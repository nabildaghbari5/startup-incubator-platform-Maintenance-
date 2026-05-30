package com.pfe.startup.controller;

import com.pfe.startup.dto.EvaluationDTO;
import com.pfe.startup.service.EvaluationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/evaluations")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class EvaluationController {

    private final EvaluationService evaluationService;

    @GetMapping("/expert/{expertId}")
    public ResponseEntity<?> getByExpert(@PathVariable Long expertId) {
        try {
            List<EvaluationDTO> list = evaluationService.findByExpert(expertId);
            return ResponseEntity.ok(list);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/expert/{expertId}")
    public ResponseEntity<?> createForExpert(@PathVariable Long expertId,
                                             @RequestBody Map<String, Object> body) {
        try {
            return ResponseEntity.ok(evaluationService.createForExpert(expertId, body));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            evaluationService.delete(id);
            return ResponseEntity.ok(Map.of("deleted", id));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
