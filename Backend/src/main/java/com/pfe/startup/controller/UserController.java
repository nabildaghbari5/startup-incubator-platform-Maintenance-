package com.pfe.startup.controller;

import com.pfe.startup.entity.User;
import com.pfe.startup.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UserController {

    private final UserService userService;

    @GetMapping
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }

    @GetMapping("/{id}")
    public User getUserById(@PathVariable Long id) {
        return userService.getUserById(id);
    }

    @PutMapping("/status/{id}/{status}")
    public User changeStatus(@PathVariable Long id, @PathVariable String status) {
        return userService.changeStatus(id, status);
    }

    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
    }

    @PutMapping("/profil")
    public ResponseEntity<?> updateProfil(@RequestBody Map<String, Object> payload) {
        try {
            Object userIdObj = payload.get("userId");
            if (userIdObj == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "userId est requis"));
            }
            Long userId = Long.parseLong(userIdObj.toString());
            User updated = userService.updateProfil(userId, payload);
            return ResponseEntity.ok(Map.of(
                    "id", updated.getId(),
                    "nom", updated.getNom(),
                    "prenom", updated.getPrenom(),
                    "email", updated.getEmail()
            ));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping(value = "/photo", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadPhoto(@RequestParam("file") MultipartFile file,
                                         @RequestParam("userId") Long userId) {
        try {
            String path = userService.updatePhoto(userId, file);
            return ResponseEntity.ok(Map.of("profilPhoto", path));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }
}
