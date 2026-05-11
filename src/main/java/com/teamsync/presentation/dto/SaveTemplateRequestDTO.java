package com.teamsync.presentation.dto;

import com.teamsync.domain.enums.TaskPriority;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SaveTemplateRequestDTO {

    @NotBlank
    private String templateName;

    @NotBlank
    private String title;

    private String description;

    private TaskPriority priority;

    private int defaultDueDays = 7;
}
