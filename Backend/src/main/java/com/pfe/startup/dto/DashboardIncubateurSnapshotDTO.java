package com.pfe.startup.dto;

import lombok.*;

import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardIncubateurSnapshotDTO {
    private DashboardIncubateurKpisDTO kpis;
    private List<Map<String, Object>> secteurs;
    private List<DashboardProjetDTO> projetsRecents;
    private List<DashboardEvenementDTO> evenementsProchains;
    private List<Map<String, Object>> activitesRecentes;
    private List<Map<String, Object>> satisfactionsRecentes;
    private DashboardActiviteMensuelleDTO activiteMensuelle;
}
