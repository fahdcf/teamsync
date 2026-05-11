package com.teamsync.presentation.dto;

import com.teamsync.domain.enums.Role;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponseDTO {
    private UUID id;
    private String username;
    private String email;
    private Role role;
    private LocalDateTime createdAt;
}
