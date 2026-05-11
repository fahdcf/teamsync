package com.teamsync.patterns.behavioral.command;

import com.teamsync.domain.entity.Task;
import com.teamsync.domain.entity.User;
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
        task.setAssignee(previousAssignee);
        taskRepository.save(task);
    }
}
