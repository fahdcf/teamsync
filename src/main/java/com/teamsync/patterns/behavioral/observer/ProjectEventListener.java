package com.teamsync.patterns.behavioral.observer;

public interface ProjectEventListener {
    void onEvent(ProjectEvent event);
}
