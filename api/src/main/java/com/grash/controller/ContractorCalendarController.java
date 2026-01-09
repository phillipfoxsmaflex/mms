package com.grash.controller;

import com.grash.advancedsearch.SearchCriteria;
import com.grash.dto.SuccessResponse;
import com.grash.exception.CustomException;
import com.grash.model.ContractorCalendarEntry;
import com.grash.model.OwnUser;
import com.grash.model.enums.PermissionEntity;
import com.grash.model.enums.RoleType;
import com.grash.service.ContractorCalendarService;
import com.grash.service.UserService;
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
import javax.validation.Valid;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Optional;

@RestController
@RequestMapping("/contractor-calendar")
@Api(tags = "contractor-calendar")
@RequiredArgsConstructor
public class ContractorCalendarController {

    private final ContractorCalendarService contractorCalendarService;
    private final UserService userService;

    @PostMapping("/search")
    @PreAuthorize("permitAll()")
    public ResponseEntity<Page<ContractorCalendarEntry>> search(@RequestBody SearchCriteria searchCriteria, HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        if (user.getRole().getRoleType().equals(RoleType.ROLE_CLIENT)) {
            if (user.getRole().getViewPermissions().contains(PermissionEntity.VENDORS_AND_CUSTOMERS)) {
                searchCriteria.filterCompany(user);
            } else throw new CustomException("Access Denied", HttpStatus.FORBIDDEN);
        }
        return ResponseEntity.ok(contractorCalendarService.findBySearchCriteria(searchCriteria));
    }

    @GetMapping("/{id}")
    @PreAuthorize("permitAll()")
    @ApiResponses(value = {//
            @ApiResponse(code = 500, message = "Something went wrong"),
            @ApiResponse(code = 403, message = "Access denied"),
            @ApiResponse(code = 404, message = "Calendar entry not found")})
    public ContractorCalendarEntry getById(@ApiParam("id") @PathVariable("id") Long id, HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        Optional<ContractorCalendarEntry> optionalEntry = contractorCalendarService.findById(id);
        if (optionalEntry.isPresent()) {
            ContractorCalendarEntry savedEntry = optionalEntry.get();
            if (user.getRole().getViewPermissions().contains(PermissionEntity.VENDORS_AND_CUSTOMERS)) {
                return savedEntry;
            } else throw new CustomException("Access denied", HttpStatus.FORBIDDEN);
        } else throw new CustomException("Not found", HttpStatus.NOT_FOUND);
    }

    @GetMapping("/vendor/{vendorId}")
    @PreAuthorize("hasRole('ROLE_CLIENT')")
    @ApiResponses(value = {//
            @ApiResponse(code = 500, message = "Something went wrong"),
            @ApiResponse(code = 403, message = "Access denied"),
            @ApiResponse(code = 404, message = "Vendor not found")})
    public Collection<ContractorCalendarEntry> getByVendor(@ApiParam("vendorId") @PathVariable("vendorId") Long vendorId, HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        if (user.getRole().getViewPermissions().contains(PermissionEntity.VENDORS_AND_CUSTOMERS)) {
            return contractorCalendarService.findByVendor(vendorId);
        } else throw new CustomException("Access denied", HttpStatus.FORBIDDEN);
    }

    @GetMapping("/employee/{employeeId}")
    @PreAuthorize("hasRole('ROLE_CLIENT')")
    @ApiResponses(value = {//
            @ApiResponse(code = 500, message = "Something went wrong"),
            @ApiResponse(code = 403, message = "Access denied"),
            @ApiResponse(code = 404, message = "Employee not found")})
    public Collection<ContractorCalendarEntry> getByEmployee(@ApiParam("employeeId") @PathVariable("employeeId") Long employeeId, HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        if (user.getRole().getViewPermissions().contains(PermissionEntity.VENDORS_AND_CUSTOMERS)) {
            return contractorCalendarService.findByEmployee(employeeId);
        } else throw new CustomException("Access denied", HttpStatus.FORBIDDEN);
    }

    @GetMapping("/work-order/{workOrderId}")
    @PreAuthorize("hasRole('ROLE_CLIENT')")
    @ApiResponses(value = {//
            @ApiResponse(code = 500, message = "Something went wrong"),
            @ApiResponse(code = 403, message = "Access denied"),
            @ApiResponse(code = 404, message = "Work order not found")})
    public Collection<ContractorCalendarEntry> getByWorkOrder(@ApiParam("workOrderId") @PathVariable("workOrderId") Long workOrderId, HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        if (user.getRole().getViewPermissions().contains(PermissionEntity.VENDORS_AND_CUSTOMERS)) {
            return contractorCalendarService.findByWorkOrder(workOrderId);
        } else throw new CustomException("Access denied", HttpStatus.FORBIDDEN);
    }

    @GetMapping("/date-range")
    @PreAuthorize("hasRole('ROLE_CLIENT')")
    @ApiResponses(value = {//
            @ApiResponse(code = 500, message = "Something went wrong"),
            @ApiResponse(code = 403, message = "Access denied")})
    public Collection<ContractorCalendarEntry> getByDateRange(
            @RequestParam LocalDateTime start,
            @RequestParam LocalDateTime end,
            HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        if (user.getRole().getViewPermissions().contains(PermissionEntity.VENDORS_AND_CUSTOMERS)) {
            return contractorCalendarService.findByDateRange(start, end);
        } else throw new CustomException("Access denied", HttpStatus.FORBIDDEN);
    }

    @PostMapping("")
    @PreAuthorize("hasRole('ROLE_CLIENT')")
    @ApiResponses(value = {//
            @ApiResponse(code = 500, message = "Something went wrong"),
            @ApiResponse(code = 403, message = "Access denied")})
    public ContractorCalendarEntry create(@ApiParam("ContractorCalendarEntry") @Valid @RequestBody ContractorCalendarEntry contractorCalendarEntryReq, HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        if (user.getRole().getCreatePermissions().contains(PermissionEntity.VENDORS_AND_CUSTOMERS)) {
            return contractorCalendarService.create(contractorCalendarEntryReq);
        } else throw new CustomException("Access denied", HttpStatus.FORBIDDEN);
    }

    @PostMapping("/from-work-order")
    @PreAuthorize("hasRole('ROLE_CLIENT')")
    @ApiResponses(value = {//
            @ApiResponse(code = 500, message = "Something went wrong"),
            @ApiResponse(code = 403, message = "Access denied")})
    public ContractorCalendarEntry createFromWorkOrder(
            @RequestParam Long workOrderId,
            @RequestParam Long employeeId,
            @RequestParam Long supervisorId,
            HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        if (user.getRole().getCreatePermissions().contains(PermissionEntity.VENDORS_AND_CUSTOMERS)) {
            return contractorCalendarService.createFromWorkOrder(workOrderId, employeeId, supervisorId);
        } else throw new CustomException("Access denied", HttpStatus.FORBIDDEN);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_CLIENT')")
    @ApiResponses(value = {//
            @ApiResponse(code = 500, message = "Something went wrong"),
            @ApiResponse(code = 403, message = "Access denied"),
            @ApiResponse(code = 404, message = "Calendar entry not found")})
    public ContractorCalendarEntry patch(@ApiParam("ContractorCalendarEntry") @Valid @RequestBody com.grash.dto.ContractorCalendarEntryPatchDTO contractorCalendarEntry,
                                  @ApiParam("id") @PathVariable("id") Long id,
                                  HttpServletRequest req) {
        OwnUser user = userService.whoami(req);
        Optional<ContractorCalendarEntry> optionalEntry = contractorCalendarService.findById(id);

        if (optionalEntry.isPresent()) {
            ContractorCalendarEntry savedEntry = optionalEntry.get();
            if (user.getRole().getEditOtherPermissions().contains(PermissionEntity.VENDORS_AND_CUSTOMERS) || savedEntry.getCreatedBy().equals(user.getId())) {
                return contractorCalendarService.update(id, contractorCalendarEntry);
            } else throw new CustomException("Forbidden", HttpStatus.FORBIDDEN);
        } else throw new CustomException("Calendar entry not found", HttpStatus.NOT_FOUND);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_CLIENT')")
    @ApiResponses(value = {//
            @ApiResponse(code = 500, message = "Something went wrong"),
            @ApiResponse(code = 403, message = "Access denied"),
            @ApiResponse(code = 404, message = "Calendar entry not found")})
    public ResponseEntity<SuccessResponse> delete(@ApiParam("id") @PathVariable("id") Long id, HttpServletRequest req) {
        OwnUser user = userService.whoami(req);

        Optional<ContractorCalendarEntry> optionalEntry = contractorCalendarService.findById(id);
        if (optionalEntry.isPresent()) {
            ContractorCalendarEntry savedEntry = optionalEntry.get();
            if (user.getId().equals(savedEntry.getCreatedBy()) ||
                    user.getRole().getDeleteOtherPermissions().contains(PermissionEntity.VENDORS_AND_CUSTOMERS)) {
                contractorCalendarService.delete(id);
                return new ResponseEntity<>(new SuccessResponse(true, "Deleted successfully"),
                        HttpStatus.OK);
            } else throw new CustomException("Forbidden", HttpStatus.FORBIDDEN);
        } else throw new CustomException("Calendar entry not found", HttpStatus.NOT_FOUND);
    }
}