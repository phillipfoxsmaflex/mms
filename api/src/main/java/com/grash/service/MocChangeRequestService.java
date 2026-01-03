package com.grash.service;

import com.grash.advancedsearch.SearchCriteria;
import com.grash.advancedsearch.SpecificationBuilder;
import com.grash.dto.MocChangeRequestPatchDTO;
import com.grash.exception.CustomException;
import com.grash.mapper.MocChangeRequestMapper;
import com.grash.model.*;
import com.grash.model.enums.MocStatus;
import com.grash.model.enums.NotificationType;
import com.grash.repository.MocChangeRequestRepository;
import com.grash.utils.Helper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.MessageSource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import javax.persistence.EntityManager;
import javax.transaction.Transactional;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MocChangeRequestService {
    private final MocChangeRequestRepository mocChangeRequestRepository;
    private final NotificationService notificationService;
    private final MocChangeRequestMapper mocChangeRequestMapper;
    private final EntityManager em;
    private final EmailService2 emailService2;
    private final MessageSource messageSource;

    @Value("${frontend.url}")
    private String frontendUrl;

    @Transactional
    public MocChangeRequest create(MocChangeRequest mocChangeRequest, Company company) {
        mocChangeRequest.setCompany(company);
        mocChangeRequest.setStatus(MocStatus.DRAFT);
        
        MocChangeRequest savedMoc = mocChangeRequestRepository.saveAndFlush(mocChangeRequest);
        em.refresh(savedMoc);
        
        return savedMoc;
    }

    @Transactional
    public MocChangeRequest update(Long id, MocChangeRequestPatchDTO patchDTO, OwnUser user) {
        if (mocChangeRequestRepository.existsById(id)) {
            MocChangeRequest savedMoc = mocChangeRequestRepository.findById(id).get();
            MocChangeRequest updatedMoc = mocChangeRequestRepository.saveAndFlush(
                    mocChangeRequestMapper.updateMocChangeRequest(savedMoc, patchDTO)
            );
            em.refresh(updatedMoc);
            return updatedMoc;
        } else {
            throw new CustomException("MOC Change Request not found", HttpStatus.NOT_FOUND);
        }
    }

    public Collection<MocChangeRequest> getAll() {
        return mocChangeRequestRepository.findAll();
    }

    public void delete(Long id) {
        mocChangeRequestRepository.deleteById(id);
    }

    public Optional<MocChangeRequest> findById(Long id) {
        return mocChangeRequestRepository.findById(id);
    }

    public Optional<MocChangeRequest> findByIdAndCompany(Long id, Long companyId) {
        return mocChangeRequestRepository.findByIdAndCompany_Id(id, companyId);
    }

    public Collection<MocChangeRequest> findByCompany(Long companyId) {
        return mocChangeRequestRepository.findByCompany_Id(companyId);
    }

    public Collection<MocChangeRequest> findByStatus(MocStatus status) {
        return mocChangeRequestRepository.findByStatus(status);
    }

    public Collection<MocChangeRequest> findByStatusAndCompany(MocStatus status, Long companyId) {
        return mocChangeRequestRepository.findByStatusAndCompany_Id(status, companyId);
    }

    public Collection<MocChangeRequest> findByPermit(Long permitId) {
        return mocChangeRequestRepository.findByPermit_Id(permitId);
    }

    public Collection<MocChangeRequest> findByRequestor(Long userId) {
        return mocChangeRequestRepository.findByRequestor_Id(userId);
    }

    public Page<MocChangeRequest> findBySearchCriteria(SearchCriteria searchCriteria) {
        SpecificationBuilder<MocChangeRequest> builder = new SpecificationBuilder<>();
        searchCriteria.getFilterFields().forEach(builder::with);
        Pageable page = PageRequest.of(searchCriteria.getPageNum(), searchCriteria.getPageSize(),
                searchCriteria.getDirection(), searchCriteria.getSortField());
        return mocChangeRequestRepository.findAll(builder.build(), page);
    }

    public void save(MocChangeRequest mocChangeRequest) {
        mocChangeRequestRepository.save(mocChangeRequest);
    }

    public MocChangeRequest saveAndFlush(MocChangeRequest mocChangeRequest) {
        MocChangeRequest updatedMoc = mocChangeRequestRepository.saveAndFlush(mocChangeRequest);
        em.refresh(updatedMoc);
        return updatedMoc;
    }

    @Transactional
    public MocChangeRequest submit(Long id, OwnUser user) {
        MocChangeRequest moc = mocChangeRequestRepository.findById(id)
                .orElseThrow(() -> new CustomException("MOC Change Request not found", HttpStatus.NOT_FOUND));
        
        if (moc.getStatus() != MocStatus.DRAFT) {
            throw new CustomException("Only draft MOC requests can be submitted", HttpStatus.BAD_REQUEST);
        }
        
        moc.setStatus(MocStatus.PENDING_REVIEW);
        
        MocChangeRequest savedMoc = mocChangeRequestRepository.saveAndFlush(moc);
        em.refresh(savedMoc);
        
        notifyStatusChange(savedMoc, "submitted for review", Helper.getLocale(moc.getCompany()));
        
        return savedMoc;
    }

    @Transactional
    public MocChangeRequest approve(Long id, OwnUser user) {
        MocChangeRequest moc = mocChangeRequestRepository.findById(id)
                .orElseThrow(() -> new CustomException("MOC Change Request not found", HttpStatus.NOT_FOUND));
        
        if (moc.getStatus() != MocStatus.PENDING_REVIEW && moc.getStatus() != MocStatus.PENDING_APPROVAL) {
            throw new CustomException("Only pending MOC requests can be approved", HttpStatus.BAD_REQUEST);
        }
        
        moc.setStatus(MocStatus.APPROVED);
        
        MocChangeRequest savedMoc = mocChangeRequestRepository.saveAndFlush(moc);
        em.refresh(savedMoc);
        
        notifyStatusChange(savedMoc, "approved", Helper.getLocale(moc.getCompany()));
        
        return savedMoc;
    }

    @Transactional
    public MocChangeRequest reject(Long id, OwnUser user, String reason) {
        MocChangeRequest moc = mocChangeRequestRepository.findById(id)
                .orElseThrow(() -> new CustomException("MOC Change Request not found", HttpStatus.NOT_FOUND));
        
        if (moc.getStatus() != MocStatus.PENDING_REVIEW && moc.getStatus() != MocStatus.PENDING_APPROVAL) {
            throw new CustomException("Only pending MOC requests can be rejected", HttpStatus.BAD_REQUEST);
        }
        
        moc.setStatus(MocStatus.REJECTED);
        
        MocChangeRequest savedMoc = mocChangeRequestRepository.saveAndFlush(moc);
        em.refresh(savedMoc);
        
        notifyStatusChange(savedMoc, "rejected", Helper.getLocale(moc.getCompany()));
        
        return savedMoc;
    }

    @Transactional
    public MocChangeRequest implement(Long id, OwnUser user) {
        MocChangeRequest moc = mocChangeRequestRepository.findById(id)
                .orElseThrow(() -> new CustomException("MOC Change Request not found", HttpStatus.NOT_FOUND));
        
        if (moc.getStatus() != MocStatus.APPROVED) {
            throw new CustomException("Only approved MOC requests can be implemented", HttpStatus.BAD_REQUEST);
        }
        
        moc.setStatus(MocStatus.IMPLEMENTED);
        moc.setImplementedAt(new Date());
        moc.setImplementedBy(user);
        
        MocChangeRequest savedMoc = mocChangeRequestRepository.saveAndFlush(moc);
        em.refresh(savedMoc);
        
        notifyStatusChange(savedMoc, "implemented", Helper.getLocale(moc.getCompany()));
        
        return savedMoc;
    }

    @Transactional
    public MocChangeRequest close(Long id, OwnUser user) {
        MocChangeRequest moc = mocChangeRequestRepository.findById(id)
                .orElseThrow(() -> new CustomException("MOC Change Request not found", HttpStatus.NOT_FOUND));
        
        if (moc.getStatus() != MocStatus.IMPLEMENTED) {
            throw new CustomException("Only implemented MOC requests can be closed", HttpStatus.BAD_REQUEST);
        }
        
        moc.setStatus(MocStatus.CLOSED);
        
        MocChangeRequest savedMoc = mocChangeRequestRepository.saveAndFlush(moc);
        em.refresh(savedMoc);
        
        notifyStatusChange(savedMoc, "closed", Helper.getLocale(moc.getCompany()));
        
        return savedMoc;
    }

    public void notifyStatusChange(MocChangeRequest moc, String action, Locale locale) {
        String title = messageSource.getMessage("moc_status_change", null, locale);
        String message = String.format("MOC Request '%s' has been %s", moc.getTitle(), action);
        
        if (moc.getRequestor() != null) {
            notificationService.create(new Notification(message, moc.getRequestor(), NotificationType.INFO, moc.getId()));
        }
    }

    public boolean isMocChangeRequestInCompany(MocChangeRequest moc, long companyId, boolean optional) {
        if (optional) {
            Optional<MocChangeRequest> optionalMoc = moc == null ? Optional.empty() : findById(moc.getId());
            return moc == null || (optionalMoc.isPresent() && optionalMoc.get().getCompany().getId().equals(companyId));
        } else {
            Optional<MocChangeRequest> optionalMoc = findById(moc.getId());
            return optionalMoc.isPresent() && optionalMoc.get().getCompany().getId().equals(companyId);
        }
    }

    public Collection<MocChangeRequest> findPendingApproval(Long companyId) {
        return mocChangeRequestRepository.findByStatusAndCompany_Id(com.grash.model.enums.MocStatus.PENDING_APPROVAL, companyId);
    }
}
