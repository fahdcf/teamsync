package com.teamsync.presentation.controller;

import com.teamsync.presentation.dto.ProjectRequestDTO;
import com.teamsync.presentation.dto.ProjectResponseDTO;
import com.teamsync.service.ProjectService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @PostMapping("/workspaces/{workspaceId}/projects")
    @ResponseStatus(HttpStatus.CREATED)
    public ProjectResponseDTO create(@PathVariable UUID workspaceId,
                                     @Valid @RequestBody ProjectRequestDTO request) {
        return projectService.create(workspaceId, request);
    }

    @GetMapping("/workspaces/{workspaceId}/projects")
    public List<ProjectResponseDTO> listByWorkspace(@PathVariable UUID workspaceId) {
        return projectService.findByWorkspace(workspaceId);
    }

    @GetMapping("/projects/{id}")
    public ProjectResponseDTO getById(@PathVariable UUID id) {
        return projectService.findById(id);
    }

    @PutMapping("/projects/{id}")
    public ProjectResponseDTO update(@PathVariable UUID id,
                                     @Valid @RequestBody ProjectRequestDTO request) {
        return projectService.update(id, request);
    }

    @PutMapping("/projects/{id}/archive")
    public ProjectResponseDTO archive(@PathVariable UUID id) {
        return projectService.archive(id);
    }
}
