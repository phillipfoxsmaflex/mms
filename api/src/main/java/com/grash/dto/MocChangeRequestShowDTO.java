package com.grash.dto;

import com.grash.model.enums.MocStatus;
import com.grash.model.enums.RiskLevel;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;

@Data
@NoArgsConstructor
public class MocChangeRequestShowDTO {
    private Long id;
    private String title;
    private String description;
    private String changeType;
    private String affectedSystems;
    private String riskAssessment;
    private String justification;
    private RiskLevel riskLevel;
    private MocStatus status;
    
    private Date proposedStartDate;
    private Date proposedEndDate;
    private Date implementedAt;
    
    private UserMiniDTO requestor;
    private UserMiniDTO implementedBy;
    private PermitMiniDTO permit;
    
    private List<MocActionShowDTO> actions;
    private List<MocApprovalShowDTO> approvals;
    private List<FileShowDTO> files;
    
    private Date createdAt;
    private Date updatedAt;
    private Long createdBy;
}
