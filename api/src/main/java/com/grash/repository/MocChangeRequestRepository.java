package com.grash.repository;

import com.grash.model.MocChangeRequest;
import com.grash.model.enums.MocStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Collection;
import java.util.Optional;

public interface MocChangeRequestRepository extends JpaRepository<MocChangeRequest, Long>, JpaSpecificationExecutor<MocChangeRequest> {

    Collection<MocChangeRequest> findByCompany_Id(Long companyId);

    Optional<MocChangeRequest> findByIdAndCompany_Id(Long id, Long companyId);

    Collection<MocChangeRequest> findByPermit_Id(Long permitId);

    Collection<MocChangeRequest> findByStatus(MocStatus status);

    Collection<MocChangeRequest> findByStatusAndCompany_Id(MocStatus status, Long companyId);

    Collection<MocChangeRequest> findByCreatedByUser_Id(Long userId);

    Collection<MocChangeRequest> findByRequestor_Id(Long requestorId);

    Collection<MocChangeRequest> findByDeletedAtIsNullAndCompany_Id(Long companyId);
}
