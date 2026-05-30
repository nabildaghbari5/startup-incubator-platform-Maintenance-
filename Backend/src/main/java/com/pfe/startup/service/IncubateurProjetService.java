package com.pfe.startup.service;

import com.pfe.startup.entity.*;
import com.pfe.startup.file.FileUtils;
import com.pfe.startup.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class IncubateurProjetService {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listRapports(Long incId) {
        userRepository.findById(incId)
                .orElseThrow(() -> new NoSuchElementException("Incubateur introuvable id=" + incId));

        return documentRepository.findByPhase_IncubateurIdOrderByUploadedAtDesc(incId).stream()
                .map(this::toRapportMap)
                .toList();
    }

    @Transactional
    public Map<String, Object> updateStatut(Long incId, Long documentId, String statut) {
        Document doc = getOwnedDocument(incId, documentId);
        doc.setReviewStatut(statut);
        return toRapportMap(documentRepository.save(doc));
    }

    @Transactional
    public Map<String, Object> updateCommentaire(Long incId, Long documentId, String commentaire) {
        Document doc = getOwnedDocument(incId, documentId);
        doc.setReviewCommentaire(commentaire);
        return toRapportMap(documentRepository.save(doc));
    }

    @Transactional(readOnly = true)
    public byte[] download(Long incId, Long documentId) {
        Document doc = getOwnedDocument(incId, documentId);
        byte[] content = FileUtils.readFileFromLocation(doc.getDocumentUrl());
        if (content == null) {
            throw new IllegalStateException("Fichier introuvable");
        }
        return content;
    }

    @Transactional(readOnly = true)
    public String getFileName(Long incId, Long documentId) {
        return getOwnedDocument(incId, documentId).getFileName();
    }

    private Document getOwnedDocument(Long incId, Long documentId) {
        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new NoSuchElementException("Document introuvable id=" + documentId));
        if (doc.getPhase() == null || doc.getPhase().getIncubateur() == null
                || !incId.equals(doc.getPhase().getIncubateur().getId())) {
            throw new NoSuchElementException("Document introuvable pour cet incubateur");
        }
        return doc;
    }

    private Map<String, Object> toRapportMap(Document d) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", d.getId());
        m.put("startupId", d.getPorteur() != null ? d.getPorteur().getId() : null);
        m.put("phasetitre", d.getPhase() != null ? d.getPhase().getTitre() : "");
        m.put("fichierNom", d.getFileName());
        m.put("fichierPath", d.getDocumentUrl());
        m.put("statut", resolveStatut(d));
        m.put("commentaire", d.getReviewCommentaire());
        m.put("soumisLe", d.getUploadedAt() != null ? d.getUploadedAt().format(FMT) : "");
        return m;
    }

    private String resolveStatut(Document d) {
        if (d.getReviewStatut() != null && !d.getReviewStatut().isBlank()) {
            return d.getReviewStatut();
        }
        if (d.getScore() != null) {
            return d.getScore() >= 50 ? "valide" : "rejete";
        }
        return "en_revision";
    }
}
