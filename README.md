# TeamSync

## Description
TeamSync is a collaborative project management platform that lets teams manage workspaces, projects, tasks, and comments with real-time activity feeds and analytics.
It serves as a full-stack demonstration of all 14 Gang-of-Four design patterns integrated into a production-grade Spring Boot 3 REST API.

## Tech Stack

| Layer | Technology |
|---|---|
| Language | Java 17 |
| Framework | Spring Boot 3.3.5 |
| Security | Spring Security 6 + JWT (jjwt 0.11.5) |
| Persistence | Spring Data JPA + PostgreSQL |
| Build | Maven |
| Documentation | SpringDoc OpenAPI 2.6 (Swagger UI) |
| Utilities | Lombok, Hibernate Validator |

## How to Run

1. Start PostgreSQL (or use `docker-compose up -d`)
2. Update `src/main/resources/application.properties` with your DB credentials (default: `postgres/postgres`, db: `teamsync`)
3. `mvn spring-boot:run`
4. Open http://localhost:8080/swagger-ui.html

## Design Patterns (14 GoF Patterns)

| # | Pattern | Category | Package | Purpose |
|---|---|---|---|---|
| 1 | Singleton | Creational | `patterns.creational.singleton` | One shared `AppLogger` instance across the whole application |
| 2 | Factory Method | Creational | `patterns.creational.factory` | Creates IN_APP or EMAIL `Notification` objects without exposing `new` |
| 3 | Builder | Creational | `patterns.creational.builder` | Fluent step-by-step construction of `Report` objects |
| 4 | Prototype | Creational | `patterns.creational.prototype` | Clones `TaskTemplate` to create tasks with pre-filled fields |
| 5 | Facade | Structural | `patterns.structural.facade` | `ProjectManagementFacade` hides validate + create + assign behind one call |
| 6 | Adapter | Structural | `patterns.structural.adapter` | Translates `MockExternalEmailClient.sendMessage()` to `EmailService.sendEmail()` |
| 7 | Proxy | Structural | `patterns.structural.proxy` | `TaskServiceProxy` checks roles before delete and membership before assign |
| 8 | Decorator | Structural | `patterns.structural.decorator` | Stacks `UrgentDecorator(EmailDecorator(InAppSender))` for CRITICAL tasks |
| 9 | Observer | Behavioral | `patterns.behavioral.observer` | `ProjectEventPublisher` notifies `ActivityLogListener` and `NotificationListener` |
| 10 | Strategy | Behavioral | `patterns.behavioral.strategy` | Swappable auto-assignment: `WorkloadStrategy` or `RoundRobinStrategy` |
| 11 | State | Behavioral | `patterns.behavioral.state` | `TaskStateMachine` delegates transitions to state objects; invalid ones throw immediately |
| 12 | Command | Behavioral | `patterns.behavioral.command` | `TaskCommandInvoker` keeps a per-user undo history for delete/assign/status changes |
| 13 | Chain of Responsibility | Behavioral | `patterns.behavioral.chain` | Title → Deadline → Assignee → Priority validators run in sequence before task creation |
| 14 | Template Method | Behavioral | `patterns.behavioral.template` | `ReportGenerator.generate()` defines fixed steps; JSON/CSV/PDF subclasses implement each step |

## API Overview

| Group | Base Path | Description |
|---|---|---|
| Auth | `/auth` | Register, login, JWT token |
| Users | `/users` | Profile, update username, list all (ADMIN) |
| Workspaces | `/workspaces` | Create, list (with keyword filter), manage members |
| Projects | `/projects`, `/workspaces/{id}/projects` | CRUD, archive, initialize via Facade, filter by status/manager |
| Tasks | `/projects/{id}/tasks`, `/tasks` | CRUD, status transitions, auto-assign, undo, templates, dependencies |
| Comments | `/tasks/{id}/comments`, `/comments` | Threaded comments and replies |
| Notifications | `/notifications` | Unread list, mark as read |
| Activity | `/projects/{id}/activity`, `/workspaces/{id}/activity` | Event feed |
| Analytics | `/analytics/projects/{id}` | Stats, team workload, health indicator |
| Reports | `/reports/projects/{id}` | JSON / CSV / PDF report generation |
| Patterns | `/patterns` | Academic catalogue of all 14 GoF patterns |
