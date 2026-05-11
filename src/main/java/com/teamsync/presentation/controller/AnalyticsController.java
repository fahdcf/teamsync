package com.teamsync.presentation.controller;

import com.teamsync.service.AnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Tag(name = "Analytics", description = "Project statistics, team workload, and health indicators")
@RestController
@RequestMapping("/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @Operation(summary = "Get project statistics (total tasks, by status, by priority, overdue, completion %)")
    @ApiResponse(responseCode = "200", description = "Stats returned")
    @GetMapping("/projects/{id}/stats")
    public Map<String, Object> getStats(@PathVariable UUID id) {
        return analyticsService.getProjectStats(id);
    }

    @Operation(summary = "Get per-member active and completed task counts for a project")
    @ApiResponse(responseCode = "200", description = "Workload data returned")
    @GetMapping("/projects/{id}/team-workload")
    public List<Map<String, Object>> getTeamWorkload(@PathVariable UUID id) {
        return analyticsService.getTeamWorkload(id);
    }

    @Operation(summary = "Get project health indicator (ON_TRACK, AT_RISK, or DELAYED)")
    @ApiResponse(responseCode = "200", description = "Health status returned")
    @GetMapping("/projects/{id}/health")
    public Map<String, Object> getHealth(@PathVariable UUID id) {
        return analyticsService.getProjectHealth(id);
    }
}
