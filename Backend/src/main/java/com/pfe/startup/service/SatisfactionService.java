package com.pfe.startup.service;

import com.pfe.startup.dto.SatisfactionDTO;
import com.pfe.startup.entity.Evenement;
import com.pfe.startup.entity.Satisfaction;
import com.pfe.startup.entity.User;
import com.pfe.startup.repository.EvenementRepository;
import com.pfe.startup.repository.SatisfactionRepository;
import com.pfe.startup.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class SatisfactionService {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final SatisfactionRepository satisfactionRepository;
    private final EvenementRepository evenementRepository;
    private final UserRepository userRepository;

    public List<SatisfactionDTO> getByPorteurId(Long porteurId) {
        userRepository.findById(porteurId)
                .orElseThrow(() -> new NoSuchElementException("Porteur introuvable id=" + porteurId));

        return satisfactionRepository.findByPorteurId(porteurId).stream()
                .map(this::toDto)
                .toList();
    }

    public SatisfactionDTO getByPorteurAndEvenement(Long porteurId, Long evenementId) {
        return satisfactionRepository.findByPorteurIdAndEvenementId(porteurId, evenementId)
                .map(this::toDto)
                .orElseThrow(() -> new NoSuchElementException(
                        "Satisfaction introuvable pour porteur=" + porteurId + " et événement=" + evenementId));
    }

    @Transactional
    public SatisfactionDTO submit(Long porteurId, Long evenementId, Integer note, String commentaire) {
        if (note == null || note < 1 || note > 5) {
            throw new IllegalArgumentException("La note doit être comprise entre 1 et 5");
        }

        User porteur = userRepository.findById(porteurId)
                .orElseThrow(() -> new NoSuchElementException("Porteur introuvable id=" + porteurId));

        Evenement evenement = evenementRepository.findById(evenementId)
                .orElseThrow(() -> new NoSuchElementException("Événement introuvable id=" + evenementId));

        if (!Boolean.TRUE.equals(evenement.getSatisfactionActive())) {
            throw new IllegalStateException("La satisfaction n'est pas activée pour cet événement");
        }

        Satisfaction satisfaction = satisfactionRepository
                .findByPorteurIdAndEvenementId(porteurId, evenementId)
                .orElse(null);

        if (satisfaction != null) {
            satisfaction.setNote(note);
            satisfaction.setCommentaire(commentaire);
        } else {
            satisfaction = Satisfaction.builder()
                    .note(note)
                    .commentaire(commentaire)
                    .createdAt(LocalDateTime.now())
                    .porteur(porteur)
                    .evenement(evenement)
                    .build();
        }

        return toDto(satisfactionRepository.save(satisfaction));
    }

    private SatisfactionDTO toDto(Satisfaction s) {
        return SatisfactionDTO.builder()
                .id(s.getId())
                .evenementId(s.getEvenement() != null ? s.getEvenement().getId() : null)
                .evenementTitre(s.getEvenement() != null ? s.getEvenement().getTitre() : "")
                .note(s.getNote())
                .commentaire(s.getCommentaire())
                .createdAt(s.getCreatedAt() != null ? s.getCreatedAt().format(FMT) : "")
                .porteurEmail(s.getPorteur() != null ? s.getPorteur().getEmail() : "")
                .build();
    }
}
