package com.teamsync.service;

import com.teamsync.domain.entity.Project;
import com.teamsync.patterns.behavioral.template.CsvReportGenerator;
import com.teamsync.patterns.behavioral.template.JsonReportGenerator;
import com.teamsync.patterns.behavioral.template.PdfReportGenerator;
import com.teamsync.patterns.behavioral.template.ReportGenerator;
import com.teamsync.patterns.creational.builder.Report;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.UUID;

@Service
public class ReportService {

    private final ProjectService projectService;
    private final JsonReportGenerator jsonGenerator;
    private final CsvReportGenerator csvGenerator;
    private final PdfReportGenerator pdfGenerator;

    public ReportService(ProjectService projectService,
                          JsonReportGenerator jsonGenerator,
                          CsvReportGenerator csvGenerator,
                          PdfReportGenerator pdfGenerator) {
        this.projectService = projectService;
        this.jsonGenerator = jsonGenerator;
        this.csvGenerator = csvGenerator;
        this.pdfGenerator = pdfGenerator;
    }

    public String generateReport(UUID projectId, String format) {
        Project project = projectService.getProject(projectId);

        Report report = com.teamsync.patterns.creational.builder.Report.builder()
                .withProject(project)
                .withFormat(format)
                .withSections("stats", "workload", "health")
                .withDateRange(LocalDate.now().minusMonths(1), LocalDate.now())
                .build();

        ReportGenerator generator = switch (format.toLowerCase()) {
            case "csv" -> csvGenerator;
            case "pdf" -> pdfGenerator;
            default -> jsonGenerator;
        };

        return generator.generate(projectId);
    }
}
