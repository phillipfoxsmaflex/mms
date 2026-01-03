package com.grash.dto;

import com.grash.model.Location;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class PermitLocationPatchDTO {
    private String name;
    private String description;
    private String building;
    private String area;
    private String facility;
    private String department;
    private Double latitude;
    private Double longitude;
    private Integer mapPositionX;
    private Integer mapPositionY;
    private boolean isActive;
    private Location parentLocation;
}
