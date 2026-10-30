# Architecture and authorization audit

Baseline: GitHub `main` at `ad3e261`. Scope: Java application, all MVC controllers,
services, JPA models/repositories, supporting patterns, Angular authentication,
API clients, routes and management screens, configuration, tests and documentation.

## Findings and migration

The actual backend was already largely layered, not hexagonal: no application ports
or repository adapters needed migration. The main problems were scattered policy,
pattern-driven delegation and persistence/service classes hidden in pattern packages.

| Finding | Resolution |
| --- | --- |
| Registration trusted the supplied global role | Only TEAM_MEMBER registration; privileged requests receive 403 |
| Global manager role allowed task deletion across projects | Service annotations require ownership or assignment as this project's manager, plus current workspace participation |
| Project search returned every project's data | Membership-aware JPA specification, applied before mapping |
| Direct resource GET, activity, reports, comments and templates lacked checks | Resource-specific annotations; outsiders and missing resources both receive generic 404 |
| Workspace membership changes were unrestricted | Owner/admin only, with annotated service entry points |
| Profile role editing allowed self-demotion and mixed account and role concerns | Profile cannot change roles; dedicated admin role endpoint; admins cannot change their own role |
| Assignment validation varied by endpoint | One database-backed assignee invariant across create/update/assign/subtasks and undo |
| Auto-assignment accepted a task from a different project | Authorize both objects and validate their relationship |
| Task templates and dependencies could reference unrelated resources | Authorize source and destination; require the same project |
| Task creation could bypass workflow via initial status | Start at TODO, route requested transitions through TaskStateMachine |
| Undo replayed stale detached entities without reauthorization | Check current access and restored assignees; reload current task; compare affected field; history published after commit |
| Inconsistent error JSON and custom bearer filter edge cases | Spring bearer filter/Nimbus decoder; serialized JSON errors; 401/403/400/404 handling |
| Email-based JWT subject changed meaning after profile edits | Stable UUID subject, current email resolved from the database |
| Password change did not revoke existing JWTs | Password version claim checked against existing passwordUpdatedAt column |
| Task status dependency service caused a lazy circular dependency | State machine checks the provided task's dependencies directly |
| Shared mutable assignment strategy could race between requests | Choose the strategy per call |
| Duplicate event audit records had random entity IDs | Native Spring events for notifications; transactional service logs use actual entity IDs |
| Report builder result was discarded | Remove dead report model/builder; format service-collected data directly |
| PDF export was plain text; CSV values were unescaped | Generate PDF with PDFBox; quote CSV fields |
| Angular sent bearer credentials to every HttpClient destination | Restrict headers to the configured API URL boundary |
| Persistent token and stale UI account state | Session storage, expiration-aware route guard, clear account state on 401 |
| Management controls depended only on global role | DTO permission flags derive from the backend policy |
| Member workspace page fetched the global invitation directory | Fetch directory only when an authorized owner opens the invitation dialog |

## Policy and resource boundaries

Global roles remain ADMIN, PROJECT_MANAGER and TEAM_MEMBER; their stored values do
not change. There is no separate project-member table: workspace owner and members
are the participants in every project in that workspace. A project manager must
also remain a participant and retain PROJECT_MANAGER. Assignment alone never gives
workspace access. Workspace owners may manage their resources regardless of their
global role, so newly registered users can create and manage their own workspace.

ADMIN is the explicit cross-workspace administrative override for resource access.
Personal notifications, preferences, profile and activity remain personal even for
administrators. Personal dashboards/workspace lists are scoped to participation;
admins can inspect other resources through project search and direct resource APIs.

| Operation / HTTP routes | Policy |
| --- | --- |
| POST /auth/register, POST /auth/login | Public; registration cannot grant privileged roles |
| GET /patterns, /public/stats, /public/health, Swagger/OpenAPI | Public; /public/stats contains static demo figures, no customer data |
| GET /users | ADMIN |
| PUT /users/{id}/role | ADMIN; cannot change own role |
| GET/PUT /users/me, preferences, account-overview, security; PUT /users/me/password | Current account only |
| POST /workspaces | Any authenticated account becomes owner |
| GET /workspaces | Current account's owned/member workspaces |
| GET /workspaces/{id}, /summary, /activity, /projects | Workspace participant or ADMIN |
| PUT /workspaces/{id}; POST/DELETE /workspaces/{id}/members; GET /available-members | Workspace owner or ADMIN |
| POST /workspaces/{id}/projects; POST /projects/initialize | Workspace owner, participating PROJECT_MANAGER or ADMIN |
| GET /projects | Membership-filtered results; ADMIN may search all |
| GET /projects/{id}; PUT /projects/{id}/favorite | Workspace participant or ADMIN; favorite belongs to caller |
| PUT /projects/{id}, /archive | Owner/admin or the assigned participating PROJECT_MANAGER |
| Change project.managerId | Owner/admin; target must participate and be owner, PROJECT_MANAGER or ADMIN |
| GET /projects/{id}/tasks, /tasks/blocked, /templates | Workspace participant or ADMIN |
| GET /tasks | Membership-filtered paginated results; ADMIN may see all |
| GET /tasks/{id} | Workspace participant or ADMIN |
| POST /projects/{id}/tasks, /tasks/auto-assign, /templates; PUT /tasks/{id}, /assign; DELETE /tasks/{id}; PUT /projects/{id}/tasks/reorder | Project management policy |
| PUT /tasks/{id}/status | Project management policy or task assignee who still participates |
| POST/DELETE task dependencies | Project management policy; source and target must share project |
| POST/PUT/DELETE subtasks | Project management policy; assignee must participate |
| PUT subtask /toggle | Same policy as parent task status change |
| POST /tasks/from-template/{templateId}?projectId=... | Destination project management; readable template from the same project |
| POST /tasks/undo | Current account's most recent action, reauthorized under current policy |
| GET/POST /tasks/{id}/comments; POST /comments/{id}/replies | Workspace participant or ADMIN |
| DELETE /comments/{id} | Author with current workspace access, or ADMIN; removes descendants |
| GET /notifications; PUT /notifications/{id}/read | Recipient only |
| GET /projects/{id}/activity | Workspace participant or ADMIN |
| GET /users/me/activity | Current account's actions only |
| GET /analytics/projects/{id}/stats, /team-workload, /health; GET /reports/projects/{id} | Workspace participant or ADMIN |
| GET /analytics/team/performance, /performance-series, /insights; /dashboard/*; /calendar/events; /search | Current account's workspace scope; supplied filters only narrow scope |
| POST /ai/chat, /ai/insights | Authenticated caller; sends caller-supplied screen payload, does not query unrestricted server data |

For an existing resource visible to the caller, insufficient management permission
returns 403. Missing or outside-workspace resources return the same generic 404.
Relationship violations inside an authorized operation return 400. Validation and
authentication failures do not expose internal SQL, signing details or stack traces.

No user delete/deactivation, workspace delete, project delete, separate project
membership or real-time chat backend existed; this refactor does not invent them.
The messages screen is a static demonstration, notifications poll over HTTP, and
the email integration remains a mock. There is no WebSocket authorization surface.

## Layering and interception

Controllers bind validated DTOs and delegate to services. Spring Data JPA repositories
are accessed from transactional services and the small security policy bean.
Method security is enabled in SecurityConfig. All public business service entry
points require authentication; sensitive entry points add explicit @PreAuthorize
policies. Overloads carry the same policy, including facade replacement and template
entry points; the outer operation therefore does not depend on self-invocation
triggering an interceptor. Task mutation reads use pessimistic row locks.

ResourceAuthorization depends on repositories, never on application services.
It is deliberately a policy evaluator, not a replacement security framework.
TaskServiceProxy, its interface and @Primary selection are gone. The facade,
no-op validation chain, discarded report builder and custom event publisher were
removed. State, assignment strategies, undo commands, notification composition,
template cloning and report formatting retain useful behavior.

## Compatibility and rollout

No table names, columns, foreign keys, role values or entity relationships were
changed. TaskTemplate moves to entity/, repository/ and service/ while retaining
the task_templates mapping. No destructive data migration is needed. Existing
rows and memberships are retained, including legacy managers/assignees outside
their workspace; those relationships do not grant access and must be repaired
explicitly by workspace owners/admins if the assignments should remain usable.

1. Back up the existing database and deploy to a staging copy first.
2. Supply a new external JWT_SECRET and DB settings. Old committed secrets must
   be rotated; a source change cannot revoke a provider key or rewrite history.
3. Deploy frontend and backend together. Old email-subject JWTs are rejected;
   users sign in again. Session storage removes persistent credentials on upgrade.
4. Audit existing privileged accounts: registration previously allowed arbitrary
   roles, so existing ADMIN/PROJECT_MANAGER accounts cannot automatically be trusted.
   This refactor deliberately does not demote or delete existing users.
5. Bootstrap the first trusted administrator through an operator-controlled database
   procedure; there is no public bootstrap endpoint or default admin password.
6. Keep Hibernate update for existing local setup or set DDL_AUTO=validate after
   provisioning schema. Introduce versioned migrations before future schema changes.

JSON field additions (canManage/canCreateProject/canChangeManager/canChangeStatus)
are backward compatible. Invalid role choices and previously unauthorized access
are intentionally rejected. Existing route names remain, including initialize,
templates, undo and report downloads. New tasks start at TODO; subsequent changes
use the state machine. PDF now returns actual PDF bytes with the existing MIME type.

Undo retains up to ten committed actions per user in memory, is lost on restart,
and is suitable for this single-instance monolith. Undo of deletion recreates task,
subtasks and comments with new IDs, as the old delete undo already recreated tasks.
It restores dependency relationships but cannot restore a deleted user/project.
Field comparisons prevent reversing a different current assignment/status; they
do not supply a durable, multi-instance audit/version history.

Browser session storage is still accessible to JavaScript. XSS prevention and TLS
remain deployment requirements. Local logout removes the tab's credentials; it
does not revoke a stolen JWT before expiry. Password change and signing-key rotation
revoke tokens; role and membership changes affect the next request. No activation
flag, refresh-token system or token denylist was added.

## Verification

SecurityIntegrationTests uses real MVC routing, bearer validation, method-security
interception and JPA persistence; services and permissions are not mocked. The
test database is isolated. The same suite can target disposable PostgreSQL through
TEST_DB_* overrides. Tests must never target an existing application database:
the test profile uses create-drop.

Coverage includes malformed/expired/forged tokens, role self-assignment, 15 protected
read surfaces, project/workspace scope, alternate task mutation paths, subtask
assignment, status transitions, membership and role revocation, password invalidation,
stable identity after email change, template isolation, reorder rollback, command
undo after access removal, deletion restoration and direct Spring service calls.
Angular tests cover login/registration flows, request token boundaries, 401/403 state,
session expiration and Kanban permission behavior. PDF exports are parsed in tests.

See README for commands and final verification results in the delivery report.

### Executed verification — 2026-10-30

| Check | Actual result |
| --- | --- |
| `mvn clean verify` with isolated H2 | 53 tests, zero failures/errors/skips; executable JAR built |
| `mvn verify` with TEST_DB_* targeting disposable PostgreSQL 17 | Same 53 tests, zero failures/errors/skips |
| `npm test -- --watch=false` | 65 tests across 15 files |
| `npm run build` | Production build succeeds; initial bundle and two component-style size warnings |
| Packaged application on port 18080 with separate PostgreSQL smoke database | 27 live HTTP checks pass: authentication, ownership, collaboration, denial, revocation, PDF and undo |

Local Java verification used JDK 21 targeting Java 17. CI additionally configures
JDK 17 and Node 22. Docker was unavailable, so local PostgreSQL verification used
an independently initialized PostgreSQL 17 cluster listening only on 127.0.0.1.
No existing database was used. A resource-limited rerun initially exhausted native
Java memory; repeating with a 256 MB Maven heap and 512 MB test heap succeeded.
Vitest worker count is bounded for repeatable local memory use. The existing
Kanban alert error-path tests emit JSDOM's alert-not-implemented notices; assertions
pass. A browser end-to-end runner and the remote CI run were not part of local
execution. CI is configured in .github/workflows/verify.yml.
