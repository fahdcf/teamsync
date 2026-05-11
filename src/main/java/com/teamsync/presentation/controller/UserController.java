package com.teamsync.presentation.controller;

import com.teamsync.presentation.dto.UpdateUsernameRequestDTO;
import com.teamsync.presentation.dto.UserResponseDTO;
import com.teamsync.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Users", description = "User profile management")
@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @Operation(summary = "Get current authenticated user's profile")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Profile returned"),
        @ApiResponse(responseCode = "401", description = "Not authenticated")
    })
    @GetMapping("/me")
    public UserResponseDTO getCurrentUser(Authentication auth) {
        return userService.getCurrentUser(auth.getName());
    }

    @Operation(summary = "Update current user's username")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Username updated"),
        @ApiResponse(responseCode = "400", description = "Username already taken or blank")
    })
    @PutMapping("/me")
    public UserResponseDTO updateUsername(@Valid @RequestBody UpdateUsernameRequestDTO request,
                                          Authentication auth) {
        return userService.updateUsername(auth.getName(), request.getUsername());
    }

    @Operation(summary = "List all users (ADMIN only)")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "User list returned"),
        @ApiResponse(responseCode = "403", description = "Requires ADMIN role")
    })
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserResponseDTO> getAllUsers() {
        return userService.getAllUsers();
    }
}
