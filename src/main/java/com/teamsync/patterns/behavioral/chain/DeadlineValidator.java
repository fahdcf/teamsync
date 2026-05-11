package com.teamsync.patterns.behavioral.chain;

import com.teamsync.domain.entity.Project;
import com.teamsync.presentation.dto.TaskRequestDTO;

import java.time.LocalDate;

public class DeadlineValidator extends TaskValidator {

    @Override
    public void validate(TaskRequestDTO request, Project project) {
        if (request.getDueDate() != null && request.getDueDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Due date must not be in the past");
        }
        passToNext(request, project);
    }
}
