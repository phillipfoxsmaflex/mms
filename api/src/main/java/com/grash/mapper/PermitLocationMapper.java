package com.grash.mapper;

import com.grash.dto.PermitLocationMiniDTO;
import com.grash.dto.PermitLocationPatchDTO;
import com.grash.dto.PermitLocationShowDTO;
import com.grash.model.PermitLocation;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface PermitLocationMapper {
    PermitLocation updatePermitLocation(@MappingTarget PermitLocation entity, PermitLocationPatchDTO dto);

    @Mappings({})
    PermitLocationPatchDTO toPatchDto(PermitLocation model);

    @Mappings({})
    PermitLocationShowDTO toShowDto(PermitLocation model);

    PermitLocationMiniDTO toMiniDto(PermitLocation model);
}
