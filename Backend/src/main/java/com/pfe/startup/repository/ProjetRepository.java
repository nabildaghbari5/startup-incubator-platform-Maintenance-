package com.pfe.startup.repository;

import com.pfe.startup.entity.Projet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjetRepository extends JpaRepository<Projet , Long> {
    List<Projet> findByPorteurId(Long porteurId);

}
