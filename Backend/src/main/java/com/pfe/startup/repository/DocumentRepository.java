package com.pfe.startup.repository;

import com.pfe.startup.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DocumentRepository extends JpaRepository<Document, Long> {

    Optional<Document> findByPorteurIdAndPhaseId(Long porteurId, Long phaseId);

    List<Document> findByPhase_Id(Long phaseId);
}
