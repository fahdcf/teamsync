package com.teamsync.presentation.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProjectRequestDTO {

    @NotBlank
    private String title;

    private String description;

    private LocalDate deadline;

    private Integer progress;

    private UUID managerId;
}
