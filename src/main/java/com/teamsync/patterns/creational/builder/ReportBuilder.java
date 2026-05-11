package com.teamsync.patterns.creational.builder;

import com.teamsync.domain.entity.Project;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class ReportBuilder {

    String projectTitle;
    String format;
    List<String> sections = new ArrayList<>();
    LocalDate dateFrom;
    LocalDate dateTo;

    public ReportBuilder withProject(Project project) {
        this.projectTitle = project.getTitle();
        return this;
    }

    public ReportBuilder withFormat(String format) {
        this.format = format;
        return this;
    }

    public ReportBuilder withSections(String... sections) {
        this.sections.addAll(Arrays.asList(sections));
        return this;
    }

    public ReportBuilder withDateRange(LocalDate from, LocalDate to) {
        this.dateFrom = from;
        this.dateTo = to;
        return this;
    }

    public Report build() {
        if (projectTitle == null || projectTitle.isBlank()) {
            throw new IllegalStateException("Project title is required");
        }
        if (format == null || format.isBlank()) {
            throw new IllegalStateException("Format is required");
        }
        return new Report(this);
    }
}
