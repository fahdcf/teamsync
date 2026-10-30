package com.teamsync.service;

import java.util.NoSuchElementException;
import java.util.UUID;
import com.teamsync.enums.Role;
import com.teamsync.exception.ValidationException;
import com.teamsync.dto.AccountOverviewResponseDTO;
import com.teamsync.dto.ChangePasswordRequestDTO;
import com.teamsync.dto.SecurityOverviewResponseDTO;
import com.teamsync.dto.UpdateProfileRequestDTO;
import com.teamsync.entity.User;
import com.teamsync.entity.UserPreference;
import com.teamsync.dto.UpdateUserPreferencesRequestDTO;
import com.teamsync.dto.UserPreferencesResponseDTO;
import com.teamsync.dto.UserResponseDTO;
import com.teamsync.repository.UserPreferenceRepository;
import com.teamsync.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.prepost.PreAuthorize;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@PreAuthorize("isAuthenticated()")
public class UserService {

    private final UserRepository userRepository;
    private final UserPreferenceRepository userPreferenceRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository,
                       UserPreferenceRepository userPreferenceRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.userPreferenceRepository = userPreferenceRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PreAuthorize("@permissions.self(#email)")
    public UserResponseDTO getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
        return toDTO(user);
    }

    @PreAuthorize("@permissions.self(#email)")
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

    @PreAuthorize("@permissions.self(#email)")
    public UserResponseDTO updateUsername(String email, String newUsername) {
        UpdateProfileRequestDTO request = new UpdateProfileRequestDTO();
        request.setUsername(newUsername);
        return updateProfile(email, request);
    }

    @PreAuthorize("@permissions.self(#email)")
    public UserPreferencesResponseDTO getPreferences(String email) {
        User user = findByEmail(email);
        return toPreferencesDTO(findOrCreatePreferences(user));
    }

    @PreAuthorize("@permissions.self(#email)")
    public UserPreferencesResponseDTO updatePreferences(String email, UpdateUserPreferencesRequestDTO request) {
        User user = findByEmail(email);
        UserPreference preferences = findOrCreatePreferences(user);

        if (request.getEmailNotifications() != null) {
            preferences.setEmailNotifications(request.getEmailNotifications());
        }
        if (request.getInAppNotifications() != null) {
            preferences.setInAppNotifications(request.getInAppNotifications());
        }
        if (request.getTaskReminders() != null) {
            preferences.setTaskReminders(request.getTaskReminders());
        }
        if (request.getWeeklyDigest() != null) {
            preferences.setWeeklyDigest(request.getWeeklyDigest());
        }
        if (request.getTheme() != null) {
            preferences.setTheme(validateChoice("theme", request.getTheme(), List.of("system", "dark", "light")));
        }
        if (request.getDensity() != null) {
            preferences.setDensity(validateChoice("density", request.getDensity(), List.of("comfortable", "compact")));
        }
        if (request.getReduceMotion() != null) {
            preferences.setReduceMotion(request.getReduceMotion());
        }

        return toPreferencesDTO(userPreferenceRepository.save(preferences));
    }

    @PreAuthorize("@permissions.self(#email)")
    public SecurityOverviewResponseDTO getSecurityOverview(String email) {
        User user = findByEmail(email);
        return SecurityOverviewResponseDTO.builder()
                .role(user.getRole())
                .memberSince(user.getCreatedAt())
                .passwordUpdatedAt(user.getPasswordUpdatedAt() != null ? user.getPasswordUpdatedAt() : user.getCreatedAt())
                .activeSessionCount(1)
                .sessionMode("JWT")
                .build();
    }

    @PreAuthorize("@permissions.self(#email)")
    public void changePassword(String email, ChangePasswordRequestDTO request) {
        User user = findByEmail(email);
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new ValidationException("currentPassword", "Current password is incorrect");
        }
        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new ValidationException("newPassword", "New password must be different from the current password");
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setPasswordUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    @PreAuthorize("@permissions.self(#email) and @permissions.profileRoleUnchanged(#request)")
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

        return toDTO(userRepository.save(user));
    }

    @PreAuthorize("hasRole('ADMIN') and !@permissions.selfId(#id)")
    public UserResponseDTO changeRole(UUID id, Role role) {
        User user = userRepository.findById(id).orElseThrow(() -> new NoSuchElementException("User not found"));
        user.setRole(role);
        return toDTO(userRepository.save(user));
    }

    @PreAuthorize("hasRole('ADMIN')")
    public List<UserResponseDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @PreAuthorize("@permissions.self(#email)")
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

    private UserPreferencesResponseDTO toPreferencesDTO(UserPreference preferences) {
        return UserPreferencesResponseDTO.builder()
                .emailNotifications(preferences.isEmailNotifications())
                .inAppNotifications(preferences.isInAppNotifications())
                .taskReminders(preferences.isTaskReminders())
                .weeklyDigest(preferences.isWeeklyDigest())
                .theme(preferences.getTheme())
                .density(preferences.getDensity())
                .reduceMotion(preferences.isReduceMotion())
                .build();
    }

    private UserPreference findOrCreatePreferences(User user) {
        return userPreferenceRepository.findByUser(user)
                .orElseGet(() -> userPreferenceRepository.save(UserPreference.builder()
                        .user(user)
                        .emailNotifications(true)
                        .inAppNotifications(true)
                        .taskReminders(true)
                        .weeklyDigest(false)
                        .theme("system")
                        .density("comfortable")
                        .reduceMotion(false)
                        .build()));
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

    private String validateChoice(String field, String value, List<String> allowedValues) {
        String cleaned = clean(value);
        if (cleaned == null || !allowedValues.contains(cleaned)) {
            throw new ValidationException(field, "Invalid " + field + ": " + value);
        }
        return cleaned;
    }

}
