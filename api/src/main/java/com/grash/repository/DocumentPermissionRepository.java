package com.grash.repository;

import com.grash.model.DocumentPermission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DocumentPermissionRepository extends JpaRepository<DocumentPermission, Long> {
    
    List<DocumentPermission> findByDocumentId(Long documentId);
    
    List<DocumentPermission> findByUserId(Long userId);
    
    void deleteByDocumentId(Long documentId);
}
