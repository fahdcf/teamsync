package com.teamsync.dto;

import com.teamsync.enums.Role;
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
    private String avatarUrl;
    private Role role;
    private LocalDateTime createdAt;
}
