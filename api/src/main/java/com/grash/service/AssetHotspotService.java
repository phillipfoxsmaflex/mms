package com.grash.service;

import com.grash.dto.AssetHotspotDTO;
import com.grash.dto.CreateAssetHotspotRequest;
import com.grash.dto.UpdateAssetHotspotRequest;
import com.grash.exception.CustomException;
import com.grash.model.Asset;
import com.grash.model.AssetHotspot;
import com.grash.model.LocationImage;
import com.grash.repository.AssetHotspotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AssetHotspotService {
    
    private final AssetHotspotRepository assetHotspotRepository;
    private final AssetService assetService;
    private final LocationImageService locationImageService;
    
    @Transactional
    public AssetHotspotDTO createHotspot(CreateAssetHotspotRequest request, Long organizationId) {
        Asset asset = assetService.findById(request.getAssetId())
            .orElseThrow(() -> new CustomException("Asset not found", HttpStatus.NOT_FOUND));
        
        LocationImage locationImage = locationImageService.findById(request.getLocationImageId())
            .orElseThrow(() -> new CustomException("Location image not found", HttpStatus.NOT_FOUND));
        
        // Verify asset and location image belong to same organization
        if (!asset.getCompany().getId().equals(locationImage.getLocation().getCompany().getId())) {
            throw new CustomException("Asset and Location image must belong to same organization", HttpStatus.BAD_REQUEST);
        }
        
        // Check if hotspot already exists for this asset on this image
        if (assetHotspotRepository.existsByAssetIdAndLocationImageId(request.getAssetId(), request.getLocationImageId())) {
            throw new CustomException("Hotspot already exists for this asset on this location image", HttpStatus.BAD_REQUEST);
        }
        
        AssetHotspot hotspot = AssetHotspot.builder()
            .asset(asset)
            .locationImage(locationImage)
            .xPosition(request.getXPosition())
            .yPosition(request.getYPosition())
            .label(request.getLabel() != null ? request.getLabel() : asset.getName())
            .iconType(request.getIconType())
            .color(request.getColor())
            .isActive(true)
            .build();
        
        hotspot = assetHotspotRepository.save(hotspot);
        log.info("Created AssetHotspot ID: {} for Asset ID: {} on LocationImage ID: {}", 
            hotspot.getId(), asset.getId(), locationImage.getId());
        
        return convertToDTO(hotspot);
    }
    
    @Transactional
    public AssetHotspotDTO updateHotspot(Long id, UpdateAssetHotspotRequest request, Long organizationId) {
        AssetHotspot hotspot = assetHotspotRepository.findByIdAndOrganizationId(id, organizationId)
            .orElseThrow(() -> new CustomException("Hotspot not found", HttpStatus.NOT_FOUND));
        
        if (request.getXPosition() != null) {
            hotspot.setXPosition(request.getXPosition());
        }
        if (request.getYPosition() != null) {
            hotspot.setYPosition(request.getYPosition());
        }
        if (request.getLabel() != null) {
            hotspot.setLabel(request.getLabel());
        }
        if (request.getIconType() != null) {
            hotspot.setIconType(request.getIconType());
        }
        if (request.getColor() != null) {
            hotspot.setColor(request.getColor());
        }
        
        hotspot = assetHotspotRepository.save(hotspot);
        log.info("Updated AssetHotspot ID: {}", id);
        
        return convertToDTO(hotspot);
    }
    
    public List<AssetHotspotDTO> getHotspotsByLocationImage(Long locationImageId, Long organizationId) {
        List<AssetHotspot> hotspots = assetHotspotRepository.findByLocationImageIdAndOrganizationId(locationImageId, organizationId);
        return hotspots.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    public List<AssetHotspotDTO> getHotspotsByAsset(Long assetId, Long organizationId) {
        List<AssetHotspot> hotspots = assetHotspotRepository.findByAssetIdAndIsActiveTrue(assetId);
        // Filter by organization
        return hotspots.stream()
            .filter(h -> h.getAsset().getCompany().getId().equals(organizationId))
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    public AssetHotspotDTO getHotspotById(Long id, Long organizationId) {
        AssetHotspot hotspot = assetHotspotRepository.findByIdAndOrganizationId(id, organizationId)
            .orElseThrow(() -> new CustomException("Hotspot not found", HttpStatus.NOT_FOUND));
        return convertToDTO(hotspot);
    }
    
    @Transactional
    public void deleteHotspot(Long id, Long organizationId) {
        AssetHotspot hotspot = assetHotspotRepository.findByIdAndOrganizationId(id, organizationId)
            .orElseThrow(() -> new CustomException("Hotspot not found", HttpStatus.NOT_FOUND));
        
        // Soft delete
        hotspot.setIsActive(false);
        assetHotspotRepository.save(hotspot);
        
        log.info("Soft deleted AssetHotspot ID: {}", id);
    }
    
    private AssetHotspotDTO convertToDTO(AssetHotspot hotspot) {
        return AssetHotspotDTO.builder()
            .id(hotspot.getId())
            .assetId(hotspot.getAsset().getId())
            .assetName(hotspot.getAsset().getName())
            .locationImageId(hotspot.getLocationImage().getId())
            .xPosition(hotspot.getXPosition())
            .yPosition(hotspot.getYPosition())
            .label(hotspot.getLabel())
            .iconType(hotspot.getIconType())
            .color(hotspot.getColor())
            .createdAt(hotspot.getCreatedAt())
            .updatedAt(hotspot.getUpdatedAt())
            .isActive(hotspot.getIsActive())
            .build();
    }
}
