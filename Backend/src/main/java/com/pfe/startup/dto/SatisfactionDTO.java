package com.pfe.startup.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Builder
@Getter
@Setter
public class SatisfactionDTO {
    private Long id;
    private Long evenementId;
    private String evenementTitre;
    private Integer note;
    private String commentaire;
    private String createdAt;
    private String porteurEmail;
}
