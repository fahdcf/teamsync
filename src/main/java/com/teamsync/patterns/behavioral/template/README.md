# Report formatting

ReportService authorizes the project and collects analytics. ReportGenerator receives
the resulting data and formats it as JSON, quoted CSV or a valid PDF. Formatters do
not call services or repositories. The unused report builder has been removed.
