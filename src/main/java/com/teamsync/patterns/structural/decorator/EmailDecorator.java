package com.teamsync.patterns.structural.decorator;

import com.teamsync.domain.entity.Notification;

public class EmailDecorator implements NotificationSender {

    private final NotificationSender wrapped;

    public EmailDecorator(NotificationSender wrapped) {
        this.wrapped = wrapped;
    }

    @Override
    public void send(Notification notification) {
        wrapped.send(notification);
        System.out.println("EMAIL → " + notification.getRecipient().getEmail()
                + ": " + notification.getMessage());
    }
}
