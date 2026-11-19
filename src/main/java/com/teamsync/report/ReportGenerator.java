package com.teamsync.report;

import java.util.Map;

public interface ReportGenerator {
    byte[] generate(Map<String, Object> data);
}
