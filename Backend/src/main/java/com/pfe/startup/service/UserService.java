package com.pfe.startup.service;

import com.pfe.startup.entity.User;
import com.pfe.startup.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    // =========================
    // TROUVER PAR EMAIL
    // =========================
    public User findByEmail(String email) {

        return userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new UsernameNotFoundException("Utilisateur non trouvé")
                );
    }

    // =========================
    // AJOUTER USER
    // =========================
    public User save(User user) {
        return userRepository.save(user);
    }

    // =========================
    // TOUS LES USERS
    // =========================
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // =========================
    // USER PAR ID
    // =========================
    public User getUserById(Long id) {

        return userRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("User introuvable")
                );
    }

    // =========================
    // SUPPRIMER USER
    // =========================
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }
    public User changeStatus(Long id, String status) {
     User user = userRepository.findById(id)
             .orElseThrow();
     user.setStatut(status);
     return  userRepository.save(user);
    }
}