package com.grash.model;

import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;

@Entity
@Data
@NoArgsConstructor
public class ContractorEmployee {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;
    
    @ManyToOne
    private Vendor vendor;
    
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String position;
    
    // Referenz auf aktuelle gültige Unterweisung
    @ManyToOne
    private SafetyInstruction currentSafetyInstruction;
    
    @ManyToOne
    private OwnUser createdBy; // User who created this employee
}