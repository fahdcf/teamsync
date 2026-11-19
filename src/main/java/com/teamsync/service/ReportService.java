package com.teamsync.service;

import com.teamsync.report.ReportGenerator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.UUID;

@Service
@Transactional
@PreAuthorize("isAuthenticated()")
public class ReportService {

    private final AnalyticsService analyticsService;

    public ReportService(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @PreAuthorize("@permissions.readProject(#projectId)")
    public byte[] generateReport(UUID projectId, ReportGenerator generator) {
        return generator.generate(analyticsService.getProjectStats(projectId, null, null));
    }
}
