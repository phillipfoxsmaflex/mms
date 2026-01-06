package com.grash.mapper;

import com.grash.dto.FloorPlanMiniDTO;
import com.grash.dto.FloorPlanPatchDTO;
import com.grash.dto.FloorPlanShowDTO;
import com.grash.model.FloorPlan;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.Mappings;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring", uses = {LocationMapper.class, FileMapper.class}, nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface FloorPlanMapper {
    FloorPlan updateFloorPlan(@MappingTarget FloorPlan entity, FloorPlanPatchDTO dto);

    @Mappings({})
    FloorPlanPatchDTO toPatchDto(FloorPlan model);

    FloorPlanShowDTO toShowDto(FloorPlan model);

    FloorPlanMiniDTO toMiniDto(FloorPlan model);
}
