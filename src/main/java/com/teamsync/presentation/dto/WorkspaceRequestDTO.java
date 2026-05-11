package com.teamsync.presentation.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class WorkspaceRequestDTO {

    @NotBlank
    private String name;

    private String description;
}
