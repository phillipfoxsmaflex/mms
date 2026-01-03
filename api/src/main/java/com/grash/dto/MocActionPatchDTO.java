package com.grash.dto;

import com.grash.model.MocChangeRequest;
import com.grash.model.OwnUser;
import com.grash.model.enums.MocActionStatus;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@NoArgsConstructor
public class MocActionPatchDTO {
    private String title;
    private String description;
    private MocActionStatus status;
    private OwnUser responsibleUser;
    private Date dueDate;
    private Date completedAt;
    private String completionNotes;
    private MocChangeRequest changeRequest;
}
