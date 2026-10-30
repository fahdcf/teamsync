# TeamSync

A Spring Boot / Angular project management application with workspaces, projects,
Kanban tasks, subtasks, dependencies, comments, notifications, analytics and exports.

## Architecture

One layered backend application: **REST controller → transactional service → Spring
Data JPA repository → PostgreSQL**. There are no application ports, custom repository
adapters, microservices or authorization delegate proxies.

```text
src/main/java/com/teamsync/
  config/       OpenAPI configuration
  controller/   Spring MVC endpoints; bind/validate requests and delegate
  dto/          Request/response contracts; no passwords in user responses
  service/      Business workflows, DTO mapping, transactions and method security
  repository/   Spring Data JPA interfaces and visibility-aware specifications
  entity/       Persistence models, including task templates
  enums/        Stored role/status/priority values
  security/     JWT issuance/validation, credential authentication, resource policy
  exception/    Application exceptions; MVC advice returns consistent errors
  patterns/     Supporting state, strategies, commands and notification/report behavior
frontend/teamsync-frontend/
  src/app/api/                 Angular HTTP clients
  src/app/core/                Interceptors, route guards, session token storage
  src/app/store/               Auth and notification state
  src/app/features/            Application screens
```

Controllers contain no persistence or permission logic. Services use constructor
injection and map entities to DTOs while their transaction is active; Open Session
in View is disabled. The service layer uses `@PreAuthorize` with the small
`ResourceAuthorization` bean for database-backed ownership and membership checks.
Task mutations acquire row locks; state transitions use `TaskStateMachine`.

Useful domain patterns remain, but the project does not target a pattern count.
The authorization proxy/interface, CRUD facade, redundant validation chain,
discarded report builder and custom event publisher were removed. Spring events
notify listeners; service audit entries contain actual resource IDs. `/patterns`
lists the retained implementations. See [the audit](docs/SECURITY_AUDIT.md) for the
previous structure, findings, full route matrix and rollout notes.

## Authentication

`POST /auth/register` creates a TEAM_MEMBER account; role may be omitted. Requests
for ADMIN or PROJECT_MANAGER at registration receive 403. Passwords use BCrypt.
`POST /auth/login` authenticates through `AuthenticationManager` and
`DaoAuthenticationProvider`, then `JwtService` issues an HS256 JWT.

Spring Security's resource-server bearer filter and `NimbusJwtDecoder` verify the
signature, issuer, expiration and required claims. `DatabaseJwtAuthenticationConverter`
resolves the stable UUID subject, checks password version and loads the **current
database role** into `ROLE_*` authorities. JWT role claims are never trusted.
The app remains stateless; it does not need an OAuth server or identity provider.

Angular sends `Authorization: Bearer <token>` only to the configured backend.
The token lives in session storage, not persistent local storage. Route guards
reject expired/malformed stored tokens. A 401 clears credentials and account state;
a 403 explains the denied operation without logging out. Backend DTO permission
flags guide management controls; backend service checks enforce the policy.

Existing JWTs require a fresh login after this migration. Role and membership
revocation affect the next request; changing password invalidates older tokens.
Changing email retains identity through the UUID subject. Logout clears browser
credentials; other copies of a token remain valid until expiry/password/key change.

## Permissions

Workspace ownership and membership are relationships, independent of the global
role. Projects inherit workspace participants; there is no separate project-member
table. A global PROJECT_MANAGER role alone never grants management of an unrelated
project. An assigned manager must remain a workspace participant.

| Operation | Allowed |
| --- | --- |
| Workspace creation | Any authenticated user; creator becomes owner |
| Workspace details, projects/tasks, comments, analytics, reports, resource activity | Workspace participants or ADMIN |
| Workspace settings, membership, invitation user directory | Workspace owner or ADMIN |
| Project creation | Owner, participating PROJECT_MANAGER, or ADMIN |
| Project update/archive; task creation/update/delete/assign/reorder; dependencies/templates; subtask editing | Workspace owner, assigned participating PROJECT_MANAGER, or ADMIN |
| Reassign project manager | Owner/admin; selected manager must belong to workspace and be eligible |
| Task status and subtask completion | Above managers, or parent task assignee who still participates |
| Add comments/replies | Workspace participants or ADMIN |
| Delete comments | Author with current access or ADMIN |
| Notifications, preferences, profile, personal activity | Current account only |
| List users / change another account's role | ADMIN; cannot change own role |
| Undo | Current user's last committed command, subject to current resource permissions |

Assignees must be workspace participants. Dependencies and template cloning stay
inside the project. GET/list/search/calendar/dashboard endpoints constrain visible
data. Missing or inaccessible resources return generic 404; visible resources with
insufficient management permission return 403. Invalid credentials return 401;
malformed/invalid input returns 400; persistence conflicts return 409.

Public routes: POST `/auth/register`, POST `/auth/login`, GET `/patterns`, GET
`/public/stats`, GET `/public/health`, GET Swagger UI and OpenAPI. All other routes
require authentication. The public stats endpoint contains static demonstration
figures, not real service metrics.

## Run locally

Requirements: JDK 17+, Maven 3.9+, PostgreSQL, Node **22.12+** (or a compatible
Angular 21 Node release), npm. Angular 21 is used, not the old React layout.

1. Create an empty PostgreSQL database named `teamsync` using your PostgreSQL tools.
2. Copy `.env.example` to the ignored `.env`; configure `DB_USERNAME`, `DB_PASSWORD`
   and a new `JWT_SECRET`. The file uses Java properties syntax, not shell `export`.
   Alternatively set process environment variables. Never commit secrets.
3. Generate a random 32-byte hexadecimal signing key locally, for example:

   ```sh
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

4. Run the backend from the repository root:

   ```sh
   mvn spring-boot:run
   ```

5. Start the frontend in a second terminal:

   ```sh
   cd frontend/teamsync-frontend
   npm ci
   npm start
   ```

Backend: `http://localhost:8080`; frontend: `http://localhost:4200`;
Swagger: `http://localhost:8080/swagger-ui.html`.

| Setting | Purpose / default |
| --- | --- |
| DB_URL | `jdbc:postgresql://localhost:5432/teamsync` |
| DB_USERNAME / DB_PASSWORD | Database account; password required externally |
| JWT_SECRET | Required, at least 64 hexadecimal characters; use independent random keys per environment |
| JWT_EXPIRATION_MS | Token lifetime, default 3600000 (one hour) |
| DDL_AUTO | Local default `update`; use `validate` against a provisioned production schema |
| APP_CORS_ALLOWED_ORIGINS | Comma-separated allowed origins; default `http://localhost:4200` |
| NVIDIA_AI_API_KEY | Optional; AI endpoints explain when the provider is unconfigured |

Set Angular's API URL in `src/environments/environment.ts` and
`environment.prod.ts`. Production uses the same-origin `/api` path; configure the
reverse proxy to forward it to Spring without the prefix. Deploy over HTTPS.

Existing schema names/relationships and role values are preserved. No data-deleting
migration is introduced. Bootstrap the first administrator through an operator
controlled database procedure. There are no default privileged credentials or
public admin bootstrap endpoints. Existing privileged users should be reviewed
because the previous registration accepted arbitrary roles.

## Tests and builds

```sh
mvn clean verify
cd frontend/teamsync-frontend
npm ci
npm test -- --watch=false
npm run build
```

Backend tests use an isolated H2 database in PostgreSQL mode, real MVC requests,
JWT validation, Spring method security and JPA transactions. The same suite supports
disposable PostgreSQL through `TEST_DB_URL`, `TEST_DB_USERNAME`, `TEST_DB_PASSWORD`,
`TEST_DB_DRIVER=org.postgresql.Driver` and
`TEST_DB_DIALECT=org.hibernate.dialect.PostgreSQLDialect`.
**Never point the test profile at an existing database: it uses create-drop.**
CI runs the backend on H2 and PostgreSQL and builds/tests Angular. See
`SecurityIntegrationTests` for both denied and permitted workflows, revocation,
undo and export regressions. Frontend tests cover authentication, 401/403 handling,
token scope, expiration and Kanban behavior.

## Current product limits

Notifications use HTTP polling, email delivery is mocked, and the messages screen
is a static demo; no WebSocket/chat backend is claimed. AI sends the screen data
supplied by the caller to the configured provider. JSON, quoted CSV and real PDF
exports use the authorized project's analytics. Undo is a ten-command per-user
memory history, lost on restart; undoing deletion recreates resources with new IDs.
No user activation/deletion, separate project membership or refresh-token system
is implemented. The historical French pattern report describes the pre-refactor
academic implementation and is clearly marked as archived.
