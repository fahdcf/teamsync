package com.teamsync.presentation.controller;

import com.teamsync.presentation.dto.AccountOverviewResponseDTO;
import com.teamsync.presentation.dto.ChangePasswordRequestDTO;
import com.teamsync.presentation.dto.SecurityOverviewResponseDTO;
import com.teamsync.presentation.dto.UpdateProfileRequestDTO;
import com.teamsync.presentation.dto.UpdateUserPreferencesRequestDTO;
import com.teamsync.presentation.dto.UserPreferencesResponseDTO;
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

    @Operation(summary = "Get current authenticated user's account overview")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Account overview returned"),
        @ApiResponse(responseCode = "401", description = "Not authenticated")
    })
    @GetMapping("/me/account-overview")
    public AccountOverviewResponseDTO getCurrentUserAccountOverview(Authentication auth) {
        return userService.getAccountOverview(auth.getName());
    }

    @Operation(summary = "Get current user's settings preferences")
    @ApiResponse(responseCode = "200", description = "Preferences returned")
    @GetMapping("/me/preferences")
    public UserPreferencesResponseDTO getCurrentUserPreferences(Authentication auth) {
        return userService.getPreferences(auth.getName());
    }

    @Operation(summary = "Update current user's settings preferences")
    @ApiResponse(responseCode = "200", description = "Preferences updated")
    @PutMapping("/me/preferences")
    public UserPreferencesResponseDTO updateCurrentUserPreferences(@RequestBody UpdateUserPreferencesRequestDTO request,
                                                                   Authentication auth) {
        return userService.updatePreferences(auth.getName(), request);
    }

    @Operation(summary = "Get current user's security overview")
    @ApiResponse(responseCode = "200", description = "Security overview returned")
    @GetMapping("/me/security")
    public SecurityOverviewResponseDTO getCurrentUserSecurity(Authentication auth) {
        return userService.getSecurityOverview(auth.getName());
    }

    @Operation(summary = "Change current user's password")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Password changed"),
        @ApiResponse(responseCode = "400", description = "Current password is invalid or new password is weak")
    })
    @PutMapping("/me/password")
    @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    public void changeCurrentUserPassword(@Valid @RequestBody ChangePasswordRequestDTO request,
                                          Authentication auth) {
        userService.changePassword(auth.getName(), request);
    }

    @Operation(summary = "Update current user's profile")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Username updated"),
        @ApiResponse(responseCode = "400", description = "Username already taken or blank")
    })
    @PutMapping("/me")
    public UserResponseDTO updateProfile(@Valid @RequestBody UpdateProfileRequestDTO request,
                                          Authentication auth) {
        return userService.updateProfile(auth.getName(), request);
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
