package com.teamsync.report;

import java.nio.charset.StandardCharsets;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class CsvReportGenerator implements ReportGenerator {

    @Override
    public byte[] generate(Map<String, Object> processed) {
        StringBuilder sb = new StringBuilder("field,value\n");
        processed.forEach((k, v) -> sb.append(escape(k)).append(",").append(escape(String.valueOf(v))).append("\n"));
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private String escape(String value) {
        return "\"" + value.replace("\"", "\"\"") + "\"";
    }
}
