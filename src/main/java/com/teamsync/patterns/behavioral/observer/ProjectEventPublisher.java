package com.teamsync.patterns.behavioral.observer;

import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ProjectEventPublisher {

    private final List<ProjectEventListener> listeners;

    public ProjectEventPublisher(List<ProjectEventListener> listeners) {
        this.listeners = listeners;
    }

    public void publish(ProjectEvent event) {
        for (ProjectEventListener listener : listeners) {
            listener.onEvent(event);
        }
    }
}
