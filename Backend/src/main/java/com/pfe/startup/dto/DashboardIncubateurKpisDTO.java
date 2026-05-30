package com.pfe.startup.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardIncubateurKpisDTO {
    private int totalStartups;
    private int startupsActives;
    private int startupsEnAttente;
    private int startupsTerminees;
    private int scoreIAMoyen;
    private int evenementsMois;
    private int satisfactionsRecues;
    private int noteSatisfactionMoyenne;
    private int documentsEnAttente;
    private int projetsEnAttente;
    private int prochainRdvJours;
    private String prochainRdvTitre;
}
