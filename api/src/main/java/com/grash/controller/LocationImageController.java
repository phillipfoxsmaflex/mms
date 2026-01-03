package com.grash.controller;

import com.grash.dto.CreateLocationImageRequest;
import com.grash.dto.LocationImageDTO;
import com.grash.dto.SuccessResponse;
import com.grash.model.OwnUser;
import com.grash.service.LocationImageService;
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
@RequestMapping("/location-images")
@Api(tags = "location-image")
@RequiredArgsConstructor
public class LocationImageController {
    
    private final LocationImageService locationImageService;
    private final UserService userService;
    
    @PostMapping("")
    @PreAuthorize("permitAll()")
    public ResponseEntity<LocationImageDTO> createLocationImage(
        @ApiParam(value = "Location Image", required = true) @Valid @RequestBody CreateLocationImageRequest request,
        @ApiParam(value = "File ID", required = true) @RequestParam Long fileId,
        HttpServletRequest req
    ) {
        OwnUser user = userService.whoami(req);
        LocationImageDTO created = locationImageService.createLocationImage(request, fileId, user.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
    
    @GetMapping("/location/{locationId}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<List<LocationImageDTO>> getLocationImagesByLocation(
        @PathVariable Long locationId,
        HttpServletRequest req
    ) {
        OwnUser user = userService.whoami(req);
        List<LocationImageDTO> images = locationImageService.getLocationImagesByLocation(
            locationId, 
            user.getCompany().getId()
        );
        return ResponseEntity.ok(images);
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<LocationImageDTO> getLocationImage(
        @PathVariable Long id,
        HttpServletRequest req
    ) {
        OwnUser user = userService.whoami(req);
        LocationImageDTO image = locationImageService.getLocationImageById(id, user.getCompany().getId());
        return ResponseEntity.ok(image);
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<SuccessResponse> deleteLocationImage(
        @PathVariable Long id,
        HttpServletRequest req
    ) {
        OwnUser user = userService.whoami(req);
        locationImageService.deleteLocationImage(id, user.getCompany().getId());
        return ResponseEntity.ok(new SuccessResponse(true, "Location image deleted successfully"));
    }
}
