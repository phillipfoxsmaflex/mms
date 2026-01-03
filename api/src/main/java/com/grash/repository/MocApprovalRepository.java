package com.grash.repository;

import com.grash.model.MocApproval;
import com.grash.model.enums.MocApprovalStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Collection;
import java.util.Optional;

public interface MocApprovalRepository extends JpaRepository<MocApproval, Long>, JpaSpecificationExecutor<MocApproval> {

    Collection<MocApproval> findByCompany_Id(Long companyId);

    Optional<MocApproval> findByIdAndCompany_Id(Long id, Long companyId);

    Collection<MocApproval> findByChangeRequest_Id(Long changeRequestId);

    Collection<MocApproval> findByStatus(MocApprovalStatus status);

    Collection<MocApproval> findByStatusAndCompany_Id(MocApprovalStatus status, Long companyId);

    Collection<MocApproval> findByApproverUser_Id(Long userId);

    Collection<MocApproval> findByApproverUser_IdAndStatus(Long userId, MocApprovalStatus status);

    Collection<MocApproval> findByDepartmentAndChangeRequest_Id(String department, Long changeRequestId);
}
