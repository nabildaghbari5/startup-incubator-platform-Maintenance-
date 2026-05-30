package com.pfe.startup.repository;

import com.pfe.startup.entity.Satisfaction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SatisfactionRepository extends JpaRepository<Satisfaction, Long> {
    List<Satisfaction> findByEvenementId(Long evenementId);

    List<Satisfaction> findByPorteurId(Long porteurId);

    Optional<Satisfaction> findByPorteurIdAndEvenementId(Long porteurId, Long evenementId);

    boolean existsByPorteurIdAndEvenementId(Long porteurId, Long evenementId);
}