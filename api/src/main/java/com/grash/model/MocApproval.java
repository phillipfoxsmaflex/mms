package com.grash.model;

import com.grash.model.abstracts.CompanyAudit;
import com.grash.model.enums.MocApprovalStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.hibernate.envers.Audited;
import org.hibernate.envers.RelationTargetAuditMode;

import javax.persistence.*;
import javax.validation.constraints.NotNull;
import java.util.Date;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Audited(withModifiedFlag = true)
public class MocApproval extends CompanyAudit {

    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED, withModifiedFlag = true)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "change_request_id")
    private MocChangeRequest changeRequest;

    @NotNull
    private String department;

    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED, withModifiedFlag = true)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approver_user_id")
    private OwnUser approverUser;

    @Enumerated(EnumType.STRING)
    @NotNull
    private MocApprovalStatus status = MocApprovalStatus.PENDING;

    @Temporal(TemporalType.TIMESTAMP)
    private Date approvedAt;

    @Column(columnDefinition = "TEXT")
    private String comments;
}
