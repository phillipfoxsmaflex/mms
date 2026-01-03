package com.grash.service;

import com.grash.advancedsearch.SearchCriteria;
import com.grash.advancedsearch.SpecificationBuilder;
import com.grash.dto.MocActionPatchDTO;
import com.grash.exception.CustomException;
import com.grash.mapper.MocActionMapper;
import com.grash.model.Company;
import com.grash.model.MocAction;
import com.grash.model.OwnUser;
import com.grash.model.enums.MocActionStatus;
import com.grash.repository.MocActionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import javax.persistence.EntityManager;
import javax.transaction.Transactional;
import java.util.Collection;
import java.util.Date;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MocActionService {
    private final MocActionRepository mocActionRepository;
    private final MocActionMapper mocActionMapper;
    private final EntityManager em;

    @Transactional
    public MocAction create(MocAction mocAction, Company company) {
        mocAction.setCompany(company);
        mocAction.setStatus(MocActionStatus.PENDING);
        
        MocAction savedAction = mocActionRepository.saveAndFlush(mocAction);
        em.refresh(savedAction);
        
        return savedAction;
    }

    @Transactional
    public MocAction update(Long id, MocActionPatchDTO patchDTO, OwnUser user) {
        if (mocActionRepository.existsById(id)) {
            MocAction savedAction = mocActionRepository.findById(id).get();
            MocAction updatedAction = mocActionRepository.saveAndFlush(
                    mocActionMapper.updateMocAction(savedAction, patchDTO)
            );
            em.refresh(updatedAction);
            return updatedAction;
        } else {
            throw new CustomException("MOC Action not found", HttpStatus.NOT_FOUND);
        }
    }

    public Collection<MocAction> getAll() {
        return mocActionRepository.findAll();
    }

    public void delete(Long id) {
        mocActionRepository.deleteById(id);
    }

    public Optional<MocAction> findById(Long id) {
        return mocActionRepository.findById(id);
    }

    public Optional<MocAction> findByIdAndCompany(Long id, Long companyId) {
        return mocActionRepository.findByIdAndCompany_Id(id, companyId);
    }

    public Collection<MocAction> findByCompany(Long companyId) {
        return mocActionRepository.findByCompany_Id(companyId);
    }

    public Collection<MocAction> findByChangeRequest(Long changeRequestId) {
        return mocActionRepository.findByChangeRequest_Id(changeRequestId);
    }

    public Collection<MocAction> findByStatus(MocActionStatus status) {
        return mocActionRepository.findByStatus(status);
    }

    public Collection<MocAction> findByStatusAndCompany(MocActionStatus status, Long companyId) {
        return mocActionRepository.findByStatusAndCompany_Id(status, companyId);
    }

    public Collection<MocAction> findByResponsibleUser(Long userId) {
        return mocActionRepository.findByResponsibleUser_Id(userId);
    }

    public Page<MocAction> findBySearchCriteria(SearchCriteria searchCriteria) {
        SpecificationBuilder<MocAction> builder = new SpecificationBuilder<>();
        searchCriteria.getFilterFields().forEach(builder::with);
        Pageable page = PageRequest.of(searchCriteria.getPageNum(), searchCriteria.getPageSize(),
                searchCriteria.getDirection(), searchCriteria.getSortField());
        return mocActionRepository.findAll(builder.build(), page);
    }

    public void save(MocAction mocAction) {
        mocActionRepository.save(mocAction);
    }

    public MocAction saveAndFlush(MocAction mocAction) {
        MocAction updatedAction = mocActionRepository.saveAndFlush(mocAction);
        em.refresh(updatedAction);
        return updatedAction;
    }

    @Transactional
    public MocAction start(Long id, OwnUser user) {
        MocAction action = mocActionRepository.findById(id)
                .orElseThrow(() -> new CustomException("MOC Action not found", HttpStatus.NOT_FOUND));
        
        if (action.getStatus() != MocActionStatus.PENDING) {
            throw new CustomException("Only pending actions can be started", HttpStatus.BAD_REQUEST);
        }
        
        action.setStatus(MocActionStatus.IN_PROGRESS);
        
        MocAction savedAction = mocActionRepository.saveAndFlush(action);
        em.refresh(savedAction);
        
        return savedAction;
    }

    @Transactional
    public MocAction complete(Long id, OwnUser user, String completionNotes) {
        MocAction action = mocActionRepository.findById(id)
                .orElseThrow(() -> new CustomException("MOC Action not found", HttpStatus.NOT_FOUND));
        
        if (action.getStatus() != MocActionStatus.IN_PROGRESS) {
            throw new CustomException("Only in-progress actions can be completed", HttpStatus.BAD_REQUEST);
        }
        
        action.setStatus(MocActionStatus.COMPLETED);
        action.setCompletionDate(new Date());
        action.setCompletionNotes(completionNotes);
        
        MocAction savedAction = mocActionRepository.saveAndFlush(action);
        em.refresh(savedAction);
        
        return savedAction;
    }

    @Transactional
    public MocAction cancel(Long id, OwnUser user) {
        MocAction action = mocActionRepository.findById(id)
                .orElseThrow(() -> new CustomException("MOC Action not found", HttpStatus.NOT_FOUND));
        
        if (action.getStatus() == MocActionStatus.COMPLETED || action.getStatus() == MocActionStatus.CANCELLED) {
            throw new CustomException("Cannot cancel a completed or already cancelled action", HttpStatus.BAD_REQUEST);
        }
        
        action.setStatus(MocActionStatus.CANCELLED);
        
        MocAction savedAction = mocActionRepository.saveAndFlush(action);
        em.refresh(savedAction);
        
        return savedAction;
    }

    public boolean isMocActionInCompany(MocAction action, long companyId, boolean optional) {
        if (optional) {
            Optional<MocAction> optionalAction = action == null ? Optional.empty() : findById(action.getId());
            return action == null || (optionalAction.isPresent() && optionalAction.get().getCompany().getId().equals(companyId));
        } else {
            Optional<MocAction> optionalAction = findById(action.getId());
            return optionalAction.isPresent() && optionalAction.get().getCompany().getId().equals(companyId);
        }
    }

    public Collection<MocAction> findByAssignedTo(Long userId) {
        return mocActionRepository.findByResponsibleUser_Id(userId);
    }

    public Collection<MocAction> findPending(Long userId) {
        return mocActionRepository.findByResponsibleUser_IdAndStatus(userId, MocActionStatus.PENDING);
    }

    public Collection<MocAction> findByMocChangeRequest(Long changeRequestId) {
        return mocActionRepository.findByChangeRequest_Id(changeRequestId);
    }
}
