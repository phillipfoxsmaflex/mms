package com.grash.dto;

import com.grash.model.enums.PermitStatus;
import com.grash.model.enums.PermitType;
import com.grash.model.enums.RiskLevel;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;

@Data
@NoArgsConstructor
public class PermitShowDTO {
    private Long id;
    private String permitId;
    private String title;
    private String description;
    private PermitType type;
    private PermitStatus status;
    private RiskLevel riskLevel;
    
    private PermitLocationMiniDTO permitLocation;
    private UserMiniDTO requestor;
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
    
    private boolean departmentHeadApproval;
    private Date departmentHeadApprovalDate;
    private boolean maintenanceApproval;
    private Date maintenanceApprovalDate;
    private boolean safetyOfficerApproval;
    private Date safetyOfficerApprovalDate;
    
    private String performerName;
    private String performerSignature;
    private Date workStartedAt;
    private Date workCompletedAt;
    
    private String immediateActions;
    private String beforeWorkStarts;
    private String complianceNotes;
    private String overallRisk;
    private String statusHistory;
    
    private Date submittedAt;
    private Date approvedAt;
    private Date activatedAt;
    private Date completedAt;
    
    private UserMiniDTO submittedBy;
    private UserMiniDTO approvedBy;
    private UserMiniDTO primaryUser;
    private List<UserMiniDTO> assignedTo;
    private TeamMiniDTO team;
    private List<FileShowDTO> files;
    
    private boolean archived;
    
    private Date createdAt;
    private Date updatedAt;
    private Long createdBy;
}
