package com.grash.repository;

import com.grash.model.LocationImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LocationImageRepository extends JpaRepository<LocationImage, Long> {
    
    List<LocationImage> findByLocationIdAndIsActiveTrue(Long locationId);
    
    Optional<LocationImage> findByIdAndIsActiveTrue(Long id);
    
    @Query("SELECT li FROM LocationImage li WHERE li.id = :id AND li.location.company.id = :organizationId AND li.isActive = true")
    Optional<LocationImage> findByIdAndOrganizationId(@Param("id") Long id, @Param("organizationId") Long organizationId);
    
    @Query("SELECT li FROM LocationImage li WHERE li.location.id = :locationId AND li.location.company.id = :organizationId AND li.isActive = true")
    List<LocationImage> findByLocationIdAndOrganizationId(@Param("locationId") Long locationId, @Param("organizationId") Long organizationId);
    
    boolean existsByNameAndLocationId(String name, Long locationId);
}
