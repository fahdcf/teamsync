package com.teamsync.patterns.behavioral.template;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class JsonReportGenerator extends ReportGenerator {

    private final ObjectMapper objectMapper;

    public JsonReportGenerator(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    protected Map<String, Object> processData(Map<String, Object> data) {
        return data;
    }

    @Override
    protected byte[] formatOutput(Map<String, Object> processed) {
        try {
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(processed);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Could not generate report", e);
        }
    }
}
