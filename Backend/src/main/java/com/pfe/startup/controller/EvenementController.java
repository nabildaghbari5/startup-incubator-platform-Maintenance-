package com.pfe.startup.controller;

import com.pfe.startup.entity.Evenement;
import com.pfe.startup.entity.User;
import com.pfe.startup.repository.EvenementRepository;
import com.pfe.startup.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/incubateur/{incId}/evenements")
@RequiredArgsConstructor
public class EvenementController {

    private final EvenementRepository evenementRepo;
    private final UserRepository      userRepo;

    private static final String[] MONTHS =
            {"Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"};

    @GetMapping
    public List<Map<String, Object>> getAll(@PathVariable Long incId) {
        return evenementRepo.findByIncubateurIdOrderByDateAsc(incId)
                .stream().map(this::toMap).collect(Collectors.toList());
    }

    @GetMapping("/upcoming")
    public List<Map<String, Object>> upcoming(@PathVariable Long incId) {
        // date stockée en String "yyyy-MM-dd", on compare lexicographiquement
        String today = java.time.LocalDate.now().toString();
        return evenementRepo.findByIncubateurIdOrderByDateAsc(incId).stream()
                .filter(e -> e.getDate() != null && e.getDate().compareTo(today) >= 0)
                .limit(5)
                .map(this::toMap)
                .collect(Collectors.toList());
    }

    @PostMapping
    public ResponseEntity<?> create(@PathVariable Long incId,
                                    @RequestBody Map<String, Object> body) {
        User inc = userRepo.findById(incId)
                .orElseThrow(() -> new RuntimeException("User non trouvé : " + incId));

        Evenement e = Evenement.builder()
                .titre((String) body.get("titre"))
                .type((String) body.get("type"))
                .date((String) body.get("date"))
                .heureDebut((String) body.get("heureDebut"))
                .heureFin((String) body.get("heureFin"))
                .lieu((String) body.get("lieu"))
                .satisfactionActive(Boolean.TRUE.equals(body.get("satisfactionActive")))
                .incubateur(inc)
                .build();

        e = evenementRepo.save(e);
        return ResponseEntity.ok(toMap(e));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long incId, @PathVariable Long id) {
        evenementRepo.deleteById(id);
        return ResponseEntity.ok(Map.of("deleted", id));
    }

    private Map<String, Object> toMap(Evenement e) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",               e.getId());
        m.put("titre",            e.getTitre());
        m.put("type",             e.getType());
        m.put("typeLabel",        getTypeLabel(e.getType()));
        m.put("heureDebut",       e.getHeureDebut());
        m.put("heureFin",         e.getHeureFin());
        m.put("lieu",             e.getLieu());
        m.put("satisfactionActive", Boolean.TRUE.equals(e.getSatisfactionActive()));
        // Extraire day/month depuis la date String "yyyy-MM-dd"
        String date = e.getDate();
        if (date != null && date.length() == 10) {
            try {
                int month = Integer.parseInt(date.substring(5, 7));
                int day   = Integer.parseInt(date.substring(8, 10));
                m.put("date",  date);
                m.put("day",   String.valueOf(day));
                m.put("month", MONTHS[month - 1]);
            } catch (Exception ex) {
                m.put("date", date); m.put("day", ""); m.put("month", "");
            }
        } else {
            m.put("date", date); m.put("day", ""); m.put("month", "");
        }
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
}