package com.pfe.startup.service;

import com.pfe.startup.dto.PhaseDTO;
import com.pfe.startup.dto.PhaseRequest;
import com.pfe.startup.entity.Phase;
import com.pfe.startup.entity.User;
import com.pfe.startup.repository.PhaseRepository;
import com.pfe.startup.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PhaseService {

    private final PhaseRepository phaseRepo;
    private final UserRepository  userRepo;

    public List<PhaseDTO> getAll(Long incId) {
        return phaseRepo.findByIncubateurIdOrderByNumeroAsc(incId)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public PhaseDTO create(PhaseRequest req, Long incId) {
        User incubateur = userRepo.findById(incId)
                .orElseThrow(() -> new RuntimeException("User non trouvé : " + incId));

        if (req.getTitre() == null || req.getTitre().isBlank())
            throw new RuntimeException("Le titre est requis");

        List<Phase> existing = phaseRepo.findByIncubateurIdOrderByNumeroAsc(incId);
        int    numero = req.getNumero()      != null ? req.getNumero()      : existing.size() + 1;
        String mois   = req.getMois()        != null ? req.getMois()        : "MOIS " + numero;
        String icone  = req.getIcone()       != null ? req.getIcone()       : "📌";
        String couleur= req.getCouleur()     != null ? req.getCouleur()     : "#7c3aed";
        String desc   = req.getDescription() != null ? req.getDescription() : "";

        Phase p = Phase.builder()
                .numero(numero).mois(mois).titre(req.getTitre().trim())
                .icone(icone).description(desc).couleur(couleur)
                .incubateur(incubateur).build();

        return toDTO(phaseRepo.save(p));
    }

    public PhaseDTO update(Long id, PhaseRequest req) {
        Phase p = phaseRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Phase non trouvée : " + id));
        if (req.getTitre()       != null) p.setTitre(req.getTitre().trim());
        if (req.getMois()        != null) p.setMois(req.getMois());
        if (req.getIcone()       != null) p.setIcone(req.getIcone());
        if (req.getDescription() != null) p.setDescription(req.getDescription());
        if (req.getCouleur()     != null) p.setCouleur(req.getCouleur());
        if (req.getNumero()      != null) p.setNumero(req.getNumero());
        return toDTO(phaseRepo.save(p));
    }

    public void delete(Long id, Long incId) {
        phaseRepo.deleteById(id);
        List<Phase> remaining = phaseRepo.findByIncubateurIdOrderByNumeroAsc(incId);
        for (int i = 0; i < remaining.size(); i++) {
            Phase ph = remaining.get(i);
            ph.setNumero(i + 1);
            ph.setMois("MOIS " + (i + 1));
            phaseRepo.save(ph);
        }
    }

    public List<PhaseDTO> move(Long id, String direction, Long incId) {
        List<Phase> phases = phaseRepo.findByIncubateurIdOrderByNumeroAsc(incId);
        int idx = -1;
        for (int i = 0; i < phases.size(); i++)
            if (phases.get(i).getId().equals(id)) { idx = i; break; }
        if (idx == -1) throw new RuntimeException("Phase non trouvée");

        int swapIdx = "up".equals(direction) ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= phases.size()) return getAll(incId);

        Phase a = phases.get(idx), b = phases.get(swapIdx);
        int tmpNum = a.getNumero(); String tmpMois = a.getMois();
        a.setNumero(b.getNumero()); a.setMois(b.getMois());
        b.setNumero(tmpNum);        b.setMois(tmpMois);
        phaseRepo.save(a); phaseRepo.save(b);
        return getAll(incId);
    }

    private PhaseDTO toDTO(Phase p) {
        return PhaseDTO.builder()
                .id(p.getId()).numero(p.getNumero()).mois(p.getMois())
                .titre(p.getTitre()).icone(p.getIcone())
                .description(p.getDescription()).couleur(p.getCouleur())
                .build();
    }
}