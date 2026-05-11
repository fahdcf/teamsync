package com.teamsync.presentation.controller;

import com.teamsync.presentation.dto.UpdateUsernameRequestDTO;
import com.teamsync.presentation.dto.UserResponseDTO;
import com.teamsync.service.UserService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public UserResponseDTO getCurrentUser(Authentication auth) {
        return userService.getCurrentUser(auth.getName());
    }

    @PutMapping("/me")
    public UserResponseDTO updateUsername(@Valid @RequestBody UpdateUsernameRequestDTO request,
                                          Authentication auth) {
        return userService.updateUsername(auth.getName(), request.getUsername());
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserResponseDTO> getAllUsers() {
        return userService.getAllUsers();
    }
}
