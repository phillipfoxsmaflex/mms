package com.grash.model;

import com.grash.model.abstracts.CompanyAudit;
import com.grash.model.enums.MocActionStatus;
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
public class MocAction extends CompanyAudit {

    @NotNull
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED, withModifiedFlag = true)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "change_request_id")
    private MocChangeRequest changeRequest;

    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED, withModifiedFlag = true)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsible_user_id")
    private OwnUser responsibleUser;

    private String dueTiming; // BEFORE_COMMISSIONING, AFTER_COMMISSIONING

    @Temporal(TemporalType.TIMESTAMP)
    private Date dueDate;

    @Enumerated(EnumType.STRING)
    @NotNull
    private MocActionStatus status = MocActionStatus.OPEN;

    @Temporal(TemporalType.TIMESTAMP)
    private Date completionDate;

    @Column(columnDefinition = "TEXT")
    private String completionNotes;
}
