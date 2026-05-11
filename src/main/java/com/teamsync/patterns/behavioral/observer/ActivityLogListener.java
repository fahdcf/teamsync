package com.teamsync.patterns.behavioral.observer;

import org.springframework.stereotype.Component;

@Component
public class ActivityLogListener implements ProjectEventListener {

    @Override
    public void onEvent(ProjectEvent event) {
        String user = event.triggeredBy() != null ? event.triggeredBy().getUsername() : "system";
        System.out.println("ACTIVITY: [" + event.eventType() + "] by " + user + " — " + event.payload());
    }
}
