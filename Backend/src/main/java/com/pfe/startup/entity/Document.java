package com.pfe.startup.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fileName;
    private String documentUrl;
    private String fileType;
    private LocalDateTime uploadedAt;

    /** Note attribuée par l'expert (0–100), null si non évalué */
    private Integer score;

    @ManyToOne
    @JoinColumn(name = "porteur_id")
    private User porteur;

    @ManyToOne
    @JoinColumn(name = "phase_id")
    private Phase phase;

}