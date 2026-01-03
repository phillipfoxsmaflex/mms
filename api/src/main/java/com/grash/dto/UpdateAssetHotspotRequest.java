package com.grash.dto;

import com.grash.model.enums.HotspotIconType;
import lombok.Data;

@Data
public class UpdateAssetHotspotRequest {
    private Double xPosition;
    private Double yPosition;
    private String label;
    private HotspotIconType iconType;
    private String color;
}
