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

### Task 1.3 — JWT Auth System ✅
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

### Task 1.4 — User Profile Endpoints ✅
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

### Task 2.1 — Workspace Entity + CRUD ✅
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

### Task 2.2 — Project Entity + CRUD ✅
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

### Task 2.3 — PATTERN: Singleton + Facade ✅
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

### Task 3.1 — Task Entity + CRUD ✅
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

### Task 3.2 — PATTERN: State Machine ✅
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

### Task 3.3 — Task Dependencies ✅
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

### Task 3.4 — PATTERN: Strategy + Prototype ✅
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

### Task 4.1 — PATTERN: Observer + Factory Method ✅
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

### Task 4.2 — PATTERN: Command (Undo) ✅
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

### Task 4.3 — PATTERN: Chain of Responsibility + Decorator ✅
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

### Task 4.4 — PATTERN: Adapter + Proxy ✅
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

### Task 5.1 — Comments System ✅
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

### Task 5.2 — Activity Feed (Wire Observer Fully) ✅
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

### Task 6.1 — Analytics Endpoints ✅
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

### Task 6.2 — PATTERN: Builder + Template Method (Reports) ✅
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

### Task 7.1 — Global Exception Handling ✅
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

### Task 7.2 — Swagger + Final Docs ✅
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

### Task 7.3 — Search + Filtering ✅
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

### Task 7.4 — README + Final Cleanup ✅
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


 
## PHASE 8 — Angular Frontend Foundation
 
### Task 8.1 — Angular Project Setup ✅
```
The frontend is a completely separate project from the backend.
Repo structure:
  /backend/    ← Spring Boot (already done)
  /frontend/   ← Angular app (this phase)
 
Commands:
  npm install -g @angular/cli
  cd frontend
  ng new teamsync-frontend --routing --style=scss --strict --standalone
  cd teamsync-frontend
  npm install
 
Additional packages to install:
  npm install @angular/cdk
  npm install @ng-icons/core @ng-icons/heroicons
  npm install ngx-toastr
  npm install chart.js ng2-charts
  npm install @angular/animations
 
Angular project folder structure to generate:
  src/app/
  ├── core/                          ← singleton services, guards, interceptors
  │   ├── interceptors/
  │   │   ├── auth.interceptor.ts    ← attaches JWT to every request
  │   │   └── error.interceptor.ts  ← handles 401/403/500 globally
  │   ├── guards/
  │   │   ├── auth.guard.ts         ← redirects to /login if not authenticated
  │   │   └── guest.guard.ts        ← redirects to /dashboard if already authenticated
  │   ├── services/
  │   │   └── token.service.ts      ← get/set/remove token from localStorage
  │   └── core.module.ts            ← (if using NgModules) or just barrel exports
  ├── shared/                        ← reusable components, pipes, directives
  │   ├── components/
  │   │   ├── button/
  │   │   ├── input/
  │   │   ├── modal/
  │   │   ├── spinner/
  │   │   ├── badge/
  │   │   ├── avatar/
  │   │   ├── empty-state/
  │   │   └── confirm-dialog/
  │   ├── pipes/
  │   │   ├── relative-time.pipe.ts
  │   │   └── truncate.pipe.ts
  │   ├── directives/
  │   │   └── click-outside.directive.ts
  │   └── models/                    ← TypeScript interfaces matching backend DTOs
  │       ├── user.model.ts
  │       ├── workspace.model.ts
  │       ├── project.model.ts
  │       ├── task.model.ts
  │       ├── comment.model.ts
  │       ├── notification.model.ts
  │       ├── activity.model.ts
  │       └── api-response.model.ts
  ├── api/                           ← one service per backend resource, nothing else
  │   ├── auth.service.ts
  │   ├── workspace.service.ts
  │   ├── project.service.ts
  │   ├── task.service.ts
  │   ├── comment.service.ts
  │   ├── notification.service.ts
  │   ├── analytics.service.ts
  │   └── patterns.service.ts
  ├── store/                         ← BehaviorSubject-based state management
  │   ├── auth.store.ts
  │   ├── workspace.store.ts
  │   └── notification.store.ts
  ├── layout/                        ← shell components
  │   ├── navbar/
  │   ├── sidebar/
  │   └── page-wrapper/
  └── features/                      ← one folder per feature/route
      ├── auth/
      │   ├── login/
      │   └── register/
      ├── dashboard/
      ├── workspace/
      │   ├── workspace-list/
      │   └── workspace-detail/
      ├── project/
      │   ├── project-detail/
      │   └── project-settings/
      ├── task/
      │   ├── task-board/
      │   ├── task-detail/
      │   └── task-card/
      ├── notification/
      └── patterns/
 
Every feature component is standalone (standalone: true).
Every feature is lazy-loaded via loadComponent() in the router.
 
Environment files:
  src/environments/environment.ts:
    export const environment = {
      production: false,
      apiUrl: 'http://localhost:8080'
    };
  src/environments/environment.prod.ts:
    export const environment = {
      production: true,
      apiUrl: 'http://localhost:8080'
    };
 
CORS: backend already allows all origins in dev. Frontend always uses environment.apiUrl.
 
Goal: ng serve starts on port 4200 with no errors. Routing configured. All folders exist.
Verify: browser opens localhost:4200 with default Angular page. No compilation errors.
```
 
### Task 8.2 — Models + API Services ✅
```
Create ALL TypeScript models in src/app/shared/models/ matching backend DTOs exactly.
 
--- MODELS ---
 
user.model.ts:
  export type UserRole = 'ADMIN' | 'PROJECT_MANAGER' | 'TEAM_MEMBER';
  export interface User {
    id: string;
    username: string;
    email: string;
    role: UserRole;
    createdAt: string;
  }
  export interface LoginRequest { email: string; password: string; }
  export interface RegisterRequest { username: string; email: string; password: string; role: UserRole; }
  export interface LoginResponse { token: string; }
 
workspace.model.ts:
  export interface Workspace {
    id: string; name: string; description: string;
    owner: User; members: User[]; createdAt: string;
  }
  export interface CreateWorkspaceRequest { name: string; description: string; }
 
project.model.ts:
  export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';
  export interface Project {
    id: string; title: string; description: string;
    status: ProjectStatus; deadline: string; progress: number;
    workspace: Workspace; manager: User; createdAt: string;
  }
  export interface CreateProjectRequest { title: string; description: string; deadline: string; managerId: string; }
 
task.model.ts:
  export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'IN_REVIEW' | 'DONE';
  export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  export interface Task {
    id: string; title: string; description: string;
    priority: TaskPriority; status: TaskStatus;
    assignee: User | null; project: Project;
    dependencies: Task[]; dueDate: string | null;
    createdAt: string; updatedAt: string;
  }
  export interface CreateTaskRequest { title: string; description: string; priority: TaskPriority; dueDate?: string; assigneeId?: string; }
  export interface ChangeStatusRequest { status: TaskStatus; }
 
comment.model.ts:
  export interface Comment {
    id: string; content: string; author: User;
    taskId: string; parentCommentId: string | null;
    replies: Comment[]; createdAt: string;
  }
 
notification.model.ts:
  export type NotificationType = 'IN_APP' | 'EMAIL';
  export interface Notification {
    id: string; type: NotificationType; message: string;
    recipient: User; readStatus: boolean; createdAt: string;
  }
 
activity.model.ts:
  export interface ActivityLog {
    id: string; action: string; user: User;
    entityType: string; entityId: string; createdAt: string;
  }
 
analytics.model.ts:
  export interface ProjectStats {
    totalTasks: number; byStatus: Record<TaskStatus, number>;
    byPriority: Record<TaskPriority, number>; overdueCount: number; completionPercent: number;
  }
  export interface TeamWorkload {
    member: User; activeTaskCount: number; completedTaskCount: number;
  }
  export type ProjectHealth = 'ON_TRACK' | 'AT_RISK' | 'DELAYED';
 
pattern.model.ts:
  export interface Pattern {
    id: number; name: string; category: string;
    package: string; keyClasses: string[]; purpose: string;
  }
 
api-response.model.ts:
  export interface ApiError {
    timestamp: string; status: number; error: string; message: string; path: string;
  }
 
--- API SERVICES (src/app/api/) ---
 
Each service:
- Is @Injectable({ providedIn: 'root' })
- Injects HttpClient
- Uses environment.apiUrl as base
- Returns Observable<T> from every method
- Has NO error handling (interceptor handles that globally)
 
auth.service.ts:
  login(req: LoginRequest): Observable<LoginResponse>  → POST /auth/login
  register(req: RegisterRequest): Observable<User>     → POST /auth/register
  getMe(): Observable<User>                            → GET /users/me
  updateMe(data: Partial<User>): Observable<User>      → PUT /users/me
 
workspace.service.ts:
  getAll(): Observable<Workspace[]>                                          → GET /workspaces
  getById(id: string): Observable<Workspace>                                 → GET /workspaces/{id}
  create(req: CreateWorkspaceRequest): Observable<Workspace>                 → POST /workspaces
  addMember(id: string, email: string): Observable<Workspace>                → POST /workspaces/{id}/members  body: {email}
  removeMember(workspaceId: string, userId: string): Observable<void>        → DELETE /workspaces/{id}/members/{userId}
 
project.service.ts:
  getByWorkspace(workspaceId: string): Observable<Project[]>                 → GET /workspaces/{id}/projects
  getById(id: string): Observable<Project>                                   → GET /projects/{id}
  create(workspaceId: string, req: CreateProjectRequest): Observable<Project>→ POST /workspaces/{id}/projects
  update(id: string, req: Partial<CreateProjectRequest>): Observable<Project>→ PUT /projects/{id}
  archive(id: string): Observable<Project>                                   → PUT /projects/{id}/archive
  initialize(data: any): Observable<Project>                                 → POST /projects/initialize
 
task.service.ts:
  getByProject(projectId: string, filters?: any): Observable<Task[]>         → GET /projects/{id}/tasks
  getById(id: string): Observable<Task>                                      → GET /tasks/{id}
  create(projectId: string, req: CreateTaskRequest): Observable<Task>        → POST /projects/{id}/tasks
  update(id: string, req: Partial<CreateTaskRequest>): Observable<Task>      → PUT /tasks/{id}
  delete(id: string): Observable<void>                                       → DELETE /tasks/{id}
  changeStatus(id: string, req: ChangeStatusRequest): Observable<Task>       → PUT /tasks/{id}/status
  assign(id: string, userId: string): Observable<Task>                       → PUT /tasks/{id}/assign  body: {userId}
  addDependency(id: string, dependsOnId: string): Observable<Task>           → POST /tasks/{id}/dependencies  body: {dependsOnTaskId}
  removeDependency(id: string, depId: string): Observable<void>              → DELETE /tasks/{id}/dependencies/{depId}
  undo(): Observable<void>                                                   → POST /tasks/undo
  autoAssign(projectId: string, taskId: string, strategy: string): Observable<Task> → POST /projects/{id}/tasks/auto-assign?strategy=
 
comment.service.ts:
  getByTask(taskId: string): Observable<Comment[]>                           → GET /tasks/{id}/comments
  add(taskId: string, content: string): Observable<Comment>                  → POST /tasks/{id}/comments  body: {content}
  reply(commentId: string, content: string): Observable<Comment>             → POST /comments/{id}/replies  body: {content}
  delete(commentId: string): Observable<void>                                → DELETE /comments/{id}
 
notification.service.ts:
  getAll(): Observable<Notification[]>                                       → GET /notifications
  markRead(id: string): Observable<Notification>                             → PUT /notifications/{id}/read
 
analytics.service.ts:
  getStats(projectId: string): Observable<ProjectStats>                      → GET /analytics/projects/{id}/stats
  getTeamWorkload(projectId: string): Observable<TeamWorkload[]>             → GET /analytics/projects/{id}/team-workload
  getHealth(projectId: string): Observable<ProjectHealth>                    → GET /analytics/projects/{id}/health
 
patterns.service.ts:
  getAll(): Observable<Pattern[]>                                            → GET /patterns
 
Goal: all services compile. No HTTP calls yet — they'll be triggered by components.
Verify: ng build produces no type errors.
```
 
### Task 8.3 — Core Module: Interceptors + Guards + Store ✅
```
--- INTERCEPTORS (src/app/core/interceptors/) ---
 
auth.interceptor.ts (functional interceptor):
  import { inject } from '@angular/core';
  import { HttpInterceptorFn } from '@angular/common/http';
  import { TokenService } from '../services/token.service';
 
  export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const token = inject(TokenService).getToken();
    if (token) {
      req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
    }
    return next(req);
  };
 
error.interceptor.ts (functional interceptor):
  Catches HTTP errors:
  - 401: clear token, navigate to /login, show toast "Session expired"
  - 403: show toast "You don't have permission to do this"
  - 404: show toast "Resource not found"
  - 500: show toast "Server error. Please try again."
  - Network error: show toast "Cannot connect to server"
  All errors: re-throw so component can handle if needed.
  Inject: Router, ToastrService, TokenService
 
Register both interceptors in app.config.ts:
  provideHttpClient(withInterceptors([authInterceptor, errorInterceptor]))
 
--- TOKEN SERVICE ---
 
core/services/token.service.ts:
  @Injectable({ providedIn: 'root' })
  private readonly KEY = 'teamsync_token';
  getToken(): string | null
  setToken(token: string): void
  removeToken(): void
  hasToken(): boolean
 
--- GUARDS ---
 
core/guards/auth.guard.ts (functional guard):
  export const authGuard: CanActivateFn = () => {
    inject(TokenService).hasToken() ? true : inject(Router).createUrlTree(['/login'])
  };
 
core/guards/guest.guard.ts (functional guard):
  Opposite: if has token → redirect to /dashboard
 
--- STATE STORES (src/app/store/) ---
 
auth.store.ts:
  @Injectable({ providedIn: 'root' })
  export class AuthStore {
    private userSubject = new BehaviorSubject<User | null>(null);
    user$ = this.userSubject.asObservable();
    isAuthenticated$ = this.user$.pipe(map(u => u !== null));
 
    setUser(user: User): void
    clearUser(): void
    getUser(): User | null
 
    // On app init: if token exists, call AuthService.getMe() to hydrate user
    init(): Observable<void>
  }
 
notification.store.ts:
  @Injectable({ providedIn: 'root' })
  export class NotificationStore {
    private notifications$ = new BehaviorSubject<Notification[]>([]);
    notifications$ = ...
    unreadCount$ = this.notifications$.pipe(map(n => n.filter(x => !x.readStatus).length));
 
    load(): void         → calls NotificationService.getAll(), updates subject
    markRead(id): void   → calls service, updates local state
    startPolling(): void → setInterval(30000, this.load)
    stopPolling(): void
  }
 
--- APP ROUTER (src/app/app.routes.ts) ---
 
export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'login',    canActivate: [guestGuard],  loadComponent: () => import('./features/auth/login/login.component') },
  { path: 'register', canActivate: [guestGuard],  loadComponent: () => import('./features/auth/register/register.component') },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/page-wrapper/page-wrapper.component'),
    children: [
      { path: 'dashboard',             loadComponent: () => import('./features/dashboard/dashboard.component') },
      { path: 'workspaces',            loadComponent: () => import('./features/workspace/workspace-list/workspace-list.component') },
      { path: 'workspaces/:id',        loadComponent: () => import('./features/workspace/workspace-detail/workspace-detail.component') },
      { path: 'projects/:id',          loadComponent: () => import('./features/project/project-detail/project-detail.component') },
      { path: 'projects/:id/board',    loadComponent: () => import('./features/task/task-board/task-board.component') },
      { path: 'tasks/:id',             loadComponent: () => import('./features/task/task-detail/task-detail.component') },
    ]
  },
  { path: 'patterns', loadComponent: () => import('./features/patterns/patterns.component') },
  { path: '**', redirectTo: 'dashboard' }
];
 
Goal: routing works. Navigating to /dashboard without token redirects to /login.
Verify: ng build --configuration=production has zero errors.
```
 
### Task 8.4 — Design System + Shared Components ✅
```
--- SCSS DESIGN SYSTEM (src/styles.scss) ---
 
Define CSS custom properties:
  :root {
    --color-bg:       #0F1117;
    --color-surface:  #1A1D27;
    --color-border:   #2A2D3E;
    --color-accent:   #6366F1;
    --color-success:  #22C55E;
    --color-warning:  #F59E0B;
    --color-danger:   #EF4444;
    --color-text:     #F1F5F9;
    --color-muted:    #64748B;
    --radius-sm: 6px; --radius-md: 10px; --radius-lg: 16px; --radius-xl: 24px;
    --shadow-sm: 0 1px 3px rgba(0,0,0,0.4);
    --shadow-md: 0 4px 16px rgba(0,0,0,0.5);
    --shadow-lg: 0 8px 32px rgba(0,0,0,0.6);
  }
  body { background: var(--color-bg); color: var(--color-text); font-family: 'Inter', sans-serif; margin: 0; }
 
Add Inter font in index.html:
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
 
Create a _mixins.scss partial for reusable patterns:
  @mixin card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); }
  @mixin flex-center { display: flex; align-items: center; justify-content: center; }
  @mixin truncate($lines: 1) { ... }
 
--- SHARED COMPONENTS (src/app/shared/components/) ---
 
Each component is standalone: true. Each has its own .scss file. No inline styles.
 
button/button.component.ts:
  Inputs: variant: 'primary'|'secondary'|'danger'|'ghost' = 'primary'
          size: 'sm'|'md'|'lg' = 'md'
          loading: boolean = false
          disabled: boolean = false
          type: string = 'button'
  Template: <button [class]="classes" [disabled]="disabled || loading" [type]="type">
              <app-spinner *ngIf="loading" size="sm"></app-spinner>
              <ng-content *ngIf="!loading"></ng-content>
            </button>
 
input/input.component.ts:
  Inputs: label, placeholder, type='text', error='', disabled=false
  Implements ControlValueAccessor (works with Angular forms)
  Shows error message below field when error is set
 
modal/modal.component.ts:
  Inputs: isOpen: boolean, title: string, size: 'sm'|'md'|'lg' = 'md'
  Outputs: closed: EventEmitter<void>
  Template: backdrop div + centered panel, ESC key closes, backdrop click closes
  Uses Angular CDK Overlay or a simple fixed div approach
 
spinner/spinner.component.ts:
  Input: size: 'sm'|'md'|'lg' = 'md', color = 'accent'
  Pure CSS animated ring
 
badge/badge.component.ts:
  Inputs: variant: 'success'|'warning'|'danger'|'info'|'muted', text: string
  Small pill badge
 
avatar/avatar.component.ts:
  Input: user: User, size: 'sm'|'md'|'lg' = 'md'
  Shows initials in colored circle (color derived from username hash)
 
empty-state/empty-state.component.ts:
  Inputs: icon: string, title: string, description: string, actionLabel?: string
  Output: action: EventEmitter<void>
  Centered layout with icon + text + optional CTA button
 
confirm-dialog/confirm-dialog.component.ts:
  Inputs: isOpen, title, message, confirmLabel='Confirm', danger=false
  Outputs: confirmed, cancelled
 
--- PIPES (src/app/shared/pipes/) ---
 
relative-time.pipe.ts:
  transform(dateString: string): string
  Returns: "just now", "5m ago", "2h ago", "3d ago", "Jan 15"
 
truncate.pipe.ts:
  transform(value: string, limit: number = 100): string
 
--- DIRECTIVES (src/app/shared/directives/) ---
 
click-outside.directive.ts:
  @Output() clickOutside = new EventEmitter<void>()
  HostListener on document:click — emits when click is outside the host element
  Used for dropdown menus
 
Goal: all shared components compile and render correctly.
Verify: create a test page that renders each component — all display without errors.
```
 
---
 
## PHASE 9 — Layout Shell
 
### Task 9.1 — Layout Components ✅
```
--- PAGE WRAPPER (src/app/layout/page-wrapper/) ---
 
page-wrapper.component.ts:
  Standalone. Template is the app shell.
  Contains: <app-sidebar> + <div class="main"> containing <app-navbar> + <router-outlet>
  Layout:
    display: flex; flex-direction: row; height: 100vh; overflow: hidden;
  Main area: flex: 1; display: flex; flex-direction: column; overflow: hidden;
  Content area: flex: 1; overflow-y: auto; padding: 2rem;
 
--- SIDEBAR (src/app/layout/sidebar/) ---
 
sidebar.component.ts:
  Injected: AuthStore, Router
  Properties: isCollapsed = false (toggle on narrow screens)
  
  Nav items (defined as array, not hardcoded in template):
    [ { label: 'Dashboard', icon: 'heroOutlineHome', route: '/dashboard' },
      { label: 'Workspaces', icon: 'heroOutlineRectangleStack', route: '/workspaces' },
      { label: 'My Tasks', icon: 'heroOutlineClipboardDocumentList', route: '/tasks/me' },
      { label: 'Patterns', icon: 'heroOutlinePuzzlePiece', route: '/patterns' } ]
 
  Template:
    <aside class="sidebar" [class.collapsed]="isCollapsed">
      <div class="logo">TS <!-- TeamSync --></div>
      <nav>
        <a *ngFor="let item of navItems" [routerLink]="item.route" routerLinkActive="active">
          <ng-icon [name]="item.icon"></ng-icon>
          <span *ngIf="!isCollapsed">{{ item.label }}</span>
        </a>
      </nav>
      <div class="sidebar-footer">
        <app-avatar [user]="(user$ | async)!"></app-avatar>
        <div *ngIf="!isCollapsed" class="user-info">
          <span class="username">{{ (user$ | async)?.username }}</span>
          <app-badge [text]="(user$ | async)?.role"></app-badge>
        </div>
      </div>
    </aside>
 
  SCSS:
    Width: 240px (full) or 64px (collapsed)
    Transition: width 0.2s ease
    Active link: background accent/10, accent color text, left border 3px accent
 
--- NAVBAR (src/app/layout/navbar/) ---
 
navbar.component.ts:
  Injected: NotificationStore, AuthStore, Router
  Properties: isNotifOpen = false, isUserMenuOpen = false
  
  Template:
    <nav class="navbar">
      <div class="navbar-left">
        <span class="page-title"><!-- dynamic based on route --></span>
      </div>
      <div class="navbar-right">
        <!-- Notification bell -->
        <div class="notif-trigger" (click)="isNotifOpen = !isNotifOpen" appClickOutside (clickOutside)="isNotifOpen = false">
          <ng-icon name="heroOutlineBell"></ng-icon>
          <span class="badge" *ngIf="(unreadCount$ | async)! > 0">{{ unreadCount$ | async }}</span>
          <!-- Dropdown -->
          <div class="notif-dropdown" *ngIf="isNotifOpen">
            <div class="notif-header">
              Notifications
              <button (click)="markAllRead()">Mark all read</button>
            </div>
            <div *ngFor="let n of (notifications$ | async)" class="notif-item" [class.unread]="!n.readStatus" (click)="markRead(n.id)">
              <span>{{ n.message }}</span>
              <span class="time">{{ n.createdAt | relativeTime }}</span>
            </div>
            <div *ngIf="!(notifications$ | async)?.length" class="notif-empty">You're all caught up 🎉</div>
          </div>
        </div>
        <!-- User menu -->
        <div class="user-menu" appClickOutside (clickOutside)="isUserMenuOpen = false">
          <app-avatar [user]="(user$ | async)!" (click)="isUserMenuOpen = !isUserMenuOpen"></app-avatar>
          <div class="user-dropdown" *ngIf="isUserMenuOpen">
            <button routerLink="/profile">Profile</button>
            <button (click)="logout()" class="danger">Logout</button>
          </div>
        </div>
      </div>
    </nav>
 
  logout(): calls AuthStore.clearUser(), TokenService.removeToken(), navigate to /login
 
Goal: shell renders correctly. Sidebar navigation highlights active route.
Verify: logout button clears token and redirects to /login.
```
 
---
 
## PHASE 10 — Auth Pages
 
### Task 10.1 — Login Page ✅
```
src/app/features/auth/login/
 
Files:
  login.component.ts
  login.component.html
  login.component.scss
 
login.component.ts:
  Standalone. Imports: ReactiveFormsModule, RouterLink, ButtonComponent, InputComponent, SpinnerComponent.
  Injected: AuthService, AuthStore, TokenService, Router, ToastrService.
 
  Form (FormGroup via FormBuilder):
    email:    [required, email]
    password: [required, minLength(6)]
 
  Properties:
    form: FormGroup
    isLoading = false
    showPassword = false
 
  onSubmit():
    if form invalid → markAllAsTouched(), return
    isLoading = true
    AuthService.login(form.value).pipe(
      switchMap(res => {
        TokenService.setToken(res.token);
        return AuthService.getMe();
      }),
      finalize(() => isLoading = false)
    ).subscribe({
      next: user => { AuthStore.setUser(user); Router.navigate(['/dashboard']); },
      error: () => {}   // error interceptor shows toast
    });
 
login.component.html:
  Full screen: display grid, two columns on desktop (hidden on mobile for left col).
 
  Left column (decorative, hidden <768px):
    Background gradient using accent color
    TeamSync logo large
    Tagline: "Collaborate. Track. Deliver."
    Decorative grid of dots (pure CSS)
 
  Right column (the form):
    Centered card (max-width 420px)
    <h1>Welcome back</h1>
    <p>Sign in to your account</p>
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <app-input label="Email" type="email" formControlName="email" [error]="emailError"></app-input>
      <app-input label="Password" [type]="showPassword ? 'text' : 'password'" formControlName="password" [error]="passwordError">
        <!-- suffix slot: show/hide toggle icon -->
      </app-input>
      <app-button type="submit" [loading]="isLoading" [disabled]="isLoading">Sign In</app-button>
    </form>
    <p>Don't have an account? <a routerLink="/register">Register</a></p>
 
Goal: login form works. Correct credentials → redirect to /dashboard. Wrong → error toast.
Verify: empty submission shows inline validation errors. Loading spinner appears during API call.
```
 
### Task 10.2 — Register Page ✅
```
src/app/features/auth/register/
 
register.component.ts:
  Standalone. Same structure as login.
  Injected: AuthService, TokenService, AuthStore, Router, ToastrService.
 
  Form fields:
    username: [required, minLength(3), maxLength(30)]
    email:    [required, email]
    password: [required, minLength(6)]
    role:     [required] — default 'TEAM_MEMBER'
 
  onSubmit():
    AuthService.register(form.value).pipe(
      switchMap(() => AuthService.login({ email, password })),
      switchMap(res => { TokenService.setToken(res.token); return AuthService.getMe(); }),
      finalize(() => isLoading = false)
    ).subscribe({
      next: user => { AuthStore.setUser(user); Router.navigate(['/dashboard']); }
    });
 
register.component.html:
  Same two-column layout as login.
  Right column form:
    <h1>Create account</h1>
    Username input
    Email input
    Password input (with show/hide)
    Role selector (styled <select>):
      <option value="TEAM_MEMBER">Team Member</option>
      <option value="PROJECT_MANAGER">Project Manager</option>
    Submit button
    "Already have an account? Sign in" link
 
Goal: registration creates account and auto-logs in. Redirects to /dashboard.
Verify: duplicate email shows error toast from backend.
```
 
---
 
## PHASE 11 — Dashboard
 
### Task 11.1 — Dashboard Page ✅
```
src/app/features/dashboard/
 
Files:
  dashboard.component.ts
  dashboard.component.html
  dashboard.component.scss
  stats-card/stats-card.component.ts  (nested component for stat cards)
  workspace-card/workspace-card.component.ts
 
dashboard.component.ts:
  Standalone. Injected: AuthStore, WorkspaceService, TaskService, ActivityService (via GET /users/me/activity).
  
  On init:
    - Load workspaces: WorkspaceService.getAll()
    - Load my tasks: TaskService.getByProject() filtered by assignee = me (or dedicated endpoint)
    - Load activity: GET /users/me/activity
  
  Computed properties:
    activeTaskCount: tasks with status IN_PROGRESS
    dueTodayCount: tasks where dueDate === today
    overdueCount: tasks where dueDate < today and status !== DONE
  
  Methods:
    openCreateWorkspaceModal()
    onWorkspaceCreated(workspace: Workspace): prepend to list
 
dashboard.component.html:
  Wrapped in PageWrapper (via router-outlet, already handled).
 
  Section 1 — Greeting header:
    <h1>Good {{ timeOfDay }}, {{ user.username }}</h1>
    <p>{{ today | date:'EEEE, MMMM d' }}</p>
 
  Section 2 — Stats row:
    <div class="stats-grid">  (4 columns)
      <app-stats-card icon="heroOutlineClipboardDocumentList" label="Active Tasks"   [value]="activeTaskCount" color="accent"></app-stats-card>
      <app-stats-card icon="heroOutlineRectangleStack"        label="My Workspaces" [value]="workspaces.length" color="success"></app-stats-card>
      <app-stats-card icon="heroOutlineClock"                 label="Due Today"     [value]="dueTodayCount" color="warning"></app-stats-card>
      <app-stats-card icon="heroOutlineExclamationCircle"     label="Overdue"       [value]="overdueCount" color="danger"></app-stats-card>
    </div>
 
  Section 3 — Workspaces row:
    <h2>My Workspaces</h2>
    <div class="workspace-row">  (horizontal scroll)
      <app-workspace-card *ngFor="let ws of workspaces" [workspace]="ws" (click)="navigate(ws.id)">
      </app-workspace-card>
      <div class="new-workspace-card" (click)="openCreateWorkspaceModal()">
        <ng-icon name="heroOutlinePlus"></ng-icon>
        <span>New Workspace</span>
      </div>
    </div>
 
  Section 4 — Activity feed (right side, if 2-col layout):
    <h2>Recent Activity</h2>
    <div class="activity-list">
      <div *ngFor="let log of activity" class="activity-item">
        <app-avatar [user]="log.user" size="sm"></app-avatar>
        <span>{{ log.action }}</span>
        <span class="time">{{ log.createdAt | relativeTime }}</span>
      </div>
    </div>
 
  Create workspace modal (inline):
    <app-modal [isOpen]="isCreateModalOpen" title="New Workspace" (closed)="isCreateModalOpen = false">
      <form [formGroup]="workspaceForm" (ngSubmit)="createWorkspace()">
        <app-input label="Name" formControlName="name"></app-input>
        <app-input label="Description" formControlName="description"></app-input>
        <app-button type="submit" [loading]="isCreating">Create</app-button>
      </form>
    </app-modal>
 
  Loading state: show skeleton cards while data loads (use *ngIf="!isLoading" else skeleton template)
  Empty state for workspaces: <app-empty-state> with "Create your first workspace" CTA
 
Goal: dashboard shows real data. Stat cards reflect actual task counts.
Verify: creating a workspace from the modal adds it to the list without page reload.
```
 
---
 
## PHASE 12 — Workspace + Project Pages
 
### Task 12.1 — Workspace List Page ☐
```
src/app/features/workspace/workspace-list/
 
workspace-list.component.ts:
  Standalone. Injected: WorkspaceService, ToastrService.
  On init: load all workspaces.
  Method: openCreate(), onCreated(ws): add to list.
 
workspace-list.component.html:
  Page header: <h1>Workspaces</h1> + <app-button (click)="openCreate()">New Workspace</app-button>
  
  Grid (3 cols lg, 2 cols md, 1 col sm):
    <div class="workspace-grid">
      <div class="workspace-card" *ngFor="let ws of workspaces" (click)="navigate(ws.id)">
        <div class="ws-header">
          <h3>{{ ws.name }}</h3>
          <app-badge [text]="ws.members.length + ' members'" variant="info"></app-badge>
        </div>
        <p class="ws-description">{{ ws.description | truncate:80 }}</p>
        <div class="ws-footer">
          <app-avatar [user]="ws.owner" size="sm"></app-avatar>
          <span class="owner-name">{{ ws.owner.username }}</span>
          <app-button variant="ghost" size="sm">Open →</app-button>
        </div>
      </div>
    </div>
 
  Empty state: <app-empty-state> when no workspaces
  Loading state: 3 skeleton cards
 
Goal: workspace list loads and displays correctly.
```
 
### Task 12.2 — Workspace Detail Page ☐
```
src/app/features/workspace/workspace-detail/
 
workspace-detail.component.ts:
  Standalone. Injected: WorkspaceService, ProjectService, ActivatedRoute, ToastrService.
  Loads: workspace by id (from route params), projects by workspace id.
  Methods:
    openAddMember(), onMemberAdded()
    openCreateProject(), onProjectCreated(project)
    removeMember(userId)
 
workspace-detail.component.html:
  Top section:
    <div class="ws-hero">
      <div>
        <h1>{{ workspace.name }}</h1>
        <p>{{ workspace.description }}</p>
      </div>
      <div class="ws-actions">
        <app-button variant="secondary" (click)="openAddMember()">Add Member</app-button>
        <app-button (click)="openCreateProject()">New Project</app-button>
      </div>
    </div>
 
  Members strip:
    <div class="members-strip">
      <app-avatar *ngFor="let m of workspace.members | slice:0:6" [user]="m" size="sm" [title]="m.username"></app-avatar>
      <span *ngIf="workspace.members.length > 6" class="more-members">+{{ workspace.members.length - 6 }}</span>
    </div>
 
  Projects grid:
    <h2>Projects</h2>
    <div class="projects-grid">
      <app-project-card *ngFor="let p of projects" [project]="p" (click)="navigate(p.id)">
      </app-project-card>
    </div>
    <app-empty-state *ngIf="!projects.length" title="No projects yet" description="Create the first project for this workspace" actionLabel="New Project" (action)="openCreateProject()">
    </app-empty-state>
 
  Add Member Modal:
    Email input + submit
 
  Create Project Modal:
    Fields: title, description, deadline (date input), manager (select from workspace.members)
 
src/app/features/project/project-card/project-card.component.ts (shared project card):
  Input: project: Project
  Output: clicked: EventEmitter
  Shows: title, status badge, deadline (red if past), ProgressBar, manager avatar+name
  Status badge colors:
    PLANNING → muted, ACTIVE → accent, ON_HOLD → warning, COMPLETED → success, ARCHIVED → muted
 
src/app/shared/components/progress-bar/progress-bar.component.ts:
  Input: value: number (0-100)
  Color: green if >70, yellow if 40-70, red if <40
  Animated width on mount using Angular animations
 
Goal: workspace detail shows projects and members. Can add members and create projects.
Verify: adding member with non-existent email shows error toast.
```
 
### Task 12.3 — Project Detail Page ☐
```
src/app/features/project/project-detail/
 
project-detail.component.ts:
  Standalone. Injected: ProjectService, AnalyticsService, ActivatedRoute, Router.
  On init: load project by id.
  Properties:
    activeTab: 'board' | 'list' | 'analytics' | 'settings' = 'board'
    isEditingTitle = false
 
  Methods:
    onTitleBlur(newTitle): call ProjectService.update() if changed
    onTabChange(tab): set activeTab
    archiveProject(): call ProjectService.archive(), navigate to workspace
 
project-detail.component.html:
 
  <div class="project-header">
    <!-- Editable title -->
    <h1 *ngIf="!isEditingTitle" (click)="isEditingTitle = true">{{ project.title }}</h1>
    <input *ngIf="isEditingTitle" [value]="project.title" (blur)="onTitleBlur($event.target.value)" autofocus>
    
    <div class="project-meta">
      <app-badge [text]="project.status" [variant]="statusVariant"></app-badge>
      <span class="deadline" [class.overdue]="isOverdue">
        {{ isOverdue ? 'Overdue' : daysLeft + ' days left' }}
      </span>
    </div>
    
    <app-button *ngIf="canArchive" variant="danger" size="sm" (click)="archiveProject()">Archive</app-button>
  </div>
 
  <!-- Tab navigation -->
  <div class="tab-nav">
    <button *ngFor="let tab of tabs" [class.active]="activeTab === tab.key" (click)="onTabChange(tab.key)">
      {{ tab.label }}
    </button>
  </div>
 
  <!-- Tab content -->
  <div class="tab-content">
    <app-task-board *ngIf="activeTab === 'board'" [projectId]="project.id"></app-task-board>
    <app-task-list  *ngIf="activeTab === 'list'"  [projectId]="project.id"></app-task-list>
    <app-project-analytics *ngIf="activeTab === 'analytics'" [projectId]="project.id"></app-project-analytics>
    <app-project-settings  *ngIf="activeTab === 'settings'"  [project]="project" (updated)="onProjectUpdated($event)"></app-project-settings>
  </div>
 
Create these as separate child components:
 
project-analytics.component.ts (in project/project-analytics/):
  Input: projectId: string
  On init: load stats, workload, health from AnalyticsService
  Template:
    Health badge (ON_TRACK=green / AT_RISK=yellow / DELAYED=red)
    Task status breakdown: horizontal stacked bar (pure CSS flex)
    Team workload: list of members with progress bar showing their task load
 
project-settings.component.ts (in project/project-settings/):
  Input: project: Project
  Output: updated: EventEmitter<Project>
  Form: title, description, deadline, manager dropdown
  Danger zone section: Archive button with confirmation
 
Goal: all 4 tabs render. Inline title editing saves to API.
Verify: TEAM_MEMBER role does not see Archive button (use *ngIf checking user role).
```
 
---
 
## PHASE 13 — Task Board (Core UI)
 
### Task 13.1 — Kanban Task Board ☐
```
src/app/features/task/task-board/
 
task-board.component.ts:
  Standalone. Input: projectId: string.
  Injected: TaskService, ToastrService, AuthStore.
  
  Properties:
    columns: { status: TaskStatus; label: string; tasks: Task[] }[] = [
      { status: 'TODO',        label: 'To Do',      tasks: [] },
      { status: 'IN_PROGRESS', label: 'In Progress', tasks: [] },
      { status: 'BLOCKED',     label: 'Blocked',     tasks: [] },
      { status: 'IN_REVIEW',   label: 'In Review',   tasks: [] },
      { status: 'DONE',        label: 'Done',        tasks: [] },
    ]
    filters: { priority: string; keyword: string; assigneeId: string } = {}
    isCreateModalOpen = false
    selectedColumnStatus: TaskStatus = 'TODO'
    isLoading = true
 
  On init: loadTasks()
  
  loadTasks():
    TaskService.getByProject(this.projectId, this.filters).subscribe(tasks => {
      this.columns.forEach(col => col.tasks = tasks.filter(t => t.status === col.status));
      this.isLoading = false;
    });
 
  onDrop(event: CdkDragDrop<Task[]>):
    if same container → moveItemInArray (reorder only, no API call)
    if different container:
      const task = event.previousContainer.data[event.previousIndex];
      const newStatus = ... // derive from container id
      optimistic update: move task in UI immediately
      TaskService.changeStatus(task.id, { status: newStatus }).subscribe({
        error: () => { revert move; ToastrService.error('Invalid status transition'); this.loadTasks(); }
      });
 
  openCreate(status: TaskStatus): selectedColumnStatus = status; isCreateModalOpen = true;
  
  onTaskCreated(task: Task): add to correct column without reload.
  
  onFiltersChange(): reload tasks with new filters.
 
task-board.component.html:
  Filter bar:
    <div class="filter-bar">
      <input placeholder="Search tasks..." (input)="onKeywordChange($event)">  <!-- debounced 300ms -->
      <select (change)="onPriorityChange($event)">
        <option value="">All priorities</option>
        <option *ngFor="let p of priorities" [value]="p">{{ p }}</option>
      </select>
      <button *ngIf="hasFilters" (click)="clearFilters()">Clear</button>
    </div>
 
  Board (horizontal scroll):
    <div class="board" cdkDropListGroup>
      <div *ngFor="let col of columns" class="column">
        <div class="column-header">
          <span class="status-dot" [class]="col.status | lowercase"></span>
          <span class="column-title">{{ col.label }}</span>
          <span class="task-count">{{ col.tasks.length }}</span>
          <button class="add-btn" (click)="openCreate(col.status)">+</button>
        </div>
        <div class="column-body"
             cdkDropList
             [id]="col.status"
             [cdkDropListData]="col.tasks"
             (cdkDropListDropped)="onDrop($event)">
          <app-task-card
            *ngFor="let task of col.tasks"
            [task]="task"
            cdkDrag
            [cdkDragData]="task"
            (cardClick)="openTaskDetail(task.id)"
            (deleted)="onTaskDeleted(task)">
          </app-task-card>
          <app-empty-state *ngIf="!col.tasks.length" title="" description="No tasks" [minimal]="true">
          </app-empty-state>
        </div>
      </div>
    </div>
 
  Import @angular/cdk/drag-drop: DragDropModule
  Add to angular.json if not already: @angular/cdk
 
  Create Task Modal (inline in template):
    <app-modal [isOpen]="isCreateModalOpen" title="New Task" (closed)="isCreateModalOpen = false">
      <form [formGroup]="createForm" (ngSubmit)="createTask()">
        <app-input label="Title" formControlName="title"></app-input>
        <app-input label="Description" formControlName="description"></app-input>
        <select formControlName="priority">CRITICAL/HIGH/MEDIUM/LOW</select>
        <input type="date" formControlName="dueDate">
        <select formControlName="assigneeId"><!-- project members --></select>
        <app-button type="submit" [loading]="isCreating">Create Task</app-button>
      </form>
    </app-modal>
 
task-card.component.ts (src/app/features/task/task-card/):
  Standalone.
  Inputs: task: Task
  Outputs: cardClick: EventEmitter<void>, deleted: EventEmitter<void>
  
  Template:
    <div class="task-card" (click)="cardClick.emit()">
      <div class="card-header">
        <app-badge [text]="task.priority" [variant]="priorityVariant"></app-badge>
        <div class="card-actions" (click)="$event.stopPropagation()">
          <button class="icon-btn" (click)="confirmDelete()">🗑</button>
        </div>
      </div>
      <h4 class="card-title">{{ task.title | truncate:60 }}</h4>
      <div class="card-footer">
        <span class="due-date" [class.overdue]="isOverdue" *ngIf="task.dueDate">
          {{ task.dueDate | date:'MMM d' }}
        </span>
        <app-avatar *ngIf="task.assignee" [user]="task.assignee" size="sm"></app-avatar>
      </div>
    </div>
 
  Priority variant map:
    LOW → 'muted', MEDIUM → 'info', HIGH → 'warning', CRITICAL → 'danger'
 
Goal: Kanban board renders. Drag and drop between columns works. Invalid transitions revert.
Verify: drag DONE → IN_PROGRESS fails with toast "Invalid status transition".
```
 
### Task 13.2 — Task Detail Drawer ☐
```
src/app/features/task/task-detail/
 
task-detail.component.ts:
  Standalone.
  Input: taskId: string
  Output: closed: EventEmitter<void>
  Injected: TaskService, CommentService, AuthStore, ToastrService.
 
  On init: load task by id, load comments.
 
  Properties:
    task: Task
    comments: Comment[]
    isEditingTitle = false
    isEditingDescription = false
    newCommentText = ''
    replyingToId: string | null = null
    replyText = ''
    isLoading = true
 
  Methods:
    onTitleBlur(val): if changed → TaskService.update()
    onDescBlur(val): if changed → TaskService.update()
    onStatusChange(status): TaskService.changeStatus() → update local task
    onAssigneeChange(userId): TaskService.assign()
    onPriorityChange(priority): TaskService.update()
    onDueDateChange(date): TaskService.update()
    submitComment(): CommentService.add() → prepend to comments list
    submitReply(commentId): CommentService.reply() → append to comment.replies
    deleteComment(commentId): CommentService.delete() → remove from list
    undoLastAction(): TaskService.undo() → reload task
    deleteTask(): TaskService.delete() → emit closed
 
task-detail.component.html:
  Drawer: fixed right panel, width 600px, full height, bg-surface, shadow-lg, slide-in animation.
  Backdrop: fixed inset-0, click closes drawer.
  
  Drawer structure:
    <div class="drawer-header">
      <button (click)="closed.emit()">✕</button>
      <div class="drawer-actions">
        <app-button variant="ghost" size="sm" (click)="undoLastAction()">Undo</app-button>
        <app-button variant="danger" size="sm" (click)="deleteTask()" *ngIf="canDelete">Delete</app-button>
      </div>
    </div>
 
    <div class="drawer-body"> (two columns: main + sidebar)
 
      <!-- Main column -->
      <div class="drawer-main">
        <!-- Editable title -->
        <h2 *ngIf="!isEditingTitle" (click)="isEditingTitle = true" class="task-title">{{ task.title }}</h2>
        <input *ngIf="isEditingTitle" [value]="task.title" (blur)="onTitleBlur($event.target.value)" autofocus>
 
        <!-- Editable description -->
        <p *ngIf="!isEditingDescription" (click)="isEditingDescription = true" class="task-desc">
          {{ task.description || 'Add description...' }}
        </p>
        <textarea *ngIf="isEditingDescription" [value]="task.description" (blur)="onDescBlur($event.target.value)" autofocus></textarea>
 
        <!-- Dependencies -->
        <div class="dependencies-section" *ngIf="task.dependencies.length">
          <h4>Blocked by</h4>
          <div *ngFor="let dep of task.dependencies" class="dep-item">
            <app-badge [text]="dep.status" [variant]="statusVariant(dep.status)"></app-badge>
            <span>{{ dep.title }}</span>
          </div>
        </div>
 
        <!-- Comments -->
        <div class="comments-section">
          <h4>Comments ({{ comments.length }})</h4>
          <div *ngFor="let comment of comments" class="comment">
            <app-avatar [user]="comment.author" size="sm"></app-avatar>
            <div class="comment-body">
              <div class="comment-header">
                <strong>{{ comment.author.username }}</strong>
                <span class="time">{{ comment.createdAt | relativeTime }}</span>
                <button *ngIf="canDeleteComment(comment)" (click)="deleteComment(comment.id)">✕</button>
              </div>
              <p>{{ comment.content }}</p>
              <button (click)="replyingToId = comment.id">Reply</button>
              <!-- Reply form -->
              <div *ngIf="replyingToId === comment.id" class="reply-form">
                <textarea [(ngModel)]="replyText" placeholder="Write a reply..."></textarea>
                <app-button size="sm" (click)="submitReply(comment.id)">Send</app-button>
              </div>
              <!-- Nested replies -->
              <div *ngFor="let reply of comment.replies" class="reply">
                <app-avatar [user]="reply.author" size="sm"></app-avatar>
                <div class="reply-body">
                  <strong>{{ reply.author.username }}</strong>
                  <p>{{ reply.content }}</p>
                </div>
              </div>
            </div>
          </div>
          <!-- New comment -->
          <div class="new-comment">
            <app-avatar [user]="currentUser!" size="sm"></app-avatar>
            <textarea [(ngModel)]="newCommentText" placeholder="Add a comment..."></textarea>
            <app-button size="sm" (click)="submitComment()" [disabled]="!newCommentText.trim()">Comment</app-button>
          </div>
          <app-empty-state *ngIf="!comments.length" title="No comments" description="Start the conversation" [minimal]="true">
          </app-empty-state>
        </div>
      </div>
 
      <!-- Sidebar column (task metadata) -->
      <div class="drawer-sidebar">
        <div class="meta-field">
          <label>Status</label>
          <select [ngModel]="task.status" (ngModelChange)="onStatusChange($event)">
            <option *ngFor="let s of statuses" [value]="s">{{ s }}</option>
          </select>
        </div>
        <div class="meta-field">
          <label>Priority</label>
          <select [ngModel]="task.priority" (ngModelChange)="onPriorityChange($event)">
            <option *ngFor="let p of priorities" [value]="p">{{ p }}</option>
          </select>
        </div>
        <div class="meta-field">
          <label>Assignee</label>
          <select [ngModel]="task.assignee?.id" (ngModelChange)="onAssigneeChange($event)">
            <option value="">Unassigned</option>
            <option *ngFor="let m of projectMembers" [value]="m.id">{{ m.username }}</option>
          </select>
        </div>
        <div class="meta-field">
          <label>Due Date</label>
          <input type="date" [ngModel]="task.dueDate" (ngModelChange)="onDueDateChange($event)">
        </div>
        <div class="meta-field">
          <label>Created</label>
          <span>{{ task.createdAt | date:'MMM d, y' }}</span>
        </div>
      </div>
    </div>
 
  Slide-in animation using Angular animations:
    trigger('slideIn', [
      transition(':enter', [ style({ transform: 'translateX(100%)' }), animate('200ms ease-out', style({ transform: 'translateX(0)' })) ]),
      transition(':leave', [ animate('200ms ease-in', style({ transform: 'translateX(100%)' })) ])
    ])
 
Goal: drawer opens on card click, all fields editable inline, comments post correctly.
Verify: undo button reverts last status change. Deleting a task closes the drawer.
```
 
---
 
## PHASE 14 — Notifications + Patterns Page
 
### Task 14.1 — Notifications ☐
```
Notifications are already partially wired via NotificationStore and Navbar.
Complete them here.
 
notification.store.ts (finalize):
  @Injectable({ providedIn: 'root' })
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  notifications$ = this.notificationsSubject.asObservable();
  unreadCount$ = this.notifications$.pipe(map(n => n.filter(x => !x.readStatus).length));
  private pollingInterval: any;
 
  load():
    this.notificationService.getAll().subscribe(n => this.notificationsSubject.next(n));
 
  markRead(id: string):
    this.notificationService.markRead(id).subscribe(() => {
      const updated = this.notificationsSubject.value.map(n =>
        n.id === id ? { ...n, readStatus: true } : n
      );
      this.notificationsSubject.next(updated);
    });
 
  markAllRead():
    unread notifications → call markRead for each → update local state
 
  startPolling():
    this.load();
    this.pollingInterval = setInterval(() => this.load(), 30000);
 
  stopPolling():
    clearInterval(this.pollingInterval);
 
In page-wrapper.component.ts:
  On init: inject NotificationStore, call startPolling()
  On destroy: call stopPolling()
 
In navbar.component.ts (already uses store):
  Connect notifications$ and unreadCount$ — already done from Task 9.1.
  Ensure markRead and markAllRead methods call the store.
 
Goal: bell badge updates every 30 seconds. Marking read updates badge immediately.
Verify: create a task → status change → within 30s, bell shows unread badge.
```
 
### Task 14.2 — Patterns Page ☐
```
src/app/features/patterns/
 
patterns.component.ts:
  Standalone. NO layout wrapper (standalone page, public).
  Injected: PatternsService.
  On init: load all patterns.
  Properties:
    patterns: Pattern[] = []
    filteredPatterns: Pattern[] = []
    activeCategory: 'ALL' | 'Creational' | 'Structural' | 'Behavioral' = 'ALL'
    isLoading = true
 
  onCategoryChange(cat): filteredPatterns = filter by category or show all.
 
patterns.component.html:
  Standalone page (no sidebar, no navbar — it has its own header).
  
  <div class="patterns-page">
    <header class="patterns-header">
      <div class="logo">TeamSync</div>
      <div class="header-content">
        <h1>Design Patterns</h1>
        <p>14 GoF Design Patterns implemented across 3 categories</p>
      </div>
      <a routerLink="/dashboard" class="back-link">← Back to App</a>
    </header>
 
    <div class="category-tabs">
      <button *ngFor="let cat of categories" [class.active]="activeCategory === cat" (click)="onCategoryChange(cat)">
        {{ cat }}
      </button>
    </div>
 
    <div class="patterns-grid">
      <div *ngFor="let p of filteredPatterns" class="pattern-card">
        <div class="pattern-card-header">
          <app-badge [text]="p.category" [variant]="categoryVariant(p.category)"></app-badge>
          <span class="pattern-number">#{{ p.id }}</span>
        </div>
        <h3 class="pattern-name">{{ p.name }}</h3>
        <p class="pattern-purpose">{{ p.purpose }}</p>
        <div class="pattern-package">{{ p.package }}</div>
        <div class="pattern-classes">
          <span *ngFor="let cls of p.keyClasses" class="class-chip">{{ cls }}</span>
        </div>
      </div>
    </div>
 
    <footer class="patterns-footer">
      <a href="http://localhost:8080/swagger-ui.html" target="_blank">View API Docs →</a>
    </footer>
  </div>
 
  Category badge variants:
    Creational → 'info' (purple tint)
    Structural → 'accent' (indigo)
    Behavioral → 'success' (green)
 
  SCSS: patterns grid = 3 cols lg, 2 cols md, 1 col sm. Cards have hover effect (translateY -4px + shadow).
 
Goal: /patterns loads without auth. All 14 patterns display. Category filter works.
Verify: page is presentable enough to show during academic defense.
```
 
---
 
## PHASE 15 — Tests
 
### Task 15.1 — Unit Tests: Services ☐
```
Use Angular's default testing setup: Jasmine + Karma (already included in ng new).
Test files go next to the files they test: auth.service.spec.ts, etc.
 
auth.service.spec.ts:
  TestBed with HttpClientTestingModule.
  Test: login() sends POST to /auth/login with correct body.
  Test: register() sends POST to /auth/register.
  Test: getMe() sends GET to /users/me.
  Use HttpTestingController to verify requests and flush mock responses.
 
task.service.spec.ts:
  Test: getByProject() sends GET /projects/{id}/tasks.
  Test: changeStatus() sends PUT /tasks/{id}/status with body.
  Test: undo() sends POST /tasks/undo.
  Test: getByProject() with filters appends correct query params.
 
workspace.service.spec.ts:
  Test: getAll() sends GET /workspaces.
  Test: addMember() sends POST with { email } body.
  Test: removeMember() sends DELETE to correct URL.
 
auth.store.spec.ts:
  Test: setUser() updates user$ observable.
  Test: clearUser() sets user$ to null.
  Test: isAuthenticated$ emits true when user is set, false when null.
 
token.service.spec.ts:
  Test: setToken() saves to localStorage.
  Test: getToken() retrieves from localStorage.
  Test: removeToken() removes from localStorage.
  Test: hasToken() returns false when empty.
  Mock localStorage with jasmine.createSpyObj or spyOn.
 
relative-time.pipe.spec.ts:
  Test: "just now" for dates < 1 minute ago.
  Test: "Xm ago" for dates < 1 hour ago.
  Test: "Xh ago" for dates < 24 hours ago.
  Test: "Xd ago" for dates < 7 days ago.
 
Run: ng test --no-watch --code-coverage
Goal: all tests pass. Coverage > 70% for services.
```
 
### Task 15.2 — Unit Tests: Components ☐
```
login.component.spec.ts:
  TestBed with ReactiveFormsModule, RouterTestingModule, HttpClientTestingModule.
  Mock AuthService, AuthStore, TokenService, Router, ToastrService.
  
  Test: form is invalid when empty → onSubmit() does not call AuthService.login.
  Test: form is invalid with bad email format.
  Test: onSubmit() calls AuthService.login() with form values when valid.
  Test: on successful login → TokenService.setToken called → Router.navigate called with ['/dashboard'].
  Test: isLoading set to true during submission, false after.
 
task-card.component.spec.ts:
  Test: renders task title.
  Test: shows 'overdue' class when dueDate is in the past.
  Test: cardClick EventEmitter emits on card click.
  Test: priority badge displays correct text.
 
status-badge.component.spec.ts:
  Test: each status maps to correct CSS class.
 
task-board.component.spec.ts:
  Mock TaskService returning Observable<Task[]>.
  Test: loadTasks() distributes tasks into correct columns by status.
  Test: onDrop() within same column calls moveItemInArray, not TaskService.changeStatus.
  Test: onDrop() to different column calls TaskService.changeStatus with correct status.
  Test: on changeStatus error → reverts task to original column.
 
navbar.component.spec.ts:
  Mock NotificationStore, AuthStore.
  Test: unreadCount badge not visible when unreadCount$ = 0.
  Test: unreadCount badge visible and shows correct number when unreadCount$ > 0.
  Test: logout() calls AuthStore.clearUser(), TokenService.removeToken(), Router.navigate.
 
Run: ng test --no-watch
Goal: all component tests pass. No test modifies real localStorage or makes real HTTP calls.
```
 
### Task 15.3 — Integration Tests: Auth Flow + Task Flow ☐
```
Use Angular's TestBed for integration tests (not e2e — no Cypress needed).
These tests render the full component tree and simulate user interactions.
 
auth-flow.integration.spec.ts:
  Setup: TestBed with real ReactiveFormsModule, RouterTestingModule, mocked HttpClient.
  
  Test — full login flow:
    Render LoginComponent.
    Fill email and password inputs (using fixture.debugElement.query).
    Click submit.
    Expect HttpClient to have received POST /auth/login.
    Flush response { token: 'mock-token' }.
    Expect HttpClient to receive GET /users/me.
    Flush response { id: '1', username: 'Ahmed', email: 'a@test.com', role: 'TEAM_MEMBER' }.
    Expect Router.navigate to have been called with ['/dashboard'].
    Expect TokenService.getToken() to return 'mock-token'.
 
  Test — login with wrong credentials:
    Flush 401 response.
    Expect ToastrService.error to have been called.
    Expect Router.navigate NOT called.
 
  Test — register then auto-login:
    Fill register form.
    Submit → flush 201 User response.
    Expect login request to follow automatically.
    Flush token → expect getMe → flush user → expect navigate to /dashboard.
 
task-flow.integration.spec.ts:
  Test — create task and see it in board:
    Render TaskBoardComponent with projectId.
    Mock TaskService.getByProject returning [].
    Expect 5 columns rendered with empty state.
    Open create modal (click + button on TODO column).
    Fill title "Test Task", priority "HIGH".
    Submit → mock TaskService.create returning a Task with status=TODO.
    Expect task to appear in TODO column without reload.
 
  Test — drag task to new column (status change):
    Mock 1 task in TODO column.
    Simulate cdkDropList drop event from TODO to IN_PROGRESS container.
    Expect TaskService.changeStatus called with correct id and status.
    Flush success → task stays in IN_PROGRESS column.
 
  Test — invalid status transition reverts:
    Simulate drop from IN_PROGRESS to DONE.
    Expect TaskService.changeStatus called.
    Flush 400 error.
    Expect task to revert back to IN_PROGRESS column.
    Expect ToastrService.error called.
 
Run: ng test --no-watch
Goal: all integration tests pass. They simulate real user flows without a backend.
```
 
---
 
## PHASE 16 — Final Polish
 
### Task 16.1 — Loading + Empty + Error States ☐
```
Go through every page and add proper states.
 
Loading skeleton (create shared skeleton component):
  src/app/shared/components/skeleton/skeleton.component.ts
  Input: type: 'card' | 'list-item' | 'text' | 'avatar'
  Renders animated gray pulse block matching the shape.
 
Pages to audit:
  dashboard: skeleton stats cards + skeleton workspace cards while loading
  workspace-list: skeleton workspace cards (3 of them)
  workspace-detail: skeleton project cards
  project-detail: skeleton tab content
  task-board: skeleton task cards in each column (2 per column)
  task-detail: skeleton for drawer content
  patterns: skeleton pattern cards (6 of them)
 
Error state component (already exists as app-empty-state with error variant):
  Add variant: 'error' to empty-state component
  Shows: red icon + "Something went wrong" + "Retry" button
  Each page: on API error → show error state with retry button that re-calls the load method.
 
Global 404 page:
  src/app/features/not-found/not-found.component.ts
  Shows: large "404", "Page not found", back to dashboard link.
  Add to router: { path: '**', loadComponent: () => NotFoundComponent }
 
Goal: no blank white screens anywhere. Every loading/empty/error state handled.
Verify: disconnect from backend → error states appear. Reconnect → retry works.
```
 
### Task 16.2 — Responsive Layout ☐
```
Breakpoints (add to styles.scss):
  $mobile:  576px;
  $tablet:  768px;
  $desktop: 1024px;
  $wide:    1280px;
 
Sidebar responsive behavior:
  Desktop (>1024px): full sidebar 240px, always visible
  Tablet (768-1024px): collapsed sidebar (64px), icons only, tooltips on hover
  Mobile (<768px): sidebar hidden, hamburger button in navbar opens it as overlay drawer
 
  Add to sidebar.component.ts:
    @HostListener('window:resize') onResize(): update isCollapsed based on window.innerWidth
    On mobile: isOverlay = true, shows backdrop behind sidebar when open
 
Task board responsive:
  Desktop: 5 columns horizontal scroll
  Mobile: 1 column visible, swipe left/right between columns (use CSS scroll snap)
    Add scroll snap CSS: scroll-snap-type: x mandatory on board container, scroll-snap-align: start on each column
 
Modals responsive:
  Mobile (<576px): modal takes full screen width and 90% height, positioned at bottom (bottom sheet)
  Add to modal.component.scss: @media (max-width: 576px) { panel: width 100%, border-radius top only }
 
Task detail drawer responsive:
  Desktop: 600px right drawer
  Mobile: full screen overlay
 
Grid responsive fixes:
  workspace-list: 1 col mobile, 2 tablet, 3 desktop
  project cards: 1 col mobile, 2 tablet, 3 desktop
  dashboard stats: 2 col mobile, 4 desktop
  patterns grid: 1 col mobile, 2 tablet, 3 desktop
 
Goal: app is fully usable on mobile. No horizontal scroll except the task board.
Verify: open on 375px viewport — everything readable, interactive, no overflow.
```
 
### Task 16.3 — Final Cleanup + Build ☐
```
Code quality:
  - Remove all console.log statements
  - Ensure all Observables are unsubscribed (use takeUntilDestroyed() from @angular/core/rxjs-interop, or AsyncPipe in templates)
  - No unused imports in any component
  - All @Input() that are required have required: true in Angular 17+ syntax
  - All components have OnPush change detection where possible
 
Accessibility:
  - All interactive elements have aria-label or aria-labelledby
  - Color is never the only indicator (add icons + text to badges)
  - Focus visible on all interactive elements (add :focus-visible styles)
  - Images and avatars have alt text
 
Page titles (add to each route):
  title: 'Dashboard | TeamSync'
  title: 'Workspaces | TeamSync'
  etc.
  Use Angular router title strategy: providers: [{ provide: TitleStrategy, useClass: AppTitleStrategy }]
 
Environment:
  Verify environment.ts and environment.prod.ts are correct.
  ng build --configuration=production must succeed with zero errors and zero warnings.
 
Update root README.md to add frontend section:
  ## Frontend (Angular)
  Prerequisites: Node 18+, Angular CLI 17+
  
  cd frontend
  npm install
  ng serve          → http://localhost:4200
  ng test           → run all tests
  ng build --configuration=production → production build
 
Final verification checklist:
  [ ] ng serve starts with no errors
  [ ] ng build --configuration=production succeeds
  [ ] ng test passes all tests
  [ ] Login → Dashboard → Create workspace → Create project → Create task → Move task → Comment → all work
  [ ] /patterns page loads without auth and shows all 14 patterns
  [ ] Notifications bell updates within 30 seconds of an action
  [ ] Responsive layout works on 375px mobile viewport
 
Goal: production build clean. Full user flow works end-to-end with the Spring Boot backend.
```
---

## Pattern Checklist

| # | Pattern | Category | Task | Done |
|---|---|---|---|---|
| 1 | Singleton | Creational | 2.3 | ✅ |
| 2 | Factory Method | Creational | 4.1 | ✅ |
| 3 | Builder | Creational | 6.2 | ✅ |
| 4 | Prototype | Creational | 3.4 | ✅ |
| 5 | Facade | Structural | 2.3 | ✅ |
| 6 | Adapter | Structural | 4.4 | ✅ |
| 7 | Proxy | Structural | 4.4 | ✅ |
| 8 | Decorator | Structural | 4.3 | ✅ |
| 9 | Observer | Behavioral | 4.1 | ✅ |
| 10 | Strategy | Behavioral | 3.4 | ✅ |
| 11 | State | Behavioral | 3.2 | ✅ |
| 12 | Command | Behavioral | 4.2 | ✅ |
| 13 | Chain of Responsibility | Behavioral | 4.3 | ✅ |
| 14 | Template Method | Behavioral | 6.2 | ✅ |

---

## Claude Code Session Header (paste this every session)

```
Read project-brain.md before touching any code.
Current task: [TASK NUMBER — TASK TITLE]
Scope: only implement what this task describes. Do not refactor other files.
Each pattern goes in patterns/<category>/<name>/ with its own README.md.
After finishing: confirm the app starts and the task's goal is met.
```
