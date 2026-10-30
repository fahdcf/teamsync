package com.teamsync.dto;

import jakarta.validation.constraints.Min;
import com.teamsync.enums.TaskPriority;
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

    @Min(0)
    private int defaultDueDays = 7;
}
