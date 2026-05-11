package com.teamsync.patterns.behavioral.command;

import com.teamsync.domain.entity.Task;
import com.teamsync.repository.TaskRepository;

public class DeleteTaskCommand implements TaskCommand {

    private final Task task;
    private final TaskRepository taskRepository;
    private Task snapshot;

    public DeleteTaskCommand(Task task, TaskRepository taskRepository) {
        this.task = task;
        this.taskRepository = taskRepository;
    }

    @Override
    public void execute() {
        snapshot = task;
        taskRepository.delete(task);
    }

    @Override
    public void undo() {
        if (snapshot != null) {
            snapshot.setId(null);
            taskRepository.save(snapshot);
        }
    }
}
