package com.grash.mapper;

import com.grash.dto.MocChangeRequestMiniDTO;
import com.grash.dto.MocChangeRequestPatchDTO;
import com.grash.dto.MocChangeRequestShowDTO;
import com.grash.model.MocChangeRequest;
import org.mapstruct.*;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Mapper(componentModel = "spring", uses = {UserMapper.class, PermitMapper.class})
public interface MocChangeRequestMapper {
    @Mapping(target = "affectedSystems", expression = "java(stringToList(dto.getAffectedSystems()))")
    MocChangeRequest updateMocChangeRequest(@MappingTarget MocChangeRequest entity, MocChangeRequestPatchDTO dto);

    @Mapping(target = "affectedSystems", expression = "java(listToString(model.getAffectedSystems()))")
    MocChangeRequestPatchDTO toPatchDto(MocChangeRequest model);

    @Mapping(target = "affectedSystems", expression = "java(listToString(model.getAffectedSystems()))")
    MocChangeRequestShowDTO toShowDto(MocChangeRequest model);

    MocChangeRequestMiniDTO toMiniDto(MocChangeRequest model);
    
    default String listToString(List<String> list) {
        if (list == null || list.isEmpty()) {
            return null;
        }
        return String.join(",", list);
    }
    
    default List<String> stringToList(String str) {
        if (str == null || str.trim().isEmpty()) {
            return Collections.emptyList();
        }
        return Arrays.asList(str.split("\\s*,\\s*"));
    }
}
