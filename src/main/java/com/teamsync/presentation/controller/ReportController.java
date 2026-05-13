package com.teamsync.presentation.controller;

import com.teamsync.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Tag(name = "Reports", description = "Project report generation (Builder + Template Method patterns)")
@RestController
@RequestMapping("/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @Operation(summary = "Generate a project report in json, csv, or pdf format")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Report generated"),
        @ApiResponse(responseCode = "404", description = "Project not found")
    })
    @GetMapping("/projects/{id}")
    public ResponseEntity<String> generateReport(@PathVariable UUID id,
                                                 @RequestParam(defaultValue = "json") String format,
                                                 @RequestParam(defaultValue = "false") boolean download) {
        String normalizedFormat = reportService.normalizeFormat(format);
        String report = reportService.generateReport(id, normalizedFormat);
        MediaType mediaType = switch (normalizedFormat) {
            case "csv" -> MediaType.parseMediaType("text/csv");
            case "pdf" -> MediaType.APPLICATION_PDF;
            default -> MediaType.APPLICATION_JSON;
        };
        ResponseEntity.BodyBuilder response = ResponseEntity.ok().contentType(mediaType);
        if (download) {
            response.header(HttpHeaders.CONTENT_DISPOSITION,
                    "attachment; filename=\"teamsync-project-report-" + id + "." + normalizedFormat + "\"");
        }
        return response.body(report);
    }
}
