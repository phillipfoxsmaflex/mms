package com.grash.dto;

import com.grash.model.enums.MocApprovalStatus;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@NoArgsConstructor
public class MocApprovalShowDTO {
    private Long id;
    private String department;
    private UserMiniDTO approverUser;
    private MocApprovalStatus status;
    private String comments;
    private Date approvedAt;
    private Long changeRequestId;
    private Date createdAt;
    private Date updatedAt;
    private Long createdBy;
}
