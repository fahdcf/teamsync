package com.teamsync.patterns.behavioral.state;

import com.teamsync.domain.entity.Task;
import com.teamsync.domain.enums.TaskStatus;
import com.teamsync.repository.TaskRepository;
import com.teamsync.service.TaskDependencyService;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

@Component
public class TaskStateMachine {

    private final TaskDependencyService dependencyService;

    public TaskStateMachine(@Lazy TaskDependencyService dependencyService) {
        this.dependencyService = dependencyService;
    }

    public TaskState getCurrentState(Task task) {
        return switch (task.getStatus()) {
            case TODO -> new TodoState();
            case IN_PROGRESS -> new InProgressState();
            case BLOCKED -> new BlockedState();
            case IN_REVIEW -> new InReviewState();
            case DONE -> new DoneState();
        };
    }

    public void transition(Task task, TaskStatus target, TaskRepository repo) {
        TaskState currentState = getCurrentState(task);
        if (!currentState.canTransitionTo(target)) {
            throw new IllegalStateException(
                    "Invalid transition: " + task.getStatus() + " → " + target);
        }
        if (task.getStatus() == TaskStatus.TODO && target == TaskStatus.IN_PROGRESS
                && !dependencyService.canStart(task)) {
            throw new IllegalStateException(
                    "Cannot start task: unfinished dependencies exist");
        }
        currentState.handle(task, target, repo);
    }
}
