package com.pfe.startup.repository;

import com.pfe.startup.entity.Phase;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PhaseRepository extends JpaRepository<Phase, Long> {
    List<Phase> findByIncubateurIdOrderByNumeroAsc(Long incubateurId);
}