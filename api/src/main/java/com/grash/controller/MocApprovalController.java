package com.grash.controller;

import com.grash.dto.*;
import com.grash.exception.CustomException;
import com.grash.mapper.MocApprovalMapper;
import com.grash.model.*;
import com.grash.model.enums.MocApprovalStatus;
import com.grash.model.enums.PermissionEntity;
import com.grash.service.*;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiParam;
import io.swagger.annotations.ApiResponse;
import io.swagger.annotations.ApiResponses;
import lombok.RequiredArgsConstructor;
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
@RequestMapping("/moc-approvals")
@Api(tags = "mocApproval")
@RequiredArgsConstructor
@Transactional
public class MocApprovalController {

    private final MocApprovalService mocApprovalService;
    private final MocApprovalMapper mocApprovalMapper;
    private final UserService userService;
    private final MocChangeRequestService mocChangeRequestService;

    @GetMapping("")
    @PreAuthorize("permitAll()")
    @ApiResponses(value = {
            @ApiResponse(code = 500, message = "Something went wrong"),
            @ApiResponse(code = 403, message = "Access denied"),
            @ApiResponse(code = 404, message = "MoC approvals not found")})
    public Collection<MocApprovalShowDTO> getAll(HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        if (user.getRole().getViewPermissions().contains(PermissionEntity.PERMITS)) {
            return mocApprovalService.findByCompany(user.getCompany().getId())
                    .stream()
                    .map(mocApprovalMapper::toShowDto)
                    .collect(Collectors.toList());
        } else {
            throw new CustomException("Access denied", HttpStatus.FORBIDDEN);
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("permitAll()")
    public MocApprovalShowDTO getById(@ApiParam("id") @PathVariable("id") Long id, HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        Optional<MocApproval> optionalApproval = mocApprovalService.findById(id);
        if (optionalApproval.isPresent()) {
            MocApproval savedApproval = optionalApproval.get();
            if (user.getRole().getViewPermissions().contains(PermissionEntity.PERMITS) &&
                    savedApproval.getCompany().getId().equals(user.getCompany().getId())) {
                return mocApprovalMapper.toShowDto(savedApproval);
            } else {
                throw new CustomException("Access denied", HttpStatus.FORBIDDEN);
            }
        } else {
            throw new CustomException("Not found", HttpStatus.NOT_FOUND);
        }
    }

    @GetMapping("/moc/{mocId}")
    @PreAuthorize("permitAll()")
    @ApiResponses(value = {
            @ApiResponse(code = 500, message = "Something went wrong"),
            @ApiResponse(code = 403, message = "Access denied"),
            @ApiResponse(code = 404, message = "MoC change request not found")})
    public Collection<MocApprovalShowDTO> getByMoc(@ApiParam("mocId") @PathVariable("mocId") Long mocId,
                                                    HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        Optional<MocChangeRequest> optionalMoc = mocChangeRequestService.findById(mocId);
        if (optionalMoc.isPresent()) {
            MocChangeRequest moc = optionalMoc.get();
            if (user.getRole().getViewPermissions().contains(PermissionEntity.PERMITS) &&
                    moc.getCompany().getId().equals(user.getCompany().getId())) {
                return mocApprovalService.findByMocChangeRequest(mocId)
                        .stream()
                        .map(mocApprovalMapper::toShowDto)
                        .collect(Collectors.toList());
            } else {
                throw new CustomException("Access denied", HttpStatus.FORBIDDEN);
            }
        } else {
            throw new CustomException("MoC change request not found", HttpStatus.NOT_FOUND);
        }
    }

    @PostMapping("")
    @PreAuthorize("hasRole('ROLE_CLIENT')")
    @ApiResponses(value = {
            @ApiResponse(code = 500, message = "Something went wrong"),
            @ApiResponse(code = 403, message = "Access denied")})
    public MocApprovalShowDTO create(@ApiParam("MocApproval") @Valid @RequestBody MocApproval approvalReq,
                                      HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        if (user.getRole().getCreatePermissions().contains(PermissionEntity.PERMITS)) {
            // Validate MoC change request if provided
            if (approvalReq.getChangeRequest() != null) {
                Optional<MocChangeRequest> optionalMoc = mocChangeRequestService.findById(approvalReq.getChangeRequest().getId());
                if (!optionalMoc.isPresent() || !optionalMoc.get().getCompany().getId().equals(user.getCompany().getId())) {
                    throw new CustomException("Invalid MoC change request", HttpStatus.BAD_REQUEST);
                }
            }
            
            approvalReq.setCreatedBy(user.getId());
            MocApproval createdApproval = mocApprovalService.create(approvalReq, user.getCompany());
            return mocApprovalMapper.toShowDto(createdApproval);
        } else {
            throw new CustomException("Access denied", HttpStatus.FORBIDDEN);
        }
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_CLIENT')")
    @ApiResponses(value = {
            @ApiResponse(code = 500, message = "Something went wrong"),
            @ApiResponse(code = 403, message = "Access denied"),
            @ApiResponse(code = 404, message = "MoC approval not found")})
    public MocApprovalShowDTO patch(@ApiParam("MocApproval") @Valid @RequestBody MocApprovalPatchDTO approval,
                                     @ApiParam("id") @PathVariable("id") Long id,
                                     HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        Optional<MocApproval> optionalApproval = mocApprovalService.findById(id);
        if (optionalApproval.isPresent()) {
            MocApproval savedApproval = optionalApproval.get();
            if (savedApproval.getCompany().getId().equals(user.getCompany().getId()) &&
                    (savedApproval.getCreatedBy().equals(user.getId()) || 
                     user.getRole().getEditOtherPermissions().contains(PermissionEntity.PERMITS))) {
                MocApproval patchedApproval = mocApprovalService.update(id, approval, user);
                return mocApprovalMapper.toShowDto(patchedApproval);
            } else {
                throw new CustomException("Forbidden", HttpStatus.FORBIDDEN);
            }
        } else {
            throw new CustomException("MoC approval not found", HttpStatus.NOT_FOUND);
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_CLIENT')")
    @ApiResponses(value = {
            @ApiResponse(code = 500, message = "Something went wrong"),
            @ApiResponse(code = 403, message = "Access denied"),
            @ApiResponse(code = 404, message = "MoC approval not found")})
    public ResponseEntity<Void> delete(@ApiParam("id") @PathVariable("id") Long id, HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        Optional<MocApproval> optionalApproval = mocApprovalService.findById(id);
        if (optionalApproval.isPresent()) {
            MocApproval savedApproval = optionalApproval.get();
            if (savedApproval.getCompany().getId().equals(user.getCompany().getId()) &&
                    user.getRole().getDeleteOtherPermissions().contains(PermissionEntity.PERMITS)) {
                mocApprovalService.delete(id);
                return new ResponseEntity<>(HttpStatus.NO_CONTENT);
            } else {
                throw new CustomException("Forbidden", HttpStatus.FORBIDDEN);
            }
        } else {
            throw new CustomException("MoC approval not found", HttpStatus.NOT_FOUND);
        }
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ROLE_CLIENT')")
    @ApiResponses(value = {
            @ApiResponse(code = 500, message = "Something went wrong"),
            @ApiResponse(code = 403, message = "Access denied"),
            @ApiResponse(code = 404, message = "MoC approval not found")})
    public MocApprovalShowDTO approve(@ApiParam("id") @PathVariable("id") Long id,
                                       @RequestBody(required = false) String comments,
                                       HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        Optional<MocApproval> optionalApproval = mocApprovalService.findById(id);
        if (optionalApproval.isPresent()) {
            MocApproval savedApproval = optionalApproval.get();
            // Only the assigned approver can approve
            if (savedApproval.getCompany().getId().equals(user.getCompany().getId()) &&
                    savedApproval.getApproverUser() != null && 
                    savedApproval.getApproverUser().getId().equals(user.getId())) {
                MocApproval approvedApproval = mocApprovalService.approve(id, user, comments);
                return mocApprovalMapper.toShowDto(approvedApproval);
            } else {
                throw new CustomException("Forbidden - only assigned approver can approve", HttpStatus.FORBIDDEN);
            }
        } else {
            throw new CustomException("MoC approval not found", HttpStatus.NOT_FOUND);
        }
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('ROLE_CLIENT')")
    @ApiResponses(value = {
            @ApiResponse(code = 500, message = "Something went wrong"),
            @ApiResponse(code = 403, message = "Access denied"),
            @ApiResponse(code = 404, message = "MoC approval not found")})
    public MocApprovalShowDTO reject(@ApiParam("id") @PathVariable("id") Long id,
                                      @RequestBody(required = false) String reason,
                                      HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        Optional<MocApproval> optionalApproval = mocApprovalService.findById(id);
        if (optionalApproval.isPresent()) {
            MocApproval savedApproval = optionalApproval.get();
            // Only the assigned approver can reject
            if (savedApproval.getCompany().getId().equals(user.getCompany().getId()) &&
                    savedApproval.getApproverUser() != null && 
                    savedApproval.getApproverUser().getId().equals(user.getId())) {
                MocApproval rejectedApproval = mocApprovalService.reject(id, user, reason);
                return mocApprovalMapper.toShowDto(rejectedApproval);
            } else {
                throw new CustomException("Forbidden - only assigned approver can reject", HttpStatus.FORBIDDEN);
            }
        } else {
            throw new CustomException("MoC approval not found", HttpStatus.NOT_FOUND);
        }
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("permitAll()")
    public Collection<MocApprovalShowDTO> getByStatus(@ApiParam("status") @PathVariable("status") MocApprovalStatus status,
                                                       HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        if (user.getRole().getViewPermissions().contains(PermissionEntity.PERMITS)) {
            return mocApprovalService.findByStatusAndCompany(status, user.getCompany().getId())
                    .stream()
                    .map(mocApprovalMapper::toShowDto)
                    .collect(Collectors.toList());
        } else {
            throw new CustomException("Access denied", HttpStatus.FORBIDDEN);
        }
    }

    @GetMapping("/pending-my-approval")
    @PreAuthorize("permitAll()")
    public Collection<MocApprovalShowDTO> getPendingMyApproval(HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        if (user.getRole().getViewPermissions().contains(PermissionEntity.PERMITS)) {
            return mocApprovalService.findPendingByApprover(user.getId())
                    .stream()
                    .map(mocApprovalMapper::toShowDto)
                    .collect(Collectors.toList());
        } else {
            throw new CustomException("Access denied", HttpStatus.FORBIDDEN);
        }
    }
}
