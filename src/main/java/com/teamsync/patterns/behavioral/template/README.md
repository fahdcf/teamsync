# Template Method Pattern

ReportGenerator.generate() is the template method — it calls collectData, processData, formatOutput in order.
Subclasses cannot change the order of steps, only what each step does.
JsonReportGenerator, CsvReportGenerator, PdfReportGenerator each implement the 3 abstract methods.
