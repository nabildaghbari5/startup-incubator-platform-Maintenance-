package com.pfe.startup.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "projets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Projet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Titre du projet proposé
     */
    @Column(nullable = false)
    private String titre;

    /**
     * Description détaillée du projet
     */
    @Column(length = 5000, nullable = false)
    private String description;
    private String secteur ;
    /**
     * Statut de traitement du projet
     */
    @Enumerated(EnumType.STRING)
    private StatutProjet statut;

    /**
     * Commentaire de l’évaluateur
     */
    @Column(length = 3000)
    private String commentaire;

    /**
     * Date de soumission
     */
    private LocalDateTime dateSoumission;

    /**
     * Date de validation ou rejet
     */
    private LocalDateTime dateTraitement;

    /**
     * Indique si le projet est validé comme startup
     */
    private Boolean startupValidee;

    /**
     * Porteur du projet
     */
    @ManyToOne
    @JoinColumn(name = "porteur_id", nullable = false)
    private User porteur;


}