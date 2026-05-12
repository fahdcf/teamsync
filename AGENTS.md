# AGENTS.md — TeamSync Autonomous Build Agent

You are an autonomous build agent for the TeamSync project.
You do not wait for instructions between tasks.
You read `tasks.md`, execute tasks in order, verify each one, update its status, push to GitHub, then immediately move to the next task — until every task is marked ✅.

---

## Autonomous Loop (follow this exactly, forever)

```
LOOP:
  1. Read tasks.md
  2. Find the first task marked ☐
  3. Read every file you will touch before touching it
  4. Implement the task exactly as described — nothing more, nothing less
  5. Verify the task (see Verification Protocol below)
  6. If verification fails → fix, re-verify. Do not move on until it passes.
  7. Update tasks.md: change ☐ to ✅ for that task
  8. git add -A
  9. git commit -m "task(<id>): <task title>"
     e.g. "task(1.1): Project Scaffolding"
  10. git push origin main
  11. GOTO LOOP
```

Stop only when every task in tasks.md is marked ✅ or you hit an unresolvable blocker.
On a blocker: stop, describe exactly what failed and why, and wait for human input.

---

## Verification Protocol

After implementing each task, run these checks in order:

### Always
- [ ] `mvn compile` — zero errors
- [ ] `mvn spring-boot:run` — app starts, port 8080 reachable
- [ ] No files modified outside the task's stated scope

### For backend tasks with new endpoints
- [ ] Test each new endpoint with `curl` (examples below)
- [ ] Expected HTTP status codes returned
- [ ] Error cases return correct status (400/403/404)

### For pattern tasks
- [ ] Pattern classes exist in correct `patterns/<category>/<name>/` package
- [ ] `README.md` exists in the pattern sub-package and is non-empty
- [ ] Pattern is wired and reachable (called by a service or endpoint)
- [ ] `GET /patterns` returns an entry for the new pattern

### For frontend tasks
- [ ] Page loads without console errors
- [ ] Matches the layout spec (section separation, no mixed concerns)
- [ ] API calls use the service layer (no raw fetch in components)

### For GitHub tasks
- [ ] `git log --oneline -1` shows the correct commit message format
- [ ] `git status` is clean after push

---

## Project Architecture

### Backend — `backend/`

```
backend/
├── pom.xml
└── src/main/java/com/teamsync/
    ├── presentation/
    │   ├── controller/       → REST controllers (routing only, zero logic)
    │   └── dto/              → RequestDTO + ResponseDTO per entity (separate classes)
    ├── service/              → All business logic lives here
    ├── repository/           → Spring Data JPA interfaces only
    ├── domain/
    │   ├── entity/           → @Entity classes
    │   └── enums/            → Role, TaskStatus, TaskPriority, ProjectStatus, etc.
    ├── infrastructure/
    │   ├── security/         → JwtUtil, JwtAuthFilter, SecurityConfig, UserDetailsServiceImpl
    │   └── config/           → @Configuration beans
    └── patterns/
        ├── creational/
        │   ├── singleton/    → AppLogger.java, README.md
        │   ├── factory/      → NotificationFactory + impls, README.md
        │   ├── builder/      → ReportBuilder.java, Report.java, README.md
        │   └── prototype/    → CloneableTask.java, TaskTemplate.java, README.md
        ├── structural/
        │   ├── facade/       → ProjectManagementFacade.java, README.md
        │   ├── adapter/      → EmailService.java, MockExternalEmailClient.java, EmailServiceAdapter.java, README.md
        │   ├── proxy/        → TaskService.java (interface), TaskServiceImpl.java, TaskServiceProxy.java, README.md
        │   └── decorator/    → NotificationSender.java, InAppSender.java, EmailDecorator.java, UrgentDecorator.java, README.md
        └── behavioral/
            ├── observer/     → ProjectEventPublisher, listeners, README.md
            ├── strategy/     → AssignmentStrategy + impls, README.md
            ├── state/        → TaskState, concrete states, TaskStateMachine.java, README.md
            ├── command/      → TaskCommand, concrete commands, TaskCommandInvoker.java, README.md
            ├── chain/        → TaskValidator, concrete validators, README.md
            └── template/     → ReportGenerator, concrete generators, README.md
```

### Frontend — `frontend/`

```
frontend/
├── package.json
├── vite.config.js
├── index.html
└── src/
    ├── main.jsx              → App entry point
    ├── App.jsx               → Router setup only
    ├── api/                  → ALL API calls live here, nowhere else
    │   ├── auth.api.js
    │   ├── workspace.api.js
    │   ├── project.api.js
    │   ├── task.api.js
    │   ├── comment.api.js
    │   └── notification.api.js
    ├── hooks/                → Custom React hooks (useAuth, useTasks, etc.)
    ├── store/                → Global state (Zustand or Context)
    ├── pages/                → One folder per route
    │   ├── auth/             → Login.jsx, Register.jsx
    │   ├── dashboard/        → Dashboard.jsx
    │   ├── workspace/        → WorkspaceList.jsx, WorkspaceDetail.jsx
    │   ├── project/          → ProjectDetail.jsx, ProjectSettings.jsx
    │   ├── task/             → TaskBoard.jsx, TaskDetail.jsx
    │   └── patterns/         → PatternsViewer.jsx (academic page)
    ├── components/           → Reusable UI components
    │   ├── layout/           → Navbar.jsx, Sidebar.jsx, PageWrapper.jsx
    │   ├── task/             → TaskCard.jsx, TaskModal.jsx, StatusBadge.jsx
    │   ├── project/          → ProjectCard.jsx, ProgressBar.jsx
    │   └── ui/               → Button.jsx, Input.jsx, Modal.jsx, Spinner.jsx
    └── utils/                → token.js, formatDate.js, constants.js
```

### Frontend Rules (non-negotiable)
- **No raw `fetch` or `axios` calls in components or pages.** All HTTP calls go in `api/*.api.js`.
- **No business logic in components.** Logic goes in hooks (`hooks/`) or services.
- **One page = one folder.** Never put two route-level pages in the same file.
- **No inline styles.** Use CSS modules or Tailwind classes only.
- **API base URL from env.** Use `import.meta.env.VITE_API_URL` — never hardcode `localhost:8080`.
- **Auth token in axios interceptor.** Set once in `api/` setup, never manually in each call.

---

## Backend Coding Standards

- Constructor injection only — never `@Autowired` on fields
- Lombok everywhere: `@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor`
- DTOs mapped in the **service layer**, never in controllers
- Status changes go through `TaskStateMachine` — never `task.setStatus()` directly
- Logging via `AppLogger.getInstance()` — never `System.out.println`
- Custom exceptions: `EntityNotFoundException` (→404), `ValidationException` (→400)
- `GlobalExceptionHandler` (@RestControllerAdvice) catches everything

---

## Patterns Folder Contract

- Every pattern lives in `patterns/<category>/<name>/` — nowhere else
- Every pattern sub-package has a `README.md` written in plain language
- Patterns receive data as method parameters — they never `@Autowired` a service or repository
- Services call patterns, patterns never call services

---

## Entities Quick Reference

| Entity | Key Fields |
|---|---|
| User | id (UUID), username, email, password, role, createdAt |
| Workspace | id, name, description, owner→User, members↔User |
| Project | id, title, description, status, deadline, progress (int), workspace→Workspace, manager→User |
| Task | id, title, description, priority, status, assignee→User, project→Project, dependencies↔Task, dueDate |
| Comment | id, content, author→User, task→Task, parentComment→Comment (nullable) |
| Notification | id, type, message, recipient→User, readStatus (boolean) |
| ActivityLog | id, action, user→User, entityType, entityId (UUID), createdAt |

## Enums Quick Reference

```
Role:             ADMIN, PROJECT_MANAGER, TEAM_MEMBER
TaskStatus:       TODO, IN_PROGRESS, BLOCKED, IN_REVIEW, DONE
TaskPriority:     LOW, MEDIUM, HIGH, CRITICAL
ProjectStatus:    PLANNING, ACTIVE, ON_HOLD, COMPLETED, ARCHIVED
NotificationType: IN_APP, EMAIL
ProjectEventType: TASK_CREATED, TASK_STATUS_CHANGED, TASK_ASSIGNED, COMMENT_ADDED, PROJECT_UPDATED
```

## Task State Machine

```
TODO        → IN_PROGRESS
IN_PROGRESS → IN_REVIEW, BLOCKED
BLOCKED     → IN_PROGRESS
IN_REVIEW   → DONE, IN_PROGRESS
DONE        → (no transitions)
```

Invalid transition → throw `IllegalStateException("Invalid transition: X → Y")`

---

## Git Commit Format

```
task(<id>): <title>

examples:
  task(1.1): Project Scaffolding
  task(2.3): Singleton and Facade patterns
  task(3.2): State Machine pattern
  task(4.1): Observer and Factory Method patterns
```

Always commit after every single completed task — not batched.

---

## Security

Public endpoints (no token required):
- `POST /auth/register`
- `POST /auth/login`
- `GET /patterns`
- `GET /swagger-ui/**`
- `GET /v3/api-docs/**`

Everything else requires `Authorization: Bearer <token>`.

Role checks:
- `GET /users` → ADMIN only
- `DELETE /tasks/{id}` → ADMIN or PROJECT_MANAGER (also enforced by Proxy pattern)
- `PUT /projects/{id}/archive` → ADMIN or PROJECT_MANAGER

---

## Error Response Shape (all errors)

```json
{
  "timestamp": "2025-01-01T10:00:00",
  "status": 404,
  "error": "Not Found",
  "message": "Task not found: <id>",
  "path": "/tasks/<id>"
}
```

---

## curl Verification Examples

```bash
# Register
curl -s -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"ahmed","email":"ahmed@test.com","password":"pass123","role":"TEAM_MEMBER"}'

# Login → save token
TOKEN=$(curl -s -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ahmed@test.com","password":"pass123"}' | jq -r '.token')

# Authenticated request
curl -s http://localhost:8080/users/me \
  -H "Authorization: Bearer $TOKEN"

# Patterns endpoint
curl -s http://localhost:8080/patterns

# Invalid state transition (expect 400)
curl -s -X PUT http://localhost:8080/tasks/<id>/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"DONE"}'
```

---

## Blocker Protocol

If you hit a blocker you cannot resolve:
1. Do NOT attempt a workaround that changes the architecture
2. Do NOT skip the task and move to the next one
3. Stop, then output:

```
BLOCKER on task <id>: <title>
Problem: <exact error or issue>
Attempted: <what you tried>
Need: <what human decision is required>
```

Then wait.

---

## Current State

> Tasks file: `tasks.md`
> Start: find the first ☐ task and begin the loop.