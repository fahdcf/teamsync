package com.teamsync.patterns.behavioral.template;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.teamsync.service.AnalyticsService;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;

@Component
public class JsonReportGenerator extends ReportGenerator {

    private final AnalyticsService analyticsService;
    private final ObjectMapper objectMapper;

    public JsonReportGenerator(AnalyticsService analyticsService, ObjectMapper objectMapper) {
        this.analyticsService = analyticsService;
        this.objectMapper = objectMapper;
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
        try {
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(processed);
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }
}
