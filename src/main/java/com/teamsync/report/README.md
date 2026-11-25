# Project report exports

`ProjectReportBuilder` assembles the requested sections from data retrieved by
`ReportService` after authorization. The controller selects a formatter and
applies the matching headers. JSON, CSV and PDF formatters accept the same
report data. Requests without sections use the original analytics payload.
