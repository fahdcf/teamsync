package com.teamsync.report;

import com.teamsync.dto.ActivityLogResponseDTO;
import com.teamsync.entity.Project;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class ProjectReportBuilder {
    private final Map<String, Object> sections = new LinkedHashMap<>();

    public ProjectReportBuilder overview(Project project) {
        Map<String, Object> overview = new LinkedHashMap<>();
        overview.put("projectId", project.getId());
        overview.put("title", project.getTitle());
        overview.put("description", project.getDescription());
        overview.put("status", project.getStatus());
        sections.put("overview", overview);
        return this;
    }

    public ProjectReportBuilder taskStats(Map<String, Object> analytics) {
        Map<String, Object> stats = new LinkedHashMap<>();
        for (String key : List.of("totalTasks", "byStatus", "byPriority", "overdueCount", "completionPercent")) {
            stats.put(key, analytics.get(key));
        }
        sections.put("taskStats", stats);
        return this;
    }

    public ProjectReportBuilder progress(Project project) {
        Map<String, Object> progress = new LinkedHashMap<>();
        progress.put("percent", project.getProgress());
        progress.put("deadline", project.getDeadline());
        sections.put("progress", progress);
        return this;
    }

    public ProjectReportBuilder recentActivity(List<ActivityLogResponseDTO> activity) {
        sections.put("recentActivity", activity.stream().limit(10)
                .map(entry -> Map.of("action", entry.getAction(), "createdAt", entry.getCreatedAt()))
                .toList());
        return this;
    }

    public Map<String, Object> build() {
        return Collections.unmodifiableMap(new LinkedHashMap<>(sections));
    }
}
