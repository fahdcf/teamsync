package com.teamsync.patterns.behavioral.command;

import com.teamsync.domain.entity.Task;
import com.teamsync.domain.enums.TaskStatus;
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
        task.setStatus(previousStatus);
        taskRepository.save(task);
    }
}
