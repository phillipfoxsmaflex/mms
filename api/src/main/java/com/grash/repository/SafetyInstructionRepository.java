package com.grash.repository;

import com.grash.model.SafetyInstruction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDateTime;
import java.util.List;

public interface SafetyInstructionRepository extends JpaRepository<SafetyInstruction, Long>, JpaSpecificationExecutor<SafetyInstruction> {
    List<SafetyInstruction> findByVendor_Id(Long vendorId);
    List<SafetyInstruction> findByEmployee_Id(Long employeeId);
    List<SafetyInstruction> findByExpirationDateBeforeAndCompletedTrue(LocalDateTime date);
    List<SafetyInstruction> findByExpirationDateBetweenAndCompletedTrue(LocalDateTime start, LocalDateTime end);
}