package com.teamsync.patterns.structural.decorator;

import com.teamsync.domain.entity.Notification;

public interface NotificationSender {
    void send(Notification notification);
}
