package com.grash.controller;

import com.grash.dto.DocumentDTO;
import com.grash.dto.DocumentPatchDTO;
import com.grash.dto.SuccessResponse;
import com.grash.exception.CustomException;
import com.grash.model.OwnUser;
import com.grash.model.enums.PermissionEntity;
import com.grash.model.enums.RoleType;
import com.grash.service.DocumentService;
import com.grash.service.UserService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiParam;
import io.swagger.annotations.ApiResponse;
import io.swagger.annotations.ApiResponses;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/documents")
@Api(tags = "document")
@RequiredArgsConstructor
@Slf4j
public class DocumentController {
    
    private final DocumentService documentService;
    private final UserService userService;
    
    @PostMapping(value = "", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("permitAll()")
    @ApiResponses(value = {
            @ApiResponse(code = 500, message = "Something went wrong"),
            @ApiResponse(code = 403, message = "Access denied"),
            @ApiResponse(code = 201, message = "Document created successfully")})
    public ResponseEntity<DocumentDTO> createDocument(
            @RequestPart("document") @Valid DocumentPatchDTO request,
            @RequestPart(value = "file", required = false) MultipartFile file,
            HttpServletRequest req
    ) {
        OwnUser user = userService.whoami(req);
        if (user.getRole().getRoleType().equals(RoleType.ROLE_CLIENT)) {
            if (!user.getRole().getCreatePermissions().contains(PermissionEntity.DOCUMENTS)) {
                throw new CustomException("Access Denied", HttpStatus.FORBIDDEN);
            }
        }
        DocumentDTO created = documentService.createDocument(request, file, user.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
    
    @GetMapping("/tree/{entityType}/{entityId}")
    @PreAuthorize("permitAll()")
    @ApiResponses(value = {
            @ApiResponse(code = 500, message = "Something went wrong"),
            @ApiResponse(code = 403, message = "Access denied"),
            @ApiResponse(code = 200, message = "Document tree retrieved successfully")})
    public ResponseEntity<List<DocumentDTO>> getDocumentTree(
            @ApiParam("entityType") @PathVariable String entityType,
            @ApiParam("entityId") @PathVariable Long entityId,
            HttpServletRequest req
    ) {
        log.info("[DEBUG] DocumentController.getDocumentTree called: entityType={}, entityId={}", entityType, entityId);
        OwnUser user = userService.whoami(req);
        log.info("[DEBUG] User authenticated: userId={}, companyId={}", user.getId(), user.getCompany().getId());
        if (user.getRole().getRoleType().equals(RoleType.ROLE_CLIENT)) {
            if (!user.getRole().getViewPermissions().contains(PermissionEntity.DOCUMENTS)) {
                throw new CustomException("Access Denied", HttpStatus.FORBIDDEN);
            }
        }
        List<DocumentDTO> tree = documentService.getDocumentTree(entityType, entityId, user.getCompany().getId());
        log.info("[DEBUG] Returning {} documents to client", tree.size());
        return ResponseEntity.ok(tree);
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("permitAll()")
    @ApiResponses(value = {
            @ApiResponse(code = 500, message = "Something went wrong"),
            @ApiResponse(code = 403, message = "Access denied"),
            @ApiResponse(code = 404, message = "Document not found")})
    public ResponseEntity<DocumentDTO> getDocument(
            @ApiParam("id") @PathVariable Long id,
            HttpServletRequest req
    ) {
        OwnUser user = userService.whoami(req);
        if (user.getRole().getRoleType().equals(RoleType.ROLE_CLIENT)) {
            if (!user.getRole().getViewPermissions().contains(PermissionEntity.DOCUMENTS)) {
                throw new CustomException("Access Denied", HttpStatus.FORBIDDEN);
            }
        }
        DocumentDTO document = documentService.getDocumentById(id, user.getCompany().getId());
        return ResponseEntity.ok(document);
    }
    
    @PatchMapping("/{id}")
    @PreAuthorize("permitAll()")
    @ApiResponses(value = {
            @ApiResponse(code = 500, message = "Something went wrong"),
            @ApiResponse(code = 403, message = "Access denied"),
            @ApiResponse(code = 404, message = "Document not found")})
    public ResponseEntity<DocumentDTO> updateDocument(
            @ApiParam("id") @PathVariable Long id,
            @RequestBody @Valid DocumentPatchDTO request,
            HttpServletRequest req
    ) {
        OwnUser user = userService.whoami(req);
        if (user.getRole().getRoleType().equals(RoleType.ROLE_CLIENT)) {
            if (!user.getRole().getEditOtherPermissions().contains(PermissionEntity.DOCUMENTS)) {
                throw new CustomException("Access Denied", HttpStatus.FORBIDDEN);
            }
        }
        DocumentDTO updated = documentService.updateDocument(id, request, user.getCompany().getId());
        return ResponseEntity.ok(updated);
    }
    
    @GetMapping("/download/{id}")
    @PreAuthorize("permitAll()")
    @ApiResponses(value = {
            @ApiResponse(code = 500, message = "Something went wrong"),
            @ApiResponse(code = 403, message = "Access denied"),
            @ApiResponse(code = 404, message = "Document not found")})
    public ResponseEntity<byte[]> downloadDocument(
            @ApiParam("id") @PathVariable Long id,
            HttpServletRequest req
    ) {
        OwnUser user = userService.whoami(req);
        if (user.getRole().getRoleType().equals(RoleType.ROLE_CLIENT)) {
            if (!user.getRole().getViewPermissions().contains(PermissionEntity.DOCUMENTS)) {
                throw new CustomException("Access Denied", HttpStatus.FORBIDDEN);
            }
        }
        byte[] fileData = documentService.downloadDocument(id, user.getCompany().getId());
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        headers.setContentDispositionFormData("attachment", "document");
        
        return new ResponseEntity<>(fileData, headers, HttpStatus.OK);
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("permitAll()")
    @ApiResponses(value = {
            @ApiResponse(code = 500, message = "Something went wrong"),
            @ApiResponse(code = 403, message = "Access denied"),
            @ApiResponse(code = 404, message = "Document not found")})
    public ResponseEntity<SuccessResponse> deleteDocument(
            @ApiParam("id") @PathVariable Long id,
            HttpServletRequest req
    ) {
        OwnUser user = userService.whoami(req);
        if (user.getRole().getRoleType().equals(RoleType.ROLE_CLIENT)) {
            if (!user.getRole().getDeleteOtherPermissions().contains(PermissionEntity.DOCUMENTS)) {
                throw new CustomException("Access Denied", HttpStatus.FORBIDDEN);
            }
        }
        documentService.deleteDocument(id, user.getCompany().getId());
        return ResponseEntity.ok(new SuccessResponse(true, "Document deleted successfully"));
    }
}
