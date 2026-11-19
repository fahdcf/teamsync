# Current design patterns and cleanup

The current checkout is a layered Spring Boot application. Its design patterns
support working features; there is no target pattern count. The historical French
pattern report remains archived. Security and integration reports describe their
dated migration milestones rather than the current pattern inventory.

## Retained patterns

| Pattern | Actual classes | Application problem |
| --- | --- | --- |
| Singleton | `AppLogger` | Shared application logging; implementation unchanged |
| Prototype | `CloneableTask`, `TaskTemplate.cloneTask()` | Copy reusable task templates; implementation and integrations unchanged |
| Simple Factory | `ReportExportFactory`, its immutable `Format` descriptor | Resolve a real export formatter and its content type/extension together |
| Observer using Spring events | `ApplicationEventPublisher`, `ProjectEvent`, `NotificationListener` | Persist assignee notifications without making task/comment services depend on notification persistence |
| Strategy | `AssignmentStrategy`, `WorkloadStrategy`, `RoundRobinStrategy`, `TaskAssignmentService` | Select between the two existing auto-assignment algorithms |
| Command | `TaskCommand`, `TaskCommandInvoker`, `AssignTaskCommand`, `ChangeStatusCommand`, `DeleteTaskCommand` | Undo committed assignment, status and deletion operations; implementation unchanged |

`TaskStateMachine` is now a table-driven state machine, not GoF State. The report
formatters implement a focused `ReportGenerator` interface, not Template Method.
`/patterns` reports six retained patterns with the same fields, categories and
stable IDs for retained entries. The existing Angular page renders this data
dynamically and needs no changes.

## Report factory and request flow

Previously ReportService selected concrete generators with one switch while
ReportController separately selected content types with another switch. Both
layers normalized the requested format, and the controller inferred extensions
from the same string. Adding a format required coordinating those decisions.

ReportExportFactory now owns one registry binding each format name to its existing
generator, media type and extension. It accepts the same case-insensitive trimmed
names, defaults a null request to JSON, and preserves invalid-format errors.
This is a **Simple Factory**, not GoF Factory Method or Abstract Factory. There is
no creator inheritance or plugin-discovery infrastructure. A new format needs a
ReportGenerator implementation and its factory registration, with the supported
format validation message updated accordingly.

1. `GET /reports/projects/{id}?format=csv&download=true` reaches ReportController.
2. The factory resolves/validates the requested format before project access is
   checked, preserving the previous error ordering.
3. The controller passes the selected ReportGenerator to ReportService.
4. The Spring service proxy enforces the unchanged `readProject` authorization;
   the existing transaction loads the authorized analytics.
5. The selected formatter produces the response bytes without accessing services
   or repositories.
6. The controller uses the same factory descriptor for content type and optional
   `attachment; filename="teamsync-project-report-{id}.{extension}"` header.

JSON, CSV and PDF formatting bodies are unchanged. JSON pretty printing, quoted
CSV escaping/UTF-8, and PDF pagination, wrapping and unsupported-character handling
are retained. The identity `processData` hook and redundant abstract formatting
hook were removed. Formatters live in `com.teamsync.report` rather than a package
named for a removed pattern. PDF generation retains its existing per-document
metadata; no new byte-rewriting or delivery layer is introduced.

## Notifications and event timing

NotificationService directly constructs and saves notification records. Both
stored notification types, unread retrieval and mark-read behavior remain. EMAIL
is a stored type, not proof of external delivery. There is no SMTP or provider
integration and no successful-delivery log. The old notification factory, mock
email adapter and sending decorators are removed. `notifyWithPriority` had no
callers and is removed with its dead composition path.

ProjectEvent identifies a recipient explicitly and carries the intended message.
The authenticated actor remains in the service-written audit record. Assignment
and status changes notify the assignee with the existing notification text.
Comments notify a different assignee once with the existing comment message;
the previous erroneous author self-notification is removed. Replies retain their
existing behavior. Task creation and project updates no longer publish events
with no consumers. Unassigned status changes publish no notification event, and
the listener defensively ignores events without a recipient.

The ordinary Spring `@EventListener` is deliberately synchronous. Notification
persistence joins the publishing transaction and rolls back with the task,
comment and audit writes. There is no external I/O to defer. Switching to
after-commit delivery would require a new persistence transaction and change
atomicity without solving an existing delivery problem.

## Assignment, state and undo

AssignmentStrategy no longer exposes a repository parameter to every algorithm.
Only WorkloadStrategy needs TaskRepository, and it obtains all candidates'
IN_PROGRESS counts in a single grouped workspace-scoped query. Other statuses,
other workspaces and noncandidates do not affect selection. Zero-load candidates
and first-candidate tie breaking retain their previous behavior.

TaskAssignmentService selects reused Spring-managed strategy instances with a
simple switch. RoundRobinStrategy uses concurrent per-project atomic counters,
not static state shared by separately created objects. Candidate eligibility,
owner inclusion, task/project consistency checks, service permissions, transactions
and pessimistic task locks remain in their existing layers.

TaskStateMachine centralizes precisely these transitions:

| From | Allowed targets |
| --- | --- |
| TODO | IN_PROGRESS |
| IN_PROGRESS | IN_REVIEW, BLOCKED |
| BLOCKED | IN_PROGRESS |
| IN_REVIEW | DONE, IN_PROGRESS |
| DONE | None |

The existing invalid-transition messages, dependency check when starting TODO,
and undo checks are unchanged. In particular, BLOCKED-to-IN_PROGRESS does not gain
a new dependency restriction. Commands continue to call the same state machine.

Command code remains unchanged after review: history publishes only after commit,
undo reserves its exact command while doing database work without the history
monitor, and failed undo transactions retain history for retry. Current permissions
and restored-assignee eligibility are still checked through TaskUndoService.

Remaining limits are explicit: round-robin counters and undo history are local to
one process and reset on restart. Counter increments are not rolled back, and
membership/order changes can change the next candidate. Counters are retained for
projects seen by the process. Workload assignment remains best effort: independent
task transactions can choose the same least-loaded person. History holds at most
ten commands per user; restoring deleted resources creates new IDs. No distributed
scheduler, persistent history or capacity reservations are introduced.

## Concrete SOLID improvements

- Single responsibility: notification persistence has no mock delivery or
  decorator composition. Factory configuration, authorized analytics retrieval,
  output formatting and HTTP response construction have distinct owners.
- Open/closed: report formats implement one small contract and register once;
  there are no duplicated selection switches or speculative plugin interfaces.
- Substitution: every report formatter accepts analytics and returns bytes;
  there are no mandatory no-op processing hooks. Both assignment strategies return
  one supplied candidate or preserve the existing no-candidates exception.
- Interface segregation: ReportGenerator has one method; AssignmentStrategy no
  longer requires a repository argument unused by round-robin.
- Dependency inversion: ReportService operates on ReportGenerator rather than
  importing and selecting three concrete implementations. No single-implementation
  service interface or new architectural layer is added.

## Verification

- Observer transaction review (2026-11-19): no production-code timing defect was
  found. The listener runs in the caller's thread and its proxied persistence
  service uses the existing REQUIRED transaction. An immediate listener
  authentication failure rolls back the earlier task, notification and audit
  writes. A separate regression test lets dispatch return, then forces the real
  database commit to fail; all writes roll back and no undo history is published.
  Listener completion is therefore not treated as proof of a successful commit.
- Original backend baseline: 58 tests passed.
- State characterization against the old hierarchy: all 25 status pairs plus
  dependency, undo and null-target cases passed (28 cases total).
- `mvn -B clean verify -DargLine=-Xmx512m`: 117 tests pass, no failures, errors or
  skips; executable Spring Boot JAR produced. Tests use the existing isolated H2
  profile. PostgreSQL verification was not run in this local cleanup.
- Existing Angular tests: 65 tests pass across 15 files. The source-identical
  frontend copy and dependencies were placed on D: because C: ran out of space
  during installation. No frontend source or lockfile was changed.
- Regression coverage includes actual event notification persistence/retrieval,
  null and absent recipients, rollback of assignment/status/comment notifications
  and audits, immediate listener failure and deferred commit failure, committed
  undo-history rollback/retry, grouped workload scope,
  concurrent round-robin calls, all status transitions, JSON/CSV/PDF output,
  factory validation, exact export headers/filenames, and existing authorization.
- HTTP mapping/request annotations, existing security policies, transaction
  configuration, entities, schema and dependencies are preserved. Formatter method
  bodies match the originals. Singleton, Prototype, Command code and all frontend
  files are checked byte-for-byte against the starting checkout.

## Files changed in this cleanup

Paths below are relative to the repository root. Four report Java files and their
README move from `patterns/behavioral/template/` to `report/`; they are not removed
features. The initial cleanup was left uncommitted; the subsequent Observer review
and delivery to main were explicitly requested separately.

| Paths | Reason |
| --- | --- |
| `README.md` | Current pattern inventory link and accurate email limitation |
| `docs/DESIGN_PATTERNS.md` | Current inventory, decisions, flow, limitations and verification |
| `docs/SECURITY_AUDIT.md`, `docs/REFACTOR_COMPLETION.md` | Identify the historical milestone and link to current pattern documentation |
| `src/main/java/com/teamsync/controller/PatternsController.java` | Accurate six-pattern catalogue with compatible response fields |
| `src/main/java/com/teamsync/controller/ReportController.java` | One factory descriptor supplies formatter and response metadata |
| `src/main/java/com/teamsync/enums/ProjectEventType.java` | Remove two event types with no meaningful consumers |
| `src/main/java/com/teamsync/service/NotificationService.java` | Direct record persistence; remove unused priority path and obsolete collaborators |
| `src/main/java/com/teamsync/service/CommentService.java` | Publish the existing assignee notification and remove erroneous author notification |
| `src/main/java/com/teamsync/service/TaskService.java` | Remove no-op creation event, use explicit notification messages/recipients, skip unassigned status events |
| `src/main/java/com/teamsync/service/ProjectService.java` | Remove ineffective update event and unused event publisher dependency |
| `src/main/java/com/teamsync/service/ReportService.java` | Retain authorization/data retrieval and invoke the selected formatter |
| `src/main/java/com/teamsync/repository/TaskRepository.java` | One grouped workload query and its small projection |
| `src/main/java/com/teamsync/patterns/behavioral/observer/ProjectEvent.java`, `NotificationListener.java`, `README.md` | Explicit recipient/message and documented synchronous transaction semantics |
| `src/main/java/com/teamsync/patterns/behavioral/strategy/AssignmentStrategy.java`, `WorkloadStrategy.java`, `RoundRobinStrategy.java`, `TaskAssignmentService.java`, `README.md` | Smaller contract, batch workloads, reused instances and documented limits |
| `src/main/java/com/teamsync/patterns/behavioral/state/TaskStateMachine.java`, `README.md` | One transition table and shared persistence |
| `src/main/java/com/teamsync/patterns/creational/factory/ReportExportFactory.java`, `README.md` | Useful export Simple Factory replaces notification factory documentation |
| `src/main/java/com/teamsync/report/ReportGenerator.java`, `JsonReportGenerator.java`, `CsvReportGenerator.java`, `PdfReportGenerator.java`, `README.md` | Moved report formatting subsystem; replace Template Method with focused interface |
| `src/test/java/com/teamsync/SecurityIntegrationTests.java` | Transactional notification/undo, immediate listener failure, deferred commit failure, workload query, endpoint and catalogue regressions |
| `src/test/java/com/teamsync/AssignmentStrategyTests.java` | Single-query workload selection, strategy reuse, concurrency and errors |
| `src/test/java/com/teamsync/TaskStateMachineTests.java` | Complete transition characterization, dependencies and undo |
| `src/test/java/com/teamsync/ReportExportTests.java` | Factory, normalization, headers/bytes passthrough and actual format rendering |
| `src/test/java/com/teamsync/NotificationServiceTests.java` | Both stored notification types and persistence-only behavior |

Removed files and layers:

| Previous package under `src/main/java/com/teamsync/` | Removed files |
| --- | --- |
| `patterns/creational/factory/` | `NotificationFactory.java`, `InAppNotificationFactory.java`, `EmailNotificationFactory.java` |
| `patterns/structural/adapter/` | `EmailService.java`, `EmailServiceAdapter.java`, `MockExternalEmailClient.java`, obsolete `README.md` |
| `patterns/structural/decorator/` | `NotificationSender.java`, `InAppSender.java`, `EmailDecorator.java`, `UrgentDecorator.java`, obsolete `README.md` |
| `patterns/behavioral/state/` | `TaskState.java`, `TodoState.java`, `InProgressState.java`, `BlockedState.java`, `InReviewState.java`, `DoneState.java` |

Singleton and Prototype files, all Command files, authentication/JWT implementation,
resource policies, database entities, build configuration, and the three pre-existing
analytics UI edits are outside this change and remain untouched.
