package com.grash.mapper;

import com.grash.dto.MocActionPatchDTO;
import com.grash.dto.MocActionShowDTO;
import com.grash.model.MocAction;
import org.mapstruct.*;

@Mapper(componentModel = "spring", uses = {UserMapper.class})
public interface MocActionMapper {
    MocAction updateMocAction(@MappingTarget MocAction entity, MocActionPatchDTO dto);

    @Mappings({})
    MocActionPatchDTO toPatchDto(MocAction model);

    @Mappings({})
    MocActionShowDTO toShowDto(MocAction model);
}
