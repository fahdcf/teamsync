package com.teamsync.controller;

import com.teamsync.service.ReportService;
import com.teamsync.report.CsvReportGenerator;
import com.teamsync.report.JsonReportGenerator;
import com.teamsync.report.PdfReportGenerator;
import com.teamsync.report.ReportFormat;
import com.teamsync.report.ReportGenerator;
import com.teamsync.report.ReportSection;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;
import java.util.Map;

@Tag(name = "Reports", description = "Authorized project reports in JSON, CSV, and PDF")
@RestController
@RequestMapping("/reports")
public class ReportController {

    private final ReportService reportService;
    private final Map<ReportFormat, ReportGenerator> generators;

    public ReportController(ReportService reportService, JsonReportGenerator json, CsvReportGenerator csv, PdfReportGenerator pdf) {
        this.reportService = reportService;
        this.generators = Map.of(ReportFormat.JSON, json, ReportFormat.CSV, csv, ReportFormat.PDF, pdf);
    }

    @Operation(summary = "Generate a project report in json, csv, or pdf format")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Report generated"),
        @ApiResponse(responseCode = "404", description = "Project not found")
    })
    @GetMapping("/projects/{id}")
    public ResponseEntity<byte[]> generateReport(@PathVariable UUID id,
                                                 @RequestParam(defaultValue = "json") String format,
                                                 @RequestParam(defaultValue = "false") boolean download,
                                                 @RequestParam(required = false) String sections) {
        ReportFormat export = ReportFormat.parse(format);
        byte[] report = reportService.generateReport(id, generators.get(export), ReportSection.parse(sections));
        ResponseEntity.BodyBuilder response = ResponseEntity.ok().contentType(export.contentType());
        if (download) {
            response.header(HttpHeaders.CONTENT_DISPOSITION,
                    "attachment; filename=\"teamsync-project-report-" + id + "." + export.extension() + "\"");
        }
        return response.body(report);
    }
}
