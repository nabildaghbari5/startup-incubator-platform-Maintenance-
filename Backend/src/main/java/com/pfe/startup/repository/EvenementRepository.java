package com.pfe.startup.repository;

import com.pfe.startup.entity.Evenement;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EvenementRepository extends JpaRepository<Evenement, Long> {
    // date est un String "yyyy-MM-dd", tri alphabétique = tri chronologique
    List<Evenement> findByIncubateurIdOrderByDateAsc(Long incubateurId);
}