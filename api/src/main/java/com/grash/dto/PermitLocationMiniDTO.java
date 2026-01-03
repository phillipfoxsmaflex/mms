package com.grash.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class PermitLocationMiniDTO {
    private Long id;
    private String name;
    private String facility;
    private String department;
}
