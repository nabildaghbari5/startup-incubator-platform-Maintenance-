package com.pfe.startup.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardProjetDTO {
    private Long id;
    private String titre;
    private String description;
    private String secteur;
    private String statut;
    private Boolean startupValidee;
    private String dateSoumission;
}
