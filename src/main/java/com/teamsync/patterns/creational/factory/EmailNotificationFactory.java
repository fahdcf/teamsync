package com.teamsync.patterns.creational.factory;

import com.teamsync.domain.entity.Notification;
import com.teamsync.domain.entity.User;
import com.teamsync.domain.enums.NotificationType;
import com.teamsync.repository.NotificationRepository;
import org.springframework.stereotype.Component;

@Component
public class EmailNotificationFactory extends NotificationFactory {

    public EmailNotificationFactory(NotificationRepository notificationRepository) {
        super(notificationRepository);
    }

    @Override
    public Notification createNotification(User recipient, String message) {
        System.out.println("EMAIL SENT to " + recipient.getEmail() + ": " + message);
        return Notification.builder()
                .type(NotificationType.EMAIL)
                .message(message)
                .recipient(recipient)
                .build();
    }
}
