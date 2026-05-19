package com.pfe.startup.controller;

import com.pfe.startup.dto.ProjetRequest;
import com.pfe.startup.entity.Projet;
import com.pfe.startup.entity.StatutProjet;
import com.pfe.startup.service.ProjetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projets")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ProjetController {

    private final ProjetService projetService;

    @PostMapping("/porteur/{porteurId}")
    public ResponseEntity<Projet> ajouterProjet(
            @RequestBody ProjetRequest request,
            @PathVariable Long porteurId
    ) {

        return ResponseEntity.ok(
                projetService.ajouterProjet(request, porteurId)
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<Projet> updateProjet(
            @PathVariable Long id,
            @RequestBody ProjetRequest request
    ) {

        return ResponseEntity.ok(
                projetService.updateProjet(id, request)
        );
    }

    @PutMapping("/{id}/statut")
    public ResponseEntity<Projet> changerStatutProjet(

            @PathVariable Long id,

            @RequestBody StatutProjet statut

    ) {

        return ResponseEntity.ok(

                projetService.changerStatutProjet(
                        id,
                        statut
                )

        );

    }
    @GetMapping
    public ResponseEntity<List<Projet>> findAll( ) {

        return ResponseEntity.ok(
                projetService.findAll()
        );
    }
    @GetMapping("/mes-projets/{porteurId}")
    public ResponseEntity<List<Projet>> mesProjets(
            @PathVariable Long porteurId
    ) {

        return ResponseEntity.ok(
                projetService.recupererMesProjets(porteurId)
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<Projet> getProjet(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                projetService.recupererProjet(id)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimerProjet(
            @PathVariable Long id
    ) {

        projetService.supprimerProjet(id);

        return ResponseEntity.noContent().build();
    }
}