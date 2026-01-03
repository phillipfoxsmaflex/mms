package com.grash.dto;

import com.grash.model.MocChangeRequest;
import com.grash.model.OwnUser;
import com.grash.model.enums.MocApprovalStatus;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@NoArgsConstructor
public class MocApprovalPatchDTO {
    private String department;
    private OwnUser approverUser;
    private MocApprovalStatus status;
    private String comments;
    private Date approvedAt;
    private MocChangeRequest changeRequest;
}
