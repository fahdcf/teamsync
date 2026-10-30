package com.teamsync.patterns.behavioral.observer;

import org.springframework.context.event.EventListener;
import com.teamsync.entity.User;
import com.teamsync.enums.NotificationType;
import com.teamsync.patterns.creational.singleton.AppLogger;
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
        User triggeredBy = event.triggeredBy();
        if (triggeredBy == null) return;

        String message = "NOTIFY: [" + event.eventType() + "] — " + event.payload();
        AppLogger.getInstance().info(message);

        notificationService.notify(triggeredBy, message, NotificationType.IN_APP);
    }
}
