package com.pfe.startup.ia;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiService {

    private final WebClient webClient;

    @Value("${gemini.api.key}")
    private String apiKey;

    private static final int MAX_CHARS = 12000;

    public String analyserTexte(String texte , String titrePhase , String descriptionPhase) {

        if (texte == null || texte.isBlank()) {
            throw new IllegalArgumentException(
                    "Le texte extrait du PDF est vide.");
        }

        String texteCorrige = texte.length() > MAX_CHARS
                ? texte.substring(0, MAX_CHARS)
                : texte;

        String prompt = """
        Tu es un expert en évaluation de projets startup.

        Contexte de la phase :

        Titre de la phase : %s

        Description de la phase :
        %s

        Ta mission :
        Analyse le document fourni et évalue dans quelle mesure son contenu répond aux attentes de cette phase.

        Retourne UNIQUEMENT un JSON valide au format suivant :

        {
          "score": 85,
          "commentaire": "Explication concise de l'évaluation."
        }

        Règles d'évaluation :
        - Le score doit être compris entre 0 et 100.
        - Le score doit refléter la pertinence du document par rapport au titre et à la description de la phase.
        - Évalue la qualité, la cohérence, la complétude et la conformité du document aux objectifs de la phase.
        - Si le document répond parfaitement aux attentes de la phase, attribue un score élevé.
        - Si des informations importantes sont absentes ou insuffisamment détaillées, réduis le score en conséquence.
        - Le commentaire doit justifier clairement le score attribué en 2 à 4 phrases maximum.
        - Ne retourne aucun texte en dehors du JSON.

        Document à analyser :

        %s
        """.formatted(
                titrePhase,
                descriptionPhase,
                texteCorrige
        );

        Map<String, Object> body = Map.of(
                "contents", List.of(
                        Map.of(
                                "parts", List.of(
                                        Map.of(
                                                "text", prompt
                                        )
                                )
                        )
                )
        );

        String url =
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key="
                        + apiKey;

        try {

            String response = webClient.post()
                    .uri(url)
                    .bodyValue(body)
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, clientResponse ->
                            clientResponse.bodyToMono(String.class)
                                    .map(err -> new RuntimeException(err)))
                    .bodyToMono(String.class)
                    .block();

            log.info("Réponse Gemini : {}", response);

            return response;

        } catch (WebClientResponseException e) {

            log.error("Erreur Gemini HTTP {} : {}",
                    e.getStatusCode(),
                    e.getResponseBodyAsString());

            throw new RuntimeException(
                    "Erreur Gemini : " + e.getResponseBodyAsString(), e);
        }
    }
}