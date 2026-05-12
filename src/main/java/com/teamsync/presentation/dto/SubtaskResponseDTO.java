package com.teamsync.presentation.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubtaskResponseDTO {
    private UUID id;
    private String title;
    private boolean completed;
    private UUID taskId;
    private UserResponseDTO assignee;
    private LocalDate dueDate;
    private LocalDateTime createdAt;
}
