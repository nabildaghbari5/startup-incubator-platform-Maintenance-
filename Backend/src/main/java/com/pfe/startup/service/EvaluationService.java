package com.pfe.startup.service;

import com.pfe.startup.dto.EvaluationDTO;
import com.pfe.startup.entity.*;
import com.pfe.startup.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class EvaluationService {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final EvaluationRepository evaluationRepository;
    private final StartupRepository startupRepository;
    private final ProjetRepository projetRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<EvaluationDTO> findByIncubateur(Long incId) {
        userRepository.findById(incId)
                .orElseThrow(() -> new NoSuchElementException("Incubateur introuvable id=" + incId));
        return evaluationRepository.findByStartup_Incubateur_IdOrderByCreatedAtDesc(incId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<EvaluationDTO> findByExpert(Long expertId) {
        userRepository.findById(expertId)
                .orElseThrow(() -> new NoSuchElementException("Expert introuvable id=" + expertId));
        return evaluationRepository.findByExpertIdOrderByCreatedAtDesc(expertId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<EvaluationDTO> findAllProjetEvaluations() {
        return evaluationRepository.findByProjetIsNotNullOrderByCreatedAtDesc().stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public EvaluationDTO createForIncubateur(Long incId, Map<String, Object> body, Long expertId) {
        userRepository.findById(incId)
                .orElseThrow(() -> new NoSuchElementException("Incubateur introuvable id=" + incId));

        Long startupId = toLong(body.get("startupId"));
        if (startupId == null) {
            throw new IllegalArgumentException("startupId est requis");
        }

        Startup startup = startupRepository.findById(startupId)
                .orElseThrow(() -> new NoSuchElementException("Startup introuvable id=" + startupId));

        User expert = resolveExpert(expertId, body);

        Evaluation evaluation = Evaluation.builder()
                .scoreIA(intVal(body, "scoreIA", "scoreInnovation"))
                .scoreMarket(intVal(body, "scoreMarket", "scoreMarche"))
                .scoreTeam(intVal(body, "scoreTeam", "scoreEquipe"))
                .scoreTech(intVal(body, "scoreTech", "scoreTechnique"))
                .scoreFinance(intVal(body, "scoreFinance"))
                .commentaire(str(body, "commentaire"))
                .statut(str(body, "statut") != null ? str(body, "statut") : "EVALUE")
                .createdAt(LocalDateTime.now())
                .startup(startup)
                .expert(expert)
                .build();

        return toDto(evaluationRepository.save(evaluation));
    }

    @Transactional
    public EvaluationDTO createForExpert(Long expertId, Map<String, Object> body) {
        User expert = userRepository.findById(expertId)
                .orElseThrow(() -> new NoSuchElementException("Expert introuvable id=" + expertId));

        Long resolvedProjetId = toLong(body.get("projetId"));
        if (resolvedProjetId == null) {
            resolvedProjetId = toLong(body.get("startupId"));
        }
        if (resolvedProjetId == null) {
            throw new IllegalArgumentException("projetId est requis");
        }
        final Long projetId = resolvedProjetId;

        Projet projet = projetRepository.findById(projetId)
                .orElseThrow(() -> new NoSuchElementException("Projet introuvable id=" + projetId));

        Evaluation evaluation = Evaluation.builder()
                .scoreIA(intVal(body, "scoreIA", "scoreInnovation"))
                .scoreMarket(intVal(body, "scoreMarket", "scoreMarche"))
                .scoreTeam(intVal(body, "scoreTeam", "scoreEquipe"))
                .scoreTech(intVal(body, "scoreTech", "scoreTechnique"))
                .scoreFinance(intVal(body, "scoreFinance"))
                .commentaire(str(body, "commentaire"))
                .statut("EVALUE")
                .createdAt(LocalDateTime.now())
                .projet(projet)
                .expert(expert)
                .build();

        projet.setStatut(StatutProjet.EN_COURS_ANALYSE);
        projetRepository.save(projet);

        return toDto(evaluationRepository.save(evaluation));
    }

    @Transactional
    public void delete(Long id) {
        if (!evaluationRepository.existsById(id)) {
            throw new NoSuchElementException("Évaluation introuvable id=" + id);
        }
        evaluationRepository.deleteById(id);
    }

    public EvaluationDTO toDto(Evaluation e) {
        String evaluateur = "";
        if (e.getExpert() != null) {
            String nom = e.getExpert().getNom() != null ? e.getExpert().getNom() : "";
            String prenom = e.getExpert().getPrenom() != null ? e.getExpert().getPrenom() : "";
            evaluateur = (prenom + " " + nom).trim();
            if (evaluateur.isBlank()) {
                evaluateur = e.getExpert().getEmail();
            }
        }

        return EvaluationDTO.builder()
                .id(e.getId())
                .scoreIA(e.getScoreIA())
                .scoreMarket(e.getScoreMarket())
                .scoreTeam(e.getScoreTeam())
                .scoreTech(e.getScoreTech())
                .scoreFinance(e.getScoreFinance())
                .commentaire(e.getCommentaire())
                .statut(e.getStatut())
                .createdAt(e.getCreatedAt() != null ? e.getCreatedAt().format(FMT) : "")
                .startupId(e.getStartup() != null ? e.getStartup().getId() : null)
                .startupNom(e.getStartup() != null ? e.getStartup().getNom() : null)
                .projetId(e.getProjet() != null ? e.getProjet().getId() : null)
                .projetTitre(e.getProjet() != null ? e.getProjet().getTitre() : null)
                .evaluateur(evaluateur)
                .build();
    }

    public int avgScore(Evaluation e) {
        int sum = safe(e.getScoreIA()) + safe(e.getScoreMarket()) + safe(e.getScoreTeam())
                + safe(e.getScoreTech()) + safe(e.getScoreFinance());
        return Math.round(sum / 5f);
    }

    private User resolveExpert(Long expertId, Map<String, Object> body) {
        Long resolvedId = expertId != null ? expertId : toLong(body.get("expertId"));
        if (resolvedId == null) {
            return null;
        }
        return userRepository.findById(resolvedId).orElse(null);
    }

    private int safe(Integer v) {
        return v != null ? v : 0;
    }

    private String str(Map<String, Object> m, String key) {
        Object v = m.get(key);
        return v != null ? v.toString() : null;
    }

    private Integer intVal(Map<String, Object> m, String... keys) {
        for (String key : keys) {
            Long val = toLong(m.get(key));
            if (val != null) {
                return val.intValue();
            }
        }
        return 0;
    }

    private Long toLong(Object o) {
        if (o == null) return null;
        if (o instanceof Number n) return n.longValue();
        try {
            return Long.parseLong(o.toString());
        } catch (Exception e) {
            return null;
        }
    }
}
