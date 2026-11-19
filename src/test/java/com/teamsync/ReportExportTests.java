package com.teamsync;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.teamsync.controller.ReportController;
import com.teamsync.exception.ValidationException;
import com.teamsync.patterns.creational.factory.ReportExportFactory;
import com.teamsync.report.CsvReportGenerator;
import com.teamsync.report.JsonReportGenerator;
import com.teamsync.report.PdfReportGenerator;
import com.teamsync.service.ReportService;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.text.PDFTextStripper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.HttpHeaders;

import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class ReportExportTests {
    private final ObjectMapper json = new ObjectMapper();
    private final JsonReportGenerator jsonGenerator = new JsonReportGenerator(json);
    private final CsvReportGenerator csvGenerator = new CsvReportGenerator();
    private final PdfReportGenerator pdfGenerator = new PdfReportGenerator();
    private final ReportExportFactory factory = new ReportExportFactory(jsonGenerator, csvGenerator, pdfGenerator);

    @ParameterizedTest @ValueSource(strings = {"json", " CSV ", "pDf"})
    void factoryKeepsFormatterMetadataHeadersAndBytesTogether(String requested) {
        String format = requested.trim().toLowerCase(java.util.Locale.ROOT);
        var export = factory.resolve(requested);
        var generator = switch (format) {
            case "csv" -> csvGenerator;
            case "pdf" -> pdfGenerator;
            default -> jsonGenerator;
        };
        assertThat(export.generator()).isSameAs(generator);
        assertThat(export.extension()).isEqualTo(format);
        assertThat(export.contentType().toString()).isEqualTo(switch (format) {
            case "csv" -> "text/csv";
            case "pdf" -> "application/pdf";
            default -> "application/json";
        });
        UUID projectId = UUID.randomUUID();
        byte[] content = {0, 1, 2, 3};
        ReportService reports = mock(ReportService.class);
        when(reports.generateReport(projectId, generator)).thenReturn(content);
        ReportController controller = new ReportController(reports, factory);
        var inline = controller.generateReport(projectId, requested, false);
        assertThat(inline.getStatusCode().value()).isEqualTo(200);
        assertThat(inline.getBody()).isSameAs(content);
        assertThat(inline.getHeaders().getContentType()).isEqualTo(export.contentType());
        assertThat(inline.getHeaders()).doesNotContainKey(HttpHeaders.CONTENT_DISPOSITION);
        var download = controller.generateReport(projectId, requested, true);
        assertThat(download.getBody()).isSameAs(content);
        assertThat(download.getHeaders().getFirst(HttpHeaders.CONTENT_DISPOSITION))
                .isEqualTo("attachment; filename=\"teamsync-project-report-" + projectId + "." + format + "\"");
    }

    @Test void nullFormatDefaultsToJson() {
        assertThat(factory.resolve(null).generator()).isSameAs(jsonGenerator);
    }

    @ParameterizedTest @ValueSource(strings = {"", " ", "xml", "json.exe"})
    void invalidFormatsKeepValidationAndDoNotFetchAnalytics(String format) {
        ReportService reports = mock(ReportService.class);
        ReportController controller = new ReportController(reports, factory);
        assertThatThrownBy(() -> controller.generateReport(UUID.randomUUID(), format, false))
                .isInstanceOf(ValidationException.class)
                .satisfies(ex -> assertThat(((ValidationException) ex).getErrors())
                        .containsExactly(new ValidationException.FieldError("format", "Report format must be json, csv, or pdf")));
        verifyNoInteractions(reports);
    }

    @Test void jsonKeepsPrettyPrintingAndCsvKeepsExactEscapingAndUtf8() throws Exception {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("title", "Café, \"quoted\"\nnext line");
        data.put("count", 2);
        byte[] jsonBytes = jsonGenerator.generate(data);
        assertThat(json.readTree(jsonBytes).get("title").asText()).isEqualTo(data.get("title"));
        assertThat(new String(jsonBytes, StandardCharsets.UTF_8)).contains(System.lineSeparator()+"  \"title\"");
        assertThat(new String(csvGenerator.generate(data), StandardCharsets.UTF_8))
                .isEqualTo("field,value\n\"title\",\"Café, \"\"quoted\"\"\nnext line\"\n\"count\",\"2\"\n");
    }

    @Test void pdfKeepsPaginationWrappingAndUnsupportedCharacterReplacement() throws Exception {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("title", "Café");
        IntStream.range(0, 50).forEach(i -> data.put("field"+i, "value"+i));
        try (var document = Loader.loadPDF(pdfGenerator.generate(data))) {
            assertThat(document.getNumberOfPages()).isEqualTo(2);
            assertThat(new PDFTextStripper().getText(document))
                    .contains("TeamSync project report", "title: Caf?", "field49: value49");
        }
    }
}
