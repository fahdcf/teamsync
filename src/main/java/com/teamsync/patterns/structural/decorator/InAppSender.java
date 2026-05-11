package com.teamsync.patterns.structural.decorator;

import com.teamsync.domain.entity.Notification;
import com.teamsync.patterns.creational.singleton.AppLogger;
import org.springframework.stereotype.Component;

@Component
public class InAppSender implements NotificationSender {

    @Override
    public void send(Notification notification) {
        AppLogger.getInstance().info("IN-APP → " + notification.getRecipient().getUsername()
                + ": " + notification.getMessage());
    }
}
