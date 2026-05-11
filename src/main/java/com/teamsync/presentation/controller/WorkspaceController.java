package com.teamsync.presentation.controller;

import com.teamsync.presentation.dto.AddMemberRequestDTO;
import com.teamsync.presentation.dto.WorkspaceRequestDTO;
import com.teamsync.presentation.dto.WorkspaceResponseDTO;
import com.teamsync.service.WorkspaceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/workspaces")
public class WorkspaceController {

    private final WorkspaceService workspaceService;

    public WorkspaceController(WorkspaceService workspaceService) {
        this.workspaceService = workspaceService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public WorkspaceResponseDTO create(@Valid @RequestBody WorkspaceRequestDTO request, Authentication auth) {
        return workspaceService.create(request, auth.getName());
    }

    @GetMapping
    public List<WorkspaceResponseDTO> getMyWorkspaces(Authentication auth) {
        return workspaceService.getMyWorkspaces(auth.getName());
    }

    @GetMapping("/{id}")
    public WorkspaceResponseDTO getById(@PathVariable UUID id) {
        return workspaceService.findById(id);
    }

    @PostMapping("/{id}/members")
    public WorkspaceResponseDTO addMember(@PathVariable UUID id,
                                          @Valid @RequestBody AddMemberRequestDTO request,
                                          Authentication auth) {
        return workspaceService.addMember(id, request.getEmail(), auth.getName());
    }

    @DeleteMapping("/{id}/members/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeMember(@PathVariable UUID id,
                              @PathVariable UUID userId,
                              Authentication auth) {
        workspaceService.removeMember(id, userId, auth.getName());
    }
}
