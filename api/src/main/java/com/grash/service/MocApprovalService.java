package com.grash.service;

import com.grash.advancedsearch.SearchCriteria;
import com.grash.advancedsearch.SpecificationBuilder;
import com.grash.dto.MocApprovalPatchDTO;
import com.grash.exception.CustomException;
import com.grash.mapper.MocApprovalMapper;
import com.grash.model.Company;
import com.grash.model.MocApproval;
import com.grash.model.OwnUser;
import com.grash.model.enums.MocApprovalStatus;
import com.grash.repository.MocApprovalRepository;
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
public class MocApprovalService {
    private final MocApprovalRepository mocApprovalRepository;
    private final MocApprovalMapper mocApprovalMapper;
    private final EntityManager em;

    @Transactional
    public MocApproval create(MocApproval mocApproval, Company company) {
        mocApproval.setCompany(company);
        mocApproval.setStatus(MocApprovalStatus.PENDING);
        
        MocApproval savedApproval = mocApprovalRepository.saveAndFlush(mocApproval);
        em.refresh(savedApproval);
        
        return savedApproval;
    }

    @Transactional
    public MocApproval update(Long id, MocApprovalPatchDTO patchDTO, OwnUser user) {
        if (mocApprovalRepository.existsById(id)) {
            MocApproval savedApproval = mocApprovalRepository.findById(id).get();
            MocApproval updatedApproval = mocApprovalRepository.saveAndFlush(
                    mocApprovalMapper.updateMocApproval(savedApproval, patchDTO)
            );
            em.refresh(updatedApproval);
            return updatedApproval;
        } else {
            throw new CustomException("MOC Approval not found", HttpStatus.NOT_FOUND);
        }
    }

    public Collection<MocApproval> getAll() {
        return mocApprovalRepository.findAll();
    }

    public void delete(Long id) {
        mocApprovalRepository.deleteById(id);
    }

    public Optional<MocApproval> findById(Long id) {
        return mocApprovalRepository.findById(id);
    }

    public Optional<MocApproval> findByIdAndCompany(Long id, Long companyId) {
        return mocApprovalRepository.findByIdAndCompany_Id(id, companyId);
    }

    public Collection<MocApproval> findByCompany(Long companyId) {
        return mocApprovalRepository.findByCompany_Id(companyId);
    }

    public Collection<MocApproval> findByChangeRequest(Long changeRequestId) {
        return mocApprovalRepository.findByChangeRequest_Id(changeRequestId);
    }

    public Collection<MocApproval> findByStatus(MocApprovalStatus status) {
        return mocApprovalRepository.findByStatus(status);
    }

    public Collection<MocApproval> findByStatusAndCompany(MocApprovalStatus status, Long companyId) {
        return mocApprovalRepository.findByStatusAndCompany_Id(status, companyId);
    }

    public Collection<MocApproval> findByApproverUser(Long userId) {
        return mocApprovalRepository.findByApproverUser_Id(userId);
    }

    public Collection<MocApproval> findByDepartmentAndChangeRequest(String department, Long changeRequestId) {
        return mocApprovalRepository.findByDepartmentAndChangeRequest_Id(department, changeRequestId);
    }

    public Page<MocApproval> findBySearchCriteria(SearchCriteria searchCriteria) {
        SpecificationBuilder<MocApproval> builder = new SpecificationBuilder<>();
        searchCriteria.getFilterFields().forEach(builder::with);
        Pageable page = PageRequest.of(searchCriteria.getPageNum(), searchCriteria.getPageSize(),
                searchCriteria.getDirection(), searchCriteria.getSortField());
        return mocApprovalRepository.findAll(builder.build(), page);
    }

    public void save(MocApproval mocApproval) {
        mocApprovalRepository.save(mocApproval);
    }

    public MocApproval saveAndFlush(MocApproval mocApproval) {
        MocApproval updatedApproval = mocApprovalRepository.saveAndFlush(mocApproval);
        em.refresh(updatedApproval);
        return updatedApproval;
    }

    @Transactional
    public MocApproval approve(Long id, OwnUser user, String comments) {
        MocApproval approval = mocApprovalRepository.findById(id)
                .orElseThrow(() -> new CustomException("MOC Approval not found", HttpStatus.NOT_FOUND));
        
        if (approval.getStatus() != MocApprovalStatus.PENDING) {
            throw new CustomException("Only pending approvals can be approved", HttpStatus.BAD_REQUEST);
        }
        
        approval.setStatus(MocApprovalStatus.APPROVED);
        approval.setApprovedAt(new Date());
        approval.setApproverUser(user);
        approval.setComments(comments);
        
        MocApproval savedApproval = mocApprovalRepository.saveAndFlush(approval);
        em.refresh(savedApproval);
        
        return savedApproval;
    }

    @Transactional
    public MocApproval reject(Long id, OwnUser user, String comments) {
        MocApproval approval = mocApprovalRepository.findById(id)
                .orElseThrow(() -> new CustomException("MOC Approval not found", HttpStatus.NOT_FOUND));
        
        if (approval.getStatus() != MocApprovalStatus.PENDING) {
            throw new CustomException("Only pending approvals can be rejected", HttpStatus.BAD_REQUEST);
        }
        
        approval.setStatus(MocApprovalStatus.REJECTED);
        approval.setApprovedAt(new Date());
        approval.setApproverUser(user);
        approval.setComments(comments);
        
        MocApproval savedApproval = mocApprovalRepository.saveAndFlush(approval);
        em.refresh(savedApproval);
        
        return savedApproval;
    }

    public boolean isMocApprovalInCompany(MocApproval approval, long companyId, boolean optional) {
        if (optional) {
            Optional<MocApproval> optionalApproval = approval == null ? Optional.empty() : findById(approval.getId());
            return approval == null || (optionalApproval.isPresent() && optionalApproval.get().getCompany().getId().equals(companyId));
        } else {
            Optional<MocApproval> optionalApproval = findById(approval.getId());
            return optionalApproval.isPresent() && optionalApproval.get().getCompany().getId().equals(companyId);
        }
    }

    public Collection<MocApproval> findPendingByApprover(Long approverId) {
        return mocApprovalRepository.findByApproverUser_IdAndStatus(approverId, MocApprovalStatus.PENDING);
    }

    public Collection<MocApproval> findByMocChangeRequest(Long mocChangeRequestId) {
        return mocApprovalRepository.findByChangeRequest_Id(mocChangeRequestId);
    }
}
