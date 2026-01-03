package com.grash.dto;

import com.grash.model.File;
import com.grash.model.OwnUser;
import com.grash.model.Permit;
import com.grash.model.enums.MocStatus;
import com.grash.model.enums.RiskLevel;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;

@Data
@NoArgsConstructor
public class MocChangeRequestPatchDTO {
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
    
    private OwnUser requestor;
    private OwnUser implementedBy;
    private Permit permit;
    
    private List<File> files;
}
