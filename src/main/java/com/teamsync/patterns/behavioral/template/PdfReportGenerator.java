package com.teamsync.patterns.behavioral.template;

import java.io.IOException;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.PDPage;
import java.util.ArrayList;
import java.util.List;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import java.io.ByteArrayOutputStream;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class PdfReportGenerator extends ReportGenerator {

    @Override
    protected Map<String, Object> processData(Map<String, Object> data) {
        return data;
    }

    @Override
    protected byte[] formatOutput(Map<String, Object> processed) {
        try (var document = new PDDocument();
             var output = new ByteArrayOutputStream()) {
            var font = new PDType1Font(
                    Standard14Fonts.FontName.HELVETICA);
            List<String> lines = new ArrayList<>();
            lines.add("TeamSync project report");
            processed.forEach((key, value) -> {
                String text = (key + ": " + value).replaceAll("[^\\x20-\\x7E]", "?");
                for (int start = 0; start < text.length(); start += 90)
                    lines.add(text.substring(start, Math.min(start + 90, text.length())));
            });
            for (int offset = 0; offset < lines.size(); offset += 45) {
                var page = new PDPage();
                document.addPage(page);
                try (var stream = new PDPageContentStream(document, page)) {
                    stream.beginText();
                    stream.setFont(font, 10);
                    stream.setLeading(15);
                    stream.newLineAtOffset(40, 750);
                    for (int index = offset; index < Math.min(offset + 45, lines.size()); index++) {
                        stream.showText(lines.get(index));
                        stream.newLine();
                    }
                    stream.endText();
                }
            }
            document.save(output);
            return output.toByteArray();
        } catch (IOException ex) {
            throw new IllegalStateException("Could not generate report", ex);
        }
    }
}
