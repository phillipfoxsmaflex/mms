package com.grash.controller;

import com.grash.advancedsearch.SearchCriteria;
import com.grash.dto.*;
import com.grash.exception.CustomException;
import com.grash.mapper.PermitMapper;
import com.grash.model.*;
import com.grash.model.enums.PermissionEntity;
import com.grash.model.enums.PermitStatus;
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
@RequestMapping("/permits")
@Api(tags = "permit")
@RequiredArgsConstructor
@Transactional
public class PermitController {

    private final PermitService permitService;
    private final PermitMapper permitMapper;
    private final UserService userService;
    private final PermitLocationService permitLocationService;

    @PostMapping("/search")
    @PreAuthorize("permitAll()")
    public ResponseEntity<Page<PermitShowDTO>> search(@RequestBody SearchCriteria searchCriteria,
                                                       HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        if (user.getRole().getViewPermissions().contains(PermissionEntity.PERMITS)) {
            return ResponseEntity.ok(permitService.findBySearchCriteria(searchCriteria).map(permitMapper::toShowDto));
        } else {
            throw new CustomException("Access denied", HttpStatus.FORBIDDEN);
        }
    }

    @GetMapping("")
    @PreAuthorize("permitAll()")
    @ApiResponses(value = {
            @ApiResponse(code = 500, message = "Something went wrong"),
            @ApiResponse(code = 403, message = "Access denied"),
            @ApiResponse(code = 404, message = "Permits not found")})
    public Collection<PermitShowDTO> getAll(HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        if (user.getRole().getViewPermissions().contains(PermissionEntity.PERMITS)) {
            return permitService.findByCompany(user.getCompany().getId())
                    .stream()
                    .filter(permit -> {
                        boolean canViewOthers = user.getRole().getViewOtherPermissions().contains(PermissionEntity.PERMITS);
                        return canViewOthers || 
                               (permit.getCreatedBy() != null && permit.getCreatedBy().equals(user.getId())) || 
                               permit.isAssignedTo(user);
                    })
                    .map(permitMapper::toShowDto)
                    .collect(Collectors.toList());
        } else {
            throw new CustomException("Access denied", HttpStatus.FORBIDDEN);
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("permitAll()")
    public PermitShowDTO getById(@ApiParam("id") @PathVariable("id") Long id, HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        Optional<Permit> optionalPermit = permitService.findById(id);
        if (optionalPermit.isPresent()) {
            Permit savedPermit = optionalPermit.get();
            if (user.getRole().getViewPermissions().contains(PermissionEntity.PERMITS) &&
                    (user.getRole().getViewOtherPermissions().contains(PermissionEntity.PERMITS) || 
                     (savedPermit.getCreatedBy() != null && savedPermit.getCreatedBy().equals(user.getId())) || 
                     savedPermit.isAssignedTo(user))) {
                return permitMapper.toShowDto(savedPermit);
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
    public PermitShowDTO create(@ApiParam("Permit") @Valid @RequestBody Permit permitReq, HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        if (user.getRole().getCreatePermissions().contains(PermissionEntity.PERMITS)) {
            permitReq.setCompany(user.getCompany());
            permitReq.setCreatedBy(user.getId());
            
            // Validate location if provided
            if (permitReq.getPermitLocation() != null) {
                Optional<PermitLocation> optionalLocation = permitLocationService.findById(permitReq.getPermitLocation().getId());
                if (!optionalLocation.isPresent() || !optionalLocation.get().getCompany().getId().equals(user.getCompany().getId())) {
                    throw new CustomException("Invalid location", HttpStatus.BAD_REQUEST);
                }
            }
            
            Permit createdPermit = permitService.create(permitReq, user.getCompany());
            return permitMapper.toShowDto(createdPermit);
        } else {
            throw new CustomException("Access denied", HttpStatus.FORBIDDEN);
        }
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_CLIENT')")
    @ApiResponses(value = {
            @ApiResponse(code = 500, message = "Something went wrong"),
            @ApiResponse(code = 403, message = "Access denied"),
            @ApiResponse(code = 404, message = "Permit not found")})
    public PermitShowDTO patch(@ApiParam("Permit") @Valid @RequestBody PermitPatchDTO permit,
                               @ApiParam("id") @PathVariable("id") Long id,
                               HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        Optional<Permit> optionalPermit = permitService.findById(id);
        if (optionalPermit.isPresent()) {
            Permit savedPermit = optionalPermit.get();
            if (savedPermit.canBeEditedBy(user)) {
                Permit patchedPermit = permitService.update(id, permit, user);
                return permitMapper.toShowDto(patchedPermit);
            } else {
                throw new CustomException("Forbidden", HttpStatus.FORBIDDEN);
            }
        } else {
            throw new CustomException("Permit not found", HttpStatus.NOT_FOUND);
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_CLIENT')")
    @ApiResponses(value = {
            @ApiResponse(code = 500, message = "Something went wrong"),
            @ApiResponse(code = 403, message = "Access denied"),
            @ApiResponse(code = 404, message = "Permit not found")})
    public ResponseEntity<Void> delete(@ApiParam("id") @PathVariable("id") Long id, HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        Optional<Permit> optionalPermit = permitService.findById(id);
        if (optionalPermit.isPresent()) {
            Permit savedPermit = optionalPermit.get();
            if (savedPermit.getCompany().getId().equals(user.getCompany().getId()) &&
                    user.getRole().getDeleteOtherPermissions().contains(PermissionEntity.PERMITS)) {
                permitService.delete(id);
                return new ResponseEntity<>(HttpStatus.NO_CONTENT);
            } else {
                throw new CustomException("Forbidden", HttpStatus.FORBIDDEN);
            }
        } else {
            throw new CustomException("Permit not found", HttpStatus.NOT_FOUND);
        }
    }

    // Workflow actions
    @PostMapping("/{id}/submit")
    @PreAuthorize("hasRole('ROLE_CLIENT')")
    @ApiResponses(value = {
            @ApiResponse(code = 500, message = "Something went wrong"),
            @ApiResponse(code = 403, message = "Access denied"),
            @ApiResponse(code = 404, message = "Permit not found")})
    public PermitShowDTO submit(@ApiParam("id") @PathVariable("id") Long id, HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        Optional<Permit> optionalPermit = permitService.findById(id);
        if (optionalPermit.isPresent()) {
            Permit savedPermit = optionalPermit.get();
            if (savedPermit.canBeEditedBy(user)) {
                Permit submittedPermit = permitService.submit(id, user);
                return permitMapper.toShowDto(submittedPermit);
            } else {
                throw new CustomException("Forbidden", HttpStatus.FORBIDDEN);
            }
        } else {
            throw new CustomException("Permit not found", HttpStatus.NOT_FOUND);
        }
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ROLE_CLIENT')")
    @ApiResponses(value = {
            @ApiResponse(code = 500, message = "Something went wrong"),
            @ApiResponse(code = 403, message = "Access denied"),
            @ApiResponse(code = 404, message = "Permit not found")})
    public PermitShowDTO approve(@ApiParam("id") @PathVariable("id") Long id, HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        Optional<Permit> optionalPermit = permitService.findById(id);
        if (optionalPermit.isPresent()) {
            Permit savedPermit = optionalPermit.get();
            // Only users with approval permission can approve
            if (savedPermit.getCompany().getId().equals(user.getCompany().getId())) {
                Permit approvedPermit = permitService.approve(id, user);
                return permitMapper.toShowDto(approvedPermit);
            } else {
                throw new CustomException("Forbidden", HttpStatus.FORBIDDEN);
            }
        } else {
            throw new CustomException("Permit not found", HttpStatus.NOT_FOUND);
        }
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('ROLE_CLIENT')")
    @ApiResponses(value = {
            @ApiResponse(code = 500, message = "Something went wrong"),
            @ApiResponse(code = 403, message = "Access denied"),
            @ApiResponse(code = 404, message = "Permit not found")})
    public PermitShowDTO reject(@ApiParam("id") @PathVariable("id") Long id,
                                @RequestBody(required = false) String reason,
                                HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        Optional<Permit> optionalPermit = permitService.findById(id);
        if (optionalPermit.isPresent()) {
            Permit savedPermit = optionalPermit.get();
            if (savedPermit.getCompany().getId().equals(user.getCompany().getId())) {
                Permit rejectedPermit = permitService.reject(id, user, reason);
                return permitMapper.toShowDto(rejectedPermit);
            } else {
                throw new CustomException("Forbidden", HttpStatus.FORBIDDEN);
            }
        } else {
            throw new CustomException("Permit not found", HttpStatus.NOT_FOUND);
        }
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasRole('ROLE_CLIENT')")
    @ApiResponses(value = {
            @ApiResponse(code = 500, message = "Something went wrong"),
            @ApiResponse(code = 403, message = "Access denied"),
            @ApiResponse(code = 404, message = "Permit not found")})
    public PermitShowDTO activate(@ApiParam("id") @PathVariable("id") Long id, HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        Optional<Permit> optionalPermit = permitService.findById(id);
        if (optionalPermit.isPresent()) {
            Permit savedPermit = optionalPermit.get();
            if (savedPermit.canBeEditedBy(user)) {
                Permit activatedPermit = permitService.activate(id, user);
                return permitMapper.toShowDto(activatedPermit);
            } else {
                throw new CustomException("Forbidden", HttpStatus.FORBIDDEN);
            }
        } else {
            throw new CustomException("Permit not found", HttpStatus.NOT_FOUND);
        }
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasRole('ROLE_CLIENT')")
    @ApiResponses(value = {
            @ApiResponse(code = 500, message = "Something went wrong"),
            @ApiResponse(code = 403, message = "Access denied"),
            @ApiResponse(code = 404, message = "Permit not found")})
    public PermitShowDTO complete(@ApiParam("id") @PathVariable("id") Long id, HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        Optional<Permit> optionalPermit = permitService.findById(id);
        if (optionalPermit.isPresent()) {
            Permit savedPermit = optionalPermit.get();
            if (savedPermit.canBeEditedBy(user)) {
                Permit completedPermit = permitService.complete(id, user);
                return permitMapper.toShowDto(completedPermit);
            } else {
                throw new CustomException("Forbidden", HttpStatus.FORBIDDEN);
            }
        } else {
            throw new CustomException("Permit not found", HttpStatus.NOT_FOUND);
        }
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasRole('ROLE_CLIENT')")
    @ApiResponses(value = {
            @ApiResponse(code = 500, message = "Something went wrong"),
            @ApiResponse(code = 403, message = "Access denied"),
            @ApiResponse(code = 404, message = "Permit not found")})
    public PermitShowDTO cancel(@ApiParam("id") @PathVariable("id") Long id,
                                @RequestBody(required = false) String reason,
                                HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        Optional<Permit> optionalPermit = permitService.findById(id);
        if (optionalPermit.isPresent()) {
            Permit savedPermit = optionalPermit.get();
            if (savedPermit.canBeEditedBy(user)) {
                Permit cancelledPermit = permitService.cancel(id, user, reason);
                return permitMapper.toShowDto(cancelledPermit);
            } else {
                throw new CustomException("Forbidden", HttpStatus.FORBIDDEN);
            }
        } else {
            throw new CustomException("Permit not found", HttpStatus.NOT_FOUND);
        }
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("permitAll()")
    public Collection<PermitShowDTO> getByStatus(@ApiParam("status") @PathVariable("status") PermitStatus status,
                                                  HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        if (user.getRole().getViewPermissions().contains(PermissionEntity.PERMITS)) {
            return permitService.findByStatusAndCompany(status, user.getCompany().getId())
                    .stream()
                    .map(permitMapper::toShowDto)
                    .collect(Collectors.toList());
        } else {
            throw new CustomException("Access denied", HttpStatus.FORBIDDEN);
        }
    }

    @GetMapping("/location/{id}")
    @PreAuthorize("permitAll()")
    public Collection<PermitShowDTO> getByLocation(@ApiParam("id") @PathVariable("id") Long id,
                                                    HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        if (user.getRole().getViewPermissions().contains(PermissionEntity.PERMITS)) {
            return permitService.findByLocation(id)
                    .stream()
                    .filter(permit -> permit.getCompany().getId().equals(user.getCompany().getId()))
                    .map(permitMapper::toShowDto)
                    .collect(Collectors.toList());
        } else {
            throw new CustomException("Access denied", HttpStatus.FORBIDDEN);
        }
    }
}
