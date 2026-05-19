package com.pfe.startup.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "phases")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Phase {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Integer numero;
    private String  mois;
    private String  titre;
    private String  icone;
    private String  couleur;

    @Column(length = 3000)
    private String description;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "incubateur_id")
    private User incubateur;  // ← User au lieu de Incubateur
}