package com.grash.dto;

import com.grash.model.enums.CalendarEntryStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ContractorCalendarEntryPatchDTO {
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String description;
    private String locationDetails;
    private CalendarEntryStatus status;
    private Long vendorId;
    private Long workOrderId;
    private Long employeeId;
    private Long supervisorId;
}