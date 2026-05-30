package com.pfe.startup.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardKpisDTO {
    private int phasesCompletees;
    private int phasesTotal;
    private int scoreMoyen;
    private int evenementsMois;
    private int projetsActifs;
    private int tauxParticipation;
    private int prochainRdvJours;
    private String prochainRdvTitre;
}
