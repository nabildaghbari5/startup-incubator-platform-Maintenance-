package com.pfe.startup.repository;

import com.pfe.startup.entity.Groupe;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface GroupeRepository extends JpaRepository<Groupe, Long> {
    List<Groupe> findByMembresContaining(String email);
}