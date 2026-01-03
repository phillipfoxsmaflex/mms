package com.grash.dto;

import com.grash.model.File;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class FloorPlanPatchDTO {

    private String name;

    private File image;

    private long area;

    private Integer imageWidth;

    private Integer imageHeight;

    private Integer displayOrder;
}
