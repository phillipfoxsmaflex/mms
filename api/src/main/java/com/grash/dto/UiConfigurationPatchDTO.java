package com.grash.dto;

import lombok.Data;

@Data
public class UiConfigurationPatchDTO {

    private boolean workOrders;
    private boolean preventiveMaintenance;
    private boolean permitToWork;
    private boolean statistics;
    private boolean requests;
    private boolean assets;
    private boolean locations;
    private boolean partsAndInventory;
    private boolean purchaseOrders;
    private boolean meters;
    private boolean peopleTeams;
    private boolean vendorsAndCustomers;
    private boolean categories;
    private boolean files;
    private boolean settings;
}
