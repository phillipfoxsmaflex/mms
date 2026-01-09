package com.grash.mapper;

import com.grash.dto.SafetyInstructionPatchDTO;
import com.grash.model.Location;
import com.grash.model.OwnUser;
import com.grash.model.SafetyInstruction;
import com.grash.model.Vendor;
import com.grash.service.ContractorEmployeeService;
import com.grash.service.LocationService;
import com.grash.service.UserService;
import com.grash.service.VendorService;
import org.mapstruct.*;
import org.springframework.beans.factory.annotation.Autowired;

@Mapper(componentModel = "spring")
public abstract class SafetyInstructionMapper {
    
    @Autowired
    protected LocationService locationService;
    
    @Autowired
    protected VendorService vendorService;
    
    @Autowired
    protected UserService userService;
    
    @Autowired
    protected ContractorEmployeeService contractorEmployeeService;

    @Mapping(target = "location", source = "locationId", qualifiedByName = "locationFromId")
    @Mapping(target = "vendor", source = "vendorId", qualifiedByName = "vendorFromId")
    @Mapping(target = "instructor", source = "instructorId", qualifiedByName = "userFromId")
    @Mapping(target = "employee", source = "employeeId", qualifiedByName = "employeeFromId")
    public abstract SafetyInstruction updateSafetyInstruction(@MappingTarget SafetyInstruction safetyInstruction, SafetyInstructionPatchDTO safetyInstructionPatchDTO);
    
    @Named("locationFromId")
    protected Location locationFromId(Long locationId) {
        return locationId != null ? locationService.findById(locationId).orElse(null) : null;
    }
    
    @Named("vendorFromId")
    protected Vendor vendorFromId(Long vendorId) {
        return vendorId != null ? vendorService.findById(vendorId).orElse(null) : null;
    }
    
    @Named("userFromId")
    protected OwnUser userFromId(Long userId) {
        return userId != null ? userService.findById(userId).orElse(null) : null;
    }
    
    @Named("employeeFromId")
    protected com.grash.model.ContractorEmployee employeeFromId(Long employeeId) {
        return employeeId != null ? contractorEmployeeService.findById(employeeId).orElse(null) : null;
    }
}