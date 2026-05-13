package com.teamsync.presentation.dto;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPreferencesResponseDTO {
    private boolean emailNotifications;
    private boolean inAppNotifications;
    private boolean taskReminders;
    private boolean weeklyDigest;
    private String theme;
    private String density;
    private boolean reduceMotion;
}
