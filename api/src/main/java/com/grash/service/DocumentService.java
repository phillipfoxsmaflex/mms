package com.grash.service;

import com.grash.dto.DocumentDTO;
import com.grash.dto.DocumentPatchDTO;
import com.grash.event.AssetCreatedEvent;
import com.grash.event.LocationCreatedEvent;
import com.grash.exception.CustomException;
import com.grash.factory.StorageServiceFactory;
import com.grash.model.Company;
import com.grash.model.Document;
import com.grash.model.OwnUser;
import com.grash.repository.CompanyRepository;
import com.grash.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentService {
    
    private final DocumentRepository documentRepository;
    private final CompanyRepository companyRepository;
    private final StorageServiceFactory storageServiceFactory;
    private final UserService userService;
    
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async
    public void handleLocationCreated(LocationCreatedEvent event) {
        try {
            createDefaultDocumentStructure(
                "LOCATION",
                event.getLocation().getId(),
                event.getLocation().getCompany().getId()
            );
            log.info("Created document structure for Location ID: {}", event.getLocation().getId());
        } catch (Exception e) {
            log.error("Error creating document structure for Location", e);
        }
    }
    
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async
    public void handleAssetCreated(AssetCreatedEvent event) {
        try {
            createDefaultDocumentStructure(
                "ASSET",
                event.getAsset().getId(),
                event.getAsset().getCompany().getId()
            );
            log.info("Created document structure for Asset ID: {}", event.getAsset().getId());
        } catch (Exception e) {
            log.error("Error creating document structure for Asset", e);
        }
    }
    
    @Transactional
    public void createDefaultDocumentStructure(String entityType, Long entityId, Long companyId) {
        List<String> defaultFolders = Arrays.asList(
            "Manuals",
            "Certificates", 
            "Maintenance Records",
            "Photos",
            "Reports"
        );
        
        Company company = companyRepository.findById(companyId)
            .orElseThrow(() -> new CustomException("Company not found", HttpStatus.NOT_FOUND));
        
        for (String folderName : defaultFolders) {
            boolean exists = documentRepository.existsByNameAndParentDocumentAndCompany_Id(
                folderName, null, companyId
            );
            
            if (!exists) {
                Document folder = new Document();
                folder.setName(folderName);
                folder.setIsFolder(true);
                folder.setEntityType(entityType);
                folder.setEntityId(entityId);
                folder.setCompany(company);
                folder.setIsActive(true);
                folder.setVersion(1);
                
                documentRepository.save(folder);
                log.info("Created default folder '{}' for {} with ID {}", folderName, entityType, entityId);
            }
        }
    }
    
    public List<DocumentDTO> getDocumentTree(String entityType, Long entityId, Long companyId) {
        log.info("[DEBUG] getDocumentTree called: entityType={}, entityId={}, companyId={}", entityType, entityId, companyId);
        List<Document> rootDocuments = documentRepository
            .findByEntityTypeAndEntityIdAndParentDocumentIsNullAndIsActiveTrue(entityType, entityId);
        log.info("[DEBUG] Found {} root documents", rootDocuments.size());
        
        List<DocumentDTO> result = rootDocuments.stream()
            .filter(doc -> doc.getCompany().getId().equals(companyId))
            .map(this::convertToTreeDTO)
            .collect(Collectors.toList());
        log.info("[DEBUG] Returning {} documents after company filter", result.size());
        return result;
    }
    
    private DocumentDTO convertToTreeDTO(Document document) {
        DocumentDTO dto = convertToDTO(document);
        
        if (document.getIsFolder()) {
            List<Document> children = documentRepository
                .findByParentDocumentAndIsActiveTrue(document);
            dto.setChildren(children.stream()
                .map(this::convertToTreeDTO)
                .collect(Collectors.toList()));
        }
        
        return dto;
    }
    
    @Transactional
    public DocumentDTO createDocument(DocumentPatchDTO request, MultipartFile file, Long userId) {
        OwnUser user = userService.findById(userId)
            .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));
        
        Company company = user.getCompany();
        
        Document document = new Document();
        document.setName(request.getName());
        document.setDescription(request.getDescription());
        document.setIsFolder(request.getIsFolder() != null ? request.getIsFolder() : false);
        document.setEntityType(request.getEntityType());
        document.setEntityId(request.getEntityId());
        document.setCompany(company);
        document.setCreatedByUser(user);
        document.setTags(request.getTags());
        document.setIsActive(true);
        document.setVersion(1);
        
        if (request.getParentDocumentId() != null) {
            Document parent = documentRepository.findById(request.getParentDocumentId())
                .orElseThrow(() -> new CustomException("Parent document not found", HttpStatus.NOT_FOUND));
            document.setParentDocument(parent);
        }
        
        if (file != null && !file.isEmpty()) {
            try {
                String filePath = storageServiceFactory.getStorageService().upload(
                    file,
                    "documents/" + company.getId() + "/" + request.getEntityType() + "/" + request.getEntityId()
                );
                document.setFilePath(filePath);
                document.setFileSize(file.getSize());
                document.setMimeType(file.getContentType());
            } catch (Exception e) {
                log.error("Error uploading file", e);
                throw new CustomException("Error uploading file", HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        
        document = documentRepository.save(document);
        return convertToDTO(document);
    }
    
    @Transactional
    public DocumentDTO updateDocument(Long id, DocumentPatchDTO request, Long companyId) {
        Document document = documentRepository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> new CustomException("Document not found", HttpStatus.NOT_FOUND));
        
        if (request.getName() != null) {
            document.setName(request.getName());
        }
        if (request.getDescription() != null) {
            document.setDescription(request.getDescription());
        }
        if (request.getTags() != null) {
            document.setTags(request.getTags());
        }
        if (request.getParentDocumentId() != null) {
            Document parent = documentRepository.findById(request.getParentDocumentId())
                .orElseThrow(() -> new CustomException("Parent document not found", HttpStatus.NOT_FOUND));
            document.setParentDocument(parent);
        }
        
        document.setVersion(document.getVersion() + 1);
        document = documentRepository.save(document);
        return convertToDTO(document);
    }
    
    @Transactional
    public void deleteDocument(Long id, Long companyId) {
        Document document = documentRepository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> new CustomException("Document not found", HttpStatus.NOT_FOUND));
        
        document.setIsActive(false);
        documentRepository.save(document);
        
        if (document.getFilePath() != null) {
            try {
                // Note: StorageService doesn't expose a delete method in the interface
                // This would need to be added if file deletion is required
                log.warn("File deletion not implemented for path: {}", document.getFilePath());
            } catch (Exception e) {
                log.error("Error deleting file from storage", e);
            }
        }
    }
    
    public byte[] downloadDocument(Long id, Long companyId) {
        Document document = documentRepository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> new CustomException("Document not found", HttpStatus.NOT_FOUND));
        
        if (document.getFilePath() == null) {
            throw new CustomException("Document has no file", HttpStatus.BAD_REQUEST);
        }
        
        try {
            return storageServiceFactory.getStorageService().download(document.getFilePath());
        } catch (Exception e) {
            log.error("Error downloading file", e);
            throw new CustomException("Error downloading file", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    public DocumentDTO getDocumentById(Long id, Long companyId) {
        Document document = documentRepository.findByIdAndCompanyId(id, companyId)
            .orElseThrow(() -> new CustomException("Document not found", HttpStatus.NOT_FOUND));
        return convertToDTO(document);
    }
    
    public Optional<Document> findById(Long id) {
        return documentRepository.findById(id);
    }
    
    private DocumentDTO convertToDTO(Document document) {
        DocumentDTO.DocumentDTOBuilder builder = DocumentDTO.builder()
            .id(document.getId())
            .name(document.getName())
            .description(document.getDescription())
            .filePath(document.getFilePath())
            .fileSize(document.getFileSize())
            .mimeType(document.getMimeType())
            .createdAt(document.getCreatedAt())
            .updatedAt(document.getUpdatedAt())
            .companyId(document.getCompany().getId())
            .parentDocumentId(document.getParentDocument() != null ? document.getParentDocument().getId() : null)
            .isFolder(document.getIsFolder())
            .entityType(document.getEntityType())
            .entityId(document.getEntityId())
            .tags(document.getTags())
            .version(document.getVersion())
            .isActive(document.getIsActive());
        
        if (document.getCreatedByUser() != null) {
            builder.createdById(document.getCreatedByUser().getId())
                .createdByName(document.getCreatedByUser().getFirstName() + " " + document.getCreatedByUser().getLastName());
        }
        
        return builder.build();
    }
}
