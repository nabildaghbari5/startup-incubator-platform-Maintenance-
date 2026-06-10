package com.pfe.startup.ia;


import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;

@Slf4j
@Service
public class PdfService {

    private static final long MAX_PDF_SIZE_BYTES = 20 * 1024 * 1024L; // 20 Mo
    private static final String PDF_CONTENT_TYPE = "application/pdf";

    /**
     * Extrait le texte d'un PDF déjà sauvegardé sur le disque.
     */
    public String extractText(String filePath) {
        File file = new File(filePath);

        if (!file.exists() || !file.isFile()) {
            throw new IllegalArgumentException("Fichier introuvable : " + filePath);
        }
        if (file.length() > MAX_PDF_SIZE_BYTES) {
            throw new IllegalArgumentException(
                    "Le fichier PDF dépasse la taille maximale autorisée (20 Mo).");
        }

        try (PDDocument document = Loader.loadPDF(file)) {
            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(document);

            if (text == null || text.isBlank()) {
                throw new IllegalStateException(
                        "Aucun texte n'a pu être extrait du PDF. " +
                                "Le document est peut-être scanné (image) sans couche OCR.");
            }

            log.info("Texte extrait du PDF ({} caractères) : {}", text.length(), filePath);
            return text;

        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de la lecture du PDF : " + filePath, e);
        }
    }

    /**
     * Valide qu'un MultipartFile est bien un PDF avant sauvegarde.
     */
    public void validatePdf(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Le fichier est requis.");
        }
        String contentType = file.getContentType();
        String filename = file.getOriginalFilename();

        boolean isPdf = PDF_CONTENT_TYPE.equalsIgnoreCase(contentType)
                || (filename != null && filename.toLowerCase().endsWith(".pdf"));

        if (!isPdf) {
            throw new IllegalArgumentException(
                    "Seuls les fichiers PDF sont acceptés. Type reçu : " + contentType);
        }
        if (file.getSize() > MAX_PDF_SIZE_BYTES) {
            throw new IllegalArgumentException(
                    "Le fichier PDF dépasse la taille maximale autorisée (20 Mo).");
        }
    }
}