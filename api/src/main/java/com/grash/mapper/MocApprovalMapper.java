package com.grash.mapper;

import com.grash.dto.MocApprovalPatchDTO;
import com.grash.dto.MocApprovalShowDTO;
import com.grash.model.MocApproval;
import org.mapstruct.*;

@Mapper(componentModel = "spring", uses = {UserMapper.class})
public interface MocApprovalMapper {
    MocApproval updateMocApproval(@MappingTarget MocApproval entity, MocApprovalPatchDTO dto);

    @Mappings({})
    MocApprovalPatchDTO toPatchDto(MocApproval model);

    @Mappings({})
    MocApprovalShowDTO toShowDto(MocApproval model);
}
