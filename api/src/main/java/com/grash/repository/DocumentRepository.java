package com.grash.repository;

import com.grash.model.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface DocumentRepository extends JpaRepository<Document, Long> {
    
    List<Document> findByEntityTypeAndEntityIdAndIsActiveTrue(String entityType, Long entityId);
    
    List<Document> findByParentDocumentAndIsActiveTrue(Document parentDocument);
    
    List<Document> findByEntityTypeAndEntityIdAndParentDocumentIsNullAndIsActiveTrue(
        String entityType, Long entityId
    );
    
    Optional<Document> findByIdAndCompanyId(Long id, Long companyId);
    
    @Query("SELECT d FROM Document d WHERE d.entityType = :entityType " +
           "AND d.entityId = :entityId AND d.isActive = true " +
           "AND (d.name LIKE %:searchTerm% OR d.description LIKE %:searchTerm%)")
    List<Document> searchDocuments(
        @Param("entityType") String entityType,
        @Param("entityId") Long entityId,
        @Param("searchTerm") String searchTerm
    );
    
    boolean existsByNameAndParentDocumentAndCompany_Id(
        String name, Document parentDocument, Long companyId
    );
}
