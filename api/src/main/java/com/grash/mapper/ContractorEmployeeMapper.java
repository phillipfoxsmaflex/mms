package com.grash.mapper;

import com.grash.dto.ContractorEmployeePatchDTO;
import com.grash.model.ContractorEmployee;
import com.grash.model.SafetyInstruction;
import com.grash.model.Vendor;
import com.grash.service.SafetyInstructionService;
import com.grash.service.VendorService;
import org.mapstruct.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;

@Mapper(componentModel = "spring")
public abstract class ContractorEmployeeMapper {
    
    @Lazy
    @Autowired
    protected SafetyInstructionService safetyInstructionService;
    
    @Autowired
    protected VendorService vendorService;

    @Mapping(target = "vendor", source = "vendorId", qualifiedByName = "vendorFromId")
    @Mapping(target = "currentSafetyInstruction", source = "currentSafetyInstructionId", qualifiedByName = "safetyInstructionFromId")
    public abstract ContractorEmployee updateContractorEmployee(@MappingTarget ContractorEmployee contractorEmployee, ContractorEmployeePatchDTO contractorEmployeePatchDTO);
    
    @Named("vendorFromId")
    protected Vendor vendorFromId(Long vendorId) {
        return vendorId != null ? vendorService.findById(vendorId).orElse(null) : null;
    }
    
    @Named("safetyInstructionFromId")
    protected SafetyInstruction safetyInstructionFromId(Long instructionId) {
        return instructionId != null ? safetyInstructionService.findById(instructionId).orElse(null) : null;
    }
}