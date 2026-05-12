package com.teamsync.presentation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityLogResponseDTO {
    private UUID id;
    private UserResponseDTO user;
    private String action;
    private String entityType;
    private UUID entityId;
    private LocalDateTime createdAt;
}
