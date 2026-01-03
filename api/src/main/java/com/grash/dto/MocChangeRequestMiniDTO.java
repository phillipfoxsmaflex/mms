package com.grash.dto;

import com.grash.model.enums.MocStatus;
import com.grash.model.enums.RiskLevel;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class MocChangeRequestMiniDTO {
    private Long id;
    private String title;
    private MocStatus status;
    private RiskLevel riskLevel;
}
