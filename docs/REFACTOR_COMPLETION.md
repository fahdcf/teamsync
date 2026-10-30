# Refactoring completion and integration review

Review date: 2026-10-30.

## What the previous review was seeing

Remote `main` was still at `ad3e261`. The local `main` checkout was at `85c4c99`
with three uncommitted analytics files. The complete refactoring was already
committed and pushed as `b261214` on `codex/layered-security-refactor`.

The missing delivery step was default-branch integration. Reimplementing those
changes would duplicate completed work. This completion preserves `b261214`,
revalidates it, adds the confirmed credential-rotation evidence, and integrates
the verified history into `main` through a normal fast-forward. The local analytics
edits do not overlap incoming changes; they are backed up and checked by SHA-256
before and after the local fast-forward. They are not staged or committed.

## Requirement review

| Requirement | Verified implementation |
| --- | --- |
| Layered monolith | controller/, service/, repository/, entity/, dto/, security/, config/, exception/, enums/; one Spring Boot application |
| Standard JWT authentication | AuthenticationManager and BCrypt login; Spring bearer filter and Nimbus decoder |
| Method authorization | @EnableMethodSecurity and service @PreAuthorize annotations, with ResourceAuthorization |
| Remove custom authorization proxy | TaskServiceProxy, proxy interface and @Primary delegate selection absent |
| Resource-aware project/task writes | Workspace owner/admin or assigned participating project manager, according to operation |
| Assignment and deletion | Caller authorization and target eligibility; a global manager role gives no unrelated-project privilege |
| Role management | Registration creates TEAM_MEMBER; profile cannot change role; explicit administrator role endpoint |
| GET/list protection | Direct resource permission checks and membership-aware project/task specifications |
| Revocation | Database roles/membership checked on new requests; password-version claim invalidates older JWTs |
| Preserve workflows | Existing API routes retained; templates, dependencies, comments, notifications, activity, analytics, reports and undo remain |
| Simplification | Redundant facade, validation chain, report builder and custom event publisher removed; useful state/strategy/undo/formatting behavior retained |
| Angular compatibility | API-scoped headers, session tokens, permission flags and 401/403 handling; no UI redesign |
| Schema compatibility | Existing table/column names, relationships and stored role values preserved |
| Secret hygiene | Current application secrets externalized; two historical exposures confirmed and rotation runbook expanded |

The previous backend was already partially layered rather than a full hexagonal
implementation. The refactoring removes its real sources of indirection instead
of inventing a ports/adapters migration. No empty mapper/validation/util packages
or new single-implementation service interfaces are introduced merely to fill a
prescribed package tree.

See [the full permission matrix and original audit](SECURITY_AUDIT.md) for every
HTTP route group and policy rationale. Workspace ownership remains distinct from
global role. All workspace participants can read workspace projects; only the
documented managers/owners/admins can manage them. Personal notifications and
preferences remain personal even for administrators.

## Verification repeated for completion

| Check | Result |
| --- | --- |
| `mvn clean verify` (isolated H2, bounded Java memory) | 53 tests, zero failures, errors or skips; executable JAR produced |
| `npm test -- --watch=false` | 65 tests in 15 files pass |
| `npm run build` | Production build succeeds |
| Packaged backend against separate PostgreSQL 17 smoke database | 27 live HTTP checks pass |
| GitHub verification for b261214 | backend (h2), backend (postgres) and frontend all succeeded |

The existing GitHub verification is recorded in
[run 41102301187](https://github.com/fahdcf/teamsync/actions/runs/41102301187).
The completion documentation does not change the tested application code.
New push events run the same verification workflow.

The build still reports the initial-bundle and two component-style size warnings.
The two existing invalid-drag tests emit JSDOM's alert-not-implemented notices;
their assertions pass. A browser end-to-end test runner is not configured.
No production database or existing user data is used for test execution.

## Interview explanation

“TeamSync is one layered Spring Boot application. A controller validates a DTO and
calls a transactional service, which applies business rules and uses Spring Data
JPA repositories to persist data in PostgreSQL.

“Login goes through `AuthService.login`, Spring's `AuthenticationManager`,
`UserDetailsServiceImpl` and BCrypt. `JwtService.generateToken` issues a signed
JWT with the user's stable UUID, issuer, expiration and password version.
`SecurityConfig.filterChain` installs Spring Security's bearer authentication;
`jwtDecoder` verifies HS256 signatures and claims.
`DatabaseJwtAuthenticationConverter.convert` then loads the current database role
and account identity into the SecurityContext.

“Authentication establishes who the caller is. Service `@PreAuthorize` annotations
decide what the caller may do. For example, `TaskService.create` calls the policy
`ResourceAuthorization.manageProject`: the user must be the workspace owner, an
administrator, or the assigned PROJECT_MANAGER who still belongs to that workspace.
A global manager role alone is insufficient. Read queries are scoped to membership.
The backend enforces this even when someone bypasses Angular. There is no custom
TaskServiceProxy.”

Relevant source entry points:

- [Login](../src/main/java/com/teamsync/service/AuthService.java)
- [JWT issuance](../src/main/java/com/teamsync/security/JwtService.java)
- [Security configuration](../src/main/java/com/teamsync/security/SecurityConfig.java)
- [Database-backed authentication](../src/main/java/com/teamsync/security/DatabaseJwtAuthenticationConverter.java)
- [Resource permissions](../src/main/java/com/teamsync/security/ResourceAuthorization.java)
- [Task workflows](../src/main/java/com/teamsync/service/TaskService.java)
- [Real HTTP security regression tests](../src/test/java/com/teamsync/SecurityIntegrationTests.java)

## Remaining operational responsibilities

Operators must rotate any historical credential still in use and review existing
privileged accounts. The review cannot claim production rotation without access to
the relevant environment. Existing email-subject tokens require a fresh login.
Undo remains a bounded in-memory history; email delivery and the messages screen
retain their documented demo limitations. No activation/deletion or separate
project-membership features are claimed where none existed.
