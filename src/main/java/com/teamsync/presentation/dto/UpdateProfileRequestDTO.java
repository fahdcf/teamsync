package com.teamsync.presentation.dto;

import com.teamsync.domain.enums.Role;
import jakarta.validation.constraints.Email;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequestDTO {
    private String username;

    @Email
    private String email;

    private Role role;

    private String avatarUrl;
}
