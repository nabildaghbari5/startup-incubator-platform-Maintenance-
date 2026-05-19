package com.pfe.startup.repository;

import com.pfe.startup.entity.Satisfaction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SatisfactionRepository extends JpaRepository<Satisfaction, Long> {
    List<Satisfaction> findByEvenementId(Long evenementId);
}