# Current design patterns

TeamSync uses Spring Boot controllers for HTTP, services for authorization and
transactions, and repositories for persistence. The public `/patterns` catalogue
uses the same response fields and IDs for existing entries.

| Pattern | Main classes | Product behavior |
| --- | --- | --- |
| Singleton | `AppLogger` | Shared application logging |
| Prototype | `CloneableTask`, `TaskTemplate` | Copy a task template into a new task |
| Simple Factory | `WorkspaceStarterKitFactory`, `StarterProject` | Prepare the project and task plan for a new workspace |
| Observer | Spring `ApplicationEventPublisher`, `ProjectEvent`, `NotificationListener` | Create assignee notifications in the publishing transaction |
| Strategy | `AssignmentStrategy`, `WorkloadStrategy`, `RoundRobinStrategy`, `TaskAssignmentService` | Select a task assignee using the requested algorithm |
| State | `TaskStateMachine`, `TaskState` | Let the current task state validate its next move |
| Command | `TaskCommandInvoker`, assignment, status and deletion commands | Undo a committed task operation |
| Builder | `ProjectReportBuilder`, `ReportSection` | Assemble the sections a user picked for a project export |

## Starter kits

When you create a workspace, you can choose Software Development, University
Project, Event Planning, or Empty Workspace in either creation form.
`POST /workspaces` accepts an optional `starterKit` in the existing request body.
Supported values are `SOFTWARE_DEVELOPMENT`, `UNIVERSITY_PROJECT`, and
`EVENT_PLANNING`. Omit the field or send null to create an empty workspace.
Unknown choices return 400.

`WorkspaceStarterKitFactory` turns the choice into a list of starter projects
and task titles. `WorkspaceCreationService` uses the existing workspace,
project and task services to save them. The caller owns the workspace and
manages its starter projects. The starter tasks are ordinary TODO tasks.
An error rolls back the workspace, projects, tasks and their audit records
together. The forms also guard against repeated submits while a request is in
flight. Independent successful requests remain separate workspace creations.

In an interview, describe the factory as a method that converts a kit name
into a setup plan. Adding a kit changes that method. The same services handle
authorization, validation and saving for every plan.

## Task lifecycle

| Current status | Possible next statuses |
| --- | --- |
| TODO | IN_PROGRESS |
| IN_PROGRESS | IN_REVIEW, BLOCKED |
| BLOCKED | IN_PROGRESS |
| IN_REVIEW | DONE, IN_PROGRESS |
| DONE | None |

Starting a TODO task still requires completed dependencies. A task must now have
all subtasks completed to enter review or move from review to DONE. Work can
return from review to IN_PROGRESS even with open subtasks. Existing tasks can
still be edited, assigned or deleted under the existing permissions. Status
changes during task creation, task edits and the status endpoint use the same
rules. Status changes and subtask writes acquire the same parent task row lock.

In an interview, explain that the state machine looks up a reusable state object
for the persisted status. That object decides what the task may do next. TODO
checks dependencies and IN_PROGRESS and IN_REVIEW check the subtask list at
their respective checkpoints. The task service and Command own persistence.
Undo restores the recorded prior status after checking the current status and
the original dependency rule. It does not replay a forward transition or
overwrite later changes to subtasks. No database columns were added.

## Project reports

In Analytics, open Reports, turn on Customize download sections, select at least
one section, and download JSON, CSV or PDF. The on-screen preview continues
to show the default report. The optional comma-separated `sections` query
parameter supports `overview`, `task_stats`, `progress`, and `recent_activity`.
An explicit empty or invalid selection returns 400. Omit it for the original
analytics report. Recent activity includes up to ten entries logged against
the project itself, with action and timestamp.

In an interview, describe the builder as a way to add content in steps. The
controller validates the options and chooses the formatter. The report service
checks project access and retrieves data for the selected sections. Each builder
method adds one section. The builder returns the content and the formatter
writes JSON, CSV or PDF. Adding a section does not require changing each
formatter. The endpoint, media types and download filenames are preserved.

## Existing behavior and limits

In-app notifications join their publishing transaction. If it rolls back, the
notifications and audit records roll back too. Undo history is updated only
after commit. It holds ten commands per user and is process-local. Deletion
undo restores records with new IDs. The round-robin counter is also process-local
and resets on restart. Workload assignment uses a grouped query scoped to the
task's workspace.

Earlier design-pattern cleanup decisions and verification are recorded in
[commit a813cd6](https://github.com/fahdcf/teamsync/blob/a813cd6e4957b857201fa89e1df7dd77542f1701/docs/DESIGN_PATTERNS.md).
