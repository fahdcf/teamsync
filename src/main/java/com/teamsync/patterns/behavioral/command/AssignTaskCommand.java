package com.teamsync.patterns.behavioral.command;

import java.util.UUID;
import com.teamsync.entity.Task;
import com.teamsync.entity.User;
import com.teamsync.repository.TaskRepository;

public class AssignTaskCommand implements TaskCommand {

    private final Task task;
    private final User newAssignee;
    private final TaskRepository taskRepository;
    private User previousAssignee;

    public AssignTaskCommand(Task task, User newAssignee, TaskRepository taskRepository) {
        this.task = task;
        this.newAssignee = newAssignee;
        this.taskRepository = taskRepository;
    }

    @Override
    public void execute() {
        previousAssignee = task.getAssignee();
        task.setAssignee(newAssignee);
        taskRepository.save(task);
    }

    @Override
    public void undo() {
        Task current = taskRepository.findForUpdate(task.getId()).orElseThrow();
        if (current.getAssignee() == null || !current.getAssignee().getId().equals(newAssignee.getId()))
            throw new IllegalStateException("Task assignment changed since this action");
        current.setAssignee(previousAssignee);
        taskRepository.save(current);
    }

    public UUID projectId() { return task.getProject().getId(); }
    public UUID taskId() { return task.getId(); }
    public UUID restoredAssigneeId() { return previousAssignee == null ? null : previousAssignee.getId(); }
}
