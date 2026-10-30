package com.teamsync.dto;

import com.teamsync.enums.ProjectStatus;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectResponseDTO {
    private UUID id;
    private boolean canManage;
    private boolean canChangeManager;
    private String title;
    private String description;
    private ProjectStatus status;
    private LocalDate deadline;
    private int progress;
    private long taskCount;
    private String health;
    private String insight;
    private boolean favorite;
    private UUID workspaceId;
    private String workspaceName;
    private UserResponseDTO manager;
    private String lastActivityAction;
    private LocalDateTime lastActivityAt;
    private LocalDateTime createdAt;
}
