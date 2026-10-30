package com.teamsync.dto;

import com.teamsync.enums.Role;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ChangeRoleRequestDTO {
    @NotNull
    private Role role;
}
