package com.pfe.startup.controller;

import com.pfe.startup.dto.*;
import com.pfe.startup.entity.Evenement;
import com.pfe.startup.entity.Phase;
import com.pfe.startup.entity.Projet;
import com.pfe.startup.entity.StatutProjet;
import com.pfe.startup.entity.User;
import com.pfe.startup.repository.EvenementRepository;
import com.pfe.startup.repository.PhaseRepository;
import com.pfe.startup.repository.ProjetRepository;
import com.pfe.startup.repository.SatisfactionRepository;
import com.pfe.startup.repository.StartupRepository;
import com.pfe.startup.repository.UserRepository;
import com.pfe.startup.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/incubateur/{incId}")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class IncubateurController {

    private static final String[] MONTHS =
            {"Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"};

    private final StartupRepository      startupRepo;
    private final SatisfactionRepository satisfactionRepo;
    private final UserRepository         userRepo;
    private final EvenementRepository    evenementRepo;
    private final PhaseRepository          phaseRepo;
    private final ProjetRepository         projetRepo;
    private final EvaluationService      evaluationService;
    private final IncubateurDocumentService incubateurDocumentService;
    private final IncubateurProjetService   incubateurProjetService;

    // ── PROJETS STATS (dashboard) ────────────────────────────
    @GetMapping({"/projets/stats", "/startups/stats"})
    public Map<String, Object> projetStats(@PathVariable Long incId) {
        userRepo.findById(incId)
                .orElseThrow(() -> new NoSuchElementException("Incubateur introuvable id=" + incId));

        List<Projet> all = projetRepo.findAll();
        long total = all.size();
        long enAttente = all.stream()
                .filter(p -> p.getStatut() == StatutProjet.EN_ATTENTE
                        || p.getStatut() == StatutProjet.EN_COURS_ANALYSE)
                .count();
        long acceptes = all.stream().filter(p -> p.getStatut() == StatutProjet.ACCEPTE).count();
        long refuses = all.stream().filter(p -> p.getStatut() == StatutProjet.REFUSE).count();
        long decides = acceptes + refuses;
        long tauxAcceptation = decides > 0 ? Math.round(acceptes * 100.0 / decides) : 0;

        Map<String, Long> sectorMap = all.stream()
                .collect(Collectors.groupingBy(
                        p -> p.getSecteur() != null && !p.getSecteur().isBlank() ? p.getSecteur() : "Autre",
                        Collectors.counting()));

        List<Map<String, Object>> secteurs = sectorMap.entrySet().stream().map(e ->
                        Map.<String, Object>of("name", e.getKey(), "count", e.getValue(),
                                "pct", total > 0 ? Math.round(e.getValue() * 100.0 / total) : 0))
                .collect(Collectors.toList());

        return Map.of(
                "totalProjets", total,
                "projetsEnAttente", enAttente,
                "projetsAcceptes", acceptes,
                "projetsRefuses", refuses,
                "tauxAcceptation", tauxAcceptation,
                "secteurs", secteurs
        );
    }

    // ── STARTUPS CRUD ────────────────────────────────────────
    @GetMapping("/startups")
    public List<Map<String, Object>> startups(@PathVariable Long incId) {
        return startupRepo.findByIncubateurIdOrderByNomAsc(incId)
                .stream().map(this::startupToMap).collect(Collectors.toList());
    }

    @PostMapping("/startups")
    public ResponseEntity<?> createStartup(@PathVariable Long incId,
                                           @RequestBody Map<String, Object> body) {
        User inc = userRepo.findById(incId)
                .orElseThrow(() -> new RuntimeException("User non trouvé"));
        com.pfe.startup.entity.Startup s = buildStartup(body, new com.pfe.startup.entity.Startup());
        s.setIncubateur(inc);
        s = startupRepo.save(s);
        return ResponseEntity.ok(startupToMap(s));
    }

    @PutMapping("/startups/{id}")
    public ResponseEntity<?> updateStartup(@PathVariable Long incId,
                                           @PathVariable Long id,
                                           @RequestBody Map<String, Object> body) {
        com.pfe.startup.entity.Startup s = startupRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Startup non trouvée"));
        buildStartup(body, s);
        return ResponseEntity.ok(startupToMap(startupRepo.save(s)));
    }

    @DeleteMapping("/startups/{id}")
    public ResponseEntity<?> deleteStartup(@PathVariable Long incId, @PathVariable Long id) {
        startupRepo.deleteById(id);
        return ResponseEntity.ok(Map.of("deleted", id));
    }

    // ── ÉVÉNEMENTS (alias frontend) ──────────────────────────
    @GetMapping("/evenements/upcoming")
    public List<Map<String, Object>> upcomingEvents(@PathVariable Long incId) {
        String today = java.time.LocalDate.now().toString();
        return evenementRepo.findByIncubateurIdOrderByDateAsc(incId).stream()
                .filter(e -> e.getDate() != null && e.getDate().compareTo(today) >= 0)
                .limit(5)
                .map(this::evenementToMap)
                .collect(Collectors.toList());
    }

    // ── PHASES (alias déplacement) ─────────────────────────────
    @PatchMapping("/phases/{id}/move")
    public ResponseEntity<?> movePhase(@PathVariable Long incId,
                                       @PathVariable Long id,
                                       @RequestParam String direction) {
        Phase current = phaseRepo.findById(id).orElse(null);
        if (current == null) return ResponseEntity.notFound().build();

        List<Phase> phases = phaseRepo.findByIncubateurIdOrderByNumeroAsc(incId);
        int idx = -1;
        for (int i = 0; i < phases.size(); i++) {
            if (phases.get(i).getId().equals(id)) { idx = i; break; }
        }
        if (idx == -1) return ResponseEntity.notFound().build();

        int target = "up".equals(direction) ? idx - 1 : idx + 1;
        if (target < 0 || target >= phases.size()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Déplacement impossible"));
        }

        Phase a = phases.get(idx);
        Phase b = phases.get(target);
        int tmp = a.getNumero();
        a.setNumero(b.getNumero());
        b.setNumero(tmp);
        phaseRepo.saveAll(List.of(a, b));

        return ResponseEntity.ok(phaseRepo.findByIncubateurIdOrderByNumeroAsc(incId).stream()
                .map(this::phaseToMap).collect(Collectors.toList()));
    }

    // ── PROJETS / RAPPORTS MENSUELS ──────────────────────────
    @GetMapping("/projets")
    public List<Map<String, Object>> projets(@PathVariable Long incId) {
        return incubateurProjetService.listRapports(incId);
    }

    @PatchMapping("/projets/{id}/statut")
    public ResponseEntity<?> updateProjetStatut(@PathVariable Long incId,
                                                @PathVariable Long id,
                                                @RequestBody Map<String, Object> body) {
        try {
            String statut = body.get("statut") != null ? body.get("statut").toString() : "en_revision";
            return ResponseEntity.ok(incubateurProjetService.updateStatut(incId, id, statut));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/projets/{id}/commentaire")
    public ResponseEntity<?> updateProjetCommentaire(@PathVariable Long incId,
                                                     @PathVariable Long id,
                                                     @RequestBody Map<String, Object> body) {
        try {
            String commentaire = body.get("commentaire") != null ? body.get("commentaire").toString() : "";
            return ResponseEntity.ok(incubateurProjetService.updateCommentaire(incId, id, commentaire));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/projets/{id}/download")
    public ResponseEntity<byte[]> downloadProjet(@PathVariable Long incId, @PathVariable Long id) {
        try {
            String fileName = incubateurProjetService.getFileName(incId, id);
            byte[] content = incubateurProjetService.download(incId, id);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(content);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // ── ÉVALUATIONS ──────────────────────────────────────────
    @GetMapping("/evaluations")
    public List<EvaluationDTO> evaluations(@PathVariable Long incId,
                                           @RequestParam(required = false) Long expertId) {
        if (expertId != null) {
            return evaluationService.findByExpert(expertId);
        }
        List<EvaluationDTO> all = new ArrayList<>(evaluationService.findByIncubateur(incId));
        return mergeEvaluations(all);
    }

    private List<EvaluationDTO> mergeEvaluations(List<EvaluationDTO> incubateurEvals) {
        Map<Long, EvaluationDTO> byId = new LinkedHashMap<>();
        for (EvaluationDTO dto : incubateurEvals) {
            if (dto.getId() != null) byId.put(dto.getId(), dto);
        }
        for (EvaluationDTO dto : evaluationService.findAllProjetEvaluations()) {
            if (dto.getId() != null && !byId.containsKey(dto.getId())) {
                byId.put(dto.getId(), dto);
            }
        }
        return new ArrayList<>(byId.values());
    }

    @PostMapping("/evaluations")
    public ResponseEntity<?> createEvaluation(@PathVariable Long incId,
                                              @RequestBody Map<String, Object> body) {
        try {
            Long targetId = toLong(body.get("startupId"));
            if (targetId != null && projetRepo.existsById(targetId)) {
                Long expertId = toLong(body.get("expertId"));
                if (expertId == null) {
                    expertId = 1L;
                }
                body.put("projetId", targetId);
                return ResponseEntity.ok(evaluationService.createForExpert(expertId, body));
            }
            return ResponseEntity.ok(evaluationService.createForIncubateur(incId, body, null));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/evaluations/{id}")
    public ResponseEntity<?> deleteEvaluation(@PathVariable Long incId, @PathVariable Long id) {
        try {
            evaluationService.delete(id);
            return ResponseEntity.ok(Map.of("deleted", id));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ── DOCUMENTS INCUBATEUR ─────────────────────────────────
    @GetMapping("/documents")
    public List<Map<String, Object>> documents(@PathVariable Long incId,
                                               @RequestParam(required = false) String statut) {
        return incubateurDocumentService.listDocuments(incId, statut);
    }

    @PostMapping(value = "/documents/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadDocument(@PathVariable Long incId,
                                            @RequestParam("file") MultipartFile file,
                                            @RequestParam(required = false) String startupNom) {
        try {
            return ResponseEntity.ok(incubateurDocumentService.upload(incId, file, startupNom));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/documents/{id}/statut")
    public ResponseEntity<?> updateDocumentStatut(@PathVariable Long incId,
                                                 @PathVariable Long id,
                                                 @RequestBody Map<String, Object> body) {
        try {
            String statut = body.get("statut") != null ? body.get("statut").toString() : "soumis";
            return ResponseEntity.ok(incubateurDocumentService.updateStatut(incId, id, statut));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/documents/{id}/visibilite")
    public ResponseEntity<?> updateDocumentVisibilite(@PathVariable Long incId,
                                                      @PathVariable Long id,
                                                      @RequestBody Map<String, Object> body) {
        try {
            boolean visible = Boolean.TRUE.equals(body.get("visiblePorteur"));
            return ResponseEntity.ok(incubateurDocumentService.updateVisibilite(incId, id, visible));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/documents/{id}/download")
    public ResponseEntity<byte[]> downloadDocument(@PathVariable Long incId, @PathVariable Long id) {
        try {
            String fileName = incubateurDocumentService.getFileName(incId, id);
            byte[] content = incubateurDocumentService.download(incId, id);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(content);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/documents/{id}")
    public ResponseEntity<?> deleteDocument(@PathVariable Long incId, @PathVariable Long id) {
        try {
            incubateurDocumentService.delete(incId, id);
            return ResponseEntity.ok(Map.of("deleted", id));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ── ACTIVITES ────────────────────────────────────────────
    @GetMapping("/activites")
    public List<Map<String, Object>> activites(@PathVariable Long incId) {
        return startupRepo.findByIncubateurIdOrderByNomAsc(incId).stream()
                .limit(5)
                .map(s -> Map.<String,Object>of(
                        "type",  "startup",
                        "texte", "Startup : " + s.getNom(),
                        "time",  ""
                ))
                .collect(Collectors.toList());
    }

    // ── SATISFACTIONS ────────────────────────────────────────
    @GetMapping("/satisfactions")
    public List<Map<String, Object>> satisfactions(@PathVariable Long incId) {
        return satisfactionRepo.findByEvenement_Incubateur_IdOrderByCreatedAtDesc(incId).stream()
                .map(sat -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id",             sat.getId());
                    m.put("porteurEmail",   sat.getPorteur() != null ? sat.getPorteur().getEmail() : "");
                    m.put("evenementId",    sat.getEvenement() != null ? sat.getEvenement().getId() : null);
                    m.put("evenementTitre", sat.getEvenement() != null ? sat.getEvenement().getTitre() : "");
                    m.put("note",           sat.getNote() != null ? sat.getNote() : 0);
                    m.put("commentaire",    sat.getCommentaire());
                    m.put("createdAt",      sat.getCreatedAt() != null
                            ? sat.getCreatedAt().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")) : "");
                    return m;
                })
                .collect(Collectors.toList());
    }

    // ── HELPERS ──────────────────────────────────────────────
    private com.pfe.startup.entity.Startup buildStartup(Map<String, Object> b, com.pfe.startup.entity.Startup s) {
        if (b.containsKey("nom"))         s.setNom((String) b.get("nom"));
        if (b.containsKey("fondateur"))   s.setFondateur((String) b.get("fondateur"));
        if (b.containsKey("secteur"))     s.setSecteur((String) b.get("secteur"));
        if (b.containsKey("phase"))       s.setPhase((String) b.get("phase"));
        if (b.containsKey("description")) s.setDescription((String) b.get("description"));
        if (b.containsKey("aiScore"))     s.setAiScore(toInt(b.get("aiScore")));
        if (b.containsKey("progress"))    s.setProgress(toInt(b.get("progress")));
        if (b.containsKey("statut"))      s.setStatut((String) b.get("statut"));
        return s;
    }

    private Map<String, Object> startupToMap(com.pfe.startup.entity.Startup s) {
        String nom = s.getNom() != null ? s.getNom() : "";
        String initiales = nom.length() >= 2 ? nom.substring(0, 2).toUpperCase() : nom.toUpperCase();
        String[] colors = {"#ec4899","#a855f7","#06b6d4","#10b981","#f59e0b","#3b82f6"};
        String couleur = s.getId() != null ? colors[(int)(s.getId() % colors.length)] : colors[0];

        String statut = s.getStatut() != null ? s.getStatut() : "actif";
        String statusLabel = switch (statut) {
            case "actif"      -> "Actif";
            case "en_attente" -> "En attente";
            case "termine"    -> "Terminé";
            default           -> statut;
        };

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",          s.getId());
        m.put("nom",         nom);
        m.put("fondateur",   s.getFondateur());
        m.put("secteur",     s.getSecteur());
        m.put("phase",       s.getPhase());
        m.put("progress",    s.getProgress() != null ? s.getProgress() : 0);
        m.put("aiScore",     s.getAiScore()  != null ? s.getAiScore()  : 0);
        m.put("statut",      statut);
        m.put("statusLabel", statusLabel);
        m.put("couleur",     couleur);
        m.put("initiales",   initiales);
        m.put("description", s.getDescription());
        return m;
    }

    private Map<String, Object> evenementToMap(Evenement e) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", e.getId());
        m.put("titre", e.getTitre());
        m.put("type", e.getType());
        m.put("typeLabel", getTypeLabel(e.getType()));
        m.put("heureDebut", e.getHeureDebut());
        m.put("heureFin", e.getHeureFin());
        m.put("lieu", e.getLieu());
        m.put("satisfactionActive", Boolean.TRUE.equals(e.getSatisfactionActive()));
        String date = e.getDate();
        if (date != null && date.length() == 10) {
            try {
                int month = Integer.parseInt(date.substring(5, 7));
                int day   = Integer.parseInt(date.substring(8, 10));
                m.put("date", date);
                m.put("day", String.valueOf(day));
                m.put("month", MONTHS[month - 1]);
            } catch (Exception ex) {
                m.put("date", date); m.put("day", ""); m.put("month", "");
            }
        } else {
            m.put("date", date); m.put("day", ""); m.put("month", "");
        }
        return m;
    }

    private Map<String, Object> phaseToMap(Phase p) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", p.getId());
        m.put("numero", p.getNumero());
        m.put("mois", p.getMois());
        m.put("titre", p.getTitre());
        m.put("icone", p.getIcone() != null ? p.getIcone() : "📌");
        m.put("description", p.getDescription() != null ? p.getDescription() : "");
        m.put("couleur", p.getCouleur() != null ? p.getCouleur() : "#ec4899");
        return m;
    }

    private String getTypeLabel(String type) {
        if (type == null) return "";
        return switch (type) {
            case "workshop"  -> "Workshop";
            case "pitch"     -> "Pitch";
            case "reunion"   -> "Réunion";
            case "formation" -> "Formation";
            default -> type;
        };
    }

    private int toInt(Object o) {
        if (o instanceof Integer) return (Integer) o;
        if (o instanceof Number)  return ((Number) o).intValue();
        try { return Integer.parseInt(o.toString()); } catch (Exception e) { return 0; }
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
