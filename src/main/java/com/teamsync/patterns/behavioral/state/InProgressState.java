package com.teamsync.patterns.behavioral.state;

import com.teamsync.domain.entity.Task;
import com.teamsync.domain.enums.TaskStatus;
import com.teamsync.repository.TaskRepository;

public class InProgressState implements TaskState {

    @Override
    public boolean canTransitionTo(TaskStatus target) {
        return target == TaskStatus.IN_REVIEW || target == TaskStatus.BLOCKED;
    }

    @Override
    public void handle(Task task, TaskStatus targetStatus, TaskRepository repo) {
        task.setStatus(targetStatus);
        repo.save(task);
    }
}
