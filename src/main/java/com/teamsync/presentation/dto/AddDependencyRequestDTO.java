package com.teamsync.presentation.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AddDependencyRequestDTO {

    @NotNull
    private UUID dependsOnTaskId;
}
