package com.pfe.startup.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardIncubateurKpisDTO {
    private int totalProjets;
    private int projetsEnAttente;
    private int projetsAcceptes;
    private int projetsRefuses;
    private int tauxAcceptation;
    private int evenementsMois;
    private int satisfactionsRecues;
    private int noteSatisfactionMoyenne;
    private int documentsEnAttente;
    private int prochainRdvJours;
    private String prochainRdvTitre;
}
