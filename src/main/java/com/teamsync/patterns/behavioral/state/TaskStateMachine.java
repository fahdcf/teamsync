package com.teamsync.patterns.behavioral.state;

import com.teamsync.entity.Task;
import com.teamsync.enums.TaskStatus;
import com.teamsync.repository.TaskRepository;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Set;

@Component
public class TaskStateMachine {

    private static final Map<TaskStatus, Set<TaskStatus>> TRANSITIONS = Map.of(
            TaskStatus.TODO, Set.of(TaskStatus.IN_PROGRESS),
            TaskStatus.IN_PROGRESS, Set.of(TaskStatus.IN_REVIEW, TaskStatus.BLOCKED),
            TaskStatus.BLOCKED, Set.of(TaskStatus.IN_PROGRESS),
            TaskStatus.IN_REVIEW, Set.of(TaskStatus.DONE, TaskStatus.IN_PROGRESS),
            TaskStatus.DONE, Set.of());

    public void transition(Task task, TaskStatus target, TaskRepository repo) {
        if (target == null || !TRANSITIONS.get(task.getStatus()).contains(target)) {
            throw new IllegalStateException(
                    "Invalid transition: " + task.getStatus() + " → " + target);
        }
        if (task.getStatus() == TaskStatus.TODO && target == TaskStatus.IN_PROGRESS
                && task.getDependencies().stream().anyMatch(dep -> dep.getStatus() != TaskStatus.DONE)) {
            throw new IllegalStateException(
                    "Cannot start task: unfinished dependencies exist");
        }
        task.setStatus(target);
        repo.save(task);
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
