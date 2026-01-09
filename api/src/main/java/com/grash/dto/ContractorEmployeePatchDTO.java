package com.grash.dto;

import lombok.Data;

@Data
public class ContractorEmployeePatchDTO {
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String position;
    private Long vendorId;
    private Long currentSafetyInstructionId;
}