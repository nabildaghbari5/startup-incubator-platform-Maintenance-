package com.pfe.startup.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardSnapshotDTO {
    private DashboardKpisDTO kpis;
    private List<DashboardPhaseDTO> phases;
    private List<DashboardProjetDTO> projets;
    private List<DashboardEvenementDTO> evenements;
    private List<DashboardDocumentDTO> documentsRecents;
    private DashboardActiviteMensuelleDTO activiteMensuelle;
}
