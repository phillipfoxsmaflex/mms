package com.grash.controller;

import com.grash.advancedsearch.SearchCriteria;
import com.grash.dto.*;
import com.grash.exception.CustomException;
import com.grash.mapper.PermitLocationMapper;
import com.grash.model.*;
import com.grash.model.enums.PermissionEntity;
import com.grash.service.*;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiParam;
import io.swagger.annotations.ApiResponse;
import io.swagger.annotations.ApiResponses;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.transaction.Transactional;
import javax.validation.Valid;
import java.util.Collection;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/permit-locations")
@Api(tags = "permitLocation")
@RequiredArgsConstructor
@Transactional
public class PermitLocationController {

    private final PermitLocationService permitLocationService;
    private final PermitLocationMapper permitLocationMapper;
    private final UserService userService;

    @PostMapping("/search")
    @PreAuthorize("permitAll()")
    public ResponseEntity<Page<PermitLocationShowDTO>> search(@RequestBody SearchCriteria searchCriteria,
                                                               HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        if (user.getRole().getViewPermissions().contains(PermissionEntity.PERMITS)) {
            return ResponseEntity.ok(permitLocationService.findBySearchCriteria(searchCriteria)
                    .map(permitLocationMapper::toShowDto));
        } else {
            throw new CustomException("Access denied", HttpStatus.FORBIDDEN);
        }
    }

    @GetMapping("")
    @PreAuthorize("permitAll()")
    @ApiResponses(value = {
            @ApiResponse(code = 500, message = "Something went wrong"),
            @ApiResponse(code = 403, message = "Access denied"),
            @ApiResponse(code = 404, message = "Permit locations not found")})
    public Collection<PermitLocationShowDTO> getAll(HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        if (user.getRole().getViewPermissions().contains(PermissionEntity.PERMITS)) {
            return permitLocationService.findByCompany(user.getCompany().getId())
                    .stream()
                    .map(permitLocationMapper::toShowDto)
                    .collect(Collectors.toList());
        } else {
            throw new CustomException("Access denied", HttpStatus.FORBIDDEN);
        }
    }

    @GetMapping("/active")
    @PreAuthorize("permitAll()")
    @ApiResponses(value = {
            @ApiResponse(code = 500, message = "Something went wrong"),
            @ApiResponse(code = 403, message = "Access denied")})
    public Collection<PermitLocationShowDTO> getActive(HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        if (user.getRole().getViewPermissions().contains(PermissionEntity.PERMITS)) {
            return permitLocationService.findActiveByCompany(user.getCompany().getId())
                    .stream()
                    .map(permitLocationMapper::toShowDto)
                    .collect(Collectors.toList());
        } else {
            throw new CustomException("Access denied", HttpStatus.FORBIDDEN);
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("permitAll()")
    public PermitLocationShowDTO getById(@ApiParam("id") @PathVariable("id") Long id, HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        Optional<PermitLocation> optionalLocation = permitLocationService.findById(id);
        if (optionalLocation.isPresent()) {
            PermitLocation savedLocation = optionalLocation.get();
            if (user.getRole().getViewPermissions().contains(PermissionEntity.PERMITS) &&
                    savedLocation.getCompany().getId().equals(user.getCompany().getId())) {
                return permitLocationMapper.toShowDto(savedLocation);
            } else {
                throw new CustomException("Access denied", HttpStatus.FORBIDDEN);
            }
        } else {
            throw new CustomException("Not found", HttpStatus.NOT_FOUND);
        }
    }

    @PostMapping("")
    @PreAuthorize("hasRole('ROLE_CLIENT')")
    @ApiResponses(value = {
            @ApiResponse(code = 500, message = "Something went wrong"),
            @ApiResponse(code = 403, message = "Access denied")})
    public PermitLocationShowDTO create(@ApiParam("PermitLocation") @Valid @RequestBody PermitLocation locationReq,
                                         HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        if (user.getRole().getCreatePermissions().contains(PermissionEntity.PERMITS)) {
            locationReq.setCreatedBy(user.getId());
            PermitLocation createdLocation = permitLocationService.create(locationReq, user.getCompany());
            return permitLocationMapper.toShowDto(createdLocation);
        } else {
            throw new CustomException("Access denied", HttpStatus.FORBIDDEN);
        }
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_CLIENT')")
    @ApiResponses(value = {
            @ApiResponse(code = 500, message = "Something went wrong"),
            @ApiResponse(code = 403, message = "Access denied"),
            @ApiResponse(code = 404, message = "Permit location not found")})
    public PermitLocationShowDTO patch(@ApiParam("PermitLocation") @Valid @RequestBody PermitLocationPatchDTO location,
                                        @ApiParam("id") @PathVariable("id") Long id,
                                        HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        Optional<PermitLocation> optionalLocation = permitLocationService.findById(id);
        if (optionalLocation.isPresent()) {
            PermitLocation savedLocation = optionalLocation.get();
            if (savedLocation.getCompany().getId().equals(user.getCompany().getId()) &&
                    user.getRole().getEditOtherPermissions().contains(PermissionEntity.PERMITS)) {
                PermitLocation patchedLocation = permitLocationService.update(id, location, user);
                return permitLocationMapper.toShowDto(patchedLocation);
            } else {
                throw new CustomException("Forbidden", HttpStatus.FORBIDDEN);
            }
        } else {
            throw new CustomException("Permit location not found", HttpStatus.NOT_FOUND);
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_CLIENT')")
    @ApiResponses(value = {
            @ApiResponse(code = 500, message = "Something went wrong"),
            @ApiResponse(code = 403, message = "Access denied"),
            @ApiResponse(code = 404, message = "Permit location not found")})
    public ResponseEntity<Void> delete(@ApiParam("id") @PathVariable("id") Long id, HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        Optional<PermitLocation> optionalLocation = permitLocationService.findById(id);
        if (optionalLocation.isPresent()) {
            PermitLocation savedLocation = optionalLocation.get();
            if (savedLocation.getCompany().getId().equals(user.getCompany().getId()) &&
                    user.getRole().getDeleteOtherPermissions().contains(PermissionEntity.PERMITS)) {
                permitLocationService.delete(id);
                return new ResponseEntity<>(HttpStatus.NO_CONTENT);
            } else {
                throw new CustomException("Forbidden", HttpStatus.FORBIDDEN);
            }
        } else {
            throw new CustomException("Permit location not found", HttpStatus.NOT_FOUND);
        }
    }

    @GetMapping("/facility/{facility}")
    @PreAuthorize("permitAll()")
    public Collection<PermitLocationShowDTO> getByFacility(@ApiParam("facility") @PathVariable("facility") String facility,
                                                            HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        if (user.getRole().getViewPermissions().contains(PermissionEntity.PERMITS)) {
            return permitLocationService.findByFacility(facility, user.getCompany().getId())
                    .stream()
                    .map(permitLocationMapper::toShowDto)
                    .collect(Collectors.toList());
        } else {
            throw new CustomException("Access denied", HttpStatus.FORBIDDEN);
        }
    }

    @GetMapping("/building/{building}")
    @PreAuthorize("permitAll()")
    public Collection<PermitLocationShowDTO> getByBuilding(@ApiParam("building") @PathVariable("building") String building,
                                                            HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        if (user.getRole().getViewPermissions().contains(PermissionEntity.PERMITS)) {
            return permitLocationService.findByBuilding(building, user.getCompany().getId())
                    .stream()
                    .map(permitLocationMapper::toShowDto)
                    .collect(Collectors.toList());
        } else {
            throw new CustomException("Access denied", HttpStatus.FORBIDDEN);
        }
    }
}
