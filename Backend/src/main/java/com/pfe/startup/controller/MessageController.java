package com.pfe.startup.controller;

import com.pfe.startup.entity.Groupe;
import com.pfe.startup.entity.Message;
import com.pfe.startup.entity.User;
import com.pfe.startup.repository.GroupeRepository;
import com.pfe.startup.repository.MessageRepository;
import com.pfe.startup.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageRepository msgRepo;
    private final GroupeRepository  groupeRepo;
    private final UserRepository    userRepo;

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd/MM HH:mm");

    @GetMapping("/users")
    public List<Map<String, Object>> users() {
        return userRepo.findAllByOrderByNomAsc().stream()
                .map(this::userToMap).collect(Collectors.toList());
    }

    @GetMapping("/contacts")
    public List<String> contacts() {
        return msgRepo.findContacts(currentEmail());
    }

    @GetMapping("/unread")
    public Map<String, Object> unread() {
        long count = msgRepo.countByReceiverAndLuFalse(currentEmail());
        return Map.of("count", count);
    }

    @GetMapping("/conversation")
    public List<Map<String, Object>> conversation(@RequestParam("with") String with) {
        return msgRepo.findConversation(currentEmail(), with)
                .stream().map(this::msgToMap).collect(Collectors.toList());
    }

    @PostMapping("/send")
    public ResponseEntity<?> send(@RequestBody Map<String, String> body) {
        Message m = Message.builder()
                .sender(currentEmail())
                .receiver(body.get("receiver"))
                .content(body.get("content"))
                .type("PRIVATE")
                .lu(false)
                .sentAt(LocalDateTime.now())
                .build();
        return ResponseEntity.ok(msgToMap(msgRepo.save(m)));
    }

    @DeleteMapping("/conversation")
    public ResponseEntity<?> deleteConv(@RequestParam("with") String with) {
        msgRepo.deleteConversation(currentEmail(), with);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @GetMapping("/groupes")
    public List<Map<String, Object>> groupes() {
        return groupeRepo.findByMembresContaining(currentEmail())
                .stream().map(this::groupeToMap).collect(Collectors.toList());
    }

    @PostMapping("/groupes")
    public ResponseEntity<?> createGroupe(@RequestBody Map<String, Object> body) {
        String me = currentEmail();
        List<String> membres = (List<String>) body.get("membres");
        if (membres == null) membres = new ArrayList<>();
        if (!membres.contains(me)) membres.add(me);

        Groupe g = Groupe.builder()
                .nom((String) body.get("nom"))
                .membres(membres)
                .createdAt(LocalDateTime.now())
                .build();
        return ResponseEntity.ok(groupeToMap(groupeRepo.save(g)));
    }

    @GetMapping("/groupe/{groupeId}")
    public List<Map<String, Object>> groupeMessages(@PathVariable Long groupeId) {
        return msgRepo.findByGroupeIdOrderBySentAtAsc(groupeId)
                .stream().map(this::msgToMap).collect(Collectors.toList());
    }

    @PostMapping("/groupe/{groupeId}/send")
    public ResponseEntity<?> sendGroupe(@PathVariable Long groupeId,
                                        @RequestBody Map<String, String> body) {
        Groupe groupe = groupeRepo.findById(groupeId).orElse(null);
        Message m = Message.builder()
                .sender(currentEmail())
                .groupe(groupe)
                .content(body.get("content"))
                .type("GROUP")
                .lu(false)
                .sentAt(LocalDateTime.now())
                .build();
        return ResponseEntity.ok(msgToMap(msgRepo.save(m)));
    }

    private String currentEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    private Map<String, Object> msgToMap(Message m) {
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("id",       m.getId());
        r.put("sender",   m.getSender());
        r.put("receiver", m.getReceiver());
        r.put("groupId",  m.getGroupe() != null ? m.getGroupe().getId() : null);
        r.put("content",  m.getContent());
        r.put("type",     m.getType());
        r.put("lu",       Boolean.TRUE.equals(m.getLu()));
        r.put("sentAt",   m.getSentAt() != null ? m.getSentAt().format(FMT) : "");
        return r;
    }

    private Map<String, Object> userToMap(User u) {
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("email",       u.getEmail());
        r.put("nom",         u.getNom() != null ? u.getNom() : "");
        r.put("prenom",      "");
        r.put("role",        u.getRole() != null ? u.getRole() : "");
        r.put("profilPhoto", u.getProfilPhoto() != null ? u.getProfilPhoto() : "");
        r.put("unread",      0);
        return r;
    }

    private Map<String, Object> groupeToMap(Groupe g) {
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("id",        g.getId());
        r.put("nom",       g.getNom());
        r.put("membres",   g.getMembres() != null ? g.getMembres() : List.of());
        r.put("createdAt", g.getCreatedAt() != null ? g.getCreatedAt().toString() : "");
        r.put("unread",    0);
        return r;
    }
}