package com.teamsync.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "user_preferences")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false)
    private boolean emailNotifications;

    @Column(nullable = false)
    private boolean inAppNotifications;

    @Column(nullable = false)
    private boolean taskReminders;

    @Column(nullable = false)
    private boolean weeklyDigest;

    @Column(nullable = false)
    private String theme;

    @Column(nullable = false)
    private String density;

    @Column(nullable = false)
    private boolean reduceMotion;
}
