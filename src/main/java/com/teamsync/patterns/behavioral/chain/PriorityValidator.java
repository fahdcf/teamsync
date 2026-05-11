package com.teamsync.patterns.behavioral.chain;

import com.teamsync.domain.entity.Project;
import com.teamsync.presentation.dto.TaskRequestDTO;

public class PriorityValidator extends TaskValidator {

    @Override
    public void validate(TaskRequestDTO request, Project project) {
        passToNext(request, project);
    }
}
