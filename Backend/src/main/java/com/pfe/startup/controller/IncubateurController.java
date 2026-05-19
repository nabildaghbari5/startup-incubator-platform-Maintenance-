package com.pfe.startup.controller;

import com.pfe.startup.entity.*;
import com.pfe.startup.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/incubateur/{incId}")
@RequiredArgsConstructor
public class IncubateurController {

    private final StartupRepository      startupRepo;
    private final SatisfactionRepository satisfactionRepo;
    private final UserRepository         userRepo;

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    // ── STARTUPS STATS ───────────────────────────────────────
    @GetMapping("/startups/stats")
    public Map<String, Object> stats(@PathVariable Long incId) {
        List<Startup> all = startupRepo.findByIncubateurIdOrderByNomAsc(incId);
        long total   = all.size();
        long actif   = all.stream().filter(s -> "actif".equals(s.getStatut())).count();
        long attente = all.stream().filter(s -> "en_attente".equals(s.getStatut())).count();
        long termine = all.stream().filter(s -> "termine".equals(s.getStatut())).count();
        double avg   = all.stream().mapToInt(s -> s.getAiScore() != null ? s.getAiScore() : 0).average().orElse(0);

        Map<String, Long> sectorMap = all.stream()
                .collect(Collectors.groupingBy(
                        s -> s.getSecteur() != null ? s.getSecteur() : "Autre",
                        Collectors.counting()));

        List<Map<String, Object>> secteurs = sectorMap.entrySet().stream().map(e ->
                        Map.<String,Object>of("name", e.getKey(), "count", e.getValue(),
                                "pct", total > 0 ? Math.round(e.getValue() * 100.0 / total) : 0))
                .collect(Collectors.toList());

        return Map.of(
                "totalStartups",     total,
                "startupsActives",   actif,
                "startupsEnAttente", attente,
                "startupsTerminees", termine,
                "scoreIAMoyen",      Math.round(avg),
                "secteurs",          secteurs
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
        Startup s = buildStartup(body, new Startup());
        s.setIncubateur(inc);
        s = startupRepo.save(s);
        return ResponseEntity.ok(startupToMap(s));
    }

    @PutMapping("/startups/{id}")
    public ResponseEntity<?> updateStartup(@PathVariable Long incId,
                                           @PathVariable Long id,
                                           @RequestBody Map<String, Object> body) {
        Startup s = startupRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Startup non trouvée"));
        buildStartup(body, s);
        return ResponseEntity.ok(startupToMap(startupRepo.save(s)));
    }

    @DeleteMapping("/startups/{id}")
    public ResponseEntity<?> deleteStartup(@PathVariable Long incId, @PathVariable Long id) {
        startupRepo.deleteById(id);
        return ResponseEntity.ok(Map.of("deleted", id));
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
        return satisfactionRepo.findAll().stream()
                .map(sat -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id",             sat.getId());
                    m.put("porteurEmail",   sat.getPorteur() != null ? sat.getPorteur().getEmail() : "");
                    m.put("evenementId",    sat.getEvenement() != null ? sat.getEvenement().getId() : null);
                    m.put("evenementTitre", sat.getEvenement() != null ? sat.getEvenement().getTitre() : "");
                    m.put("note",           sat.getNote() != null ? sat.getNote() : 0);
                    m.put("commentaire",    sat.getCommentaire());
                    m.put("createdAt",      sat.getCreatedAt() != null ? sat.getCreatedAt().format(FMT) : "");
                    return m;
                })
                .collect(Collectors.toList());
    }

    // ── HELPERS ──────────────────────────────────────────────
    private Startup buildStartup(Map<String, Object> b, Startup s) {
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

    private Map<String, Object> startupToMap(Startup s) {
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

    private int toInt(Object o) {
        if (o instanceof Integer) return (Integer) o;
        if (o instanceof Number)  return ((Number) o).intValue();
        try { return Integer.parseInt(o.toString()); } catch (Exception e) { return 0; }
    }
}