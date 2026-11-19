package com.teamsync.patterns.creational.factory;

import com.teamsync.exception.ValidationException;
import com.teamsync.report.CsvReportGenerator;
import com.teamsync.report.JsonReportGenerator;
import com.teamsync.report.PdfReportGenerator;
import com.teamsync.report.ReportGenerator;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;

import java.util.Locale;
import java.util.Map;

/** Simple Factory: keeps each real export's formatter and HTTP metadata together. */
@Component
public class ReportExportFactory {
    private final Map<String, Format> formats;

    public ReportExportFactory(JsonReportGenerator json, CsvReportGenerator csv, PdfReportGenerator pdf) {
        formats = Map.of(
                "json", new Format(json, MediaType.APPLICATION_JSON, "json"),
                "csv", new Format(csv, MediaType.parseMediaType("text/csv"), "csv"),
                "pdf", new Format(pdf, MediaType.APPLICATION_PDF, "pdf"));
    }

    public Format resolve(String requestedFormat) {
        String name = requestedFormat == null ? "json" : requestedFormat.trim().toLowerCase(Locale.ROOT);
        Format format = formats.get(name);
        if (format == null) {
            throw new ValidationException("format", "Report format must be json, csv, or pdf");
        }
        return format;
    }

    public record Format(ReportGenerator generator, MediaType contentType, String extension) {}
}
