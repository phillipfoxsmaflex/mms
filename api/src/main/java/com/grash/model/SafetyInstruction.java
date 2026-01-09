package com.grash.model;

import com.grash.model.enums.InstructionType;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
public class SafetyInstruction {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;
    
    @ManyToOne
    private Location location; // Standortspezifische Unterweisung
    
    @ManyToOne
    private Vendor vendor; // Zugehöriger Auftragnehmer
    
    private String title;
    private String description;
    private LocalDateTime instructionDate;
    private LocalDateTime expirationDate; // Standard: 12 Monate ab Unterweisungsdatum
    
    @Enumerated(EnumType.STRING)
    private InstructionType type; // VIDEO, DOCUMENT, LINK
    
    private String instructionMaterialUrl; // URL zu Dokument/Video
    private String instructionMaterialFileId; // Referenz auf hochgeladenes File
    
    @ManyToOne
    private OwnUser instructor; // Durchführender
    
    @ManyToOne
    private ContractorEmployee employee; // Unterwiesener Mitarbeiter
    
    private boolean completed;
    private LocalDateTime completionDate;
    private String signatureData; // Elektronische Signatur
    private String signatureName; // Name des Unterzeichners
    
    @ManyToOne
    private OwnUser createdBy; // User who created this instruction
}