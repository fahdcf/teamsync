package com.teamsync.presentation.dto;

import com.teamsync.domain.enums.TaskPriority;
import com.teamsync.domain.enums.TaskStatus;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskResponseDTO {
    private UUID id;
    private String taskIdentifier;
    private String title;
    private String description;
    private TaskPriority priority;
    private TaskStatus status;
    private UserResponseDTO assignee;
    private UUID projectId;
    private List<SubtaskResponseDTO> subtasks;
    private LocalDate dueDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
