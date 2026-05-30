package com.pfe.startup.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EvaluationDTO {
    private Long id;
    private Integer scoreIA;
    private Integer scoreMarket;
    private Integer scoreTeam;
    private Integer scoreTech;
    private Integer scoreFinance;
    private String commentaire;
    private String statut;
    private String createdAt;
    private Long startupId;
    private String startupNom;
    private Long projetId;
    private String projetTitre;
    private String evaluateur;
}
