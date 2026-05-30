package com.pfe.startup.service;

import com.pfe.startup.entity.User;
import com.pfe.startup.file.FileStorageService;
import com.pfe.startup.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

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

    public User updateProfil(Long userId, Map<String, Object> payload) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("Utilisateur introuvable id=" + userId));

        if (payload.containsKey("nom")) user.setNom(str(payload.get("nom")));
        if (payload.containsKey("prenom")) user.setPrenom(str(payload.get("prenom")));
        if (payload.containsKey("email")) user.setEmail(str(payload.get("email")));

        return userRepository.save(user);
    }

    public String updatePhoto(Long userId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Le fichier photo est requis");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("Utilisateur introuvable id=" + userId));

        String storedPath = fileStorageService.saveFile(file, String.valueOf(userId), "profiles");
        if (storedPath == null) {
            throw new IllegalStateException("Échec de l'enregistrement de la photo");
        }
        user.setProfilPhoto(storedPath);
        userRepository.save(user);
        return storedPath;
    }

    private String str(Object o) {
        return o != null ? o.toString() : null;
    }
}