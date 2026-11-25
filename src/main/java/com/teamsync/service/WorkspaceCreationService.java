package com.teamsync.service;

import com.teamsync.dto.ProjectRequestDTO;
import com.teamsync.dto.TaskRequestDTO;
import com.teamsync.dto.WorkspaceRequestDTO;
import com.teamsync.dto.WorkspaceResponseDTO;
import com.teamsync.patterns.creational.factory.WorkspaceStarterKitFactory;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WorkspaceCreationService {
    private final WorkspaceService workspaces;
    private final ProjectService projects;
    private final TaskService tasks;
    private final WorkspaceStarterKitFactory starterKits;

    public WorkspaceCreationService(WorkspaceService workspaces, ProjectService projects, TaskService tasks,
                                    WorkspaceStarterKitFactory starterKits) {
        this.workspaces = workspaces;
        this.projects = projects;
        this.tasks = tasks;
        this.starterKits = starterKits;
    }

    @Transactional
    @PreAuthorize("@permissions.self(#ownerEmail)")
    public WorkspaceResponseDTO create(WorkspaceRequestDTO request, String ownerEmail) {
        var setup = starterKits.create(request.getStarterKit());
        WorkspaceResponseDTO workspace = workspaces.create(request, ownerEmail);
        for (var starter : setup) {
            ProjectRequestDTO projectRequest = new ProjectRequestDTO();
            projectRequest.setTitle(starter.title());
            var project = projects.create(workspace.getId(), projectRequest);

            for (String title : starter.tasks()) {
                TaskRequestDTO taskRequest = new TaskRequestDTO();
                taskRequest.setTitle(title);
                tasks.create(project.getId(), taskRequest);
            }
        }
        return workspace;
    }
}
