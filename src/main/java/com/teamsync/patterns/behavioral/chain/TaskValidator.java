package com.teamsync.patterns.behavioral.chain;

import com.teamsync.domain.entity.Project;
import com.teamsync.presentation.dto.TaskRequestDTO;

public abstract class TaskValidator {

    private TaskValidator next;

    public TaskValidator setNext(TaskValidator next) {
        this.next = next;
        return next;
    }

    public abstract void validate(TaskRequestDTO request, Project project);

    protected void passToNext(TaskRequestDTO request, Project project) {
        if (next != null) {
            next.validate(request, project);
        }
    }
}
