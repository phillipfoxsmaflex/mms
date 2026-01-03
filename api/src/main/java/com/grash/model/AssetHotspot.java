package com.grash.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.grash.model.enums.HotspotIconType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import javax.persistence.*;
import javax.validation.constraints.NotNull;
import java.util.Date;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "asset_hotspot",
       uniqueConstraints = @UniqueConstraint(
           name = "uk_asset_hotspot_asset_image",
           columnNames = {"asset_id", "location_image_id"}
       ))
public class AssetHotspot {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "asset_id", nullable = false)
    @NotNull
    @JsonIgnore
    private Asset asset;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_image_id", nullable = false)
    @NotNull
    @JsonIgnore
    private LocationImage locationImage;
    
    @Column(name = "x_position", nullable = false)
    @NotNull
    private Double xPosition;
    
    @Column(name = "y_position", nullable = false)
    @NotNull
    private Double yPosition;
    
    private String label;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "icon_type", nullable = false)
    private HotspotIconType iconType = HotspotIconType.DEFAULT;
    
    @Column(nullable = false)
    private String color = "#1976d2";
    
    @CreationTimestamp
    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "created_at", nullable = false, updatable = false)
    private Date createdAt;
    
    @UpdateTimestamp
    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "updated_at", nullable = false)
    private Date updatedAt;
    
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}
