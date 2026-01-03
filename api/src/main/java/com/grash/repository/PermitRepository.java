package com.grash.repository;

import com.grash.model.Permit;
import com.grash.model.enums.PermitStatus;
import com.grash.model.enums.PermitType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.Date;
import java.util.Optional;

public interface PermitRepository extends JpaRepository<Permit, Long>, JpaSpecificationExecutor<Permit> {

    Collection<Permit> findByCompany_Id(Long companyId);

    Page<Permit> findByCompany_Id(Long companyId, Pageable pageable);

    Optional<Permit> findByIdAndCompany_Id(Long id, Long companyId);

    Collection<Permit> findByStatus(PermitStatus status);

    Collection<Permit> findByStatusAndCompany_Id(PermitStatus status, Long companyId);

    Collection<Permit> findByType(PermitType type);

    Collection<Permit> findByTypeAndCompany_Id(PermitType type, Long companyId);

    Collection<Permit> findByPermitLocation_Id(Long locationId);

    Collection<Permit> findByPrimaryUser_Id(Long userId);

    Collection<Permit> findByRequestor_Id(Long userId);

    Collection<Permit> findByTeam_Id(Long teamId);

    Collection<Permit> findByStartDateBetweenAndCompany_Id(Date start, Date end, Long companyId);

    Collection<Permit> findByEndDateBetweenAndCompany_Id(Date start, Date end, Long companyId);

    @Query("SELECT DISTINCT p FROM Permit p " +
            "LEFT JOIN p.assignedTo assigned " +
            "LEFT JOIN p.team team " +
            "WHERE p.primaryUser.id = :userId " +
            "OR assigned.id = :userId " +
            "OR :userId IN (SELECT user.id FROM team.users user)")
    Collection<Permit> findByAssignedToUser(@Param("userId") Long userId);

    @Query("SELECT p FROM Permit p WHERE p.company.id = :companyId AND " +
            "(LOWER(p.title) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(p.permitId) LIKE LOWER(CONCAT('%', :search, '%')))")
    Collection<Permit> searchPermits(@Param("companyId") Long companyId, @Param("search") String search);

    @Query("SELECT p FROM Permit p WHERE p.company.id = :companyId AND p.status = :status AND p.endDate < :now")
    Collection<Permit> findExpiredPermits(@Param("companyId") Long companyId, 
                                          @Param("status") PermitStatus status, 
                                          @Param("now") Date now);

    Collection<Permit> findByCreatedBy(Long userId);

    Collection<Permit> findByApprovedBy_Id(Long userId);

    void deleteByCompany_IdAndArchivedTrue(Long companyId);
}
