package com.teamsync.presentation.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class InitializeProjectRequestDTO {

    @NotNull
    private UUID workspaceId;

    @NotBlank
    private String projectTitle;

    @NotBlank
    @Email
    private String managerEmail;
}
