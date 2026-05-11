package com.teamsync.patterns.behavioral.state;

import com.teamsync.domain.entity.Task;
import com.teamsync.domain.enums.TaskStatus;
import com.teamsync.repository.TaskRepository;

public interface TaskState {
    void handle(Task task, TaskStatus targetStatus, TaskRepository repo);
    boolean canTransitionTo(TaskStatus target);
}
