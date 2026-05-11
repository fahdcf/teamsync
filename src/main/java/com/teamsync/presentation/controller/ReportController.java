package com.teamsync.presentation.controller;

import com.teamsync.service.ReportService;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/projects/{id}")
    public String generateReport(@PathVariable UUID id,
                                  @RequestParam(defaultValue = "json") String format) {
        return reportService.generateReport(id, format);
    }
}
