package com.pfe.startup.controller;

import com.pfe.startup.entity.Phase;
import com.pfe.startup.entity.User;
import com.pfe.startup.repository.PhaseRepository;
import com.pfe.startup.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/phases")
@RequiredArgsConstructor
public class PhaseController {

    private final PhaseRepository phaseRepo;

    private final UserRepository userRepo;

    // GET /api/phases/incubateur/{incId}

    @GetMapping
    public ResponseEntity<?> findAllPhases(
    ) {

        List<Phase> phases =
                phaseRepo
                        .findAll();

        return ResponseEntity.ok(

                phases.stream()
                        .map(this::toMap)
                        .collect(Collectors.toList())

        );

    }

    @GetMapping("/incubateur/{incId}")
    public ResponseEntity<List<Map<String, Object>>> list(
            @PathVariable Long incId
    ) {

        List<Phase> phases =
                phaseRepo
                        .findByIncubateurIdOrderByNumeroAsc(incId);

        return ResponseEntity.ok(

                phases.stream()
                        .map(this::toMap)
                        .collect(Collectors.toList())

        );

    }

    // POST /api/phases/incubateur/{incId}

    @PostMapping("/incubateur/{incId}")
    public ResponseEntity<?> create(

            @PathVariable Long incId,

            @RequestBody Map<String, Object> body

    ) {

        User incubateur = userRepo
                .findById(incId)
                .orElse(null);

        if (incubateur == null) {

            return ResponseEntity
                    .badRequest()
                    .body(

                            Map.of(
                                    "error",
                                    "Incubateur introuvable id=" + incId
                            )

                    );

        }

        Phase phase = Phase.builder()

                .titre(str(body, "titre"))

                .mois(str(body, "mois"))

                .icone(
                        str(body, "icone") != null
                                ? str(body, "icone")
                                : "📌"
                )

                .description(str(body, "description"))

                .couleur(
                        str(body, "couleur") != null
                                ? str(body, "couleur")
                                : "#ec4899"
                )

                .numero(toInt(body.get("numero")))

                .incubateur(incubateur)

                .build();

        phase = phaseRepo.save(phase);

        return ResponseEntity.ok(
                toMap(phase)
        );

    }

    // PUT /api/phases/{id}

    @PutMapping("/{id}")
    public ResponseEntity<?> update(

            @PathVariable Long id,

            @RequestBody Map<String, Object> body

    ) {

        Phase phase = phaseRepo
                .findById(id)
                .orElse(null);

        if (phase == null) {

            return ResponseEntity
                    .notFound()
                    .build();

        }

        if (body.containsKey("titre")) {
            phase.setTitre(str(body, "titre"));
        }

        if (body.containsKey("mois")) {
            phase.setMois(str(body, "mois"));
        }

        if (body.containsKey("icone")) {
            phase.setIcone(str(body, "icone"));
        }

        if (body.containsKey("description")) {
            phase.setDescription(
                    str(body, "description")
            );
        }

        if (body.containsKey("couleur")) {
            phase.setCouleur(
                    str(body, "couleur")
            );
        }

        if (body.containsKey("numero")) {
            phase.setNumero(
                    toInt(body.get("numero"))
            );
        }

        phase = phaseRepo.save(phase);

        return ResponseEntity.ok(
                toMap(phase)
        );

    }

    // DELETE /api/phases/{id}

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(
            @PathVariable Long id
    ) {

        if (!phaseRepo.existsById(id)) {

            return ResponseEntity
                    .notFound()
                    .build();

        }

        phaseRepo.deleteById(id);

        return ResponseEntity.ok(
                Map.of("deleted", id)
        );

    }

    // PATCH /api/phases/{id}/move?direction=up|down

    @PatchMapping("/{id}/move")
    public ResponseEntity<?> move(

            @PathVariable Long id,

            @RequestParam String direction

    ) {

        Phase current = phaseRepo
                .findById(id)
                .orElse(null);

        if (current == null) {

            return ResponseEntity
                    .notFound()
                    .build();

        }

        Long incId =
                current.getIncubateur().getId();

        List<Phase> phases =
                phaseRepo
                        .findByIncubateurIdOrderByNumeroAsc(
                                incId
                        );

        int idx = -1;

        for (int i = 0; i < phases.size(); i++) {

            if (phases.get(i)
                    .getId()
                    .equals(id)) {

                idx = i;

                break;

            }

        }

        if (idx == -1) {

            return ResponseEntity
                    .notFound()
                    .build();

        }

        int target =
                "up".equals(direction)
                        ? idx - 1
                        : idx + 1;

        if (target < 0 ||
                target >= phases.size()) {

            return ResponseEntity
                    .badRequest()
                    .body(

                            Map.of(
                                    "error",
                                    "Déplacement impossible"
                            )

                    );

        }

        Phase a = phases.get(idx);

        Phase b = phases.get(target);

        int tmp = a.getNumero();

        a.setNumero(b.getNumero());

        b.setNumero(tmp);

        phaseRepo.saveAll(List.of(a, b));

        List<Map<String, Object>> updated =

                phaseRepo
                        .findByIncubateurIdOrderByNumeroAsc(
                                incId
                        )
                        .stream()
                        .map(this::toMap)
                        .collect(Collectors.toList());

        return ResponseEntity.ok(updated);

    }

    // ── HELPERS ───────────────────────────

    private Map<String, Object> toMap(Phase p) {

        Map<String, Object> m =
                new LinkedHashMap<>();

        m.put("id", p.getId());

        m.put("numero", p.getNumero());

        m.put("mois", p.getMois());

        m.put("titre", p.getTitre());

        m.put(
                "icone",

                p.getIcone() != null
                        ? p.getIcone()
                        : "📌"
        );

        m.put(
                "description",

                p.getDescription() != null
                        ? p.getDescription()
                        : ""
        );

        m.put(
                "couleur",

                p.getCouleur() != null
                        ? p.getCouleur()
                        : "#ec4899"
        );

        return m;

    }

    private String str(
            Map<String, Object> m,
            String key
    ) {

        Object v = m.get(key);

        return v != null
                ? v.toString()
                : null;

    }

    private int toInt(Object o) {

        if (o == null) {
            return 1;
        }

        if (o instanceof Integer) {
            return (Integer) o;
        }

        if (o instanceof Number) {
            return ((Number) o).intValue();
        }

        try {

            return Integer.parseInt(
                    o.toString()
            );

        } catch (Exception e) {

            return 1;

        }

    }



}