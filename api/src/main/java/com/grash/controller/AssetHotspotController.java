package com.grash.controller;

import com.grash.dto.AssetHotspotDTO;
import com.grash.dto.CreateAssetHotspotRequest;
import com.grash.dto.SuccessResponse;
import com.grash.dto.UpdateAssetHotspotRequest;
import com.grash.model.OwnUser;
import com.grash.service.AssetHotspotService;
import com.grash.service.UserService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiParam;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/asset-hotspots")
@Api(tags = "asset-hotspot")
@RequiredArgsConstructor
public class AssetHotspotController {
    
    private final AssetHotspotService assetHotspotService;
    private final UserService userService;
    
    @PostMapping("")
    @PreAuthorize("permitAll()")
    public ResponseEntity<AssetHotspotDTO> createHotspot(
        @ApiParam(value = "Asset Hotspot", required = true) @Valid @RequestBody CreateAssetHotspotRequest request,
        HttpServletRequest req
    ) {
        OwnUser user = userService.whoami(req);
        AssetHotspotDTO created = assetHotspotService.createHotspot(request, user.getCompany().getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
    
    @PatchMapping("/{id}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<AssetHotspotDTO> updateHotspot(
        @PathVariable Long id,
        @ApiParam(value = "Asset Hotspot Update", required = true) @Valid @RequestBody UpdateAssetHotspotRequest request,
        HttpServletRequest req
    ) {
        OwnUser user = userService.whoami(req);
        AssetHotspotDTO updated = assetHotspotService.updateHotspot(id, request, user.getCompany().getId());
        return ResponseEntity.ok(updated);
    }
    
    @GetMapping("/location-image/{locationImageId}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<List<AssetHotspotDTO>> getHotspotsByLocationImage(
        @PathVariable Long locationImageId,
        HttpServletRequest req
    ) {
        OwnUser user = userService.whoami(req);
        List<AssetHotspotDTO> hotspots = assetHotspotService.getHotspotsByLocationImage(
            locationImageId, 
            user.getCompany().getId()
        );
        return ResponseEntity.ok(hotspots);
    }
    
    @GetMapping("/asset/{assetId}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<List<AssetHotspotDTO>> getHotspotsByAsset(
        @PathVariable Long assetId,
        HttpServletRequest req
    ) {
        OwnUser user = userService.whoami(req);
        List<AssetHotspotDTO> hotspots = assetHotspotService.getHotspotsByAsset(
            assetId, 
            user.getCompany().getId()
        );
        return ResponseEntity.ok(hotspots);
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<AssetHotspotDTO> getHotspot(
        @PathVariable Long id,
        HttpServletRequest req
    ) {
        OwnUser user = userService.whoami(req);
        AssetHotspotDTO hotspot = assetHotspotService.getHotspotById(id, user.getCompany().getId());
        return ResponseEntity.ok(hotspot);
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<SuccessResponse> deleteHotspot(
        @PathVariable Long id,
        HttpServletRequest req
    ) {
        OwnUser user = userService.whoami(req);
        assetHotspotService.deleteHotspot(id, user.getCompany().getId());
        return ResponseEntity.ok(new SuccessResponse(true, "Asset hotspot deleted successfully"));
    }
}
