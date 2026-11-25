package com.teamsync.patterns.behavioral.state;

import com.teamsync.entity.Task;
import com.teamsync.enums.TaskStatus;
import org.springframework.stereotype.Component;

@Component
public class TaskStateMachine {

    public void transition(Task task, TaskStatus target) {
        TaskState.valueOf(task.getStatus().name()).validateTransition(task, target);
        task.setStatus(target);
    }

    /** Undo reverses a recorded transition only while its resulting state is still current. */
    public void undoTransition(Task task, TaskStatus expected, TaskStatus previous) {
        if (task.getStatus() != expected) throw new IllegalStateException("Task status changed since this action");
        if (previous == TaskStatus.IN_PROGRESS && TaskState.hasUnfinishedDependencies(task))
            throw new IllegalStateException("Cannot restore task: unfinished dependencies exist");
        task.setStatus(previous);
    }
}
