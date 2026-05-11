package com.teamsync.patterns.behavioral.state;

import com.teamsync.domain.entity.Task;
import com.teamsync.domain.enums.TaskStatus;
import com.teamsync.repository.TaskRepository;

public class DoneState implements TaskState {

    @Override
    public boolean canTransitionTo(TaskStatus target) {
        return false;
    }

    @Override
    public void handle(Task task, TaskStatus targetStatus, TaskRepository repo) {
        throw new IllegalStateException("Invalid transition: DONE → " + targetStatus);
    }
}
