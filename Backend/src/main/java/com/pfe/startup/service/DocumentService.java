package com.pfe.startup.service;

import com.pfe.startup.dto.DocumentsDTO;
import com.pfe.startup.entity.Document;
import com.pfe.startup.entity.Phase;
import com.pfe.startup.entity.User;
import com.pfe.startup.file.FileStorageService;
import com.pfe.startup.file.FileUtils;
import com.pfe.startup.ia.*;
import com.pfe.startup.repository.DocumentRepository;
import com.pfe.startup.repository.PhaseRepository;
import com.pfe.startup.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentService {

    private static final String DOCUMENTS_FOLDER = "documents";

    private final UserRepository userRepository;
    private final PhaseRepository phaseRepository;
    private final DocumentRepository documentRepository;
    private final FileStorageService fileStorageService;

    // ia
    private final PdfService pdfService ;
    private final ImageService imageService;
    private final AiService aiService ;
    private final AiParserService aiParserService ;
    private final NotificationService notificationService ;


    private boolean isPdf(String contentType) {

        return "application/pdf".equalsIgnoreCase(contentType);

    }

    private boolean isImage(String contentType, String fileName) {
        if (contentType != null && !contentType.isBlank()) {
            String lowerType = contentType.toLowerCase();
            if (lowerType.equals("image/jpeg")
                    || lowerType.equals("image/jpg")
                    || lowerType.equals("image/png")) {
                return true;
            }
        }

        if (fileName == null || fileName.isBlank()) {
            return false;
        }

        String lowerFileName = fileName.toLowerCase();
        return lowerFileName.endsWith(".jpg")
                || lowerFileName.endsWith(".jpeg")
                || lowerFileName.endsWith(".png");
    }

    @Transactional
    public DocumentsDTO uploadDocument(Long porteurId, Long phaseId, MultipartFile file) throws Exception {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Le fichier est requis");
        }

        User porteur = userRepository.findById(porteurId)
                .orElseThrow(() -> new NoSuchElementException("Porteur introuvable id=" + porteurId));

        Phase phase = phaseRepository.findById(phaseId)
                .orElseThrow(() -> new NoSuchElementException("Phase introuvable id=" + phaseId));

        String storedPath = fileStorageService.saveFile(
                file,
                String.valueOf(porteurId),
                DOCUMENTS_FOLDER
        );
        if (storedPath == null) {
            throw new IllegalStateException("Échec de l'enregistrement du fichier sur le serveur");
        }

        String originalName = file.getOriginalFilename();
        String fileType = file.getContentType();
        log.info("le typeee de file " + fileType);

        if (fileType == null || fileType.isBlank()) {
            fileType = guessContentType(originalName);
        }

        Document document = documentRepository
                .findByPorteurIdAndPhaseId(porteurId, phaseId)
                .orElse(null);

        if (document != null) {
            deleteFileIfExists(document.getDocumentUrl());
            document.setFileName(originalName);
            document.setDocumentUrl(storedPath);
            document.setFileType(fileType);
            document.setUploadedAt(LocalDateTime.now());
            document.setScore(null);
        } else {
            document = Document.builder()
                    .fileName(originalName)
                    .documentUrl(storedPath)
                    .fileType(fileType)
                    .uploadedAt(LocalDateTime.now())
                    .porteur(porteur)
                    .phase(phase)
                    .build();
        }



        if (!isPdf(fileType) && !isImage(fileType, originalName)) {
            throw new IllegalArgumentException(
                    "Type de fichier non supporté : " + fileType);
        }

        String texte = extractText(storedPath, fileType, originalName);
        if (texte != null && !texte.isBlank()) {
            applyAiAnalysis(document, texte, phase);
        } else {
            log.warn("Aucun texte extrait pour {} — document enregistré sans score IA", originalName);
        }

        document = documentRepository.save(document);

        notificationService.notifyExpert(
                "Un nouveau document est disponible. Veuillez le consulter pour poursuivre l'évaluation.");

        notificationService.notifyIncubateur(
                "Un nouveau document est disponible. Veuillez le consulter pour poursuivre l'évaluation.");

        return DocumentsDTO.builder()
                .id(document.getId())
                .porteur(porteur)
                .phase(phase)
                .fileName(document.getFileName())
                .fileType(document.getFileType())
                .uploadedAt(document.getUploadedAt())
                .score(document.getScore())
                .commentaireIA(document.getCommentaireIA())
                .statut(computeStatut(document))
                .document(null)
                .build();
    }

    @Transactional
    public DocumentsDTO updateScore(Long documentId, Integer score) {
        if (score == null || score < 0 || score > 100) {
            throw new IllegalArgumentException("Le score doit être un entier entre 0 et 100");
        }

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new NoSuchElementException("Document introuvable id=" + documentId));

        document.setScore(score);
        document.setScoredAt(java.time.LocalDateTime.now());
        document = documentRepository.save(document);
        notificationService.notifyPorteur(
                "La note d'un document a été mise à jour par l'expert. Veuillez consulter les nouvelles informations.");
        return toListItemDto(document);
    }

    public List<DocumentsDTO> getDocumentsByPhaseId(Long phaseId) {
        phaseRepository.findById(phaseId)
                .orElseThrow(() -> new NoSuchElementException("Phase introuvable id=" + phaseId));

        return documentRepository.findByPhase_Id(phaseId).stream()
                .map(this::toListItemDto)
                .toList();
    }

    public DocumentsDTO getDocumentInfo(Long porteurId, Long phaseId) {
        return documentRepository
                .findByPorteurIdAndPhaseId(porteurId, phaseId)
                .map(this::toListItemDto)
                .orElseThrow(() -> new NoSuchElementException(
                        "Document introuvable pour porteur=" + porteurId + " et phase=" + phaseId));
    }

    public DocumentsDTO getDocument(Long porteurId, Long phaseId) {
        Document document = documentRepository
                .findByPorteurIdAndPhaseId(porteurId, phaseId)
                .orElseThrow(() -> new NoSuchElementException(
                        "Document introuvable pour porteur=" + porteurId + " et phase=" + phaseId));

        byte[] content = FileUtils.readFileFromLocation(document.getDocumentUrl());
        if (content == null) {
            throw new IllegalStateException("Fichier introuvable sur le serveur");
        }

        return DocumentsDTO.builder()
                .id(document.getId())
                .document(content)
                .fileName(document.getFileName())
                .fileType(document.getFileType())
                .uploadedAt(document.getUploadedAt())
                .score(document.getScore())
                .statut(computeStatut(document))
                .porteur(document.getPorteur())
                .phase(document.getPhase())
                .build();
    }

    private DocumentsDTO toListItemDto(Document d) {
        return DocumentsDTO.builder()
                .id(d.getId())
                .fileName(d.getFileName())
                .fileType(d.getFileType())
                .uploadedAt(d.getUploadedAt())
                .score(d.getScore())
                .commentaireIA(d.getCommentaireIA())
                .statut(computeStatut(d))
                .porteur(d.getPorteur())
                .phase(d.getPhase())
                .build();
    }

    private String computeStatut(Document d) {
        if (d.getScore() != null) {
            return "EVALUE";
        }
        return "EN_ATTENTE";
    }

    private void deleteFileIfExists(String path) {
        if (path == null || path.isBlank()) {
            return;
        }
        File file = new File(path);
        if (file.exists() && !file.delete()) {
            // ancien fichier conservé si suppression impossible
        }
    }

    private String extractText(String storedPath, String fileType, String originalName) {
        try {
            if (isPdf(fileType)) {
                return pdfService.extractText(storedPath);
            }
            if (isImage(fileType, originalName)) {

                return imageService.extractText(storedPath);
            }
        } catch (Exception e) {
            log.warn("Extraction de texte échouée pour {} : {}", originalName, e.getMessage());
        }
        return null;
    }

    private void applyAiAnalysis(Document document, String texte, Phase phase) {
        try {
            String aiRawResponse = aiService.analyserTexte(
                    texte, phase.getTitre(), phase.getDescription());
            AiResponseDto result = aiParserService.parse(aiRawResponse);
            document.setScore(result.getScore());
            document.setCommentaireIA(result.getCommentaire());
        } catch (Exception e) {
            log.warn("Analyse IA échouée pour {} : {}", document.getFileName(), e.getMessage());
        }
    }

    private String guessContentType(String fileName) {
        if (fileName == null) {
            return "application/octet-stream";
        }
        String lower = fileName.toLowerCase();
        if (lower.endsWith(".pdf")) {
            return "application/pdf";
        }
        if (lower.endsWith(".png")) {
            return "image/png";
        }
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
            return "image/jpeg";
        }
        return "application/octet-stream";
    }
}
