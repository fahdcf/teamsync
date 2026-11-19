package com.teamsync.report;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class JsonReportGenerator implements ReportGenerator {

    private final ObjectMapper objectMapper;

    public JsonReportGenerator(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public byte[] generate(Map<String, Object> processed) {
        try {
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(processed);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Could not generate report", e);
        }
    }
}
