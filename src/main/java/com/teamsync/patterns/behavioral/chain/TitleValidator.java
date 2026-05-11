package com.teamsync.patterns.behavioral.chain;

import com.teamsync.domain.entity.Project;
import com.teamsync.presentation.dto.TaskRequestDTO;

public class TitleValidator extends TaskValidator {

    @Override
    public void validate(TaskRequestDTO request, Project project) {
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new IllegalArgumentException("Task title must not be blank");
        }
        if (request.getTitle().length() > 100) {
            throw new IllegalArgumentException("Task title must not exceed 100 characters");
        }
        passToNext(request, project);
    }
}
