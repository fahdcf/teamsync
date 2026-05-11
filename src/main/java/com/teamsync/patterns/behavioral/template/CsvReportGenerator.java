package com.teamsync.patterns.behavioral.template;

import com.teamsync.service.AnalyticsService;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;

@Component
public class CsvReportGenerator extends ReportGenerator {

    private final AnalyticsService analyticsService;

    public CsvReportGenerator(AnalyticsService analyticsService) {
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
        StringBuilder sb = new StringBuilder("field,value\n");
        processed.forEach((k, v) -> sb.append(k).append(",").append(v).append("\n"));
        return sb.toString();
    }
}
