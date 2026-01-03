package com.grash.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LocationImageDTO {
    private Long id;
    private String name;
    private String description;
    private Long fileId;
    private String fileUrl;
    private Long locationId;
    private String locationName;
    private Date createdAt;
    private Date updatedAt;
    private Long createdById;
    private String createdByName;
    private Boolean isActive;
    private List<AssetHotspotDTO> hotspots;
}
