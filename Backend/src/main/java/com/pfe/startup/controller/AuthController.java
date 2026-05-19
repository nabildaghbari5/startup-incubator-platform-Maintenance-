package com.pfe.startup.controller;

import com.pfe.startup.entity.Role;
import com.pfe.startup.entity.User;
import com.pfe.startup.security.JwtService;
import com.pfe.startup.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin("*")
public class AuthController {

    private final UserService     userService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService      jwtService;

    @PostMapping("/register")
    public Map<String, Object> register(@RequestBody User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        if (user.getRole() == null) user.setRole(Role.PORTEUR);
        user.setStatut("");
        User saved = userService.save(user);
        return buildResponse(jwtService.generateToken(saved), saved);
    }

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody User request) {
        User user = userService.findByEmail(request.getEmail());
        if (user == null)
            throw new RuntimeException("Utilisateur introuvable");
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword()))
            throw new RuntimeException("Mot de passe incorrect");
        return buildResponse(jwtService.generateToken(user), user);
    }

    private Map<String, Object> buildResponse(String token, User user) {
        // userId au niveau racine pour le frontend Angular (localStorage.setItem('userId', res.userId))
        // user imbriqué pour compatibilité avec res.user.email, res.user.role, etc.
        Map<String, Object> userMap = new HashMap<>();
        userMap.put("id",    user.getId());
        userMap.put("email", user.getEmail() != null ? user.getEmail() : "");
        userMap.put("nom",   user.getNom()   != null ? user.getNom()   : "");
        userMap.put("role",  user.getRole()  != null ? user.getRole().name() : "PORTEUR");

        Map<String, Object> response = new HashMap<>();
        response.put("token",  token);
        response.put("userId", user.getId());   // ← pour localStorage.setItem('userId', res.userId)
        response.put("user",   userMap);         // ← pour res.user.email, res.user.role
        return response;
    }
}