package com.grash.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.grash.model.abstracts.CompanyAudit;
import com.grash.model.enums.MocStatus;
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
public class MocChangeRequest extends CompanyAudit {

    @NotNull
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ElementCollection
    @CollectionTable(name = "moc_affected_systems", joinColumns = @JoinColumn(name = "moc_id"))
    @Column(name = "system")
    private List<String> affectedSystems = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    private RiskLevel riskLevel = RiskLevel.LOW;

    @Temporal(TemporalType.TIMESTAMP)
    private Date plannedCommissioningDate;

    @Enumerated(EnumType.STRING)
    @NotNull
    private MocStatus status = MocStatus.DRAFT;

    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED, withModifiedFlag = true)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "permit_id")
    private Permit permit;

    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED, withModifiedFlag = true)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id")
    private OwnUser createdByUser;

    @NotAudited
    @OneToMany(mappedBy = "changeRequest", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JsonIgnore
    private List<MocAction> actions = new ArrayList<>();

    @NotAudited
    @OneToMany(mappedBy = "changeRequest", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JsonIgnore
    private List<MocApproval> approvals = new ArrayList<>();

    @NotAudited
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "moc_attachments",
            joinColumns = @JoinColumn(name = "moc_id"),
            inverseJoinColumns = @JoinColumn(name = "file_id"))
    private List<File> attachments = new ArrayList<>();

    @Temporal(TemporalType.TIMESTAMP)
    private Date submittedAt;

    @Temporal(TemporalType.TIMESTAMP)
    private Date approvedAt;

    @Temporal(TemporalType.TIMESTAMP)
    private Date completedAt;

    @Temporal(TemporalType.TIMESTAMP)
    private Date deletedAt;

    @Temporal(TemporalType.TIMESTAMP)
    private Date implementedAt;

    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED, withModifiedFlag = true)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "implemented_by_user_id")
    private OwnUser implementedBy;

    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED, withModifiedFlag = true)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requestor_user_id")
    private OwnUser requestor;
}
