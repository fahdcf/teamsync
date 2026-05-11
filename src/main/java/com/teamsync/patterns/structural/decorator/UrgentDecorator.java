package com.teamsync.patterns.structural.decorator;

import com.teamsync.domain.entity.Notification;

public class UrgentDecorator implements NotificationSender {

    private final NotificationSender wrapped;

    public UrgentDecorator(NotificationSender wrapped) {
        this.wrapped = wrapped;
    }

    @Override
    public void send(Notification notification) {
        notification.setMessage("[URGENT] " + notification.getMessage());
        wrapped.send(notification);
    }
}
