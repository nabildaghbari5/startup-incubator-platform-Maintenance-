package com.pfe.startup.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardEvenementDTO {
    private Long id;
    private String titre;
    private String type;
    private String typeLabel;
    private String date;
    private String day;
    private String month;
    private String heureDebut;
    private String heureFin;
    private String lieu;
    private Boolean satisfactionActive;
}
