package com.pfe.startup.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardActiviteMensuelleDTO {
    private List<String> labels;
    private List<Integer> evenements;
    private List<Integer> documents;
}
