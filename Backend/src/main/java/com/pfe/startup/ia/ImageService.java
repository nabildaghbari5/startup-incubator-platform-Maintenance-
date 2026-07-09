package com.pfe.startup.ia;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.sourceforge.tess4j.Tesseract;
import net.sourceforge.tess4j.TesseractException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;




import java.io.File;
@Service
@Slf4j
@RequiredArgsConstructor
public class ImageService {

    @Value("${tesseract.datapath}")
    private String datapath;

    private final ImagePreprocessor imagePreprocessor;

    public String extractText(String imagePath) {
        File file = new File(imagePath);

        if (!file.exists() || !file.isFile()) {
            throw new IllegalArgumentException("Image introuvable : " + imagePath);
        }

        File tessdataDir = new File(datapath);
        if (!tessdataDir.exists() || !tessdataDir.isDirectory()) {
            throw new IllegalStateException(
                    "Dossier tessdata introuvable : " + tessdataDir.getAbsolutePath());
        }

        String preprocessedPath = null;
        try {
            // 1) Prétraitement OpenCV
            preprocessedPath = imagePreprocessor.preprocess(imagePath);
            File preprocessedFile = new File(preprocessedPath);

            // 2) OCR sur l'image nettoyée
            Tesseract tesseract = new Tesseract();
            tesseract.setDatapath(tessdataDir.getAbsolutePath());
            tesseract.setLanguage("fra");

            String text = tesseract.doOCR(preprocessedFile);

            if (text == null || text.isBlank()) {
                throw new IllegalStateException("Aucun texte détecté dans l'image.");
            }

            log.info("Texte extrait de l'image (après prétraitement OpenCV)");
            return text;

        } catch (TesseractException e) {
            throw new RuntimeException("Erreur OCR sur l'image : " + e.getMessage(), e);
        } finally {
            // 3) nettoyage du fichier temporaire prétraité
            if (preprocessedPath != null) {
                new File(preprocessedPath).delete();
            }
        }
    }
}