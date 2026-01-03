package com.grash.repository;

import com.grash.model.AssetHotspot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssetHotspotRepository extends JpaRepository<AssetHotspot, Long> {
    
    List<AssetHotspot> findByLocationImageIdAndIsActiveTrue(Long locationImageId);
    
    List<AssetHotspot> findByAssetIdAndIsActiveTrue(Long assetId);
    
    Optional<AssetHotspot> findByIdAndIsActiveTrue(Long id);
    
    @Query("SELECT ah FROM AssetHotspot ah WHERE ah.id = :id AND ah.asset.company.id = :organizationId AND ah.isActive = true")
    Optional<AssetHotspot> findByIdAndOrganizationId(@Param("id") Long id, @Param("organizationId") Long organizationId);
    
    @Query("SELECT ah FROM AssetHotspot ah WHERE ah.locationImage.id = :locationImageId AND ah.locationImage.location.company.id = :organizationId AND ah.isActive = true")
    List<AssetHotspot> findByLocationImageIdAndOrganizationId(@Param("locationImageId") Long locationImageId, @Param("organizationId") Long organizationId);
    
    boolean existsByAssetIdAndLocationImageId(Long assetId, Long locationImageId);
    
    void deleteByLocationImageId(Long locationImageId);
}
