package com.pfe.startup.repository;

import com.pfe.startup.entity.IncubateurDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IncubateurDocumentRepository extends JpaRepository<IncubateurDocument, Long> {

    List<IncubateurDocument> findByIncubateurIdOrderByUploadedAtDesc(Long incubateurId);

    List<IncubateurDocument> findByIncubateurIdAndStatutOrderByUploadedAtDesc(Long incubateurId, String statut);
}
