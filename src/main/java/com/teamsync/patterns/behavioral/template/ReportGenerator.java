package com.teamsync.patterns.behavioral.template;

import java.util.Map;
import java.util.UUID;

public abstract class ReportGenerator {

    public final String generate(UUID projectId) {
        Map<String, Object> data = collectData(projectId);
        Map<String, Object> processed = processData(data);
        return formatOutput(processed);
    }

    protected abstract Map<String, Object> collectData(UUID projectId);
    protected abstract Map<String, Object> processData(Map<String, Object> data);
    protected abstract String formatOutput(Map<String, Object> processed);
}
