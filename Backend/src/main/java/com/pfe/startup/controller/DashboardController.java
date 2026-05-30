package com.pfe.startup.controller;

import com.pfe.startup.dto.DashboardKpisDTO;
import com.pfe.startup.dto.DashboardSnapshotDTO;
import com.pfe.startup.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DashboardController {

    private final DashboardService dashboardService;

    /**
     * Snapshot complet du dashboard porteur (KPIs, phases, projets, événements, documents, activité).
     */
    @GetMapping("/porteur/{porteurId}")
    public ResponseEntity<?> getPorteurSnapshot(@PathVariable Long porteurId) {
        try {
            return ResponseEntity.ok(dashboardService.getPorteurSnapshot(porteurId));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * KPIs uniquement — utile pour un rafraîchissement léger.
     */
    @GetMapping("/porteur/{porteurId}/kpis")
    public ResponseEntity<?> getPorteurKpis(@PathVariable Long porteurId) {
        try {
            DashboardKpisDTO kpis = dashboardService.getPorteurKpis(porteurId);
            return ResponseEntity.ok(kpis);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/incubateur/{incId}")
    public ResponseEntity<?> getIncubateurSnapshot(@PathVariable Long incId) {
        try {
            return ResponseEntity.ok(dashboardService.getIncubateurSnapshot(incId));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/expert/{expertId}")
    public ResponseEntity<?> getExpertSnapshot(@PathVariable Long expertId) {
        try {
            return ResponseEntity.ok(dashboardService.getExpertSnapshot(expertId));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }
}
