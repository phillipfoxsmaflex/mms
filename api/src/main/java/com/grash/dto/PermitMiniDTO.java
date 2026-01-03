package com.grash.dto;

import com.grash.model.enums.PermitStatus;
import com.grash.model.enums.PermitType;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class PermitMiniDTO {
    private Long id;
    private String permitId;
    private String title;
    private PermitType type;
    private PermitStatus status;
}
