package com.teamsync.patterns.behavioral.template;

import java.util.Map;

public abstract class ReportGenerator {

    public final byte[] generate(Map<String, Object> data) {
        Map<String, Object> processed = processData(data);
        return formatOutput(processed);
    }

    protected abstract Map<String, Object> processData(Map<String, Object> data);
    protected abstract byte[] formatOutput(Map<String, Object> processed);
}
