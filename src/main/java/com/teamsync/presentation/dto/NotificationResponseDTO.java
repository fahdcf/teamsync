package com.teamsync.presentation.dto;

import com.teamsync.domain.enums.NotificationType;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponseDTO {
    private UUID id;
    private NotificationType type;
    private String message;
    private boolean readStatus;
    private LocalDateTime createdAt;
}
