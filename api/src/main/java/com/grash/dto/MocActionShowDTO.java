package com.grash.dto;

import com.grash.model.enums.MocActionStatus;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@NoArgsConstructor
public class MocActionShowDTO {
    private Long id;
    private String title;
    private String description;
    private MocActionStatus status;
    private UserMiniDTO responsibleUser;
    private Date dueDate;
    private Date completedAt;
    private String completionNotes;
    private Long changeRequestId;
    private Date createdAt;
    private Date updatedAt;
    private Long createdBy;
}
