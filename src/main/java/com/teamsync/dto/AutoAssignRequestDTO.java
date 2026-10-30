package com.teamsync.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AutoAssignRequestDTO {

    @NotNull
    private UUID taskId;
}
