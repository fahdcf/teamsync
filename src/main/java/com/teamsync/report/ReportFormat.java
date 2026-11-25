package com.teamsync.report;

import com.teamsync.exception.ValidationException;
import org.springframework.http.MediaType;

import java.util.Locale;

public enum ReportFormat {
    JSON(MediaType.APPLICATION_JSON), CSV(MediaType.parseMediaType("text/csv")), PDF(MediaType.APPLICATION_PDF);

    private final MediaType contentType;

    ReportFormat(MediaType contentType) {
        this.contentType = contentType;
    }

    public MediaType contentType() {
        return contentType;
    }

    public String extension() {
        return name().toLowerCase(Locale.ROOT);
    }

    public static ReportFormat parse(String value) {
        if (value == null) return JSON;
        try {
            return valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new ValidationException("format", "Report format must be json, csv, or pdf");
        }
    }
}
