package com.teamsync.patterns.behavioral.observer;

import com.teamsync.entity.User;
import com.teamsync.enums.ProjectEventType;

/** Recipient is the notification target; services record the authenticated actor in the audit log. */
public record ProjectEvent(ProjectEventType eventType, String message, User recipient) {
}
