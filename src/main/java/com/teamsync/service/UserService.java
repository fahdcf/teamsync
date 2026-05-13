package com.teamsync.service;

import com.teamsync.domain.enums.Role;
import com.teamsync.infrastructure.exception.ValidationException;
import com.teamsync.presentation.dto.AccountOverviewResponseDTO;
import com.teamsync.presentation.dto.UpdateProfileRequestDTO;
import com.teamsync.domain.entity.User;
import com.teamsync.presentation.dto.UserResponseDTO;
import com.teamsync.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public UserResponseDTO getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
        return toDTO(user);
    }

    public AccountOverviewResponseDTO getAccountOverview(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));

        List<String> missingFields = new ArrayList<>();
        int completion = 0;

        completion += scoreField(user.getUsername(), "Username", 25, missingFields);
        completion += scoreField(user.getEmail(), "Email", 25, missingFields);
        completion += scoreField(user.getAvatarUrl(), "Avatar", 20, missingFields);
        if (user.getRole() != null) {
            completion += 15;
        } else {
            missingFields.add("Role");
        }
        if (user.getCreatedAt() != null) {
            completion += 15;
        }

        boolean secure = clean(user.getEmail()) != null && clean(user.getPassword()) != null && user.getRole() != null;

        return AccountOverviewResponseDTO.builder()
                .profileCompletion(Math.min(100, completion))
                .securityStatus(secure ? "Secure" : "Needs attention")
                .securityMessage(secure
                        ? "Your account has the required sign-in details."
                        : "Complete the missing sign-in details to improve account security.")
                .missingProfileFields(missingFields)
                .build();
    }

    public UserResponseDTO updateUsername(String email, String newUsername) {
        UpdateProfileRequestDTO request = new UpdateProfileRequestDTO();
        request.setUsername(newUsername);
        return updateProfile(email, request);
    }

    public UserResponseDTO updateProfile(String email, UpdateProfileRequestDTO request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));

        String username = clean(request.getUsername());
        if (request.getUsername() != null && username == null) {
            throw new ValidationException("username", "Username cannot be blank");
        }
        if (username != null && !username.equals(user.getUsername())) {
            userRepository.findByUsername(username)
                    .filter(existing -> !existing.getId().equals(user.getId()))
                    .ifPresent(existing -> {
                        throw new ValidationException("username", "Username already taken: " + username);
                    });
            user.setUsername(username);
        }

        String newEmail = clean(request.getEmail());
        if (request.getEmail() != null && newEmail == null) {
            throw new ValidationException("email", "Email cannot be blank");
        }
        if (newEmail != null && !newEmail.equals(user.getEmail())) {
            userRepository.findByEmail(newEmail)
                    .filter(existing -> !existing.getId().equals(user.getId()))
                    .ifPresent(existing -> {
                        throw new ValidationException("email", "Email already taken: " + newEmail);
                    });
            user.setEmail(newEmail);
        }

        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(clean(request.getAvatarUrl()));
        }

        if (request.getRole() != null && request.getRole() != user.getRole()) {
            if (roleRank(request.getRole()) > roleRank(user.getRole())) {
                throw new AccessDeniedException("Cannot elevate your own role");
            }
            user.setRole(request.getRole());
        }

        return toDTO(userRepository.save(user));
    }

    public List<UserResponseDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }

    private UserResponseDTO toDTO(User user) {
        return UserResponseDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();
    }

    private String clean(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private int scoreField(String value, String label, int score, List<String> missingFields) {
        if (clean(value) != null) {
            return score;
        }
        missingFields.add(label);
        return 0;
    }

    private int roleRank(Role role) {
        return switch (role) {
            case ADMIN -> 3;
            case PROJECT_MANAGER -> 2;
            case TEAM_MEMBER -> 1;
        };
    }
}
