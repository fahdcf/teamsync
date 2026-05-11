package com.teamsync.patterns.behavioral.observer;

import com.teamsync.service.ActivityLogService;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class ActivityLogListener implements ProjectEventListener {

    private final ActivityLogService activityLogService;

    public ActivityLogListener(ActivityLogService activityLogService) {
        this.activityLogService = activityLogService;
    }

    @Override
    public void onEvent(ProjectEvent event) {
        String user = event.triggeredBy() != null ? event.triggeredBy().getUsername() : "system";
        String action = user + " performed " + event.eventType() + ": " + event.payload();

        activityLogService.log(
                event.triggeredBy(),
                action,
                event.eventType().name(),
                UUID.randomUUID()
        );
    }
}
