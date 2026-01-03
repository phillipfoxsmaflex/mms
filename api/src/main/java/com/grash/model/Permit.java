package com.grash.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.grash.model.abstracts.CompanyAudit;
import com.grash.model.enums.PermitStatus;
import com.grash.model.enums.PermitType;
import com.grash.model.enums.RiskLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.hibernate.envers.Audited;
import org.hibernate.envers.NotAudited;
import org.hibernate.envers.RelationTargetAuditMode;

import javax.persistence.*;
import javax.validation.constraints.NotNull;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Audited(withModifiedFlag = true)
public class Permit extends CompanyAudit {

    private String permitId;

    @NotNull
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @NotNull
    private PermitType type;

    @Enumerated(EnumType.STRING)
    @NotNull
    private PermitStatus status = PermitStatus.DRAFT;

    @Enumerated(EnumType.STRING)
    private RiskLevel riskLevel = RiskLevel.LOW;

    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED, withModifiedFlag = true)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "permit_location_id")
    private PermitLocation permitLocation;

    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED, withModifiedFlag = true)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requestor_id")
    private OwnUser requestor;

    private String requestorName;

    private String department;

    private String contactNumber;

    private String emergencyContact;

    @Temporal(TemporalType.TIMESTAMP)
    private Date startDate;

    @Temporal(TemporalType.TIMESTAMP)
    private Date endDate;

    @Column(columnDefinition = "TEXT")
    private String safetyRequirements;

    @Column(columnDefinition = "TEXT")
    private String equipmentNeeded;

    @Column(columnDefinition = "TEXT")
    private String identifiedHazards;

    @Column(columnDefinition = "TEXT")
    private String additionalComments;

    @ElementCollection
    @CollectionTable(name = "permit_selected_hazards", joinColumns = @JoinColumn(name = "permit_id"))
    @Column(name = "hazard")
    private List<String> selectedHazards = new ArrayList<>();

    @Column(columnDefinition = "TEXT")
    private String hazardNotes;

    @ElementCollection
    @CollectionTable(name = "permit_completed_measures", joinColumns = @JoinColumn(name = "permit_id"))
    @Column(name = "measure")
    private List<String> completedMeasures = new ArrayList<>();

    private String safetyOfficer;

    private String departmentHead;

    private String maintenanceApprover;

    private boolean departmentHeadApproval = false;

    @Temporal(TemporalType.TIMESTAMP)
    private Date departmentHeadApprovalDate;

    private boolean maintenanceApproval = false;

    @Temporal(TemporalType.TIMESTAMP)
    private Date maintenanceApprovalDate;

    private boolean safetyOfficerApproval = false;

    @Temporal(TemporalType.TIMESTAMP)
    private Date safetyOfficerApprovalDate;

    private String performerName;

    @Column(columnDefinition = "TEXT")
    private String performerSignature;

    @Temporal(TemporalType.TIMESTAMP)
    private Date workStartedAt;

    @Temporal(TemporalType.TIMESTAMP)
    private Date workCompletedAt;

    @Column(columnDefinition = "TEXT")
    private String immediateActions;

    @Column(columnDefinition = "TEXT")
    private String beforeWorkStarts;

    @Column(columnDefinition = "TEXT")
    private String complianceNotes;

    private String overallRisk;

    @Column(columnDefinition = "TEXT")
    private String statusHistory;

    @Temporal(TemporalType.TIMESTAMP)
    private Date submittedAt;

    @Temporal(TemporalType.TIMESTAMP)
    private Date approvedAt;

    @Temporal(TemporalType.TIMESTAMP)
    private Date activatedAt;

    @Temporal(TemporalType.TIMESTAMP)
    private Date completedAt;

    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED, withModifiedFlag = true)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submitted_by_id")
    private OwnUser submittedBy;

    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED, withModifiedFlag = true)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by_id")
    private OwnUser approvedBy;

    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED, withModifiedFlag = true)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "primary_user_id")
    private OwnUser primaryUser;

    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED, withModifiedFlag = true)
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "permit_assigned_users",
            joinColumns = @JoinColumn(name = "permit_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id"))
    private List<OwnUser> assignedTo = new ArrayList<>();

    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED, withModifiedFlag = true)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private Team team;

    @NotAudited
    @OneToMany(mappedBy = "permit", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JsonIgnore
    private List<MocChangeRequest> mocChangeRequests = new ArrayList<>();

    @NotAudited
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "permit_files",
            joinColumns = @JoinColumn(name = "permit_id"),
            inverseJoinColumns = @JoinColumn(name = "file_id"))
    private List<File> files = new ArrayList<>();

    private boolean archived = false;

    public boolean isAssignedTo(OwnUser user) {
        return (primaryUser != null && primaryUser.getId().equals(user.getId()))
                || assignedTo.stream().anyMatch(u -> u.getId().equals(user.getId()))
                || (team != null && team.getUsers().stream().anyMatch(u -> u.getId().equals(user.getId())));
    }

    public boolean canBeEditedBy(OwnUser user) {
        return user.getRole().getEditOtherPermissions().contains(com.grash.model.enums.PermissionEntity.PERMITS)
                || (getCreatedBy() != null && getCreatedBy().equals(user.getId()))
                || isAssignedTo(user);
    }
}
