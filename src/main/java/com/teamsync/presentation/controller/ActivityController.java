package com.teamsync.presentation.controller;

import com.teamsync.presentation.dto.ActivityLogResponseDTO;
import com.teamsync.service.ActivityLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "Activity", description = "Activity feed for projects, workspaces, and users")
@RestController
public class ActivityController {

    private final ActivityLogService activityLogService;

    public ActivityController(ActivityLogService activityLogService) {
        this.activityLogService = activityLogService;
    }

    @Operation(summary = "Get last 50 activity entries for a project")
    @ApiResponse(responseCode = "200", description = "Activity feed returned")
    @GetMapping("/projects/{id}/activity")
    public List<ActivityLogResponseDTO> getProjectActivity(@PathVariable UUID id) {
        return activityLogService.findDTOsByEntityId(id);
    }

    @Operation(summary = "Get last 50 activity entries for a workspace")
    @ApiResponse(responseCode = "200", description = "Activity feed returned")
    @GetMapping("/workspaces/{id}/activity")
    public List<ActivityLogResponseDTO> getWorkspaceActivity(@PathVariable UUID id) {
        return activityLogService.findWorkspaceActivityDTOs(id);
    }

    @Operation(summary = "Get personal activity feed for the current user")
    @ApiResponse(responseCode = "200", description = "Personal activity feed returned")
    @GetMapping("/users/me/activity")
    public List<ActivityLogResponseDTO> getMyActivity(Authentication auth) {
        return activityLogService.findRecentDTOsByUserEmail(auth.getName());
    }
}
