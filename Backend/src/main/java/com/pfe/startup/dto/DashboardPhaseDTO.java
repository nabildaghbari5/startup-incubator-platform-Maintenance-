package com.pfe.startup.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardPhaseDTO {
    private Long id;
    private Integer numero;
    private String mois;
    private String titre;
    private String icone;
    private String description;
    private String couleur;
    /** termine | en_cours | a_venir */
    private String statut;
    private String fichierNom;
    private Integer score;
    private String documentStatut;
}
