package com.grash.dto;

import com.grash.model.File;
import com.grash.model.OwnUser;
import com.grash.model.PermitLocation;
import com.grash.model.Team;
import com.grash.model.enums.PermitStatus;
import com.grash.model.enums.PermitType;
import com.grash.model.enums.RiskLevel;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;

@Data
@NoArgsConstructor
public class PermitPatchDTO {
    private String title;
    private String description;
    private PermitType type;
    private PermitStatus status;
    private RiskLevel riskLevel;
    
    private PermitLocation permitLocation;
    private OwnUser requestor;
    private String requestorName;
    private String department;
    private String contactNumber;
    private String emergencyContact;
    
    private Date startDate;
    private Date endDate;
    
    private String safetyRequirements;
    private String equipmentNeeded;
    private String identifiedHazards;
    private String additionalComments;
    
    private List<String> selectedHazards;
    private String hazardNotes;
    private List<String> completedMeasures;
    
    private String safetyOfficer;
    private String departmentHead;
    private String maintenanceApprover;
    
    private String performerName;
    private String performerSignature;
    
    private String immediateActions;
    private String beforeWorkStarts;
    private String complianceNotes;
    private String overallRisk;
    
    private OwnUser primaryUser;
    private List<OwnUser> assignedTo;
    private Team team;
    private List<File> files;
    
    private boolean archived;
}
