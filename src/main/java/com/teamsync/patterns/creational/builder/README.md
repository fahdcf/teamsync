# Builder Pattern

Report has many optional fields and a private constructor.
ReportBuilder provides a fluent API to construct it step by step.
build() validates that required fields are set before creating the Report object.
No telescoping constructors, no partially-initialized objects.
