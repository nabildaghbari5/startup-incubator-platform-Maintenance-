package com.pfe.startup.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PhaseDTO {
    private Long    id;
    private Integer numero;
    private String  mois;
    private String  titre;
    private String  icone;
    private String  description;
    private String  couleur;
}