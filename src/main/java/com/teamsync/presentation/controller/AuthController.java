package com.teamsync.presentation.controller;

import com.teamsync.presentation.dto.AuthResponseDTO;
import com.teamsync.presentation.dto.LoginRequestDTO;
import com.teamsync.presentation.dto.UserRequestDTO;
import com.teamsync.presentation.dto.UserResponseDTO;
import com.teamsync.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponseDTO register(@Valid @RequestBody UserRequestDTO request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponseDTO login(@Valid @RequestBody LoginRequestDTO request) {
        return authService.login(request);
    }
}
