package com.pfe.startup.service;

import com.pfe.startup.dto.*;
import com.pfe.startup.entity.*;
import com.pfe.startup.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private static final String[] MONTHS = {
            "Jan", "Fév", "Mar", "Avr", "Mai", "Jun",
            "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"
    };

    private static final DateTimeFormatter ISO_DATE = DateTimeFormatter.ISO_LOCAL_DATE;

    private final UserRepository userRepository;
    private final ProjetRepository projetRepository;
    private final PhaseRepository phaseRepository;
    private final EvenementRepository evenementRepository;
    private final DocumentRepository documentRepository;
    private final SatisfactionRepository satisfactionRepository;
    private final StartupRepository startupRepository;
    private final EvaluationRepository evaluationRepository;
    private final EvaluationService evaluationService;

    @Transactional(readOnly = true)
    public DashboardSnapshotDTO getPorteurSnapshot(Long porteurId) {
        User porteur = userRepository.findById(porteurId)
                .orElseThrow(() -> new NoSuchElementException("Porteur introuvable id=" + porteurId));

        List<Phase> phases = phaseRepository.findAll().stream()
                .sorted(Comparator.comparing(Phase::getNumero, Comparator.nullsLast(Integer::compareTo)))
                .toList();

        Map<Long, Document> docsByPhaseId = loadDocumentsByPhase(porteurId);
        List<DashboardPhaseDTO> phaseDtos = buildPhaseDtos(phases, docsByPhaseId);

        List<Projet> projets = projetRepository.findByPorteurId(porteurId);
        List<DashboardProjetDTO> projetDtos = projets.stream()
                .map(this::toProjetDto)
                .toList();

        List<Evenement> evenements = evenementRepository.findAll().stream()
                .sorted(Comparator.comparing(Evenement::getDate, Comparator.nullsLast(String::compareTo)))
                .toList();
        List<DashboardEvenementDTO> evenementDtos = evenements.stream()
                .map(this::toEvenementDto)
                .toList();

        List<Document> porteurDocs = documentRepository.findByPorteur_IdOrderByUploadedAtDesc(porteurId);
        List<DashboardDocumentDTO> documentsRecents = porteurDocs.stream()
                .limit(5)
                .map(this::toDocumentDto)
                .toList();

        DashboardActiviteMensuelleDTO activite = buildActiviteMensuelle(evenements, porteurDocs);
        DashboardKpisDTO kpis = buildKpis(phaseDtos, projets, evenements, porteurId);

        return DashboardSnapshotDTO.builder()
                .kpis(kpis)
                .phases(phaseDtos)
                .projets(projetDtos)
                .evenements(evenementDtos)
                .documentsRecents(documentsRecents)
                .activiteMensuelle(activite)
                .build();
    }

    @Transactional(readOnly = true)
    public DashboardKpisDTO getPorteurKpis(Long porteurId) {
        return getPorteurSnapshot(porteurId).getKpis();
    }

    @Transactional(readOnly = true)
    public DashboardIncubateurSnapshotDTO getIncubateurSnapshot(Long incId) {
        userRepository.findById(incId)
                .orElseThrow(() -> new NoSuchElementException("Incubateur introuvable id=" + incId));

        List<Projet> projets = projetRepository.findAll().stream()
                .sorted(Comparator.comparing(
                        Projet::getDateSoumission,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
        List<Evenement> evenements = evenementRepository.findByIncubateurIdOrderByDateAsc(incId);
        List<Satisfaction> satisfactions = satisfactionRepository.findByEvenement_Incubateur_IdOrderByCreatedAtDesc(incId);
        List<Document> pendingDocs = documentRepository.findByPhase_IncubateurIdOrderByUploadedAtDesc(incId).stream()
                .filter(d -> d.getScore() == null)
                .toList();

        Map<String, Long> sectorMap = new LinkedHashMap<>();
        for (Projet p : projets) {
            String secteur = p.getSecteur() != null && !p.getSecteur().isBlank() ? p.getSecteur() : "Autre";
            sectorMap.merge(secteur, 1L, Long::sum);
        }
        long total = projets.size();
        List<Map<String, Object>> secteurs = sectorMap.entrySet().stream()
                .map(e -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("name", e.getKey());
                    m.put("count", e.getValue());
                    m.put("pct", total > 0 ? Math.round(e.getValue() * 100.0 / total) : 0);
                    return m;
                })
                .toList();

        String today = LocalDate.now().format(ISO_DATE);
        List<DashboardEvenementDTO> upcoming = evenements.stream()
                .filter(e -> e.getDate() != null && e.getDate().compareTo(today) >= 0)
                .limit(5)
                .map(this::toEvenementDto)
                .toList();

        Evenement nextEvent = findNextEvent(evenements);
        int prochainRdvJours = 0;
        String prochainRdvTitre = "";
        if (nextEvent != null) {
            prochainRdvJours = (int) ChronoUnit.DAYS.between(
                    LocalDate.now(), LocalDate.parse(nextEvent.getDate()));
            prochainRdvTitre = nextEvent.getTitre() != null ? nextEvent.getTitre() : "";
        }

        double avgSat = satisfactions.stream()
                .mapToInt(s -> s.getNote() != null ? s.getNote() : 0)
                .average().orElse(0);

        int enAttente = (int) projets.stream()
                .filter(p -> p.getStatut() == StatutProjet.EN_ATTENTE
                        || p.getStatut() == StatutProjet.EN_COURS_ANALYSE)
                .count();
        int acceptes = (int) projets.stream()
                .filter(p -> p.getStatut() == StatutProjet.ACCEPTE)
                .count();
        int refuses = (int) projets.stream()
                .filter(p -> p.getStatut() == StatutProjet.REFUSE)
                .count();
        int decides = acceptes + refuses;
        int tauxAcceptation = decides > 0 ? (int) Math.round(acceptes * 100.0 / decides) : 0;

        DashboardIncubateurKpisDTO kpis = DashboardIncubateurKpisDTO.builder()
                .totalProjets(projets.size())
                .projetsEnAttente(enAttente)
                .projetsAcceptes(acceptes)
                .projetsRefuses(refuses)
                .tauxAcceptation(tauxAcceptation)
                .evenementsMois((int) evenements.stream()
                        .filter(e -> isInMonth(e.getDate(), YearMonth.now())).count())
                .satisfactionsRecues(satisfactions.size())
                .noteSatisfactionMoyenne((int) Math.round(avgSat))
                .documentsEnAttente(pendingDocs.size())
                .prochainRdvJours(Math.max(prochainRdvJours, 0))
                .prochainRdvTitre(prochainRdvTitre)
                .build();

        List<Map<String, Object>> activites = projets.stream().limit(5)
                .map(p -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("type", "projet");
                    m.put("texte", "Projet : " + (p.getTitre() != null ? p.getTitre() : "Sans titre"));
                    m.put("time", p.getDateSoumission() != null
                            ? p.getDateSoumission().toLocalDate().format(ISO_DATE)
                            : "");
                    return m;
                })
                .toList();

        List<Map<String, Object>> satRecent = satisfactions.stream().limit(5)
                .map(s -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", s.getId());
                    m.put("porteurEmail", s.getPorteur() != null ? s.getPorteur().getEmail() : "");
                    m.put("evenementTitre", s.getEvenement() != null ? s.getEvenement().getTitre() : "");
                    m.put("note", s.getNote());
                    m.put("commentaire", s.getCommentaire());
                    m.put("createdAt", s.getCreatedAt() != null ? s.getCreatedAt().toString() : "");
                    return m;
                })
                .toList();

        List<DashboardProjetDTO> projetsRecents = projets.stream()
                .limit(5)
                .map(this::toProjetDto)
                .toList();

        DashboardActiviteMensuelleDTO activite = buildIncubateurActivite(projets, evenements, satisfactions);

        return DashboardIncubateurSnapshotDTO.builder()
                .kpis(kpis)
                .secteurs(secteurs)
                .projetsRecents(projetsRecents)
                .evenementsProchains(upcoming)
                .activitesRecentes(activites)
                .satisfactionsRecentes(satRecent)
                .activiteMensuelle(activite)
                .build();
    }

    @Transactional(readOnly = true)
    public DashboardExpertSnapshotDTO getExpertSnapshot(Long expertId) {
        userRepository.findById(expertId)
                .orElseThrow(() -> new NoSuchElementException("Expert introuvable id=" + expertId));

        List<Document> allDocuments = documentRepository.findAll();
        List<Document> pendingDocs = documentRepository.findByScoreIsNullOrderByUploadedAtDesc();
        List<Document> scoredDocs = allDocuments.stream()
                .filter(d -> d.getScore() != null)
                .toList();
        List<Projet> pendingProjets = projetRepository.findAll().stream()
                .filter(p -> p.getStatut() == StatutProjet.EN_ATTENTE
                        || p.getStatut() == StatutProjet.EN_COURS_ANALYSE)
                .toList();

        YearMonth now = YearMonth.now();
        long scoredThisMonth = scoredDocs.stream()
                .filter(d -> isDocumentScoredInMonth(d, now))
                .count();

        int avgDocScore = scoredDocs.isEmpty() ? 0 :
                (int) Math.round(scoredDocs.stream().mapToInt(Document::getScore).average().orElse(0));

        DashboardExpertKpisDTO kpis = DashboardExpertKpisDTO.builder()
                .projetsEnAttente(pendingProjets.size())
                .documentsEnAttente(pendingDocs.size())
                .documentsEvaluesMois((int) scoredThisMonth)
                .scoreMoyenDocuments(avgDocScore)
                .documentsNotesTotal(scoredDocs.size())
                .build();

        List<Map<String, Object>> projetMaps = pendingProjets.stream().limit(10)
                .map(p -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", p.getId());
                    m.put("titre", p.getTitre());
                    m.put("secteur", p.getSecteur());
                    m.put("statut", p.getStatut() != null ? p.getStatut().name() : "");
                    m.put("porteurNom", p.getPorteur() != null
                            ? (p.getPorteur().getPrenom() + " " + p.getPorteur().getNom()).trim() : "");
                    m.put("porteurEmail", p.getPorteur() != null ? p.getPorteur().getEmail() : "");
                    m.put("dateSoumission", p.getDateSoumission() != null
                            ? p.getDateSoumission().toLocalDate().format(ISO_DATE) : "");
                    return m;
                })
                .toList();

        List<Map<String, Object>> docMaps = pendingDocs.stream().limit(10)
                .map(d -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", d.getId());
                    m.put("fileName", d.getFileName());
                    m.put("phaseTitre", d.getPhase() != null ? d.getPhase().getTitre() : "");
                    m.put("porteurNom", d.getPorteur() != null
                            ? (d.getPorteur().getPrenom() + " " + d.getPorteur().getNom()).trim() : "");
                    m.put("score", d.getScore());
                    m.put("statut", d.getScore() != null ? "EVALUE" : "EN_ATTENTE");
                    m.put("uploadedAt", d.getUploadedAt() != null
                            ? d.getUploadedAt().toLocalDate().format(ISO_DATE) : "");
                    return m;
                })
                .toList();

        DashboardActiviteMensuelleDTO activite = buildExpertActivite(scoredDocs);

        return DashboardExpertSnapshotDTO.builder()
                .kpis(kpis)
                .projetsEnAttente(projetMaps)
                .documentsEnAttente(docMaps)
                .activiteMensuelle(activite)
                .build();
    }

    private boolean isDocumentScoredInMonth(Document document, YearMonth month) {
        if (document.getScore() == null) {
            return false;
        }
        if (document.getScoredAt() != null) {
            return YearMonth.from(document.getScoredAt()).equals(month);
        }
        return document.getUploadedAt() != null && YearMonth.from(document.getUploadedAt()).equals(month);
    }

    private DashboardActiviteMensuelleDTO buildIncubateurActivite(
            List<Projet> projets,
            List<Evenement> evenements,
            List<Satisfaction> satisfactions
    ) {
        List<String> labels = new ArrayList<>();
        List<Integer> projetCounts = new ArrayList<>();
        List<Integer> eventCounts = new ArrayList<>();
        List<Integer> satCounts = new ArrayList<>();

        YearMonth now = YearMonth.now();
        for (int i = 5; i >= 0; i--) {
            YearMonth ym = now.minusMonths(i);
            labels.add(MONTHS[ym.getMonthValue() - 1]);
            projetCounts.add((int) projets.stream()
                    .filter(p -> p.getDateSoumission() != null
                            && YearMonth.from(p.getDateSoumission()).equals(ym))
                    .count());
            eventCounts.add((int) evenements.stream().filter(e -> isInMonth(e.getDate(), ym)).count());
            satCounts.add((int) satisfactions.stream()
                    .filter(s -> s.getCreatedAt() != null && YearMonth.from(s.getCreatedAt()).equals(ym))
                    .count());
        }

        return DashboardActiviteMensuelleDTO.builder()
                .labels(labels)
                .evenements(eventCounts)
                .documents(projetCounts)
                .build();
    }

    private DashboardActiviteMensuelleDTO buildExpertActivite(List<Document> scoredDocuments) {
        List<String> labels = new ArrayList<>();
        List<Integer> docCounts = new ArrayList<>();

        YearMonth now = YearMonth.now();
        for (int i = 5; i >= 0; i--) {
            YearMonth ym = now.minusMonths(i);
            labels.add(MONTHS[ym.getMonthValue() - 1]);
            docCounts.add((int) scoredDocuments.stream()
                    .filter(d -> isDocumentScoredInMonth(d, ym))
                    .count());
        }

        return DashboardActiviteMensuelleDTO.builder()
                .labels(labels)
                .documents(docCounts)
                .build();
    }

    private Map<Long, Document> loadDocumentsByPhase(Long porteurId) {
        Map<Long, Document> map = new HashMap<>();
        for (Document doc : documentRepository.findByPorteur_IdOrderByUploadedAtDesc(porteurId)) {
            if (doc.getPhase() != null && doc.getPhase().getId() != null) {
                map.putIfAbsent(doc.getPhase().getId(), doc);
            }
        }
        return map;
    }

    private List<DashboardPhaseDTO> buildPhaseDtos(List<Phase> phases, Map<Long, Document> docsByPhaseId) {
        List<DashboardPhaseDTO> result = new ArrayList<>();
        boolean currentAssigned = false;

        for (Phase phase : phases) {
            Document doc = docsByPhaseId.get(phase.getId());
            String statut;
            if (doc != null && doc.getScore() != null) {
                statut = "termine";
            } else if (!currentAssigned) {
                statut = "en_cours";
                currentAssigned = true;
            } else {
                statut = "a_venir";
            }

            result.add(DashboardPhaseDTO.builder()
                    .id(phase.getId())
                    .numero(phase.getNumero())
                    .mois(phase.getMois())
                    .titre(phase.getTitre())
                    .icone(phase.getIcone() != null ? phase.getIcone() : "📌")
                    .description(phase.getDescription() != null ? phase.getDescription() : "")
                    .couleur(phase.getCouleur() != null ? phase.getCouleur() : "#ec4899")
                    .statut(statut)
                    .fichierNom(doc != null ? doc.getFileName() : null)
                    .score(doc != null ? doc.getScore() : null)
                    .documentStatut(doc != null ? mapDocumentStatut(doc) : null)
                    .build());
        }
        return result;
    }

    private String mapDocumentStatut(Document doc) {
        if (doc.getScore() != null) {
            return "valide";
        }
        return "soumis";
    }

    private DashboardProjetDTO toProjetDto(Projet p) {
        String dateSoumission = p.getDateSoumission() != null
                ? p.getDateSoumission().toLocalDate().format(ISO_DATE)
                : null;
        return DashboardProjetDTO.builder()
                .id(p.getId())
                .titre(p.getTitre())
                .description(p.getDescription())
                .secteur(p.getSecteur())
                .statut(p.getStatut() != null ? p.getStatut().name() : null)
                .startupValidee(p.getStartupValidee())
                .dateSoumission(dateSoumission)
                .build();
    }

    private DashboardEvenementDTO toEvenementDto(Evenement e) {
        String date = e.getDate();
        String day = "";
        String month = "";

        if (date != null && date.length() == 10) {
            try {
                int monthIdx = Integer.parseInt(date.substring(5, 7));
                int dayNum = Integer.parseInt(date.substring(8, 10));
                day = String.valueOf(dayNum);
                month = MONTHS[monthIdx - 1];
            } catch (Exception ignored) {
                // keep empty day/month
            }
        }

        return DashboardEvenementDTO.builder()
                .id(e.getId())
                .titre(e.getTitre())
                .type(e.getType())
                .typeLabel(getTypeLabel(e.getType()))
                .date(date)
                .day(day)
                .month(month)
                .heureDebut(e.getHeureDebut())
                .heureFin(e.getHeureFin())
                .lieu(e.getLieu())
                .satisfactionActive(Boolean.TRUE.equals(e.getSatisfactionActive()))
                .build();
    }

    private DashboardDocumentDTO toDocumentDto(Document d) {
        return DashboardDocumentDTO.builder()
                .id(d.getId())
                .nom(d.getFileName())
                .type(extractFileType(d.getFileName()))
                .taille(formatFileSize(d.getDocumentUrl()))
                .statut(mapDocumentStatut(d))
                .uploadedAt(d.getUploadedAt() != null
                        ? d.getUploadedAt().toLocalDate().format(ISO_DATE)
                        : null)
                .build();
    }

    private DashboardKpisDTO buildKpis(
            List<DashboardPhaseDTO> phases,
            List<Projet> projets,
            List<Evenement> evenements,
            Long porteurId
    ) {
        int phasesTotal = phases.size();
        int phasesCompletees = (int) phases.stream().filter(p -> "termine".equals(p.getStatut())).count();

        List<Integer> scores = phases.stream()
                .map(DashboardPhaseDTO::getScore)
                .filter(Objects::nonNull)
                .toList();
        int scoreMoyen = scores.isEmpty()
                ? 0
                : (int) Math.round(scores.stream().mapToInt(Integer::intValue).average().orElse(0));

        YearMonth currentMonth = YearMonth.now();
        int evenementsMois = (int) evenements.stream()
                .filter(e -> isInMonth(e.getDate(), currentMonth))
                .count();

        int projetsActifs = (int) projets.stream()
                .filter(p -> p.getStatut() == StatutProjet.ACCEPTE)
                .count();

        int tauxParticipation = computeTauxParticipation(evenements, porteurId);

        Evenement nextEvent = findNextEvent(evenements);
        int prochainRdvJours = 0;
        String prochainRdvTitre = "";
        if (nextEvent != null) {
            prochainRdvJours = (int) ChronoUnit.DAYS.between(LocalDate.now(), LocalDate.parse(nextEvent.getDate()));
            prochainRdvTitre = nextEvent.getTitre() != null ? nextEvent.getTitre() : "";
        }

        return DashboardKpisDTO.builder()
                .phasesCompletees(phasesCompletees)
                .phasesTotal(phasesTotal)
                .scoreMoyen(scoreMoyen)
                .evenementsMois(evenementsMois)
                .projetsActifs(projetsActifs)
                .tauxParticipation(tauxParticipation)
                .prochainRdvJours(Math.max(prochainRdvJours, 0))
                .prochainRdvTitre(prochainRdvTitre)
                .build();
    }

    private int computeTauxParticipation(List<Evenement> evenements, Long porteurId) {
        String today = LocalDate.now().format(ISO_DATE);
        List<Evenement> eligible = evenements.stream()
                .filter(e -> Boolean.TRUE.equals(e.getSatisfactionActive()))
                .filter(e -> e.getDate() != null && e.getDate().compareTo(today) < 0)
                .toList();

        if (eligible.isEmpty()) {
            return 0;
        }

        long submitted = eligible.stream()
                .filter(e -> satisfactionRepository.existsByPorteurIdAndEvenementId(porteurId, e.getId()))
                .count();

        return (int) Math.round((submitted * 100.0) / eligible.size());
    }

    private Evenement findNextEvent(List<Evenement> evenements) {
        String today = LocalDate.now().format(ISO_DATE);
        return evenements.stream()
                .filter(e -> e.getDate() != null && e.getDate().compareTo(today) >= 0)
                .findFirst()
                .orElse(null);
    }

    private boolean isInMonth(String dateStr, YearMonth month) {
        if (dateStr == null || dateStr.length() < 7) {
            return false;
        }
        try {
            YearMonth eventMonth = YearMonth.parse(dateStr.substring(0, 7));
            return eventMonth.equals(month);
        } catch (Exception e) {
            return false;
        }
    }

    private DashboardActiviteMensuelleDTO buildActiviteMensuelle(
            List<Evenement> evenements,
            List<Document> documents
    ) {
        List<String> labels = new ArrayList<>();
        List<Integer> eventCounts = new ArrayList<>();
        List<Integer> docCounts = new ArrayList<>();

        YearMonth now = YearMonth.now();
        for (int i = 5; i >= 0; i--) {
            YearMonth ym = now.minusMonths(i);
            labels.add(MONTHS[ym.getMonthValue() - 1]);

            int evCount = (int) evenements.stream()
                    .filter(e -> isInMonth(e.getDate(), ym))
                    .count();
            eventCounts.add(evCount);

            int docCount = (int) documents.stream()
                    .filter(d -> d.getUploadedAt() != null
                            && YearMonth.from(d.getUploadedAt()).equals(ym))
                    .count();
            docCounts.add(docCount);
        }

        return DashboardActiviteMensuelleDTO.builder()
                .labels(labels)
                .evenements(eventCounts)
                .documents(docCounts)
                .build();
    }

    private String getTypeLabel(String type) {
        if (type == null) {
            return "";
        }
        return switch (type) {
            case "workshop" -> "Workshop";
            case "pitch" -> "Pitch";
            case "reunion" -> "Réunion";
            case "formation" -> "Formation";
            default -> type;
        };
    }

    private String extractFileType(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return "FILE";
        }
        return fileName.substring(fileName.lastIndexOf('.') + 1).toUpperCase();
    }

    private String formatFileSize(String documentUrl) {
        if (documentUrl == null || documentUrl.isBlank()) {
            return "—";
        }
        File file = new File(documentUrl);
        if (!file.exists()) {
            return "—";
        }
        long bytes = file.length();
        if (bytes < 1024) {
            return bytes + " B";
        }
        if (bytes < 1024 * 1024) {
            return String.format(Locale.FRANCE, "%.0f KB", bytes / 1024.0);
        }
        return String.format(Locale.FRANCE, "%.1f MB", bytes / (1024.0 * 1024.0));
    }
}
