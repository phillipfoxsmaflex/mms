package com.grash.dto;

import com.grash.model.enums.HotspotIconType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssetHotspotDTO {
    private Long id;
    private Long assetId;
    private String assetName;
    private Long locationImageId;
    private Double xPosition;
    private Double yPosition;
    private String label;
    private HotspotIconType iconType;
    private String color;
    private Date createdAt;
    private Date updatedAt;
    private Boolean isActive;
}
