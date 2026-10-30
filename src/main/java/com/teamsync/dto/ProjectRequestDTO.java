package com.teamsync.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
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

    @Min(0)
    @Max(100)
    private Integer progress;

    private UUID managerId;
}
