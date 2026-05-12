package com.teamsync.presentation.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SubtaskRequestDTO {

    @NotBlank
    private String title;

    private UUID assigneeId;

    private LocalDate dueDate;
}
