package com.teamsync.patterns.behavioral.observer;

import com.teamsync.domain.entity.User;
import com.teamsync.domain.enums.ProjectEventType;

public record ProjectEvent(ProjectEventType eventType, Object payload, User triggeredBy) {
}
