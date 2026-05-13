package com.teamsync.presentation.dto;

import com.teamsync.domain.enums.ProjectStatus;
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
    private String title;
    private String description;
    private ProjectStatus status;
    private LocalDate deadline;
    private int progress;
    private String health;
    private String insight;
    private UUID workspaceId;
    private String workspaceName;
    private UserResponseDTO manager;
    private LocalDateTime createdAt;
}
