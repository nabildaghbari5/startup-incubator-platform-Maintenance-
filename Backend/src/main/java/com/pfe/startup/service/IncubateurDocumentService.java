package com.pfe.startup.service;

import com.pfe.startup.entity.IncubateurDocument;
import com.pfe.startup.entity.User;
import com.pfe.startup.file.FileStorageService;
import com.pfe.startup.file.FileUtils;
import com.pfe.startup.repository.IncubateurDocumentRepository;
import com.pfe.startup.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class IncubateurDocumentService {

    private static final String FOLDER = "incubateur-documents";
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final IncubateurDocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listDocuments(Long incId, String statut) {
        List<IncubateurDocument> docs = statut != null && !statut.isBlank()
                ? documentRepository.findByIncubateurIdAndStatutOrderByUploadedAtDesc(incId, statut)
                : documentRepository.findByIncubateurIdOrderByUploadedAtDesc(incId);
        return docs.stream().map(this::toMap).toList();
    }

    @Transactional
    public Map<String, Object> upload(Long incId, MultipartFile file, String startupNom) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Le fichier est requis");
        }

        User incubateur = userRepository.findById(incId)
                .orElseThrow(() -> new NoSuchElementException("Incubateur introuvable id=" + incId));

        String storedPath = fileStorageService.saveFile(file, String.valueOf(incId), FOLDER);
        if (storedPath == null) {
            throw new IllegalStateException("Échec de l'enregistrement du fichier");
        }

        IncubateurDocument doc = IncubateurDocument.builder()
                .fileName(file.getOriginalFilename())
                .documentUrl(storedPath)
                .fileType(file.getContentType())
                .statut("soumis")
                .visiblePorteur(false)
                .startupNom(startupNom)
                .uploadedAt(LocalDateTime.now())
                .incubateur(incubateur)
                .build();

        return toMap(documentRepository.save(doc));
    }

    @Transactional
    public Map<String, Object> updateStatut(Long incId, Long docId, String statut) {
        IncubateurDocument doc = getOwnedDocument(incId, docId);
        doc.setStatut(statut);
        return toMap(documentRepository.save(doc));
    }

    @Transactional
    public Map<String, Object> updateVisibilite(Long incId, Long docId, boolean visible) {
        IncubateurDocument doc = getOwnedDocument(incId, docId);
        doc.setVisiblePorteur(visible);
        return toMap(documentRepository.save(doc));
    }

    @Transactional
    public void delete(Long incId, Long docId) {
        IncubateurDocument doc = getOwnedDocument(incId, docId);
        deleteFileIfExists(doc.getDocumentUrl());
        documentRepository.delete(doc);
    }

    @Transactional(readOnly = true)
    public byte[] download(Long incId, Long docId) {
        IncubateurDocument doc = getOwnedDocument(incId, docId);
        byte[] content = FileUtils.readFileFromLocation(doc.getDocumentUrl());
        if (content == null) {
            throw new IllegalStateException("Fichier introuvable sur le serveur");
        }
        return content;
    }

    @Transactional(readOnly = true)
    public String getFileName(Long incId, Long docId) {
        return getOwnedDocument(incId, docId).getFileName();
    }

    private IncubateurDocument getOwnedDocument(Long incId, Long docId) {
        IncubateurDocument doc = documentRepository.findById(docId)
                .orElseThrow(() -> new NoSuchElementException("Document introuvable id=" + docId));
        if (doc.getIncubateur() == null || !incId.equals(doc.getIncubateur().getId())) {
            throw new NoSuchElementException("Document introuvable pour cet incubateur");
        }
        return doc;
    }

    private Map<String, Object> toMap(IncubateurDocument d) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", d.getId());
        m.put("nom", d.getFileName());
        m.put("type", extractType(d.getFileName()));
        m.put("taille", formatSize(d.getDocumentUrl()));
        m.put("statut", d.getStatut() != null ? d.getStatut() : "soumis");
        m.put("startupNom", d.getStartupNom() != null ? d.getStartupNom() : "");
        m.put("startupId", null);
        m.put("uploadedAt", d.getUploadedAt() != null ? d.getUploadedAt().format(FMT) : "");
        m.put("visiblePorteur", Boolean.TRUE.equals(d.getVisiblePorteur()));
        return m;
    }

    private String extractType(String fileName) {
        if (fileName == null || !fileName.contains(".")) return "FILE";
        return fileName.substring(fileName.lastIndexOf('.') + 1).toUpperCase();
    }

    private String formatSize(String path) {
        if (path == null) return "—";
        File file = new File(path);
        if (!file.exists()) return "—";
        long bytes = file.length();
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format(Locale.FRANCE, "%.0f KB", bytes / 1024.0);
        return String.format(Locale.FRANCE, "%.1f MB", bytes / (1024.0 * 1024.0));
    }

    private void deleteFileIfExists(String path) {
        if (path == null || path.isBlank()) return;
        File file = new File(path);
        if (file.exists()) file.delete();
    }
}
