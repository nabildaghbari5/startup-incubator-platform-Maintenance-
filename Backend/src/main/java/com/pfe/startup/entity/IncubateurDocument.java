package com.pfe.startup.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "incubateur_documents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IncubateurDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fileName;
    private String documentUrl;
    private String fileType;
    private String statut;
    private Boolean visiblePorteur;
    private String startupNom;

    private LocalDateTime uploadedAt;

    @ManyToOne
    @JoinColumn(name = "incubateur_id")
    private User incubateur;
}
