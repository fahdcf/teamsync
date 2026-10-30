package com.teamsync.patterns.creational.factory;

import com.teamsync.entity.Notification;
import com.teamsync.entity.User;
import com.teamsync.enums.NotificationType;
import com.teamsync.repository.NotificationRepository;
import org.springframework.stereotype.Component;

@Component
public class InAppNotificationFactory extends NotificationFactory {

    public InAppNotificationFactory(NotificationRepository notificationRepository) {
        super(notificationRepository);
    }

    @Override
    public Notification createNotification(User recipient, String message) {
        return Notification.builder()
                .type(NotificationType.IN_APP)
                .message(message)
                .recipient(recipient)
                .build();
    }
}
