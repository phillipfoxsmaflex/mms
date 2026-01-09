package com.grash.dto;

import com.grash.model.enums.InstructionType;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class SafetyInstructionPatchDTO {
    private String title;
    private String description;
    private LocalDateTime instructionDate;
    private LocalDateTime expirationDate;
    private InstructionType type;
    private String instructionMaterialUrl;
    private String instructionMaterialFileId;
    private Long locationId;
    private Long vendorId;
    private Long instructorId;
    private Long employeeId;
}