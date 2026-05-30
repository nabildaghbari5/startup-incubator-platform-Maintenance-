package com.pfe.startup.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardDocumentDTO {
    private Long id;
    private String nom;
    private String type;
    private String taille;
    private String statut;
    private String uploadedAt;
}
