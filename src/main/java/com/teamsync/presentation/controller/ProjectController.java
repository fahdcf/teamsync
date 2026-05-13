package com.teamsync.presentation.controller;

import com.teamsync.domain.enums.ProjectStatus;
import com.teamsync.patterns.structural.facade.ProjectManagementFacade;
import com.teamsync.presentation.dto.InitializeProjectRequestDTO;
import com.teamsync.presentation.dto.ProjectRequestDTO;
import com.teamsync.presentation.dto.ProjectResponseDTO;
import com.teamsync.service.ProjectService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Tag(name = "Projects", description = "Project management")
@RestController
public class ProjectController {

    private final ProjectService projectService;
    private final ProjectManagementFacade projectManagementFacade;

    public ProjectController(ProjectService projectService, ProjectManagementFacade projectManagementFacade) {
        this.projectService = projectService;
        this.projectManagementFacade = projectManagementFacade;
    }

    @Operation(summary = "Search all projects with optional status and managerId filters")
    @ApiResponse(responseCode = "200", description = "Project list returned")
    @GetMapping("/projects")
    public List<ProjectResponseDTO> search(@RequestParam(required = false) ProjectStatus status,
                                           @RequestParam(required = false) UUID managerId) {
        return projectService.search(status, managerId);
    }

    @Operation(summary = "Create a project in a workspace")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Project created"),
        @ApiResponse(responseCode = "404", description = "Workspace not found")
    })
    @PostMapping("/workspaces/{workspaceId}/projects")
    @ResponseStatus(HttpStatus.CREATED)
    public ProjectResponseDTO create(@PathVariable UUID workspaceId,
                                     @Valid @RequestBody ProjectRequestDTO request,
                                     Authentication auth) {
        return projectService.create(workspaceId, request, auth.getName());
    }

    @Operation(summary = "List projects in a workspace")
    @ApiResponse(responseCode = "200", description = "Project list returned")
    @GetMapping("/workspaces/{workspaceId}/projects")
    public List<ProjectResponseDTO> listByWorkspace(@PathVariable UUID workspaceId,
                                                    @RequestParam(required = false) ProjectStatus status,
                                                    @RequestParam(required = false) String health,
                                                    @RequestParam(required = false) UUID managerId,
                                                    @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dueFrom,
                                                    @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dueTo,
                                                    @RequestParam(required = false) String keyword,
                                                    @RequestParam(required = false) String sort) {
        return projectService.findByWorkspace(workspaceId, status, health, managerId, dueFrom, dueTo, keyword, sort);
    }

    @Operation(summary = "Get project details by ID")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Project found"),
        @ApiResponse(responseCode = "404", description = "Project not found")
    })
    @GetMapping("/projects/{id}")
    public ProjectResponseDTO getById(@PathVariable UUID id) {
        return projectService.findById(id);
    }

    @Operation(summary = "Update project fields")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Project updated"),
        @ApiResponse(responseCode = "404", description = "Project not found")
    })
    @PutMapping("/projects/{id}")
    public ProjectResponseDTO update(@PathVariable UUID id,
                                     @Valid @RequestBody ProjectRequestDTO request,
                                     Authentication auth) {
        return projectService.update(id, request, auth.getName());
    }

    @Operation(summary = "Archive a project (ADMIN or PROJECT_MANAGER)")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Project archived"),
        @ApiResponse(responseCode = "403", description = "Insufficient role"),
        @ApiResponse(responseCode = "404", description = "Project not found")
    })
    @PutMapping("/projects/{id}/archive")
    public ProjectResponseDTO archive(@PathVariable UUID id, Authentication auth) {
        return projectService.archive(id, auth.getName());
    }

    @Operation(summary = "Initialize a project via Facade pattern (validate workspace, create project, assign manager)")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Project initialized"),
        @ApiResponse(responseCode = "404", description = "Workspace or manager not found")
    })
    @PostMapping("/projects/initialize")
    @ResponseStatus(HttpStatus.CREATED)
    public ProjectResponseDTO initialize(@Valid @RequestBody InitializeProjectRequestDTO request) {
        return projectManagementFacade.initializeProject(
                request.getWorkspaceId(), request.getProjectTitle(), request.getManagerEmail());
    }
}
