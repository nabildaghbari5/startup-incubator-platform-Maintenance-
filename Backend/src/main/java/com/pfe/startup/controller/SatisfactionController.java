package com.pfe.startup.controller;

import com.pfe.startup.dto.SatisfactionDTO;
import com.pfe.startup.service.SatisfactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/satisfaction")
@RequiredArgsConstructor
public class SatisfactionController {

    private final SatisfactionService satisfactionService;

    @GetMapping("/porteur/{porteurId}")
    public ResponseEntity<List<SatisfactionDTO>> getByPorteur(@PathVariable Long porteurId) {
        try {
            return ResponseEntity.ok(satisfactionService.getByPorteurId(porteurId));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/porteur/{porteurId}/evenement/{evenementId}")
    public ResponseEntity<SatisfactionDTO> getByPorteurAndEvenement(
            @PathVariable Long porteurId,
            @PathVariable Long evenementId) {
        try {
            return ResponseEntity.ok(satisfactionService.getByPorteurAndEvenement(porteurId, evenementId));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/porteur/{porteurId}/evenement/{evenementId}")
    public ResponseEntity<?> submit(
            @PathVariable Long porteurId,
            @PathVariable Long evenementId,
            @RequestBody Map<String, Object> body) {

        Integer note = body.get("note") instanceof Number n ? n.intValue() : null;
        String commentaire = body.get("commentaire") != null ? body.get("commentaire").toString() : null;

        try {
            return ResponseEntity.ok(satisfactionService.submit(porteurId, evenementId, note, commentaire));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
