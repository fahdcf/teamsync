# TeamSync — Task List for Claude Code

> Strategy: Build small working MVPs, add complexity incrementally.
> Each task = one Claude Code session. App must run after every phase.
> Patterns rule: every pattern goes in `patterns/<category>/<name>/` with a README.md.

---

## PHASE 1 — Foundation (Working Auth App)

### Task 1.1 — Project Scaffolding ✅
```
Create a Spring Boot 3 project with Maven.

Dependencies:
- Spring Web
- Spring Data JPA
- Spring Security
- PostgreSQL Driver
- Lombok
- Validation (hibernate-validator)
- jjwt 0.11.5 (io.jsonwebtoken)
- SpringDoc OpenAPI (springdoc-openapi-starter-webmvc-ui)

Package structure to create (empty for now):
  com.teamsync
    ├── presentation/controller/
    ├── presentation/dto/
    ├── service/
    ├── repository/
    ├── domain/entity/
    ├── domain/enums/
    ├── infrastructure/security/
    ├── infrastructure/config/
    └── patterns/
        ├── creational/singleton/
        ├── creational/factory/
        ├── creational/builder/
        ├── creational/prototype/
        ├── structural/facade/
        ├── structural/adapter/
        ├── structural/proxy/
        ├── structural/decorator/
        ├── behavioral/observer/
        ├── behavioral/strategy/
        ├── behavioral/state/
        ├── behavioral/command/
        ├── behavioral/chain/
        └── behavioral/template/

application.properties: configure PostgreSQL, JWT secret (min 32 chars), port 8080.

Goal: app starts with no errors. All packages exist.
```

### Task 1.2 — User Entity + Repository ✅
```
Create:
- Role enum (ADMIN, PROJECT_MANAGER, TEAM_MEMBER) in domain/enums/
- User entity in domain/entity/ (id UUID, username, email, password, role, createdAt)
- UserRepository in repository/ (JpaRepository<User, UUID>)
- UserResponseDTO in presentation/dto/ (id, username, email, role — NO password)
- UserRequestDTO in presentation/dto/ (username, email, password, role)

Goal: entity maps to DB table on startup (spring.jpa.hibernate.ddl-auto=update).
```

### Task 1.3 — JWT Auth System
```
Implement full JWT authentication:

infrastructure/security/:
- JwtUtil: generateToken(email), validateToken(token), extractEmail(token)
- JwtAuthFilter: extends OncePerRequestFilter, reads Bearer token, sets SecurityContext
- UserDetailsServiceImpl: loads UserDetails by email from UserRepository
- SecurityConfig: permit /auth/**, /patterns/**, /swagger-ui/**, require auth elsewhere

service/:
- AuthService: register(request) saves user with BCrypt password, login(request) returns JWT string

presentation/controller/:
- AuthController: POST /auth/register → UserResponseDTO, POST /auth/login → { token: "..." }

Goal: register and login work via Postman. JWT token returned on login.
```

### Task 1.4 — User Profile Endpoints
```
service/:
- UserService: getCurrentUser(email), updateUsername(email, newUsername), getAllUsers()

presentation/controller/:
- UserController:
  GET  /users/me       → UserResponseDTO (current authenticated user)
  PUT  /users/me       → update username
  GET  /users          → List<UserResponseDTO> — ADMIN only (@PreAuthorize)

Enable @EnableMethodSecurity in SecurityConfig.

Goal: all 3 endpoints work with Bearer token. /users returns 403 for non-ADMIN.
```

---

## PHASE 2 — Workspace + Project + First Patterns

### Task 2.1 — Workspace Entity + CRUD
```
domain/entity/:
- Workspace (id UUID, name, description, owner ManyToOne User, members ManyToMany User, createdAt)

repository/:
- WorkspaceRepository: findByOwner(User), findByMembersContaining(User)

service/:
- WorkspaceService: create, findById, getMyWorkspaces, addMember(workspaceId, email), removeMember

presentation/dto/:
- WorkspaceRequestDTO, WorkspaceResponseDTO

presentation/controller/:
- WorkspaceController:
  POST   /workspaces                          → create
  GET    /workspaces                          → my workspaces (owned + member of)
  GET    /workspaces/{id}                     → details
  POST   /workspaces/{id}/members             → add member by email
  DELETE /workspaces/{id}/members/{userId}    → remove member

Goal: workspace CRUD works end-to-end.
```

### Task 2.2 — Project Entity + CRUD
```
domain/enums/:
- ProjectStatus: PLANNING, ACTIVE, ON_HOLD, COMPLETED, ARCHIVED

domain/entity/:
- Project (id UUID, title, description, status, deadline LocalDate, progress int,
           workspace ManyToOne, manager ManyToOne User, createdAt)

repository/:
- ProjectRepository: findByWorkspace, findByManager

service/:
- ProjectService: create, update, archive, findByWorkspace, findById

presentation/dto/:
- ProjectRequestDTO, ProjectResponseDTO

presentation/controller/:
- ProjectController:
  POST /workspaces/{workspaceId}/projects     → create project
  GET  /workspaces/{workspaceId}/projects     → list projects
  GET  /projects/{id}                         → details
  PUT  /projects/{id}                         → update
  PUT  /projects/{id}/archive                 → set status=ARCHIVED

Goal: project CRUD works scoped to workspace.
```

### Task 2.3 — PATTERN: Singleton + Facade
```
Implement two patterns. Each goes in its own sub-package with a README.md.

--- PATTERN 1: Singleton ---
Package: patterns/creational/singleton/

Create AppLogger.java:
- Private static instance
- Private constructor
- Public static getInstance() returning the single instance
- Methods: info(String msg), warn(String msg), error(String msg) — print to console with timestamp
- Annotate with @Component using a trick: Spring-managed singleton via private constructor workaround,
  OR use pure GoF singleton (static getInstance) — pure GoF is preferred for academic clarity

Create README.md in patterns/creational/singleton/:
  # Singleton Pattern
  Ensures only one instance of AppLogger exists in the application.
  AppLogger uses a private constructor and a static getInstance() method.
  All services call AppLogger.getInstance().info(...) to log — never create a new logger.

Use AppLogger in WorkspaceService and ProjectService for logging create/update actions.

--- PATTERN 2: Facade ---
Package: patterns/structural/facade/

Create ProjectManagementFacade.java:
- Injected dependencies: ProjectService, WorkspaceService, UserService
- Method: initializeProject(workspaceId, projectTitle, managerEmail)
  → validates workspace exists
  → creates project
  → assigns manager
  → logs via AppLogger
  → returns ProjectResponseDTO
- This hides 3 service calls behind one method

Create README.md in patterns/structural/facade/:
  # Facade Pattern
  ProjectManagementFacade provides a single method to initialize a project.
  Without the facade, callers would need to: find workspace, create project, find user, assign manager.
  The facade hides this complexity behind one initializeProject() call.

Add endpoint in ProjectController:
  POST /projects/initialize → calls facade.initializeProject(...)

--- ACADEMIC ENDPOINT ---
Create PatternsController in presentation/controller/:
  GET /patterns → returns a hardcoded JSON list of all 14 patterns:
  [{ "name": "Singleton", "category": "Creational", "package": "patterns.creational.singleton", "purpose": "..." }, ...]

Goal: /projects/initialize works; /patterns returns all 14 entries; AppLogger logs are visible in console.
```

---

## PHASE 3 — Task System (Core Value)

### Task 3.1 — Task Entity + CRUD
```
domain/enums/:
- TaskStatus: TODO, IN_PROGRESS, BLOCKED, IN_REVIEW, DONE
- TaskPriority: LOW, MEDIUM, HIGH, CRITICAL

domain/entity/:
- Task (id UUID, title, description, priority, status, assignee ManyToOne User,
        project ManyToOne Project, dueDate LocalDate, createdAt, updatedAt)

repository/:
- TaskRepository: findByProject, findByAssignee, findByProjectAndStatus

service/:
- TaskService: create, update, delete, findByProject, findByAssignee, findById

presentation/dto/:
- TaskRequestDTO, TaskResponseDTO

presentation/controller/:
- TaskController:
  POST   /projects/{projectId}/tasks      → create
  GET    /projects/{projectId}/tasks      → list (optional ?status=, ?priority=)
  GET    /tasks/{id}                      → details
  PUT    /tasks/{id}                      → update title/description/priority/dueDate
  DELETE /tasks/{id}                      → delete
  PUT    /tasks/{id}/assign               → assign to userId

Goal: task CRUD works scoped to project.
```

### Task 3.2 — PATTERN: State Machine
```
Package: patterns/behavioral/state/

Create the following:

TaskState.java (interface):
  void handle(Task task, TaskStatus targetStatus, TaskRepository repo);
  boolean canTransitionTo(TaskStatus target);

Concrete states (one class each):
- TodoState        → can go to: IN_PROGRESS
- InProgressState  → can go to: IN_REVIEW, BLOCKED
- BlockedState     → can go to: IN_PROGRESS
- InReviewState    → can go to: DONE, IN_PROGRESS
- DoneState        → no transitions allowed

TaskStateMachine.java:
- getCurrentState(Task task) → returns the right concrete state
- transition(Task task, TaskStatus target, TaskRepository repo):
    gets current state → checks canTransitionTo → calls handle → saves

Create README.md:
  # State Pattern
  Each TaskStatus has a corresponding State class that knows which transitions are valid.
  TaskStateMachine holds no transition logic itself — it delegates to the current state.
  Example: InProgressState allows going to IN_REVIEW or BLOCKED, but not directly to DONE.

Wire into TaskService:
- New method: changeStatus(taskId, targetStatus) — goes through TaskStateMachine, never sets status directly

Add endpoint:
  PUT /tasks/{id}/status   body: { "status": "IN_REVIEW" }

Goal: valid transitions work; invalid ones return 400 with "Invalid transition: IN_PROGRESS → DONE".
```

### Task 3.3 — Task Dependencies
```
Add to Task entity:
- dependencies: ManyToMany self-reference (a task can depend on multiple tasks)

Add to TaskRepository:
- findByDependenciesContaining(Task task)

Create TaskDependencyService:
- addDependency(taskId, dependsOnId): validates no circular dependency (BFS check), saves
- removeDependency(taskId, dependsOnId)
- canStart(Task task): returns true if all dependency tasks have status=DONE
- getBlockedTasks(projectId): tasks where canStart() is false

Wire into TaskStateMachine:
- TodoState.canTransitionTo(IN_PROGRESS) also checks TaskDependencyService.canStart()

Add endpoints:
  POST   /tasks/{id}/dependencies              body: { "dependsOnTaskId": "..." }
  DELETE /tasks/{id}/dependencies/{depId}
  GET    /projects/{id}/tasks/blocked          → tasks that cannot start yet

Goal: task B blocked until task A is DONE. Circular dependency rejected with 400.
```

### Task 3.4 — PATTERN: Strategy + Prototype
```
--- PATTERN 1: Strategy ---
Package: patterns/behavioral/strategy/

AssignmentStrategy.java (interface):
  User assign(List<User> projectMembers, Task task, TaskRepository taskRepository);

Concrete strategies:
- WorkloadStrategy: assigns to member with fewest IN_PROGRESS tasks
- RoundRobinStrategy: assigns in rotation (use a simple static counter per project)
- ManualStrategy: no-op, throws UnsupportedOperationException (use direct assign endpoint instead)

TaskAssignmentService.java:
- setStrategy(AssignmentStrategy strategy)
- autoAssign(Task task, List<User> members) → calls strategy.assign(...)

Create README.md:
  # Strategy Pattern
  AssignmentStrategy defines the algorithm interface. WorkloadStrategy and RoundRobinStrategy
  are interchangeable implementations. TaskAssignmentService runs whichever strategy is injected,
  with no if/else logic in the service itself.

Add endpoint:
  POST /projects/{projectId}/tasks/auto-assign?strategy=workload|roundrobin
  body: { "taskId": "..." }

--- PATTERN 2: Prototype ---
Package: patterns/creational/prototype/

CloneableTask.java (interface):
  CloneableTask cloneTask();

TaskTemplate.java (implements CloneableTask):
- Fields: templateName, title, description, priority, defaultDueDays (int)
- cloneTask() returns a new TaskTemplate with same fields (deep copy)
- Store as a simple entity in DB (TaskTemplate table)

TaskTemplateRepository, TaskTemplateService.

Add endpoints:
  POST /projects/{id}/templates            → save current task structure as template
  GET  /projects/{id}/templates            → list templates
  POST /tasks/from-template/{templateId}   → clone template → create task with pre-filled fields

Create README.md:
  # Prototype Pattern
  TaskTemplate implements cloneTask() to produce a deep copy of itself.
  Instead of constructing a new task from scratch, callers clone a template.
  This avoids re-specifying title, description, priority, and due date every time.

Goal: auto-assign endpoint works with both strategies; task created from template has pre-filled fields.
```

---

## PHASE 4 — Remaining Patterns (All 14 Done)

### Task 4.1 — PATTERN: Observer + Factory Method
```
--- PATTERN 1: Observer ---
Package: patterns/behavioral/observer/

ProjectEvent.java (record or class): eventType (enum), payload (Object), triggeredBy (User)
ProjectEventType enum: TASK_CREATED, TASK_STATUS_CHANGED, TASK_ASSIGNED, COMMENT_ADDED, PROJECT_UPDATED

ProjectEventListener.java (interface):
  void onEvent(ProjectEvent event);

ProjectEventPublisher.java:
- List<ProjectEventListener> listeners (injected via constructor)
- publish(ProjectEvent event): calls onEvent on each listener

Listeners to implement (stubs for now, wired later):
- ActivityLogListener: prints "ACTIVITY: [action]" to console (real persistence in Phase 5)
- NotificationListener: prints "NOTIFY: [recipient] — [message]" (real notifications below)

Wire into TaskService: publish event after create, changeStatus, assign.
Wire into ProjectService: publish event after update.

Create README.md:
  # Observer Pattern
  ProjectEventPublisher maintains a list of ProjectEventListeners.
  When a task changes status, the publisher calls onEvent() on all listeners.
  Listeners (ActivityLogListener, NotificationListener) react independently.
  The publisher knows nothing about what listeners do — fully decoupled.

--- PATTERN 2: Factory Method ---
Package: patterns/creational/factory/

Notification.java entity: id, type (enum), message, recipient ManyToOne User, readStatus boolean, createdAt
NotificationType enum: IN_APP, EMAIL

NotificationFactory.java (abstract class):
  abstract Notification createNotification(User recipient, String message);
  final void notifyUser(User recipient, String message) { save(createNotification(...)); }

Concrete factories:
- InAppNotificationFactory: creates Notification with type=IN_APP
- EmailNotificationFactory: creates Notification with type=EMAIL, logs "EMAIL SENT to [email]"

NotificationRepository, NotificationService (wraps factory selection).

Wire NotificationListener (from Observer) to call the right factory based on notification type.

Create README.md:
  # Factory Method Pattern
  NotificationFactory defines createNotification() as abstract.
  InAppNotificationFactory and EmailNotificationFactory each implement it differently.
  The caller uses notifyUser() on the factory — never calls new Notification() directly.

Add endpoints:
  GET /notifications                → current user's unread notifications
  PUT /notifications/{id}/read      → mark as read

Goal: task status change → observer fires → factory creates notification → GET /notifications returns it.
```

### Task 4.2 — PATTERN: Command (Undo)
```
Package: patterns/behavioral/command/

TaskCommand.java (interface):
  void execute();
  void undo();

Concrete commands:
- DeleteTaskCommand:
    execute(): saves full task snapshot (all fields) in memory, then deletes from DB
    undo(): re-inserts saved snapshot
- AssignTaskCommand:
    execute(): stores previousAssignee, sets new assignee
    undo(): restores previousAssignee
- ChangeStatusCommand:
    execute(): stores previousStatus, changes to new status via StateMachine
    undo(): directly sets previousStatus (bypass state machine for undo)

TaskCommandInvoker.java:
- Per-user history: Map<UUID, Deque<TaskCommand>> (userId → stack, max 10)
- execute(userId, command): runs execute(), pushes to stack
- undo(userId): pops last command, calls undo()

Refactor in TaskService:
- deleteTask → goes through DeleteTaskCommand via invoker
- changeStatus → goes through ChangeStatusCommand via invoker
- assignTask → goes through AssignTaskCommand via invoker

Add endpoint:
  POST /tasks/undo    → undoes last action for current user

Create README.md:
  # Command Pattern
  Each action (delete, assign, change status) is wrapped in a Command object with execute() and undo().
  TaskCommandInvoker keeps a per-user history stack.
  Calling POST /tasks/undo pops the last command and calls undo() — no action-specific logic in the controller.

Goal: delete a task → POST /tasks/undo → task is restored in DB.
```

### Task 4.3 — PATTERN: Chain of Responsibility + Decorator
```
--- PATTERN 1: Chain of Responsibility ---
Package: patterns/behavioral/chain/

TaskValidator.java (abstract class):
  private TaskValidator next;
  setNext(TaskValidator next): returns next (fluent)
  abstract void validate(TaskRequestDTO request, Project project);
  protected void passToNext(request, project): calls next.validate if next != null

Concrete validators (one class each):
- TitleValidator:   rejects if title is blank or > 100 chars
- DeadlineValidator: rejects if dueDate is in the past
- AssigneeValidator: rejects if assigneeId is not a member of the project
- PriorityValidator: rejects if priority is null

ValidationChainFactory.java:
- buildChain(): returns TitleValidator → DeadlineValidator → AssigneeValidator → PriorityValidator

Wire into TaskService.createTask(): run request through chain before saving.

Create README.md:
  # Chain of Responsibility Pattern
  Each validator handles one rule. If the rule passes, it calls the next validator.
  If it fails, it throws a ValidationException immediately.
  The chain is assembled by ValidationChainFactory: Title → Deadline → Assignee → Priority.
  TaskService passes the request to the first validator and lets the chain handle the rest.

--- PATTERN 2: Decorator ---
Package: patterns/structural/decorator/

NotificationSender.java (interface):
  void send(Notification notification);

InAppSender.java (base implementation):
  send(): marks notification as sent (logs to console)

EmailDecorator.java (wraps NotificationSender):
  private NotificationSender wrapped;
  send(): calls wrapped.send(), then also logs "EMAIL → [recipient email]: [message]"

UrgentDecorator.java (wraps NotificationSender):
  send(): prepends "[URGENT] " to notification message, then calls wrapped.send()

Usage in NotificationService:
- For HIGH/CRITICAL priority tasks: UrgentDecorator(EmailDecorator(InAppSender))
- For normal tasks: InAppSender only

Create README.md:
  # Decorator Pattern
  NotificationSender is the base interface. InAppSender is the plain implementation.
  EmailDecorator wraps any sender and adds email sending on top.
  UrgentDecorator wraps any sender and prepends [URGENT] to the message.
  They can be stacked: UrgentDecorator(EmailDecorator(InAppSender)) sends urgent + email + in-app.

Goal: invalid tasks rejected with specific message per validator; CRITICAL tasks get [URGENT] prefix + email log.
```

### Task 4.4 — PATTERN: Adapter + Proxy
```
--- PATTERN 1: Adapter ---
Package: patterns/structural/adapter/

MockExternalEmailClient.java (simulates incompatible third-party API):
  void sendMessage(String recipient, String content)  // different method name + signature

EmailService.java (our interface):
  void sendEmail(String to, String subject, String body);

EmailServiceAdapter.java (implements EmailService, wraps MockExternalEmailClient):
  sendEmail(to, subject, body):
    → calls client.sendMessage(to, subject + " | " + body)

Wire EmailServiceAdapter into EmailDecorator (from 4.3) to replace the console log.

Create README.md:
  # Adapter Pattern
  MockExternalEmailClient has sendMessage() — incompatible with our EmailService interface.
  EmailServiceAdapter implements EmailService and translates sendEmail() calls to sendMessage().
  The rest of the app only knows about EmailService — the third-party API is completely hidden.

--- PATTERN 2: Proxy ---
Package: patterns/structural/proxy/

Create TaskService.java as an interface with methods:
  createTask, updateTask, deleteTask, assignTask, changeStatus, findById, findByProject

TaskServiceImpl.java: current TaskService logic, now implements the interface

TaskServiceProxy.java (implements TaskService, wraps TaskServiceImpl):
  For deleteTask: checks caller has role ADMIN or PROJECT_MANAGER, else throws AccessDeniedException
  For assignTask: checks caller is a member of the task's project, else throws AccessDeniedException
  All other methods: delegate directly to impl with no checks

Wire proxy: inject TaskServiceProxy wherever TaskService is injected (use @Primary on proxy).

Create README.md:
  # Proxy Pattern
  TaskServiceProxy sits in front of TaskServiceImpl and controls access.
  Before delete: checks the caller has ADMIN or PROJECT_MANAGER role.
  Before assign: checks the caller is a project member.
  If checks pass, it delegates to TaskServiceImpl. The controller never talks to the impl directly.

Goal: non-manager trying to delete a task gets 403. Adapter logs "EXTERNAL EMAIL SENT" on notifications.
All 14 patterns now implemented. GET /patterns returns all 14.
```

---

## PHASE 5 — Collaboration Features

### Task 5.1 — Comments System
```
domain/entity/:
- Comment (id UUID, content, author ManyToOne User, task ManyToOne Task,
           parentComment ManyToOne Comment nullable, createdAt)

repository/:
- CommentRepository: findByTask, findByParentComment

service/:
- CommentService: addComment, addReply, deleteComment (author or ADMIN only), findByTask

presentation/dto/:
- CommentRequestDTO, CommentResponseDTO (includes replies list)

presentation/controller/:
- CommentController:
  POST   /tasks/{id}/comments       → add comment
  GET    /tasks/{id}/comments       → list with nested replies
  POST   /comments/{id}/replies     → reply to comment
  DELETE /comments/{id}             → delete (author or ADMIN)

Wire Observer: CommentService publishes COMMENT_ADDED event after saving.
NotificationListener notifies the task assignee via factory.

Goal: threaded comments work; assignee gets in-app notification on new comment.
```

### Task 5.2 — Activity Feed (Wire Observer Fully)
```
domain/entity/:
- ActivityLog (id UUID, action String, user ManyToOne User,
               entityType String, entityId UUID, createdAt)

repository/:
- ActivityLogRepository: findByEntityId, findTop50ByOrderByCreatedAtDesc

service/:
- ActivityLogService: log(user, action, entityType, entityId), findByProject, findByWorkspace

Update ActivityLogListener (from Observer):
- Now persists real ActivityLog entries instead of console printing
- Format: "Ahmed moved task 'Backend API' to IN_PROGRESS"

presentation/controller/:
- ActivityController:
  GET /projects/{id}/activity      → last 50 activity entries for project
  GET /workspaces/{id}/activity    → workspace-level feed
  GET /users/me/activity           → personal feed

Goal: every task change, assignment, and comment creates a real activity log entry.
```

---

## PHASE 6 — Analytics + Reports

### Task 6.1 — Analytics Endpoints
```
service/:
- AnalyticsService:
  getProjectStats(projectId):
    → total tasks, count by status, count by priority, overdue count, completion %
  getTeamWorkload(projectId):
    → per-member: name, activeTaskCount, completedTaskCount
  getProjectHealth(projectId):
    → ON_TRACK if progress >= 70% and no overdue tasks
    → AT_RISK if progress 40-69% or few overdue tasks
    → DELAYED otherwise

presentation/controller/:
- AnalyticsController:
  GET /analytics/projects/{id}/stats
  GET /analytics/projects/{id}/team-workload
  GET /analytics/projects/{id}/health

Goal: analytics data returned as JSON, ready for any frontend chart library.
```

### Task 6.2 — PATTERN: Builder + Template Method (Reports)
```
--- PATTERN 1: Template Method ---
Package: patterns/behavioral/template/

ReportGenerator.java (abstract class):
  final String generate(UUID projectId):    ← template method, cannot be overridden
    data = collectData(projectId)
    processed = processData(data)
    return formatOutput(processed)
  
  abstract Map<String, Object> collectData(UUID projectId);
  abstract Map<String, Object> processData(Map<String, Object> data);
  abstract String formatOutput(Map<String, Object> processed);

Concrete subclasses:
- JsonReportGenerator: formatOutput returns JSON string (use Jackson ObjectMapper)
- CsvReportGenerator:  formatOutput returns CSV rows as string
- PdfReportGenerator:  formatOutput returns "PDF REPORT: [summary]" (mock — no library needed)

Create README.md:
  # Template Method Pattern
  ReportGenerator.generate() is the template method — it calls collectData, processData, formatOutput in order.
  Subclasses cannot change the order of steps, only what each step does.
  JsonReportGenerator, CsvReportGenerator, PdfReportGenerator each implement the 3 abstract methods.

--- PATTERN 2: Builder ---
Package: patterns/creational/builder/

Report.java:
  Fields: projectTitle, generatedAt, format, sections (List<String>), dateRange (from/to)
  Private constructor, no setters.

ReportBuilder.java:
  withProject(Project project)       → sets projectTitle
  withFormat(String format)          → sets format
  withSections(String... sections)   → adds to sections list
  withDateRange(LocalDate from, LocalDate to)
  build()                            → validates required fields, returns new Report

Create README.md:
  # Builder Pattern
  Report has many optional fields and a private constructor.
  ReportBuilder provides a fluent API to construct it step by step.
  build() validates that required fields are set before creating the Report object.
  No telescoping constructors, no partially-initialized objects.

Wire together:
- ReportService: uses ReportBuilder to create the Report, then picks the correct ReportGenerator subclass
- Returns the formatted string as the response body

Add endpoint:
  GET /reports/projects/{id}?format=json|csv|pdf

Goal: all 3 formats return different output for same project data.
```

---

## PHASE 7 — Polish + Finalization

### Task 7.1 — Global Exception Handling
```
Create GlobalExceptionHandler (@RestControllerAdvice):
- EntityNotFoundException (custom) → 404
- AccessDeniedException           → 403
- ValidationException (custom)    → 400 with { field, message } list
- IllegalStateException           → 400 (invalid state transitions)
- Generic Exception               → 500

Standard error response format for all errors:
{
  "timestamp": "...",
  "status": 404,
  "error": "Not Found",
  "message": "Task not found: [id]",
  "path": "/tasks/..."
}

Add @Valid to all controller @RequestBody params.
Add validation annotations to all DTOs (@NotBlank, @NotNull, @Future, @Size).

Goal: no stack traces leak. All errors return the standard JSON format.
```

### Task 7.2 — Swagger + Final Docs
```
Configure SpringDoc:
- Title: "TeamSync API", version "1.0", description: "Collaborative Project Management Platform"
- JWT Bearer auth scheme (so Swagger UI has Authorize button)
- Add @Tag to each controller (Auth, Users, Workspaces, Projects, Tasks, Comments, Notifications, Analytics, Reports, Patterns)
- Add @Operation(summary="...") to every endpoint
- Add @ApiResponse for common status codes (200, 201, 400, 401, 403, 404)

Update GET /patterns to return full list:
[{
  "id": 1,
  "name": "Singleton",
  "category": "Creational",
  "package": "com.teamsync.patterns.creational.singleton",
  "keyClasses": ["AppLogger"],
  "purpose": "Ensures one shared logger instance exists across the application"
}, ...]

Goal: /swagger-ui.html shows all endpoints, grouped by tag, with working JWT auth.
```

### Task 7.3 — Search + Filtering
```
Add JPA Specification-based filtering to task list:
GET /projects/{id}/tasks?status=IN_PROGRESS&priority=HIGH&assigneeId=...&keyword=...&overdue=true

Create TaskSpecification.java (implements Specification<Task>):
- Each filter is a static method returning a Predicate
- Combine with and() in TaskRepository

TaskRepository extends JpaSpecificationExecutor<Task>.

Apply same pattern to:
- GET /projects?status=ACTIVE&managerId=...
- GET /workspaces?keyword=...

Goal: task filtering works with any combination of query params. No params = return all.
```

### Task 7.4 — README + Final Cleanup
```
Create README.md at project root:

# TeamSync

## Description
[2 sentences about the platform]

## Tech Stack
[table]

## How to Run
1. Start PostgreSQL (or use docker-compose up -d)
2. Update application.properties with DB credentials
3. mvn spring-boot:run
4. Open http://localhost:8080/swagger-ui.html

## Design Patterns (14 GoF Patterns)
| # | Pattern | Category | Package | Purpose |
...all 14 rows...

## API Overview
[list of main endpoint groups]

Also:
- Remove any System.out.println left from early phases, replace with AppLogger
- Ensure all pattern README.md files are complete and accurate
- Run app from scratch on a clean DB and verify all endpoints work

Goal: project is demo-ready, presentable, and CV-ready.
```

---

## Pattern Checklist

| # | Pattern | Category | Task | Done |
|---|---|---|---|---|
| 1 | Singleton | Creational | 2.3 | ☐ |
| 2 | Factory Method | Creational | 4.1 | ☐ |
| 3 | Builder | Creational | 6.2 | ☐ |
| 4 | Prototype | Creational | 3.4 | ☐ |
| 5 | Facade | Structural | 2.3 | ☐ |
| 6 | Adapter | Structural | 4.4 | ☐ |
| 7 | Proxy | Structural | 4.4 | ☐ |
| 8 | Decorator | Structural | 4.3 | ☐ |
| 9 | Observer | Behavioral | 4.1 | ☐ |
| 10 | Strategy | Behavioral | 3.4 | ☐ |
| 11 | State | Behavioral | 3.2 | ☐ |
| 12 | Command | Behavioral | 4.2 | ☐ |
| 13 | Chain of Responsibility | Behavioral | 4.3 | ☐ |
| 14 | Template Method | Behavioral | 6.2 | ☐ |

---

## Claude Code Session Header (paste this every session)

```
Read project-brain.md before touching any code.
Current task: [TASK NUMBER — TASK TITLE]
Scope: only implement what this task describes. Do not refactor other files.
Each pattern goes in patterns/<category>/<name>/ with its own README.md.
After finishing: confirm the app starts and the task's goal is met.
```
