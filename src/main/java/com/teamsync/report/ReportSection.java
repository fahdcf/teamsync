package com.teamsync.report;

import com.teamsync.exception.ValidationException;

import java.util.EnumSet;
import java.util.Locale;
import java.util.Set;

public enum ReportSection {
    OVERVIEW, TASK_STATS, PROGRESS, RECENT_ACTIVITY;

    public static Set<ReportSection> parse(String value) {
        if (value == null) return Set.of();
        Set<ReportSection> sections = EnumSet.noneOf(ReportSection.class);
        for (String section : value.split(",", -1)) {
            try {
                sections.add(valueOf(section.trim().toUpperCase(Locale.ROOT)));
            } catch (IllegalArgumentException ex) {
                throw new ValidationException("sections", "Choose from overview, task_stats, progress, and recent_activity");
            }
        }
        return sections;
    }
}
