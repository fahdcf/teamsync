package com.teamsync.patterns.behavioral.state;

import com.teamsync.entity.Task;
import com.teamsync.enums.TaskStatus;
import com.teamsync.repository.TaskRepository;
import org.springframework.stereotype.Component;

@Component
public class TaskStateMachine {

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
                && task.getDependencies().stream().anyMatch(dep -> dep.getStatus() != TaskStatus.DONE)) {
            throw new IllegalStateException(
                    "Cannot start task: unfinished dependencies exist");
        }
        currentState.handle(task, target, repo);
    }

    /** Undo reverses a recorded transition only while its resulting state is still current. */
    public void undoTransition(Task task, TaskStatus expected, TaskStatus previous, TaskRepository repo) {
        if (task.getStatus() != expected) throw new IllegalStateException("Task status changed since this action");
        if (previous == TaskStatus.IN_PROGRESS && task.getDependencies().stream().anyMatch(dep -> dep.getStatus() != TaskStatus.DONE))
            throw new IllegalStateException("Cannot restore task: unfinished dependencies exist");
        task.setStatus(previous);
        repo.save(task);
    }
}
