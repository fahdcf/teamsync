package com.teamsync.service;

import com.teamsync.report.ProjectReportBuilder;
import com.teamsync.report.ReportGenerator;
import com.teamsync.report.ReportSection;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.UUID;
import java.util.Set;

@Service
@Transactional
@PreAuthorize("isAuthenticated()")
public class ReportService {

    private final AnalyticsService analyticsService;
    private final ProjectService projectService;
    private final ActivityLogService activityLogService;

    public ReportService(AnalyticsService analyticsService, ProjectService projectService, ActivityLogService activityLogService) {
        this.analyticsService = analyticsService;
        this.projectService = projectService;
        this.activityLogService = activityLogService;
    }

    @PreAuthorize("@permissions.readProject(#projectId)")
    public byte[] generateReport(UUID projectId, ReportGenerator generator, Set<ReportSection> sections) {
        if (sections.isEmpty()) {
            return generator.generate(analyticsService.getProjectStats(projectId, null, null));
        }

        var project = projectService.getProject(projectId);
        var builder = new ProjectReportBuilder();
        if (sections.contains(ReportSection.OVERVIEW)) builder.overview(project);
        if (sections.contains(ReportSection.TASK_STATS)) builder.taskStats(analyticsService.getProjectStats(projectId, null, null));
        if (sections.contains(ReportSection.PROGRESS)) builder.progress(project);
        if (sections.contains(ReportSection.RECENT_ACTIVITY)) builder.recentActivity(activityLogService.findDTOsByEntityId(projectId));
        return generator.generate(builder.build());
    }
}
