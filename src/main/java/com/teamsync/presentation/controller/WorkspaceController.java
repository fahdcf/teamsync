package com.teamsync.presentation.controller;

import com.teamsync.presentation.dto.AddMemberRequestDTO;
import com.teamsync.presentation.dto.WorkspaceRequestDTO;
import com.teamsync.presentation.dto.WorkspaceResponseDTO;
import com.teamsync.service.WorkspaceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "Workspaces", description = "Workspace management")
@RestController
@RequestMapping("/workspaces")
public class WorkspaceController {

    private final WorkspaceService workspaceService;

    public WorkspaceController(WorkspaceService workspaceService) {
        this.workspaceService = workspaceService;
    }

    @Operation(summary = "Create a new workspace")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Workspace created"),
        @ApiResponse(responseCode = "400", description = "Validation error")
    })
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public WorkspaceResponseDTO create(@Valid @RequestBody WorkspaceRequestDTO request, Authentication auth) {
        return workspaceService.create(request, auth.getName());
    }

    @Operation(summary = "List workspaces the current user owns or is a member of, with optional keyword filter")
    @ApiResponse(responseCode = "200", description = "Workspace list returned")
    @GetMapping
    public List<WorkspaceResponseDTO> getMyWorkspaces(Authentication auth,
                                                       @RequestParam(required = false) String keyword) {
        return workspaceService.getMyWorkspaces(auth.getName(), keyword);
    }

    @Operation(summary = "Get workspace details by ID")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Workspace found"),
        @ApiResponse(responseCode = "404", description = "Workspace not found")
    })
    @GetMapping("/{id}")
    public WorkspaceResponseDTO getById(@PathVariable UUID id) {
        return workspaceService.findById(id);
    }

    @Operation(summary = "Add a member to a workspace by email")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Member added"),
        @ApiResponse(responseCode = "404", description = "Workspace or user not found")
    })
    @PostMapping("/{id}/members")
    public WorkspaceResponseDTO addMember(@PathVariable UUID id,
                                          @Valid @RequestBody AddMemberRequestDTO request,
                                          Authentication auth) {
        return workspaceService.addMember(id, request.getEmail(), auth.getName());
    }

    @Operation(summary = "Remove a member from a workspace")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Member removed"),
        @ApiResponse(responseCode = "404", description = "Workspace not found")
    })
    @DeleteMapping("/{id}/members/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeMember(@PathVariable UUID id,
                              @PathVariable UUID userId,
                              Authentication auth) {
        workspaceService.removeMember(id, userId, auth.getName());
    }
}
