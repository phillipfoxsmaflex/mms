package com.grash.mapper;

import com.grash.dto.ContractorCalendarEntryPatchDTO;
import com.grash.model.ContractorCalendarEntry;
import com.grash.model.ContractorEmployee;
import com.grash.model.OwnUser;
import com.grash.model.Vendor;
import com.grash.model.WorkOrder;
import com.grash.service.ContractorEmployeeService;
import com.grash.service.UserService;
import com.grash.service.VendorService;
import com.grash.service.WorkOrderService;
import org.mapstruct.*;
import org.springframework.beans.factory.annotation.Autowired;

@Mapper(componentModel = "spring")
public abstract class ContractorCalendarEntryMapper {
    
    @Autowired
    protected VendorService vendorService;
    
    @Autowired
    protected WorkOrderService workOrderService;
    
    @Autowired
    protected ContractorEmployeeService contractorEmployeeService;
    
    @Autowired
    protected UserService userService;

    @Mapping(target = "vendor", source = "vendorId", qualifiedByName = "vendorFromId")
    @Mapping(target = "workOrder", source = "workOrderId", qualifiedByName = "workOrderFromId")
    @Mapping(target = "employee", source = "employeeId", qualifiedByName = "employeeFromId")
    @Mapping(target = "supervisor", source = "supervisorId", qualifiedByName = "userFromId")
    public abstract ContractorCalendarEntry updateContractorCalendarEntry(@MappingTarget ContractorCalendarEntry contractorCalendarEntry, ContractorCalendarEntryPatchDTO contractorCalendarEntryPatchDTO);
    
    @Named("vendorFromId")
    protected Vendor vendorFromId(Long vendorId) {
        return vendorId != null ? vendorService.findById(vendorId).orElse(null) : null;
    }
    
    @Named("workOrderFromId")
    protected WorkOrder workOrderFromId(Long workOrderId) {
        return workOrderId != null ? workOrderService.findById(workOrderId).orElse(null) : null;
    }
    
    @Named("employeeFromId")
    protected ContractorEmployee employeeFromId(Long employeeId) {
        return employeeId != null ? contractorEmployeeService.findById(employeeId).orElse(null) : null;
    }
    
    @Named("userFromId")
    protected OwnUser userFromId(Long userId) {
        return userId != null ? userService.findById(userId).orElse(null) : null;
    }
}