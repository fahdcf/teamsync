package com.teamsync.presentation.dto;

import com.teamsync.domain.enums.Role;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SecurityOverviewResponseDTO {
    private Role role;
    private LocalDateTime memberSince;
    private LocalDateTime passwordUpdatedAt;
    private int activeSessionCount;
    private String sessionMode;
}
