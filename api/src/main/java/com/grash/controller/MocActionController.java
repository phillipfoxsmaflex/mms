package com.grash.controller;

import com.grash.dto.*;
import com.grash.exception.CustomException;
import com.grash.mapper.MocActionMapper;
import com.grash.model.*;
import com.grash.model.enums.MocActionStatus;
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
@RequestMapping("/moc-actions")
@Api(tags = "mocAction")
@RequiredArgsConstructor
@Transactional
public class MocActionController {

    private final MocActionService mocActionService;
    private final MocActionMapper mocActionMapper;
    private final UserService userService;
    private final MocChangeRequestService mocChangeRequestService;

    @GetMapping("")
    @PreAuthorize("permitAll()")
    @ApiResponses(value = {
            @ApiResponse(code = 500, message = "Something went wrong"),
            @ApiResponse(code = 403, message = "Access denied"),
            @ApiResponse(code = 404, message = "MoC actions not found")})
    public Collection<MocActionShowDTO> getAll(HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        if (user.getRole().getViewPermissions().contains(PermissionEntity.PERMITS)) {
            return mocActionService.findByCompany(user.getCompany().getId())
                    .stream()
                    .map(mocActionMapper::toShowDto)
                    .collect(Collectors.toList());
        } else {
            throw new CustomException("Access denied", HttpStatus.FORBIDDEN);
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("permitAll()")
    public MocActionShowDTO getById(@ApiParam("id") @PathVariable("id") Long id, HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        Optional<MocAction> optionalAction = mocActionService.findById(id);
        if (optionalAction.isPresent()) {
            MocAction savedAction = optionalAction.get();
            if (user.getRole().getViewPermissions().contains(PermissionEntity.PERMITS) &&
                    savedAction.getCompany().getId().equals(user.getCompany().getId())) {
                return mocActionMapper.toShowDto(savedAction);
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
    public Collection<MocActionShowDTO> getByMoc(@ApiParam("mocId") @PathVariable("mocId") Long mocId,
                                                  HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        Optional<MocChangeRequest> optionalMoc = mocChangeRequestService.findById(mocId);
        if (optionalMoc.isPresent()) {
            MocChangeRequest moc = optionalMoc.get();
            if (user.getRole().getViewPermissions().contains(PermissionEntity.PERMITS) &&
                    moc.getCompany().getId().equals(user.getCompany().getId())) {
                return mocActionService.findByMocChangeRequest(mocId)
                        .stream()
                        .map(mocActionMapper::toShowDto)
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
    public MocActionShowDTO create(@ApiParam("MocAction") @Valid @RequestBody MocAction actionReq,
                                    HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        if (user.getRole().getCreatePermissions().contains(PermissionEntity.PERMITS)) {
            // Validate MoC change request if provided
            if (actionReq.getChangeRequest() != null) {
                Optional<MocChangeRequest> optionalMoc = mocChangeRequestService.findById(actionReq.getChangeRequest().getId());
                if (!optionalMoc.isPresent() || !optionalMoc.get().getCompany().getId().equals(user.getCompany().getId())) {
                    throw new CustomException("Invalid MoC change request", HttpStatus.BAD_REQUEST);
                }
            }
            
            actionReq.setCreatedBy(user.getId());
            MocAction createdAction = mocActionService.create(actionReq, user.getCompany());
            return mocActionMapper.toShowDto(createdAction);
        } else {
            throw new CustomException("Access denied", HttpStatus.FORBIDDEN);
        }
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_CLIENT')")
    @ApiResponses(value = {
            @ApiResponse(code = 500, message = "Something went wrong"),
            @ApiResponse(code = 403, message = "Access denied"),
            @ApiResponse(code = 404, message = "MoC action not found")})
    public MocActionShowDTO patch(@ApiParam("MocAction") @Valid @RequestBody MocActionPatchDTO action,
                                   @ApiParam("id") @PathVariable("id") Long id,
                                   HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        Optional<MocAction> optionalAction = mocActionService.findById(id);
        if (optionalAction.isPresent()) {
            MocAction savedAction = optionalAction.get();
            if (savedAction.getCompany().getId().equals(user.getCompany().getId()) &&
                    (savedAction.getCreatedBy().equals(user.getId()) || 
                     user.getRole().getEditOtherPermissions().contains(PermissionEntity.PERMITS))) {
                MocAction patchedAction = mocActionService.update(id, action, user);
                return mocActionMapper.toShowDto(patchedAction);
            } else {
                throw new CustomException("Forbidden", HttpStatus.FORBIDDEN);
            }
        } else {
            throw new CustomException("MoC action not found", HttpStatus.NOT_FOUND);
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_CLIENT')")
    @ApiResponses(value = {
            @ApiResponse(code = 500, message = "Something went wrong"),
            @ApiResponse(code = 403, message = "Access denied"),
            @ApiResponse(code = 404, message = "MoC action not found")})
    public ResponseEntity<Void> delete(@ApiParam("id") @PathVariable("id") Long id, HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        Optional<MocAction> optionalAction = mocActionService.findById(id);
        if (optionalAction.isPresent()) {
            MocAction savedAction = optionalAction.get();
            if (savedAction.getCompany().getId().equals(user.getCompany().getId()) &&
                    user.getRole().getDeleteOtherPermissions().contains(PermissionEntity.PERMITS)) {
                mocActionService.delete(id);
                return new ResponseEntity<>(HttpStatus.NO_CONTENT);
            } else {
                throw new CustomException("Forbidden", HttpStatus.FORBIDDEN);
            }
        } else {
            throw new CustomException("MoC action not found", HttpStatus.NOT_FOUND);
        }
    }

    @PostMapping("/{id}/start")
    @PreAuthorize("hasRole('ROLE_CLIENT')")
    @ApiResponses(value = {
            @ApiResponse(code = 500, message = "Something went wrong"),
            @ApiResponse(code = 403, message = "Access denied"),
            @ApiResponse(code = 404, message = "MoC action not found")})
    public MocActionShowDTO start(@ApiParam("id") @PathVariable("id") Long id, HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        Optional<MocAction> optionalAction = mocActionService.findById(id);
        if (optionalAction.isPresent()) {
            MocAction savedAction = optionalAction.get();
            if (savedAction.getCompany().getId().equals(user.getCompany().getId())) {
                MocAction startedAction = mocActionService.start(id, user);
                return mocActionMapper.toShowDto(startedAction);
            } else {
                throw new CustomException("Forbidden", HttpStatus.FORBIDDEN);
            }
        } else {
            throw new CustomException("MoC action not found", HttpStatus.NOT_FOUND);
        }
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasRole('ROLE_CLIENT')")
    @ApiResponses(value = {
            @ApiResponse(code = 500, message = "Something went wrong"),
            @ApiResponse(code = 403, message = "Access denied"),
            @ApiResponse(code = 404, message = "MoC action not found")})
    public MocActionShowDTO complete(@ApiParam("id") @PathVariable("id") Long id, HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        Optional<MocAction> optionalAction = mocActionService.findById(id);
        if (optionalAction.isPresent()) {
            MocAction savedAction = optionalAction.get();
            if (savedAction.getCompany().getId().equals(user.getCompany().getId())) {
                MocAction completedAction = mocActionService.complete(id, user, null);
                return mocActionMapper.toShowDto(completedAction);
            } else {
                throw new CustomException("Forbidden", HttpStatus.FORBIDDEN);
            }
        } else {
            throw new CustomException("MoC action not found", HttpStatus.NOT_FOUND);
        }
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("permitAll()")
    public Collection<MocActionShowDTO> getByStatus(@ApiParam("status") @PathVariable("status") MocActionStatus status,
                                                     HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        if (user.getRole().getViewPermissions().contains(PermissionEntity.PERMITS)) {
            return mocActionService.findByStatusAndCompany(status, user.getCompany().getId())
                    .stream()
                    .map(mocActionMapper::toShowDto)
                    .collect(Collectors.toList());
        } else {
            throw new CustomException("Access denied", HttpStatus.FORBIDDEN);
        }
    }

    @GetMapping("/assigned-to-me")
    @PreAuthorize("permitAll()")
    public Collection<MocActionShowDTO> getAssignedToMe(HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        if (user.getRole().getViewPermissions().contains(PermissionEntity.PERMITS)) {
            return mocActionService.findByAssignedTo(user.getId())
                    .stream()
                    .map(mocActionMapper::toShowDto)
                    .collect(Collectors.toList());
        } else {
            throw new CustomException("Access denied", HttpStatus.FORBIDDEN);
        }
    }

    @GetMapping("/pending")
    @PreAuthorize("permitAll()")
    public Collection<MocActionShowDTO> getPending(HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        if (user.getRole().getViewPermissions().contains(PermissionEntity.PERMITS)) {
            return mocActionService.findPending(user.getCompany().getId())
                    .stream()
                    .map(mocActionMapper::toShowDto)
                    .collect(Collectors.toList());
        } else {
            throw new CustomException("Access denied", HttpStatus.FORBIDDEN);
        }
    }
}
