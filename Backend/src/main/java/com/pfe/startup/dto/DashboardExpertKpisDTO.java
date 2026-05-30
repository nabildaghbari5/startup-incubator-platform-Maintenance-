package com.pfe.startup.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardExpertKpisDTO {
    /** Projets en attente d'évaluation (EN_ATTENTE ou EN_COURS_ANALYSE) */
    private int projetsEnAttente;
    /** Documents sans note */
    private int documentsEnAttente;
    /** Documents notés durant le mois en cours */
    private int documentsEvaluesMois;
    /** Moyenne des notes sur tous les documents évalués */
    private int scoreMoyenDocuments;
    /** Total des documents déjà notés */
    private int documentsNotesTotal;
}
