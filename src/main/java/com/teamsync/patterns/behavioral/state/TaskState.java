package com.teamsync.patterns.behavioral.state;

import com.teamsync.entity.Task;
import com.teamsync.enums.TaskStatus;
import com.teamsync.repository.TaskRepository;

public interface TaskState {
    void handle(Task task, TaskStatus targetStatus, TaskRepository repo);
    boolean canTransitionTo(TaskStatus target);
}
