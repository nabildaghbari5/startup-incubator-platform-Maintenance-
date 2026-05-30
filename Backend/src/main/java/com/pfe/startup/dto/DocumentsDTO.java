package com.pfe.startup.dto;

import com.pfe.startup.entity.Phase;
import com.pfe.startup.entity.User;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Builder
@Getter
@Setter
public class DocumentsDTO {
    private Long id;
    private byte[] document;
    private String fileName;
    private String fileType;
    private LocalDateTime uploadedAt;
    private Integer score;
    private String statut;
    private Phase phase;
    private User porteur;
}
