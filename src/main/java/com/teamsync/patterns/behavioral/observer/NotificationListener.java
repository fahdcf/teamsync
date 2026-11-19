package com.teamsync.patterns.behavioral.observer;

import org.springframework.context.event.EventListener;
import com.teamsync.enums.NotificationType;
import com.teamsync.service.NotificationService;
import org.springframework.stereotype.Component;

@Component
public class NotificationListener {

    private final NotificationService notificationService;

    public NotificationListener(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @EventListener
    public void onEvent(ProjectEvent event) {
        if (event.recipient() == null) return;
        // Synchronous persistence joins the publisher's transaction, including rollback.
        notificationService.notify(event.recipient(), event.message(), NotificationType.IN_APP);
    }
}
