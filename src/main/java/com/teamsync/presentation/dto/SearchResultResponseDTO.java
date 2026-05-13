package com.teamsync.presentation.dto;

import lombok.*;

import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchResultResponseDTO {
    private UUID id;
    private String type;
    private String title;
    private String subtitle;
    private String route;
    private UUID workspaceId;
    private UUID projectId;
}
