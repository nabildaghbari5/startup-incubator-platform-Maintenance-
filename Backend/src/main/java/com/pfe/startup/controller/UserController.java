package com.pfe.startup.controller;

import com.pfe.startup.entity.User;
import com.pfe.startup.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
    public User changeStatus(@PathVariable Long id,
                             @PathVariable String status) {
        return userService.changeStatus(id, status);
    }

    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable Long id) {

        userService.deleteUser(id);
    }
}