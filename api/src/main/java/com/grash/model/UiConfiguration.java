package com.grash.model;


import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;

@Entity
@Data
@NoArgsConstructor
public class UiConfiguration {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    private boolean workOrders = true;
    private boolean preventiveMaintenance = true;
    private boolean permitToWork = true;
    private boolean statistics = true;
    private boolean requests = true;
    private boolean assets = true;
    private boolean locations = true;
    private boolean partsAndInventory = true;
    private boolean purchaseOrders = true;
    private boolean meters = true;
    private boolean peopleTeams = true;
    private boolean vendorsAndCustomers = true;
    private boolean categories = true;
    private boolean files = true;
    private boolean settings = true;

    @OneToOne(fetch = FetchType.LAZY)
    @JsonIgnore
    private CompanySettings companySettings;

    public UiConfiguration(CompanySettings companySettings) {
        this.companySettings = companySettings;
    }
}
