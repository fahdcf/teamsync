package com.teamsync.patterns.creational.factory;

import com.teamsync.entity.Notification;
import com.teamsync.entity.User;
import com.teamsync.enums.NotificationType;
import com.teamsync.patterns.creational.singleton.AppLogger;
import com.teamsync.repository.NotificationRepository;
import org.springframework.stereotype.Component;

@Component
public class EmailNotificationFactory extends NotificationFactory {

    public EmailNotificationFactory(NotificationRepository notificationRepository) {
        super(notificationRepository);
    }

    @Override
    public Notification createNotification(User recipient, String message) {
        AppLogger.getInstance().info("EMAIL SENT to " + recipient.getEmail() + ": " + message);
        return Notification.builder()
                .type(NotificationType.EMAIL)
                .message(message)
                .recipient(recipient)
                .build();
    }
}
