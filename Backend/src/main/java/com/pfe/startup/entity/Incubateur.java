package com.pfe.startup.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "incubateurs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Incubateur {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nom;
    private String email;
    private String telephone;
    private String adresse;
    private String nomOrganisation;
    private String secteurPrincipal;
    private Integer nbStartup;

    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;
}