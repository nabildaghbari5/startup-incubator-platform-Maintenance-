package com.pfe.startup.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "documents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nom;

    private String type;

    private String taille;

    private String chemin;

    private String statut;

    private Boolean visiblePorteur;

    private LocalDateTime uploadedAt;

    @ManyToOne
    @JoinColumn(name = "startup_id")
    private Startup startup;
}