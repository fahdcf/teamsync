package com.teamsync.presentation.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkspaceResponseDTO {
    private UUID id;
    private String name;
    private String description;
    private UserResponseDTO owner;
    private List<UserResponseDTO> members;
    private LocalDateTime createdAt;
}
