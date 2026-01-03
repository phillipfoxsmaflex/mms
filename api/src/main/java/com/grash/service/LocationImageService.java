package com.grash.service;

import com.grash.dto.AssetHotspotDTO;
import com.grash.dto.CreateLocationImageRequest;
import com.grash.dto.LocationImageDTO;
import com.grash.exception.CustomException;
import com.grash.model.AssetHotspot;
import com.grash.model.File;
import com.grash.model.Location;
import com.grash.model.LocationImage;
import com.grash.model.OwnUser;
import com.grash.repository.AssetHotspotRepository;
import com.grash.repository.LocationImageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LocationImageService {
    
    private final LocationImageRepository locationImageRepository;
    private final AssetHotspotRepository assetHotspotRepository;
    private final LocationService locationService;
    private final FileService fileService;
    private final UserService userService;
    
    @Transactional
    public LocationImageDTO createLocationImage(CreateLocationImageRequest request, Long fileId, Long userId) {
        OwnUser user = userService.findById(userId)
            .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));
        
        Location location = locationService.findById(request.getLocationId())
            .orElseThrow(() -> new CustomException("Location not found", HttpStatus.NOT_FOUND));
        
        File file = fileService.findById(fileId)
            .orElseThrow(() -> new CustomException("File not found", HttpStatus.NOT_FOUND));
        
        // Check if name already exists for this location
        if (locationImageRepository.existsByNameAndLocationId(request.getName(), request.getLocationId())) {
            throw new CustomException("Location image with this name already exists for this location", HttpStatus.BAD_REQUEST);
        }
        
        LocationImage locationImage = LocationImage.builder()
            .name(request.getName())
            .description(request.getDescription())
            .file(file)
            .location(location)
            .createdBy(user)
            .isActive(true)
            .build();
        
        locationImage = locationImageRepository.save(locationImage);
        log.info("Created LocationImage ID: {} for Location ID: {}", locationImage.getId(), location.getId());
        
        return convertToDTO(locationImage);
    }
    
    public List<LocationImageDTO> getLocationImagesByLocation(Long locationId, Long organizationId) {
        List<LocationImage> images = locationImageRepository.findByLocationIdAndOrganizationId(locationId, organizationId);
        return images.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    public LocationImageDTO getLocationImageById(Long id, Long organizationId) {
        LocationImage locationImage = locationImageRepository.findByIdAndOrganizationId(id, organizationId)
            .orElseThrow(() -> new CustomException("Location image not found", HttpStatus.NOT_FOUND));
        return convertToDTO(locationImage);
    }
    
    @Transactional
    public void deleteLocationImage(Long id, Long organizationId) {
        LocationImage locationImage = locationImageRepository.findByIdAndOrganizationId(id, organizationId)
            .orElseThrow(() -> new CustomException("Location image not found", HttpStatus.NOT_FOUND));
        
        // Soft delete
        locationImage.setIsActive(false);
        locationImageRepository.save(locationImage);
        
        // Soft delete all associated hotspots
        List<AssetHotspot> hotspots = assetHotspotRepository.findByLocationImageIdAndIsActiveTrue(id);
        hotspots.forEach(hotspot -> {
            hotspot.setIsActive(false);
            assetHotspotRepository.save(hotspot);
        });
        
        log.info("Soft deleted LocationImage ID: {} and {} associated hotspots", id, hotspots.size());
    }
    
    public Optional<LocationImage> findById(Long id) {
        return locationImageRepository.findById(id);
    }
    
    private LocationImageDTO convertToDTO(LocationImage locationImage) {
        List<AssetHotspotDTO> hotspots = assetHotspotRepository
            .findByLocationImageIdAndIsActiveTrue(locationImage.getId())
            .stream()
            .map(this::convertHotspotToDTO)
            .collect(Collectors.toList());
        
        return LocationImageDTO.builder()
            .id(locationImage.getId())
            .name(locationImage.getName())
            .description(locationImage.getDescription())
            .fileId(locationImage.getFile() != null ? locationImage.getFile().getId() : null)
            .fileUrl(locationImage.getFile() != null ? locationImage.getFile().getPath() : null)
            .locationId(locationImage.getLocation().getId())
            .locationName(locationImage.getLocation().getName())
            .createdAt(locationImage.getCreatedAt())
            .updatedAt(locationImage.getUpdatedAt())
            .createdById(locationImage.getCreatedBy() != null ? locationImage.getCreatedBy().getId() : null)
            .createdByName(locationImage.getCreatedBy() != null ? 
                locationImage.getCreatedBy().getFirstName() + " " + locationImage.getCreatedBy().getLastName() : null)
            .isActive(locationImage.getIsActive())
            .hotspots(hotspots)
            .build();
    }
    
    private AssetHotspotDTO convertHotspotToDTO(AssetHotspot hotspot) {
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
