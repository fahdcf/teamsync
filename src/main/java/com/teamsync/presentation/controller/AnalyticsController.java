package com.teamsync.presentation.controller;

import com.teamsync.service.AnalyticsService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/projects/{id}/stats")
    public Map<String, Object> getStats(@PathVariable UUID id) {
        return analyticsService.getProjectStats(id);
    }

    @GetMapping("/projects/{id}/team-workload")
    public List<Map<String, Object>> getTeamWorkload(@PathVariable UUID id) {
        return analyticsService.getTeamWorkload(id);
    }

    @GetMapping("/projects/{id}/health")
    public Map<String, Object> getHealth(@PathVariable UUID id) {
        return analyticsService.getProjectHealth(id);
    }
}
