package com.teamsync.dto;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserPreferencesRequestDTO {
    private Boolean emailNotifications;
    private Boolean inAppNotifications;
    private Boolean taskReminders;
    private Boolean weeklyDigest;
    private String theme;
    private String density;
    private Boolean reduceMotion;
}
