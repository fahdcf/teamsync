package com.teamsync.dto;

import com.teamsync.enums.TaskPriority;
import com.teamsync.enums.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TaskRequestDTO {

    @NotBlank
    private String title;

    private String description;

    private TaskPriority priority;

    private TaskStatus status;

    private UUID assigneeId;

    private LocalDate dueDate;
}
