package com.pfe.startup.service;

import com.pfe.startup.dto.ProjetRequest;
import com.pfe.startup.entity.Projet;
import com.pfe.startup.entity.StatutProjet;
import com.pfe.startup.entity.User;
import com.pfe.startup.repository.ProjetRepository;
import com.pfe.startup.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjetService {

     private final ProjetRepository projetRepository;

     private final UserRepository userRepository;

     public Projet ajouterProjet(ProjetRequest request, Long porteurId) {

          User porteur = userRepository.findById(porteurId)
                  .orElseThrow(() -> new RuntimeException("Porteur introuvable"));

          Projet projet = Projet.builder()
                  .titre(request.getTitre())
                  .description(request.getDescription())
                  .secteur(request.getSecteur())
                  .statut(StatutProjet.EN_ATTENTE)
                  .dateSoumission(LocalDateTime.now())
                  .startupValidee(false)
                  .porteur(porteur)
                  .build();

          return projetRepository.save(projet);
     }

     public List<Projet> recupererMesProjets(Long porteurId) {

          return projetRepository.findByPorteurId(porteurId);
     }

     public Projet recupererProjet(Long id) {

          return projetRepository.findById(id)
                  .orElseThrow(() -> new RuntimeException("Projet introuvable"));
     }

     public void supprimerProjet(Long id) {

          Projet projet = recupererProjet(id);

          projetRepository.delete(projet);
     }

     @Transactional
     public Projet updateProjet(Long id, ProjetRequest request) {

          Projet projet = projetRepository.findById(id)
                  .orElseThrow(() -> new RuntimeException("Projet introuvable"));

          if (request.getTitre() != null) {
               projet.setTitre(request.getTitre());
          }

          if (request.getDescription() != null) {
               projet.setDescription(request.getDescription());
          }

          if (request.getSecteur() != null) {
               projet.setSecteur(request.getSecteur());
          }

          return projetRepository.save(projet);
     }

     public List<Projet> findAll() {
          return projetRepository.findAll();
     }

     public Projet changerStatutProjet(
             Long id,
             StatutProjet statut
     ) {

          Projet projet = projetRepository
                  .findById(id)
                  .orElseThrow();

          projet.setStatut(statut);

          projet.setDateTraitement(
                  LocalDateTime.now()
          );

          if (statut == StatutProjet.ACCEPTE) {

               projet.setStartupValidee(true);

          } else {

               projet.setStartupValidee(false);

          }

          return projetRepository.save(projet);

     }
}