package com.grash.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class FloorPlanMiniDTO {

    private Long id;

    private String name;

    private Integer imageWidth;

    private Integer imageHeight;

    private Integer displayOrder;

}
