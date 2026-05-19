package com.pfe.startup.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "startups")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Startup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nom;

    private String fondateur;

    private String secteur;

    private String phase;

    private Integer progress;

    private Integer aiScore;

    private String statut;

    @Column(length = 5000)
    private String description;

    @ManyToOne
    @JoinColumn(name = "incubateur_id")
    private User incubateur;
}