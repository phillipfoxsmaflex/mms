package com.grash.dto;

import lombok.Data;

import javax.validation.constraints.NotNull;

@Data
public class CreateLocationImageRequest {
    @NotNull
    private String name;
    
    private String description;
    
    @NotNull
    private Long locationId;
}
