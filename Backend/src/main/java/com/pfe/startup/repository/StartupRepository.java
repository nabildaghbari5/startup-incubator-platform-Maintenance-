package com.pfe.startup.repository;

import com.pfe.startup.entity.Startup;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StartupRepository extends JpaRepository<Startup, Long> {
    List<Startup> findByIncubateurIdOrderByNomAsc(Long incubateurId);
}