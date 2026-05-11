package com.teamsync.patterns.structural.facade;

import com.teamsync.domain.entity.User;
import com.teamsync.patterns.creational.singleton.AppLogger;
import com.teamsync.presentation.dto.ProjectRequestDTO;
import com.teamsync.presentation.dto.ProjectResponseDTO;
import com.teamsync.service.ProjectService;
import com.teamsync.service.UserService;
import com.teamsync.service.WorkspaceService;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class ProjectManagementFacade {

    private final ProjectService projectService;
    private final WorkspaceService workspaceService;
    private final UserService userService;

    public ProjectManagementFacade(ProjectService projectService,
                                    WorkspaceService workspaceService,
                                    UserService userService) {
        this.projectService = projectService;
        this.workspaceService = workspaceService;
        this.userService = userService;
    }

    public ProjectResponseDTO initializeProject(UUID workspaceId, String projectTitle, String managerEmail) {
        workspaceService.getWorkspace(workspaceId);

        User manager = userService.findByEmail(managerEmail);

        ProjectRequestDTO request = new ProjectRequestDTO();
        request.setTitle(projectTitle);
        request.setManagerId(manager.getId());

        ProjectResponseDTO dto = projectService.create(workspaceId, request);

        AppLogger.getInstance().info("Project initialized via facade: " + projectTitle + " in workspace " + workspaceId);

        return dto;
    }
}
