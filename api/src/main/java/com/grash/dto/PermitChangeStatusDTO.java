package com.grash.dto;

import com.grash.model.enums.PermitStatus;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class PermitChangeStatusDTO {
    private PermitStatus status;
    private String comments;
}
