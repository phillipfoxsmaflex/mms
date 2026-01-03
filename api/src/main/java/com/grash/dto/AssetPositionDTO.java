package com.grash.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotNull;

@Data
@NoArgsConstructor
public class AssetPositionDTO {

    private Long floorPlanId;

    @NotNull
    private Double positionX;

    @NotNull
    private Double positionY;
}
