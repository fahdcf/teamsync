package com.teamsync.patterns.creational.builder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class Report {

    private final String projectTitle;
    private final LocalDateTime generatedAt;
    private final String format;
    private final List<String> sections;
    private final LocalDate dateFrom;
    private final LocalDate dateTo;

    Report(ReportBuilder builder) {
        this.projectTitle = builder.projectTitle;
        this.generatedAt = LocalDateTime.now();
        this.format = builder.format;
        this.sections = builder.sections;
        this.dateFrom = builder.dateFrom;
        this.dateTo = builder.dateTo;
    }

    public String getProjectTitle() { return projectTitle; }
    public LocalDateTime getGeneratedAt() { return generatedAt; }
    public String getFormat() { return format; }
    public List<String> getSections() { return sections; }
    public LocalDate getDateFrom() { return dateFrom; }
    public LocalDate getDateTo() { return dateTo; }

    @Override
    public String toString() {
        return "Report{project='" + projectTitle + "', format='" + format
                + "', sections=" + sections + ", generated=" + generatedAt + "}";
    }

    public static ReportBuilder builder() {
        return new ReportBuilder();
    }
}
