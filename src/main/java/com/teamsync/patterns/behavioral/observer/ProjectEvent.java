package com.teamsync.patterns.behavioral.observer;

import com.teamsync.entity.User;
import com.teamsync.enums.ProjectEventType;

public record ProjectEvent(ProjectEventType eventType, Object payload, User triggeredBy) {
}
