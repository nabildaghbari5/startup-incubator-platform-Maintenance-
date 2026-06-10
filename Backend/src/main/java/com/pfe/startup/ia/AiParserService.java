package com.pfe.startup.ia;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class AiParserService {

    private final ObjectMapper objectMapper = new ObjectMapper();

    public AiResponseDto parse(String geminiResponse) {

        try {

            JsonNode root = objectMapper.readTree(geminiResponse);

            JsonNode candidates = root.path("candidates");

            if (!candidates.isArray() || candidates.isEmpty()) {
                throw new IllegalArgumentException(
                        "Aucun candidat retourné par Gemini");
            }

            String jsonText = candidates.get(0)
                    .path("content")
                    .path("parts")
                    .get(0)
                    .path("text")
                    .asText();

            jsonText = jsonText
                    .replace("```json", "")
                    .replace("```", "")
                    .trim();

            log.info("JSON extrait : {}", jsonText);

            AiResponseDto dto =
                    objectMapper.readValue(jsonText, AiResponseDto.class);

            if (dto.getScore() == null
                    || dto.getScore() < 0
                    || dto.getScore() > 100) {

                throw new IllegalArgumentException(
                        "Score invalide : " + dto.getScore());
            }

            return dto;

        } catch (Exception e) {

            log.error("Erreur parsing Gemini", e);

            throw new IllegalArgumentException(
                    "Impossible de parser la réponse Gemini", e);
        }
    }
}