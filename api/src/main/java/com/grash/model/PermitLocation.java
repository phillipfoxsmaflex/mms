package com.grash.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.grash.model.abstracts.CompanyAudit;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.hibernate.envers.Audited;
import org.hibernate.envers.RelationTargetAuditMode;

import javax.persistence.*;
import javax.validation.constraints.NotNull;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Audited(withModifiedFlag = true)
public class PermitLocation extends CompanyAudit {

    @NotNull
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String building;

    private String area;

    private String facility;

    private String department;

    private Double latitude;

    private Double longitude;

    private Integer mapPositionX;

    private Integer mapPositionY;

    private boolean isActive = true;

    @OneToMany(mappedBy = "permitLocation", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Permit> permits = new ArrayList<>();

    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED, withModifiedFlag = true)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_location_id")
    private Location parentLocation;
}
