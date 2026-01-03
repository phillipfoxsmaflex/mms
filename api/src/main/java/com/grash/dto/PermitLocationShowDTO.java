package com.grash.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@NoArgsConstructor
public class PermitLocationShowDTO {
    private Long id;
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
    private LocationMiniDTO parentLocation;
    private Date createdAt;
    private Date updatedAt;
    private Long createdBy;
}
