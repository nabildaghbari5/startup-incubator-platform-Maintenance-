package com.pfe.startup.service;

import com.pfe.startup.entity.Evenement;
import com.pfe.startup.repository.EvenementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EvenementService {

    private final EvenementRepository evenementRepository;

    public Evenement save(Evenement evenement) {
        return evenementRepository.save(evenement);
    }

    public List<Evenement> getAll() {
        return evenementRepository.findAll();
    }

    public void delete(Long id) {
        evenementRepository.deleteById(id);
    }
}