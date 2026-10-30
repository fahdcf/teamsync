package com.teamsync.dto;

import com.teamsync.enums.TaskPriority;
import com.teamsync.enums.TaskStatus;
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
    private boolean canManage;
    private boolean canChangeStatus;
    private String taskIdentifier;
    private String title;
    private String description;
    private TaskPriority priority;
    private TaskStatus status;
    private Integer position;
    private UserResponseDTO assignee;
    private UUID projectId;
    private String projectTitle;
    private UUID workspaceId;
    private String workspaceName;
    private long commentCount;
    private List<SubtaskResponseDTO> subtasks;
    private LocalDate dueDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
