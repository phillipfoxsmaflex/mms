package com.grash.mapper;

import com.grash.dto.PermitMiniDTO;
import com.grash.dto.PermitPatchDTO;
import com.grash.dto.PermitShowDTO;
import com.grash.model.Permit;
import org.mapstruct.*;

@Mapper(componentModel = "spring", uses = {UserMapper.class, FileMapper.class, TeamMapper.class, PermitLocationMapper.class})
public interface PermitMapper {
    Permit updatePermit(@MappingTarget Permit entity, PermitPatchDTO dto);

    @Mappings({})
    PermitPatchDTO toPatchDto(Permit model);

    @Mappings({})
    PermitShowDTO toShowDto(Permit model);

    PermitMiniDTO toMiniDto(Permit model);
}
