package com.pfe.startup.repository;

import com.pfe.startup.entity.Incubateur;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IncubateurRepository extends JpaRepository<Incubateur, Long> {
}