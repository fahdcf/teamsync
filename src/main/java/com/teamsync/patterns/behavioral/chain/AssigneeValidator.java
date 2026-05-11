package com.teamsync.patterns.behavioral.chain;

import com.teamsync.domain.entity.Project;
import com.teamsync.domain.entity.User;
import com.teamsync.presentation.dto.TaskRequestDTO;
import com.teamsync.repository.UserRepository;

import java.util.NoSuchElementException;

public class AssigneeValidator extends TaskValidator {

    private final UserRepository userRepository;

    public AssigneeValidator(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public void validate(TaskRequestDTO request, Project project) {
        if (request.getAssigneeId() != null) {
            User assignee = userRepository.findById(request.getAssigneeId())
                    .orElseThrow(() -> new NoSuchElementException("Assignee not found"));

            boolean isMember = project.getWorkspace().getMembers().contains(assignee)
                    || project.getManager() != null && project.getManager().getId().equals(assignee.getId());

            if (!isMember) {
                throw new IllegalArgumentException("Assignee is not a member of the project workspace");
            }
        }
        passToNext(request, project);
    }
}
