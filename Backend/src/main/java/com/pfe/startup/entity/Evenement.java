package com.pfe.startup.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "evenements")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Evenement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String titre;

    private String type;

    private String date;

    private String heureDebut;

    private String heureFin;

    private String lieu;

    @Column(length = 5000)
    private String description;

    private Boolean satisfactionActive;

    @ManyToOne
    @JoinColumn(name = "incubateur_id")
    private User incubateur;
}