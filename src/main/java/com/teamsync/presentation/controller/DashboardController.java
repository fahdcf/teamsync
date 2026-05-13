package com.teamsync.presentation.controller;

import com.teamsync.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Tag(name = "Dashboard", description = "Dashboard stats and overview data")
@RestController
@RequestMapping("/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @Operation(summary = "Get dashboard summary metrics for the authenticated user")
    @ApiResponse(responseCode = "200", description = "Dashboard stats returned")
    @GetMapping("/stats")
    public Map<String, Object> getStats(Authentication auth,
                                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return dashboardService.getStats(auth.getName(), from, to);
    }

    @Operation(summary = "List upcoming task deadlines (next 7 days) for the authenticated user")
    @ApiResponse(responseCode = "200", description = "Upcoming deadlines returned")
    @GetMapping("/upcoming-deadlines")
    public List<Map<String, Object>> getUpcomingDeadlines(Authentication auth,
                                                          @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                                          @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return dashboardService.getUpcomingDeadlines(auth.getName(), from, to);
    }

    @Operation(summary = "List up to 5 project overview entries for the authenticated user")
    @ApiResponse(responseCode = "200", description = "Project overview returned")
    @GetMapping("/projects-overview")
    public List<Map<String, Object>> getProjectsOverview(Authentication auth) {
        return dashboardService.getProjectsOverview(auth.getName());
    }

    @Operation(summary = "Get dashboard chart series for the authenticated user")
    @ApiResponse(responseCode = "200", description = "Dashboard chart series returned")
    @GetMapping("/chart-series")
    public Map<String, Object> getChartSeries(Authentication auth,
                                              @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                              @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return dashboardService.getChartSeries(auth.getName(), from, to);
    }

    @Operation(summary = "Get current work summaries for dashboard team members")
    @ApiResponse(responseCode = "200", description = "Team workload summaries returned")
    @GetMapping("/team-workload")
    public List<Map<String, Object>> getTeamWorkload(Authentication auth) {
        return dashboardService.getTeamWorkload(auth.getName());
    }
}
