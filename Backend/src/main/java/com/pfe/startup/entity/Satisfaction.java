package com.pfe.startup.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "satisfactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Satisfaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Integer note;

    @Column(length = 3000)
    private String commentaire;

    private LocalDateTime createdAt;

    @ManyToOne
    @JoinColumn(name = "event_id")
    private Evenement evenement;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User porteur;
}