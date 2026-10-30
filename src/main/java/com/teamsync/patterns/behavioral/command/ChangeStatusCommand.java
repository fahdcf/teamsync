package com.teamsync.patterns.behavioral.command;

import java.util.UUID;
import com.teamsync.entity.Task;
import com.teamsync.enums.TaskStatus;
import com.teamsync.patterns.behavioral.state.TaskStateMachine;
import com.teamsync.repository.TaskRepository;

public class ChangeStatusCommand implements TaskCommand {

    private final Task task;
    private final TaskStatus newStatus;
    private final TaskStateMachine stateMachine;
    private final TaskRepository taskRepository;
    private TaskStatus previousStatus;

    public ChangeStatusCommand(Task task, TaskStatus newStatus,
                                TaskStateMachine stateMachine, TaskRepository taskRepository) {
        this.task = task;
        this.newStatus = newStatus;
        this.stateMachine = stateMachine;
        this.taskRepository = taskRepository;
    }

    @Override
    public void execute() {
        previousStatus = task.getStatus();
        stateMachine.transition(task, newStatus, taskRepository);
    }

    @Override
    public void undo() {
        Task current = taskRepository.findForUpdate(task.getId()).orElseThrow();
        stateMachine.undoTransition(current, newStatus, previousStatus, taskRepository);
    }

    public UUID projectId() { return task.getProject().getId(); }
    public UUID taskId() { return task.getId(); }
}
