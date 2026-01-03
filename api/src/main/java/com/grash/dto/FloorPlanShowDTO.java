package com.grash.dto;

import lombok.Data;

@Data
public class FloorPlanShowDTO {
    private Long id;
    private String name;

    private FileShowDTO image;

    private long area;

    private Integer imageWidth;

    private Integer imageHeight;

    private Integer displayOrder;

    private LocationMiniDTO location;

}
