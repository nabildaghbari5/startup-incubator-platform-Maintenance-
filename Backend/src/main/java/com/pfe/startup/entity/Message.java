package com.pfe.startup.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String sender;

    private String receiver;

    @Column(length = 10000)
    private String content;

    private String type;

    private Boolean lu;

    private LocalDateTime sentAt;

    @ManyToOne
    @JoinColumn(name = "group_id")
    private Groupe groupe;
}