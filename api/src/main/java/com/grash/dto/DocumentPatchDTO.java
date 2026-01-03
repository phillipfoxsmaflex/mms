package com.grash.dto;

import lombok.Data;

import java.util.List;

@Data
public class DocumentPatchDTO {
    private String name;
    private String description;
    private Long parentDocumentId;
    private Boolean isFolder;
    private String entityType;
    private Long entityId;
    private List<String> tags;
}
