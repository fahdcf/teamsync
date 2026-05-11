package com.teamsync.patterns.structural.decorator;

import com.teamsync.domain.entity.Notification;
import org.springframework.stereotype.Component;

@Component
public class InAppSender implements NotificationSender {

    @Override
    public void send(Notification notification) {
        System.out.println("IN-APP → " + notification.getRecipient().getUsername()
                + ": " + notification.getMessage());
    }
}
