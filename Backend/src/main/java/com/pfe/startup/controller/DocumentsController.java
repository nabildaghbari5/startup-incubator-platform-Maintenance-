package com.pfe.startup.controller;

import com.pfe.startup.dto.DocumentScoreDTO;
import com.pfe.startup.dto.DocumentsDTO;
import com.pfe.startup.service.DocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentsController {

    private final DocumentService documentService;

    @PostMapping(value = "/upload/{porteurId}/{phaseId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadDocument(
            @PathVariable Long porteurId,
            @PathVariable Long phaseId,
            @RequestParam(value = "document", required = false) MultipartFile document,
            @RequestParam(value = "file", required = false) MultipartFile file) {

        MultipartFile upload = document != null && !document.isEmpty() ? document : file;
        if (upload == null || upload.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Le fichier est requis (paramètre document ou file)"));
        }

        try {
            DocumentsDTO result = documentService.uploadDocument(porteurId, phaseId, upload);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/phase/{phaseId}")
    public ResponseEntity<List<DocumentsDTO>> getDocumentsByPhase(@PathVariable Long phaseId) {
        try {
            return ResponseEntity.ok(documentService.getDocumentsByPhaseId(phaseId));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{porteurId}/{phaseId}/info")
    public ResponseEntity<DocumentsDTO> getDocumentInfo(
            @PathVariable Long porteurId,
            @PathVariable Long phaseId) {

        try {
            return ResponseEntity.ok(documentService.getDocumentInfo(porteurId, phaseId));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{porteurId}/{phaseId}")
    public ResponseEntity<DocumentsDTO> getDocument(
            @PathVariable Long porteurId,
            @PathVariable Long phaseId) {

        try {
            return ResponseEntity.ok(documentService.getDocument(porteurId, phaseId));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(500).build();
        }
    }

    @PatchMapping("/{documentId}/score")
    public ResponseEntity<?> updateScore(
            @PathVariable Long documentId,
            @RequestBody DocumentScoreDTO body) {

        if (body == null || body.getScore() == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Le score est requis (0 à 100)"));
        }

        try {
            return ResponseEntity.ok(documentService.updateScore(documentId, body.getScore()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{documentId}/score")
    public ResponseEntity<?> putScore(
            @PathVariable Long documentId,
            @RequestBody DocumentScoreDTO body) {
        return updateScore(documentId, body);
    }
}
