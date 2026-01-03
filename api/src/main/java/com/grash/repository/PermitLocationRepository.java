package com.grash.repository;

import com.grash.model.PermitLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Collection;
import java.util.Optional;

public interface PermitLocationRepository extends JpaRepository<PermitLocation, Long>, JpaSpecificationExecutor<PermitLocation> {

    Collection<PermitLocation> findByCompany_Id(Long companyId);

    Optional<PermitLocation> findByIdAndCompany_Id(Long id, Long companyId);

    Collection<PermitLocation> findByIsActiveAndCompany_Id(boolean isActive, Long companyId);

    Collection<PermitLocation> findByFacilityAndCompany_Id(String facility, Long companyId);

    Collection<PermitLocation> findByDepartmentAndCompany_Id(String department, Long companyId);

    Collection<PermitLocation> findByBuildingAndCompany_Id(String building, Long companyId);

    Collection<PermitLocation> findByParentLocation_Id(Long parentLocationId);
}
