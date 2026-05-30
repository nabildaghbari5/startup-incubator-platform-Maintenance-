package com.pfe.startup.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardExpertKpisDTO {
    private int totalEvaluations;
    private int scoreMoyen;
    private int projetsEnAttente;
    private int documentsEnAttente;
    private int documentsEvaluesMois;
    private int scoreMoyenDocuments;
}
