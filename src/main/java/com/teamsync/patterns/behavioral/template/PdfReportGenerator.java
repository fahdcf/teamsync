package com.teamsync.patterns.behavioral.template;

import com.teamsync.service.AnalyticsService;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;

@Component
public class PdfReportGenerator extends ReportGenerator {

    private final AnalyticsService analyticsService;

    public PdfReportGenerator(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @Override
    protected Map<String, Object> collectData(UUID projectId) {
        return analyticsService.getProjectStats(projectId);
    }

    @Override
    protected Map<String, Object> processData(Map<String, Object> data) {
        return data;
    }

    @Override
    protected String formatOutput(Map<String, Object> processed) {
        return "PDF REPORT: " + processed.toString();
    }
}
