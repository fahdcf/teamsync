# Report formatting

ReportGenerator is a one-method interface implemented by JsonReportGenerator,
CsvReportGenerator and PdfReportGenerator. Their formatting bodies retain JSON
pretty printing, CSV quoting and UTF-8, and PDF generation/pagination. The previous
Template Method hierarchy and identity processData hooks are removed.

ReportExportFactory selects the formatter with its HTTP content type and extension.
ReportController resolves the requested format before calling ReportService,
preserving invalid-format handling order. ReportService enforces project access,
loads analytics and invokes the formatter. The controller uses the same descriptor
for response metadata. The formatting implementations do not access repositories,
services or HTTP response objects.
