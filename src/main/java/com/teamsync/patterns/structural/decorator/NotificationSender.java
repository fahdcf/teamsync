package com.teamsync.patterns.structural.decorator;

import com.teamsync.entity.Notification;

public interface NotificationSender {
    void send(Notification notification);
}
