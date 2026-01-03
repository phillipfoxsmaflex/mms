package com.grash.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.grash.model.abstracts.CompanyAudit;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import javax.persistence.*;
import javax.validation.constraints.NotNull;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
public class Document extends CompanyAudit {
    
    @NotNull
    @Column(nullable = false)
    private String name;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(length = 500)
    private String filePath;
    
    private Long fileSize;
    
    private String mimeType;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id")
    private OwnUser createdByUser;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_document_id")
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Document parentDocument;
    
    @OneToMany(mappedBy = "parentDocument", cascade = CascadeType.REMOVE)
    @JsonIgnore
    private List<Document> childDocuments = new ArrayList<>();
    
    @NotNull
    @Column(nullable = false)
    private Boolean isFolder = false;
    
    private String entityType;
    
    private Long entityId;
    
    @ElementCollection
    @CollectionTable(name = "document_tags", joinColumns = @JoinColumn(name = "document_id"))
    @Column(name = "tag")
    private List<String> tags = new ArrayList<>();
    
    @NotNull
    @Column(nullable = false)
    private Integer version = 1;
    
    @NotNull
    @Column(nullable = false)
    private Boolean isActive = true;
}
