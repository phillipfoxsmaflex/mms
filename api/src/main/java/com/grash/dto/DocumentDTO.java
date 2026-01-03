package com.grash.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentDTO {
    private Long id;
    private String name;
    private String description;
    private String filePath;
    private Long fileSize;
    private String mimeType;
    private Date createdAt;
    private Date updatedAt;
    private Long createdById;
    private String createdByName;
    private Long companyId;
    private Long parentDocumentId;
    private Boolean isFolder;
    private String entityType;
    private Long entityId;
    private List<String> tags;
    private Integer version;
    private Boolean isActive;
    private List<DocumentDTO> children;
}
