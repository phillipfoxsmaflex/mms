package com.grash.model;

import com.grash.model.enums.CalendarEntryStatus;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
public class ContractorCalendarEntry {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;
    
    @ManyToOne
    private Vendor vendor;
    
    @ManyToOne
    private WorkOrder workOrder; // Verknüpfung mit Arbeitsaufträgen
    
    @ManyToOne
    private ContractorEmployee employee; // Zugewiesener Mitarbeiter
    
    @ManyToOne
    private OwnUser supervisor; // Zuständiger Betreuer
    
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String description;
    private String locationDetails;
    
    @Enumerated(EnumType.STRING)
    private CalendarEntryStatus status; // PLANNED, IN_PROGRESS, COMPLETED, CANCELLED
    
    @ManyToOne
    private OwnUser createdBy; // User who created this entry
}