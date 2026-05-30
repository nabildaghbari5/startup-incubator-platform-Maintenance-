package com.pfe.startup.dto;

import lombok.*;

import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardExpertSnapshotDTO {
    private DashboardExpertKpisDTO kpis;
    private List<Map<String, Object>> projetsEnAttente;
    private List<Map<String, Object>> documentsEnAttente;
    private DashboardActiviteMensuelleDTO activiteMensuelle;
}
