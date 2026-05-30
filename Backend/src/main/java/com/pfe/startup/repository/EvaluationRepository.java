package com.pfe.startup.repository;

import com.pfe.startup.entity.Evaluation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EvaluationRepository extends JpaRepository<Evaluation, Long> {

    List<Evaluation> findByExpertIdOrderByCreatedAtDesc(Long expertId);

    List<Evaluation> findByStartup_Incubateur_IdOrderByCreatedAtDesc(Long incubateurId);

    List<Evaluation> findByProjetIsNotNullOrderByCreatedAtDesc();
}
