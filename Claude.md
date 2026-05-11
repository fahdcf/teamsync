# CLAUDE.md — TeamSync

This file is read by Claude Code at the start of every session.
Read it fully before touching any file.

---

## What This Project Is

TeamSync is a collaborative project management REST API.
Stack: Java 17 + Spring Boot 3 + Spring Security (JWT) + Spring Data JPA + PostgreSQL + Maven.
Academic goal: demonstrate 14 GoF Design Patterns across 3 categories (Creational, Structural, Behavioral).

---

## Non-Negotiable Rules

1. **Read before touching.** Before editing any file, read it first. Never assume its current state.
2. **One task at a time.** Only implement what the current task describes. Do not refactor, "improve", or touch files outside the task scope.
3. **Never break what works.** The app must compile and start after every task. If your change breaks the build, fix it before finishing.
4. **No guessing.** If something is ambiguous, stop and ask. Do not invent behavior not described in the task.
5. **Patterns in their folder.** All design pattern code goes in `patterns/<category>/<name>/`. Never put pattern logic inside a service or controller.

---

## Package Structure

```
src/main/java/com/teamsync/
├── presentation/
│   ├── controller/       → REST controllers only, no business logic
│   └── dto/              → Request DTOs, Response DTOs (separate classes)
├── service/              → Business logic, orchestration
├── repository/           → Spring Data JPA interfaces only
├── domain/
│   ├── entity/           → JPA entities (@Entity, @Table)
│   └── enums/            → All enums (Role, TaskStatus, ProjectStatus, etc.)
├── infrastructure/
│   ├── security/         → JwtUtil, JwtAuthFilter, SecurityConfig, UserDetailsServiceImpl
│   └── config/           → Spring @Configuration beans
└── patterns/
    ├── creational/
    │   ├── singleton/     → AppLogger.java, README.md
    │   ├── factory/       → NotificationFactory.java + impls, README.md
    │   ├── builder/       → ReportBuilder.java, Report.java, README.md
    │   └── prototype/     → CloneableTask.java, TaskTemplate.java, README.md
    ├── structural/
    │   ├── facade/        → ProjectManagementFacade.java, README.md
    │   ├── adapter/       → EmailService.java, MockExternalEmailClient.java, EmailServiceAdapter.java, README.md
    │   ├── proxy/         → TaskService.java (interface), TaskServiceImpl.java, TaskServiceProxy.java, README.md
    │   └── decorator/     → NotificationSender.java, InAppSender.java, EmailDecorator.java, UrgentDecorator.java, README.md
    └── behavioral/
        ├── observer/      → ProjectEventPublisher.java, ProjectEventListener.java, listeners, README.md
        ├── strategy/      → AssignmentStrategy.java, WorkloadStrategy.java, RoundRobinStrategy.java, README.md
        ├── state/         → TaskState.java, concrete states, TaskStateMachine.java, README.md
        ├── command/       → TaskCommand.java, concrete commands, TaskCommandInvoker.java, README.md
        ├── chain/         → TaskValidator.java, concrete validators, README.md
        └── template/      → ReportGenerator.java, concrete generators, README.md
```

---

## Patterns Folder Contract

Every pattern sub-package must contain:
- The interface or abstract class
- All concrete implementations
- A `README.md` with: pattern name, one-paragraph plain-language explanation, which class plays which role

**Services call into patterns. Patterns NEVER import services or repositories.**
Patterns receive all data they need as method parameters.

When implementing a pattern, always create the README.md in the same task.

---

## Entities Reference

| Entity | Key Fields |
|---|---|
| User | id (UUID), username, email, password (BCrypt), role, createdAt |
| Workspace | id, name, description, owner (→User), members (↔User), createdAt |
| Project | id, title, description, status, deadline, progress (int), workspace (→Workspace), manager (→User) |
| Task | id, title, description, priority, status, assignee (→User), project (→Project), dependencies (↔Task), dueDate |
| Comment | id, content, author (→User), task (→Task), parentComment (→Comment nullable), createdAt |
| Notification | id, type, message, recipient (→User), readStatus (boolean), createdAt |
| ActivityLog | id, action, user (→User), entityType, entityId (UUID), createdAt |

All IDs are UUID. All entities use Lombok (@Data/@Getter/@Setter/@Builder/@NoArgsConstructor/@AllArgsConstructor as needed).

---

## Enums Reference

```java
Role:          ADMIN, PROJECT_MANAGER, TEAM_MEMBER
TaskStatus:    TODO, IN_PROGRESS, BLOCKED, IN_REVIEW, DONE
TaskPriority:  LOW, MEDIUM, HIGH, CRITICAL
ProjectStatus: PLANNING, ACTIVE, ON_HOLD, COMPLETED, ARCHIVED
NotificationType: IN_APP, EMAIL
ProjectEventType: TASK_CREATED, TASK_STATUS_CHANGED, TASK_ASSIGNED, COMMENT_ADDED, PROJECT_UPDATED
```

---

## Task State Machine

Valid transitions only:
```
TODO        → IN_PROGRESS
IN_PROGRESS → IN_REVIEW, BLOCKED
BLOCKED     → IN_PROGRESS
IN_REVIEW   → DONE, IN_PROGRESS
DONE        → (none)
```

Invalid transition = throw `IllegalStateException("Invalid transition: X → Y")`.
Status changes always go through `TaskStateMachine` — never set `task.setStatus()` directly in a service.

---

## Security Rules

- All endpoints require JWT Bearer token except: `POST /auth/register`, `POST /auth/login`, `GET /patterns`, `GET /swagger-ui/**`, `GET /v3/api-docs/**`
- Role checks via `@PreAuthorize`:
  - `GET /users` → ADMIN only
  - `DELETE /tasks/{id}` → ADMIN or PROJECT_MANAGER (also enforced via Proxy pattern)
  - `PUT /projects/{id}/archive` → PROJECT_MANAGER or ADMIN
- Current user extracted from SecurityContext, not passed as a parameter

---

## Error Handling

Use these custom exceptions (create them if they don't exist yet):
- `EntityNotFoundException extends RuntimeException` → mapped to 404
- `ValidationException extends RuntimeException` → mapped to 400
- `AccessDeniedException` (Spring Security) → mapped to 403

`GlobalExceptionHandler` (@RestControllerAdvice) handles all of these.
Standard error response shape:
```json
{
  "timestamp": "2025-01-01T10:00:00",
  "status": 404,
  "error": "Not Found",
  "message": "Task not found: <id>",
  "path": "/tasks/<id>"
}
```

Never let stack traces reach the HTTP response.

---

## DTO Rules

- Always separate Request DTO and Response DTO per entity
- Response DTOs never expose `password`
- Use `@Valid` on all `@RequestBody` in controllers
- Validation annotations on Request DTOs: `@NotBlank`, `@NotNull`, `@Size`, `@Future` where appropriate
- Map entities → DTOs in the service layer, not in controllers

---

## Coding Standards

- Use Lombok to eliminate boilerplate (`@Getter`, `@Setter`, `@Builder`, `@NoArgsConstructor`, `@AllArgsConstructor`, `@RequiredArgsConstructor`)
- Inject dependencies via constructor injection, not `@Autowired` on fields
- Repository methods: define named query methods in the interface, no JPQL unless necessary
- No raw `System.out.println` — use `AppLogger.getInstance()` once it's implemented (Phase 2+)
- Every new class goes in the correct package — double-check before creating

---

## Design Patterns Already Implemented

Track which patterns are done. Update this list as phases complete:

| # | Pattern | Category | Package | Status |
|---|---|---|---|---|
| 1 | Singleton | Creational | patterns.creational.singleton | ☐ |
| 2 | Factory Method | Creational | patterns.creational.factory | ☐ |
| 3 | Builder | Creational | patterns.creational.builder | ☐ |
| 4 | Prototype | Creational | patterns.creational.prototype | ☐ |
| 5 | Facade | Structural | patterns.structural.facade | ☐ |
| 6 | Adapter | Structural | patterns.structural.adapter | ☐ |
| 7 | Proxy | Structural | patterns.structural.proxy | ☐ |
| 8 | Decorator | Structural | patterns.structural.decorator | ☐ |
| 9 | Observer | Behavioral | patterns.behavioral.observer | ☐ |
| 10 | Strategy | Behavioral | patterns.behavioral.strategy | ☐ |
| 11 | State | Behavioral | patterns.behavioral.state | ☐ |
| 12 | Command | Behavioral | patterns.behavioral.command | ☐ |
| 13 | Chain of Responsibility | Behavioral | patterns.behavioral.chain | ☐ |
| 14 | Template Method | Behavioral | patterns.behavioral.template | ☐ |

---

## API Endpoints Reference

```
POST   /auth/register
POST   /auth/login

GET    /users/me
PUT    /users/me
GET    /users                              (ADMIN)

POST   /workspaces
GET    /workspaces
GET    /workspaces/{id}
POST   /workspaces/{id}/members
DELETE /workspaces/{id}/members/{userId}

POST   /workspaces/{workspaceId}/projects
GET    /workspaces/{workspaceId}/projects
GET    /projects/{id}
PUT    /projects/{id}
PUT    /projects/{id}/archive
POST   /projects/initialize               (Facade)

POST   /projects/{projectId}/tasks
GET    /projects/{projectId}/tasks
GET    /tasks/{id}
PUT    /tasks/{id}
DELETE /tasks/{id}
PUT    /tasks/{id}/status
PUT    /tasks/{id}/assign
POST   /tasks/{id}/dependencies
DELETE /tasks/{id}/dependencies/{depId}
GET    /projects/{id}/tasks/blocked
POST   /projects/{id}/tasks/auto-assign
POST   /tasks/undo

POST   /projects/{id}/templates
GET    /projects/{id}/templates
POST   /tasks/from-template/{templateId}

POST   /tasks/{id}/comments
GET    /tasks/{id}/comments
POST   /comments/{id}/replies
DELETE /comments/{id}

GET    /notifications
PUT    /notifications/{id}/read

GET    /analytics/projects/{id}/stats
GET    /analytics/projects/{id}/team-workload
GET    /analytics/projects/{id}/health

GET    /reports/projects/{id}?format=json|csv|pdf

GET    /patterns
```

---

## How to Verify a Task Is Done

After completing any task:
1. Run `mvn spring-boot:run` — must start with no errors
2. Test the new endpoint(s) with curl or confirm compilable
3. If a pattern was implemented: confirm its `README.md` exists in the correct sub-package
4. Confirm no files outside the task scope were modified

---

## Current Task

**Set this at the start of each session:**

> Current task: [TASK NUMBER — TASK TITLE]
> e.g. "Task 1.1 — Project Scaffolding"

Refer to `tasks.md` for the full description of what to implement.