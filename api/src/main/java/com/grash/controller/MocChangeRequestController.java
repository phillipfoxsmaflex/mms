package com.grash.controller;

import com.grash.advancedsearch.SearchCriteria;
import com.grash.dto.*;
import com.grash.exception.CustomException;
import com.grash.mapper.MocChangeRequestMapper;
import com.grash.model.*;
import com.grash.model.enums.MocStatus;
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
@RequestMapping("/moc-change-requests")
@Api(tags = "mocChangeRequest")
@RequiredArgsConstructor
@Transactional
public class MocChangeRequestController {

    private final MocChangeRequestService mocChangeRequestService;
    private final MocChangeRequestMapper mocChangeRequestMapper;
    private final UserService userService;
    private final PermitService permitService;

    @PostMapping("/search")
    @PreAuthorize("permitAll()")
    public ResponseEntity<Page<MocChangeRequestShowDTO>> search(@RequestBody SearchCriteria searchCriteria,
                                                                 HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        if (user.getRole().getViewPermissions().contains(PermissionEntity.PERMITS)) {
            return ResponseEntity.ok(mocChangeRequestService.findBySearchCriteria(searchCriteria)
                    .map(mocChangeRequestMapper::toShowDto));
        } else {
            throw new CustomException("Access denied", HttpStatus.FORBIDDEN);
        }
    }

    @GetMapping("")
    @PreAuthorize("permitAll()")
    @ApiResponses(value = {
            @ApiResponse(code = 500, message = "Something went wrong"),
            @ApiResponse(code = 403, message = "Access denied"),
            @ApiResponse(code = 404, message = "MoC change requests not found")})
    public Collection<MocChangeRequestShowDTO> getAll(HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        if (user.getRole().getViewPermissions().contains(PermissionEntity.PERMITS)) {
            return mocChangeRequestService.findByCompany(user.getCompany().getId())
                    .stream()
                    .map(mocChangeRequestMapper::toShowDto)
                    .collect(Collectors.toList());
        } else {
            throw new CustomException("Access denied", HttpStatus.FORBIDDEN);
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("permitAll()")
    public MocChangeRequestShowDTO getById(@ApiParam("id") @PathVariable("id") Long id, HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        Optional<MocChangeRequest> optionalMoc = mocChangeRequestService.findById(id);
        if (optionalMoc.isPresent()) {
            MocChangeRequest savedMoc = optionalMoc.get();
            if (user.getRole().getViewPermissions().contains(PermissionEntity.PERMITS) &&
                    savedMoc.getCompany().getId().equals(user.getCompany().getId())) {
                return mocChangeRequestMapper.toShowDto(savedMoc);
            } else {
                throw new CustomException("Access denied", HttpStatus.FORBIDDEN);
            }
        } else {
            throw new CustomException("Not found", HttpStatus.NOT_FOUND);
        }
    }

    @GetMapping("/permit/{permitId}")
    @PreAuthorize("permitAll()")
    @ApiResponses(value = {
            @ApiResponse(code = 500, message = "Something went wrong"),
            @ApiResponse(code = 403, message = "Access denied"),
            @ApiResponse(code = 404, message = "Permit not found")})
    public Collection<MocChangeRequestShowDTO> getByPermit(@ApiParam("permitId") @PathVariable("permitId") Long permitId,
                                                            HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        Optional<Permit> optionalPermit = permitService.findById(permitId);
        if (optionalPermit.isPresent()) {
            Permit permit = optionalPermit.get();
            if (user.getRole().getViewPermissions().contains(PermissionEntity.PERMITS) &&
                    permit.getCompany().getId().equals(user.getCompany().getId())) {
                return mocChangeRequestService.findByPermit(permitId)
                        .stream()
                        .map(mocChangeRequestMapper::toShowDto)
                        .collect(Collectors.toList());
            } else {
                throw new CustomException("Access denied", HttpStatus.FORBIDDEN);
            }
        } else {
            throw new CustomException("Permit not found", HttpStatus.NOT_FOUND);
        }
    }

    @PostMapping("")
    @PreAuthorize("hasRole('ROLE_CLIENT')")
    @ApiResponses(value = {
            @ApiResponse(code = 500, message = "Something went wrong"),
            @ApiResponse(code = 403, message = "Access denied")})
    public MocChangeRequestShowDTO create(@ApiParam("MocChangeRequest") @Valid @RequestBody MocChangeRequest mocReq,
                                           HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        if (user.getRole().getCreatePermissions().contains(PermissionEntity.PERMITS)) {
            // Validate permit if provided
            if (mocReq.getPermit() != null) {
                Optional<Permit> optionalPermit = permitService.findById(mocReq.getPermit().getId());
                if (!optionalPermit.isPresent() || !optionalPermit.get().getCompany().getId().equals(user.getCompany().getId())) {
                    throw new CustomException("Invalid permit", HttpStatus.BAD_REQUEST);
                }
            }
            
            mocReq.setCreatedBy(user.getId());
            MocChangeRequest createdMoc = mocChangeRequestService.create(mocReq, user.getCompany());
            return mocChangeRequestMapper.toShowDto(createdMoc);
        } else {
            throw new CustomException("Access denied", HttpStatus.FORBIDDEN);
        }
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_CLIENT')")
    @ApiResponses(value = {
            @ApiResponse(code = 500, message = "Something went wrong"),
            @ApiResponse(code = 403, message = "Access denied"),
            @ApiResponse(code = 404, message = "MoC change request not found")})
    public MocChangeRequestShowDTO patch(@ApiParam("MocChangeRequest") @Valid @RequestBody MocChangeRequestPatchDTO moc,
                                          @ApiParam("id") @PathVariable("id") Long id,
                                          HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        Optional<MocChangeRequest> optionalMoc = mocChangeRequestService.findById(id);
        if (optionalMoc.isPresent()) {
            MocChangeRequest savedMoc = optionalMoc.get();
            if (savedMoc.getCompany().getId().equals(user.getCompany().getId()) &&
                    (savedMoc.getCreatedBy().equals(user.getId()) || 
                     user.getRole().getEditOtherPermissions().contains(PermissionEntity.PERMITS))) {
                MocChangeRequest patchedMoc = mocChangeRequestService.update(id, moc, user);
                return mocChangeRequestMapper.toShowDto(patchedMoc);
            } else {
                throw new CustomException("Forbidden", HttpStatus.FORBIDDEN);
            }
        } else {
            throw new CustomException("MoC change request not found", HttpStatus.NOT_FOUND);
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_CLIENT')")
    @ApiResponses(value = {
            @ApiResponse(code = 500, message = "Something went wrong"),
            @ApiResponse(code = 403, message = "Access denied"),
            @ApiResponse(code = 404, message = "MoC change request not found")})
    public ResponseEntity<Void> delete(@ApiParam("id") @PathVariable("id") Long id, HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        Optional<MocChangeRequest> optionalMoc = mocChangeRequestService.findById(id);
        if (optionalMoc.isPresent()) {
            MocChangeRequest savedMoc = optionalMoc.get();
            if (savedMoc.getCompany().getId().equals(user.getCompany().getId()) &&
                    user.getRole().getDeleteOtherPermissions().contains(PermissionEntity.PERMITS)) {
                mocChangeRequestService.delete(id);
                return new ResponseEntity<>(HttpStatus.NO_CONTENT);
            } else {
                throw new CustomException("Forbidden", HttpStatus.FORBIDDEN);
            }
        } else {
            throw new CustomException("MoC change request not found", HttpStatus.NOT_FOUND);
        }
    }

    // Workflow actions
    @PostMapping("/{id}/submit")
    @PreAuthorize("hasRole('ROLE_CLIENT')")
    @ApiResponses(value = {
            @ApiResponse(code = 500, message = "Something went wrong"),
            @ApiResponse(code = 403, message = "Access denied"),
            @ApiResponse(code = 404, message = "MoC change request not found")})
    public MocChangeRequestShowDTO submit(@ApiParam("id") @PathVariable("id") Long id, HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        Optional<MocChangeRequest> optionalMoc = mocChangeRequestService.findById(id);
        if (optionalMoc.isPresent()) {
            MocChangeRequest savedMoc = optionalMoc.get();
            if (savedMoc.getCompany().getId().equals(user.getCompany().getId()) &&
                    savedMoc.getCreatedBy().equals(user.getId())) {
                MocChangeRequest submittedMoc = mocChangeRequestService.submit(id, user);
                return mocChangeRequestMapper.toShowDto(submittedMoc);
            } else {
                throw new CustomException("Forbidden", HttpStatus.FORBIDDEN);
            }
        } else {
            throw new CustomException("MoC change request not found", HttpStatus.NOT_FOUND);
        }
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ROLE_CLIENT')")
    @ApiResponses(value = {
            @ApiResponse(code = 500, message = "Something went wrong"),
            @ApiResponse(code = 403, message = "Access denied"),
            @ApiResponse(code = 404, message = "MoC change request not found")})
    public MocChangeRequestShowDTO approve(@ApiParam("id") @PathVariable("id") Long id, HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        Optional<MocChangeRequest> optionalMoc = mocChangeRequestService.findById(id);
        if (optionalMoc.isPresent()) {
            MocChangeRequest savedMoc = optionalMoc.get();
            if (savedMoc.getCompany().getId().equals(user.getCompany().getId())) {
                MocChangeRequest approvedMoc = mocChangeRequestService.approve(id, user);
                return mocChangeRequestMapper.toShowDto(approvedMoc);
            } else {
                throw new CustomException("Forbidden", HttpStatus.FORBIDDEN);
            }
        } else {
            throw new CustomException("MoC change request not found", HttpStatus.NOT_FOUND);
        }
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('ROLE_CLIENT')")
    @ApiResponses(value = {
            @ApiResponse(code = 500, message = "Something went wrong"),
            @ApiResponse(code = 403, message = "Access denied"),
            @ApiResponse(code = 404, message = "MoC change request not found")})
    public MocChangeRequestShowDTO reject(@ApiParam("id") @PathVariable("id") Long id,
                                           @RequestBody(required = false) String reason,
                                           HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        Optional<MocChangeRequest> optionalMoc = mocChangeRequestService.findById(id);
        if (optionalMoc.isPresent()) {
            MocChangeRequest savedMoc = optionalMoc.get();
            if (savedMoc.getCompany().getId().equals(user.getCompany().getId())) {
                MocChangeRequest rejectedMoc = mocChangeRequestService.reject(id, user, reason);
                return mocChangeRequestMapper.toShowDto(rejectedMoc);
            } else {
                throw new CustomException("Forbidden", HttpStatus.FORBIDDEN);
            }
        } else {
            throw new CustomException("MoC change request not found", HttpStatus.NOT_FOUND);
        }
    }

    @PostMapping("/{id}/implement")
    @PreAuthorize("hasRole('ROLE_CLIENT')")
    @ApiResponses(value = {
            @ApiResponse(code = 500, message = "Something went wrong"),
            @ApiResponse(code = 403, message = "Access denied"),
            @ApiResponse(code = 404, message = "MoC change request not found")})
    public MocChangeRequestShowDTO implement(@ApiParam("id") @PathVariable("id") Long id, HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        Optional<MocChangeRequest> optionalMoc = mocChangeRequestService.findById(id);
        if (optionalMoc.isPresent()) {
            MocChangeRequest savedMoc = optionalMoc.get();
            if (savedMoc.getCompany().getId().equals(user.getCompany().getId())) {
                MocChangeRequest implementedMoc = mocChangeRequestService.implement(id, user);
                return mocChangeRequestMapper.toShowDto(implementedMoc);
            } else {
                throw new CustomException("Forbidden", HttpStatus.FORBIDDEN);
            }
        } else {
            throw new CustomException("MoC change request not found", HttpStatus.NOT_FOUND);
        }
    }

    @PostMapping("/{id}/close")
    @PreAuthorize("hasRole('ROLE_CLIENT')")
    @ApiResponses(value = {
            @ApiResponse(code = 500, message = "Something went wrong"),
            @ApiResponse(code = 403, message = "Access denied"),
            @ApiResponse(code = 404, message = "MoC change request not found")})
    public MocChangeRequestShowDTO close(@ApiParam("id") @PathVariable("id") Long id, HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        Optional<MocChangeRequest> optionalMoc = mocChangeRequestService.findById(id);
        if (optionalMoc.isPresent()) {
            MocChangeRequest savedMoc = optionalMoc.get();
            if (savedMoc.getCompany().getId().equals(user.getCompany().getId())) {
                MocChangeRequest closedMoc = mocChangeRequestService.close(id, user);
                return mocChangeRequestMapper.toShowDto(closedMoc);
            } else {
                throw new CustomException("Forbidden", HttpStatus.FORBIDDEN);
            }
        } else {
            throw new CustomException("MoC change request not found", HttpStatus.NOT_FOUND);
        }
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("permitAll()")
    public Collection<MocChangeRequestShowDTO> getByStatus(@ApiParam("status") @PathVariable("status") MocStatus status,
                                                            HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        if (user.getRole().getViewPermissions().contains(PermissionEntity.PERMITS)) {
            return mocChangeRequestService.findByStatusAndCompany(status, user.getCompany().getId())
                    .stream()
                    .map(mocChangeRequestMapper::toShowDto)
                    .collect(Collectors.toList());
        } else {
            throw new CustomException("Access denied", HttpStatus.FORBIDDEN);
        }
    }

    @GetMapping("/pending-approval")
    @PreAuthorize("permitAll()")
    public Collection<MocChangeRequestShowDTO> getPendingApproval(HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        if (user.getRole().getViewPermissions().contains(PermissionEntity.PERMITS)) {
            return mocChangeRequestService.findPendingApproval(user.getCompany().getId())
                    .stream()
                    .map(mocChangeRequestMapper::toShowDto)
                    .collect(Collectors.toList());
        } else {
            throw new CustomException("Access denied", HttpStatus.FORBIDDEN);
        }
    }
}
