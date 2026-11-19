# Report export Simple Factory

ReportExportFactory resolves JSON, CSV or PDF to one immutable Format descriptor:
the existing formatter, content type and filename extension. ReportController uses
its metadata and passes the formatter to the authorized ReportService, which loads
analytics and generates the response bytes. There is one format registry instead
of separate service/controller switches and repeated normalization.

This is a Simple Factory, not GoF Factory Method. Adding an export requires a
ReportGenerator implementation and one registry entry. Notification construction
uses no factory or inheritance. See docs/DESIGN_PATTERNS.md at the repository root.
