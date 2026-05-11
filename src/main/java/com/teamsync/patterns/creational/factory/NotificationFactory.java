package com.teamsync.patterns.creational.factory;

import com.teamsync.domain.entity.Notification;
import com.teamsync.domain.entity.User;
import com.teamsync.repository.NotificationRepository;

public abstract class NotificationFactory {

    protected final NotificationRepository notificationRepository;

    protected NotificationFactory(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    public abstract Notification createNotification(User recipient, String message);

    public final void notifyUser(User recipient, String message) {
        Notification notification = createNotification(recipient, message);
        notificationRepository.save(notification);
    }
}
