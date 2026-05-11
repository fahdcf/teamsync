package com.teamsync.patterns.behavioral.observer;

import com.teamsync.domain.entity.User;
import com.teamsync.domain.enums.NotificationType;
import com.teamsync.service.NotificationService;
import org.springframework.stereotype.Component;

@Component
public class NotificationListener implements ProjectEventListener {

    private final NotificationService notificationService;

    public NotificationListener(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @Override
    public void onEvent(ProjectEvent event) {
        User triggeredBy = event.triggeredBy();
        if (triggeredBy == null) return;

        String message = "NOTIFY: [" + event.eventType() + "] — " + event.payload();
        System.out.println(message);

        notificationService.notify(triggeredBy, message, NotificationType.IN_APP);
    }
}
