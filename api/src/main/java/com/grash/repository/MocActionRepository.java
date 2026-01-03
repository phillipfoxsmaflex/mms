package com.grash.repository;

import com.grash.model.MocAction;
import com.grash.model.enums.MocActionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Collection;
import java.util.Optional;

public interface MocActionRepository extends JpaRepository<MocAction, Long>, JpaSpecificationExecutor<MocAction> {

    Collection<MocAction> findByCompany_Id(Long companyId);

    Optional<MocAction> findByIdAndCompany_Id(Long id, Long companyId);

    Collection<MocAction> findByChangeRequest_Id(Long changeRequestId);

    Collection<MocAction> findByStatus(MocActionStatus status);

    Collection<MocAction> findByStatusAndCompany_Id(MocActionStatus status, Long companyId);

    Collection<MocAction> findByResponsibleUser_Id(Long userId);

    Collection<MocAction> findByResponsibleUser_IdAndStatus(Long userId, MocActionStatus status);
}
