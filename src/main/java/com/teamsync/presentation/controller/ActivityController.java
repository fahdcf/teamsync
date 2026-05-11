package com.teamsync.presentation.controller;

import com.teamsync.domain.entity.ActivityLog;
import com.teamsync.service.ActivityLogService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
public class ActivityController {

    private final ActivityLogService activityLogService;

    public ActivityController(ActivityLogService activityLogService) {
        this.activityLogService = activityLogService;
    }

    @GetMapping("/projects/{id}/activity")
    public List<ActivityLog> getProjectActivity(@PathVariable UUID id) {
        return activityLogService.findByEntityId(id);
    }

    @GetMapping("/workspaces/{id}/activity")
    public List<ActivityLog> getWorkspaceActivity(@PathVariable UUID id) {
        return activityLogService.findByEntityId(id);
    }

    @GetMapping("/users/me/activity")
    public List<ActivityLog> getMyActivity(Authentication auth) {
        return activityLogService.findRecent();
    }
}
