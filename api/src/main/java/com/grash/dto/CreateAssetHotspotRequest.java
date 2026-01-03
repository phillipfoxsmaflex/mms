package com.grash.dto;

import com.grash.model.enums.HotspotIconType;
import lombok.Data;

import javax.validation.constraints.NotNull;

@Data
public class CreateAssetHotspotRequest {
    @NotNull
    private Long assetId;
    
    @NotNull
    private Long locationImageId;
    
    @NotNull
    private Double xPosition;
    
    @NotNull
    private Double yPosition;
    
    private String label;
    
    private HotspotIconType iconType = HotspotIconType.DEFAULT;
    
    private String color = "#1976d2";
}
