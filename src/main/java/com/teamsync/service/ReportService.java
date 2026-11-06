package com.teamsync.service;

import java.util.Locale;
import com.teamsync.exception.ValidationException;
import com.teamsync.patterns.behavioral.template.CsvReportGenerator;
import com.teamsync.patterns.behavioral.template.JsonReportGenerator;
import com.teamsync.patterns.behavioral.template.PdfReportGenerator;
import com.teamsync.patterns.behavioral.template.ReportGenerator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.Set;
import java.util.UUID;

@Service
@Transactional
@PreAuthorize("isAuthenticated()")
public class ReportService {

    private final AnalyticsService analyticsService;
    private final JsonReportGenerator jsonGenerator;
    private final CsvReportGenerator csvGenerator;
    private final PdfReportGenerator pdfGenerator;

    public ReportService(AnalyticsService analyticsService,
                          JsonReportGenerator jsonGenerator,
                          CsvReportGenerator csvGenerator,
                          PdfReportGenerator pdfGenerator) {
        this.analyticsService = analyticsService;
        this.jsonGenerator = jsonGenerator;
        this.csvGenerator = csvGenerator;
        this.pdfGenerator = pdfGenerator;
    }

    @PreAuthorize("@permissions.readProject(#projectId)")
    public byte[] generateReport(UUID projectId, String format) {
        String normalizedFormat = normalizeFormat(format);
        ReportGenerator generator = switch (normalizedFormat) {
            case "csv" -> csvGenerator;
            case "pdf" -> pdfGenerator;
            default -> jsonGenerator;
        };

        return generator.generate(analyticsService.getProjectStats(projectId, null, null));
    }

    public String normalizeFormat(String format) {
        String normalized = format == null ? "json" : format.trim().toLowerCase(Locale.ROOT);
        if (!Set.of("json", "csv", "pdf").contains(normalized)) {
            throw new ValidationException("format", "Report format must be json, csv, or pdf");
        }
        return normalized;
    }
}
