package com.grash.service;

import com.grash.advancedsearch.SearchCriteria;
import com.grash.advancedsearch.SpecificationBuilder;
import com.grash.dto.SafetyInstructionPatchDTO;
import com.grash.exception.CustomException;
import com.grash.mapper.SafetyInstructionMapper;
import com.grash.model.ContractorEmployee;
import com.grash.model.OwnUser;
import com.grash.model.SafetyInstruction;
import com.grash.model.Vendor;
import com.grash.repository.SafetyInstructionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SafetyInstructionService {
    private final SafetyInstructionRepository safetyInstructionRepository;
    private final VendorService vendorService;
    private final ContractorEmployeeService contractorEmployeeService;
    private final SafetyInstructionMapper safetyInstructionMapper;
    private final UserService userService;

    public SafetyInstruction create(SafetyInstruction safetyInstruction) {
        // Set standard expiration date (12 months from instruction date)
        if (safetyInstruction.getInstructionDate() != null && safetyInstruction.getExpirationDate() == null) {
            safetyInstruction.setExpirationDate(safetyInstruction.getInstructionDate().plusMonths(12));
        }
        
        return safetyInstructionRepository.save(safetyInstruction);
    }

    public SafetyInstruction update(Long id, SafetyInstructionPatchDTO safetyInstruction) {
        if (safetyInstructionRepository.existsById(id)) {
            SafetyInstruction savedInstruction = safetyInstructionRepository.findById(id).get();
            return safetyInstructionRepository.save(safetyInstructionMapper.updateSafetyInstruction(savedInstruction, safetyInstruction));
        } else throw new CustomException("Not found", HttpStatus.NOT_FOUND);
    }

    public Collection<SafetyInstruction> getAll() {
        return safetyInstructionRepository.findAll();
    }

    public void delete(Long id) {
        safetyInstructionRepository.deleteById(id);
    }

    public Optional<SafetyInstruction> findById(Long id) {
        return safetyInstructionRepository.findById(id);
    }

    public Collection<SafetyInstruction> findByVendor(Long vendorId) {
        return safetyInstructionRepository.findByVendor_Id(vendorId);
    }

    public Collection<SafetyInstruction> findByEmployee(Long employeeId) {
        return safetyInstructionRepository.findByEmployee_Id(employeeId);
    }

    public Collection<SafetyInstruction> findExpiredInstructions() {
        return safetyInstructionRepository.findByExpirationDateBeforeAndCompletedTrue(LocalDateTime.now());
    }

    public Page<SafetyInstruction> findBySearchCriteria(SearchCriteria searchCriteria) {
        SpecificationBuilder<SafetyInstruction> builder = new SpecificationBuilder<>();
        searchCriteria.getFilterFields().forEach(builder::with);
        Pageable page = PageRequest.of(searchCriteria.getPageNum(), searchCriteria.getPageSize(),
                searchCriteria.getDirection(), searchCriteria.getSortField());
        return safetyInstructionRepository.findAll(builder.build(), page);
    }

    public SafetyInstruction completeInstruction(Long id, String signatureData, String signatureName, Long userId) {
        Optional<SafetyInstruction> optionalInstruction = safetyInstructionRepository.findById(id);
        if (optionalInstruction.isPresent()) {
            SafetyInstruction instruction = optionalInstruction.get();
            instruction.setCompleted(true);
            instruction.setCompletionDate(LocalDateTime.now());
            instruction.setSignatureData(signatureData);
            instruction.setSignatureName(signatureName);
            
            // Update employee's current safety instruction
            if (instruction.getEmployee() != null) {
                ContractorEmployee employee = instruction.getEmployee();
                employee.setCurrentSafetyInstruction(instruction);
                contractorEmployeeService.update(employee.getId(), employee);
            }
            
            return safetyInstructionRepository.save(instruction);
        } else throw new CustomException("Safety instruction not found", HttpStatus.NOT_FOUND);
    }

    public boolean isEmployeeInstructionValid(Long employeeId) {
        Optional<ContractorEmployee> optionalEmployee = contractorEmployeeService.findById(employeeId);
        if (optionalEmployee.isPresent()) {
            ContractorEmployee employee = optionalEmployee.get();
            SafetyInstruction currentInstruction = employee.getCurrentSafetyInstruction();
            
            if (currentInstruction == null) {
                return false; // No instruction
            }
            
            return currentInstruction.isCompleted() && 
                   currentInstruction.getExpirationDate().isAfter(LocalDateTime.now());
        }
        return false;
    }
}