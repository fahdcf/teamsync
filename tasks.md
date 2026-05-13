# TeamSync Frontend Functionality Backlog

Audit scope: all active frontend pages and shared layout UI under `frontend/teamsync-frontend/src/app`.

Excluded by request:
- AI assistant, AI insight, AI recommendation, and AI-generated suggestion UI may stay static for now.
- Messages page and messaging-related UI may stay static for now.

## Global Layout

- [x] Task UI-AUDIT-001: Wire the top navbar global search to real data.
  Frontend: make the `Search projects, tasks, people...` field query projects, tasks, and users, show grouped results, and navigate to the selected result.
  Backend: add a global search endpoint such as `GET /search?keyword=` returning typed results for projects, tasks, workspaces, and users visible to the authenticated user.

- [x] Task UI-AUDIT-002: Replace hardcoded navbar breadcrumbs with current workspace/project context.
  Frontend: derive breadcrumb labels from the active route and loaded entity instead of always showing `Product Design Workspace` and `Design:System 2.0`.
  Backend: ensure project/task detail responses include enough workspace/project identifiers and names to build breadcrumbs without extra placeholder text.

- [x] Task UI-AUDIT-003: Make the navbar `+ New` button functional.
  Frontend: open a create menu for workspace, project, and task actions, route each choice to the right modal/page, and refresh the current page after creation.
  Backend: reuse existing create endpoints where possible; add any missing quick-create DTO support if the menu needs workspace/project/task creation from any page.

- [x] Task UI-AUDIT-004: Make the navbar workspace selector real.
  Frontend: replace the static `Product Design` selector with the authenticated user's workspaces, allow switching active workspace, and update page queries/breadcrumbs.
  Backend: `GET /workspaces` already exists; add/persist a current/default workspace preference if the selected workspace should survive refresh/login.

- [x] Task UI-AUDIT-005: Replace hardcoded navbar and sidebar team/user preview data.
  Frontend: use the authenticated user for the sidebar bottom profile, use real current-workspace members for the navbar avatar stack, and remove static `Alex Johnson`/sample teammates.
  Backend: workspace responses already include members; add avatar/profile image fields to `UserResponseDTO` if real images are required.

- [x] Task UI-AUDIT-006: Make sidebar account/profile button open a real account menu.
  Frontend: clicking the sidebar user card should open account actions such as Settings and Logout instead of doing nothing.
  Backend: no backend required unless adding profile image upload or account preference persistence.

## Dashboard Page

- [x] Task UI-AUDIT-010: Replace static dashboard recent activity with persisted activity logs.
  Frontend: load recent activity from a service instead of the hardcoded `recentActivity` array, show real actor/action/time, and link each activity to its entity.
  Backend: `GET /users/me/activity` exists; verify it returns authenticated-user-scoped activity, entity type/id, actor, and timestamps for dashboard rendering.

- [x] Task UI-AUDIT-011: Make dashboard time range controls work.
  Frontend: wire the `This week` analytics selector to a real selected date range and refresh stats/charts when changed.
  Backend: extend dashboard/analytics endpoints with `from` and `to` query parameters so trends and cards are calculated for the chosen range.

- [x] Task UI-AUDIT-012: Replace dashboard static chart shapes with real chart series.
  Frontend: drive Progress Overview, Time Tracked, Team Workload mini bars, and day labels from API data instead of fixed SVG paths and fixed bar arrays.
  Backend: add dashboard chart-series endpoints or extend `GET /dashboard/stats` with daily completion, time tracking, and workload series.

- [x] Task UI-AUDIT-013: Make dashboard time tracking real or remove it.
  Frontend: stop calculating `timeTracked` as `Math.max(24, tasks.length * 4)` and show real tracked time only when available.
  Backend: add a time tracking model/endpoints or add aggregated tracked-hours fields to dashboard analytics.

- [x] Task UI-AUDIT-014: Make dashboard team member work summaries real.
  Frontend: replace `Working on {{ firstTaskTitle }}` repeated for every member with each member's current active task or workload summary.
  Backend: add a per-member current work endpoint or extend dashboard/team workload data with each member's current task titles/counts.

- [x] Task UI-AUDIT-015: Make dashboard links navigate.
  Frontend: wire `View all activity`, `View calendar`, and `View all projects` to real routes instead of `href="#"`.
  Backend: no backend required unless adding a dedicated full activity page endpoint beyond `GET /users/me/activity`.

- [x] Task UI-AUDIT-016: Make dashboard calendar show all relevant tasks.
  Frontend: load task events across all visible projects/workspaces instead of only the first loaded project, and make calendar event chips open the task detail.
  Backend: add an efficient endpoint such as `GET /calendar/events?from=&to=&workspaceId=` returning all visible task deadlines and project deadlines.

## Workspaces Page

- [x] Task UI-AUDIT-020: Replace workspace overview placeholders with real counts.
  Frontend: replace `Projects -`, `Active Tasks 0`, and progress `0%` placeholders with API values.
  Backend: add a workspace summary endpoint such as `GET /workspaces/{id}/summary` returning project count, active task count, completed task count, overdue count, and average progress.

- [x] Task UI-AUDIT-021: Replace synthetic workspace list activity rows.
  Frontend: remove generated rows like `owner joined this workspace` when they are not from the database and render actual activity data.
  Backend: ensure `GET /workspaces/{id}/activity` logs workspace creation, member add/remove, project creation/update, and task activity with actor and timestamp.

- [x] Task UI-AUDIT-022: Make workspace health/progress panels real.
  Frontend: drive `Workspace Progress`, `On Track`, `At Risk`, `Overdue`, `Activity`, `Engagement`, and `Progress` from data rather than fixed `0`/`Low`/`No data` values.
  Backend: add workspace health calculations for project health buckets, activity level, engagement level, and progress status.

- [x] Task UI-AUDIT-023: Make workspace options menu functional.
  Frontend: implement the `...` workspace menu with edit workspace, invite member, archive/delete if supported, and refresh after actions.
  Backend: add workspace update/archive/delete endpoints if those actions should exist; currently only create, get, add member, and remove member are exposed.

- [x] Task UI-AUDIT-024: Show more than one workspace or provide a real list switcher.
  Frontend: the page currently focuses only on `primaryWorkspace`; add a real workspace list/grid for all returned workspaces or a carousel/switcher.
  Backend: `GET /workspaces` already returns multiple workspaces; no backend change unless pagination/filtering is needed.

## Workspace Detail Page

- [x] Task UI-AUDIT-030: Make workspace settings button functional.
  Frontend: open an edit workspace settings modal/page from `Workspace settings`.
  Backend: add `PUT /workspaces/{id}` for name/description updates and optional workspace preference fields.

- [x] Task UI-AUDIT-031: Make workspace project toolbar controls work.
  Frontend: wire `Filter`, `All projects`, and `Sort: Recent` to actual filtering/sorting of workspace projects.
  Backend: extend `GET /workspaces/{workspaceId}/projects` with status, health, manager/team, due-date, keyword, and sort query parameters.

- [x] Task UI-AUDIT-032: Make project favorite buttons persist.
  Frontend: clicking the star/favorite controls on workspace project cards should toggle a saved favorite state and update the UI.
  Backend: add a project favorite/watch model or endpoint such as `PUT /projects/{id}/favorite` scoped to the authenticated user.

- [x] Task UI-AUDIT-033: Make project options menu functional on workspace detail.
  Frontend: implement the project `...` menu with edit, archive, open board/settings, and delete/archive options based on permissions.
  Backend: existing project update/archive endpoints can be reused; add delete endpoint only if permanent deletion is desired.

- [x] Task UI-AUDIT-034: Replace fake active member count with real presence/activity.
  Frontend: stop using `Math.min(5, memberCount)` as active members and show real online/recently-active counts or rename the label.
  Backend: add user presence/lastActiveAt fields or a workspace active-members endpoint.

- [x] Task UI-AUDIT-035: Make `View all activity` navigate and show full activity.
  Frontend: route `View all activity` to a full activity page/panel for the workspace instead of `href="#"`.
  Backend: `GET /workspaces/{id}/activity` exists; verify pagination and filtering support for a full activity feed.

## Projects Page

- [x] Task UI-AUDIT-040: Make `New Project` on the projects page work.
  Frontend: open a project creation modal, select a workspace/manager, call `ProjectService.create`, and refresh the list.
  Backend: `POST /workspaces/{workspaceId}/projects` exists; verify it supports all fields shown in the UI and returns workspace/manager data.

- [x] Task UI-AUDIT-041: Make projects page view toggle real.
  Frontend: implement both grid and list/table views, persist the user's selected view, and keep filters working in both modes.
  Backend: no backend required unless saving preferences server-side.

- [x] Task UI-AUDIT-042: Make projects page Team, Due date, and Sort filters real.
  Frontend: wire the controls to filter by manager/team member, due-date range, and sort order instead of rendering static buttons.
  Backend: extend `GET /projects` with `workspaceId`, `teamMemberId`, `dueFrom`, `dueTo`, `keyword`, and `sort` query params; current backend only supports status and managerId.

- [x] Task UI-AUDIT-043: Replace hardcoded project task counts.
  Frontend: remove the hardcoded `0 Tasks` value and show each project's actual task count.
  Backend: include `taskCount` in `ProjectResponseDTO` or add a lightweight project summary endpoint.

- [x] Task UI-AUDIT-044: Replace hardcoded project activity timestamps.
  Frontend: remove `Just now` from every project row and render the last activity timestamp/action.
  Backend: include last activity metadata in project list responses or add `GET /projects/{id}/activity` usage for project rows.

- [x] Task UI-AUDIT-045: Make project row options menu functional.
  Frontend: implement the `...` menu with open, edit, archive, duplicate/template, and permission-aware actions.
  Backend: reuse project update/archive endpoints; add duplicate/clone endpoint only if duplicate is part of the menu.

## Project Detail Page

- [x] Task UI-AUDIT-050: Remove or implement inactive project tabs.
  Frontend: tabs for `Timeline`, `Overview`, and `Files` are listed but do not render real content; implement them or hide them until supported.
  Backend: add project timeline/activity and project file attachment endpoints if keeping those tabs.

- [x] Task UI-AUDIT-051: Make project board toolbar actions work.
  Frontend: wire `Filter`, `Sort`, `Group`, and `...` actions above the board to the task board filters/layout instead of static buttons.
  Backend: existing `GET /projects/{projectId}/tasks` supports status, priority, assigneeId, keyword, and overdue; add sort/group parameters if backend-side ordering is required.

- [x] Task UI-AUDIT-052: Make project favorite/star persist from project detail.
  Frontend: clicking the star beside the project title should toggle saved favorite state.
  Backend: same project favorite endpoint as UI-AUDIT-032.

- [x] Task UI-AUDIT-053: Make project breadcrumb fully dynamic.
  Frontend: remove hardcoded `Acme Inc.` and use real workspace/project names with working navigation links.
  Backend: project detail responses already include workspace data; verify DTO includes workspace id/name consistently.

## Task Board Page

- [x] Task UI-AUDIT-060: Preserve task status when creating from a board column.
  Frontend: creating a task from `In Progress`, `Review`, or `Done` should place it in that selected column, not default to TODO.
  Backend: either allow initial `status` in `TaskRequestDTO` with state-machine validation or have the frontend create then call the status transition endpoint when valid.

- [x] Task UI-AUDIT-061: Fix task assignment API contract.
  Frontend: `TaskService.assign` sends `{ userId }` in the body, but backend expects `@RequestParam UUID userId`; align the service call or backend signature.
  Backend: choose one contract and document it; recommended endpoint shape is `PUT /tasks/{id}/assign` with JSON body for consistency.

- [x] Task UI-AUDIT-062: Replace task card comment count with real comment count.
  Frontend: stop using dependency count as `commentCountFor(task)` and show actual comment counts.
  Backend: include `commentCount` in `TaskResponseDTO` or add a batch counts endpoint for task cards.

- [x] Task UI-AUDIT-063: Persist task order inside each board column.
  Frontend: same-column drag/drop currently only reorders locally; persist the order and reload it consistently.
  Backend: add a `position` field on tasks and an endpoint such as `PUT /projects/{projectId}/tasks/reorder`.

- [x] Task UI-AUDIT-064: Add blocked tasks visibility to the board.
  Frontend: either add a `Blocked` column or a visible blocked filter using the existing blocked status/dependency state.
  Backend: `GET /projects/{id}/tasks/blocked` exists; ensure it is wired into the board if using dependency-blocked tasks.

## Task List Page

- [x] Task UI-AUDIT-070: Add efficient all-tasks querying for the task list.
  Frontend: the page currently loads every workspace, then every project, then every project task; replace this with one paginated task list call.
  Backend: add `GET /tasks` for the authenticated user with filters for status, priority, projectId, workspaceId, assigneeId, keyword, overdue, due date, sort, and pagination.

- [x] Task UI-AUDIT-071: Add search/sort/date filters to match task-list usage.
  Frontend: add visible search, due-date, assignee, project, and sort controls for the task list.
  Backend: supported by the new `GET /tasks` endpoint from UI-AUDIT-070.

## Task Detail Page

- [x] Task UI-AUDIT-080: Make task detail expand button functional.
  Frontend: the expand icon should switch between modal/drawer and full-page task detail, or be removed.
  Backend: no backend required.

- [x] Task UI-AUDIT-081: Make task options menu functional.
  Frontend: implement the `...` task options menu with delete, duplicate/from-template, add dependency, save as template, and undo where permissions allow.
  Backend: existing delete, dependency, undo, template, and create-from-template endpoints exist; add duplicate endpoint only if needed.

- [x] Task UI-AUDIT-082: Make task detail `Create` button functional or remove it.
  Frontend: define whether `Create` creates a subtask, related task, or template, then wire it to the correct modal/action.
  Backend: reuse subtask/task/template endpoints depending on the chosen behavior.

- [x] Task UI-AUDIT-083: Implement assignee picker in task detail.
  Frontend: make the assignee field editable, list project/workspace members, and call the assignment service.
  Backend: fix/confirm `PUT /tasks/{id}/assign` contract from UI-AUDIT-061 and ensure only project members can be assigned.

- [x] Task UI-AUDIT-084: Implement comment reply UI.
  Frontend: the `Reply` button sets `replyingToId`, but no reply input is rendered; add reply editor, submit/cancel, and nested reply display.
  Backend: `POST /comments/{id}/replies` exists; verify response includes the new reply and nested replies are returned by `GET /tasks/{id}/comments`.

- [x] Task UI-AUDIT-085: Replace static task Files tab with real attachments or hide it.
  Frontend: the Files tab lists fake files; either remove the tab or implement upload/list/delete/download attachments.
  Backend: add attachment entity and endpoints such as `GET/POST/DELETE /tasks/{id}/attachments` with file storage.

- [x] Task UI-AUDIT-086: Allow subtask assignee and due date editing.
  Frontend: subtask rows display assignee/date but creation only accepts title; add fields and edit controls.
  Backend: `SubtaskRequestDTO` appears to support assigneeId/dueDate from the frontend model; verify backend accepts and returns those fields, and add subtask update endpoint if editing after creation is needed.

## Calendar Page

- [x] Task UI-AUDIT-090: Add task navigation from calendar events.
  Frontend: clicking a task chip should open the task detail route/modal.
  Backend: no backend required if calendar events include task id; otherwise add id to calendar event response.

- [x] Task UI-AUDIT-091: Replace calendar's multi-request loading with a dedicated events endpoint.
  Frontend: stop loading all workspaces/projects/tasks just to render the calendar; query events for the visible month.
  Backend: add `GET /calendar/events?from=&to=&workspaceId=` returning task deadlines and project deadlines visible to the authenticated user.

- [x] Task UI-AUDIT-092: Add calendar filters.
  Frontend: add workspace/project/member/priority filters for calendar events.
  Backend: support matching query params on the calendar events endpoint.

## Analytics Page

- [x] Task UI-AUDIT-100: Make analytics date range, share, and filter buttons real.
  Frontend: wire header date range, Share, and Filter controls to actual UI/actions.
  Backend: analytics endpoints should accept date range and filter query parameters; share may require a report/share-link endpoint if links are persisted.

- [x] Task UI-AUDIT-101: Make analytics section tabs show full real content.
  Frontend: `Team Performance`, `Sprint Analytics`, `Workload`, `Flow Metrics`, and `Reports` currently show short text summaries; build full panels using real data.
  Backend: extend analytics/report endpoints with sprint series, flow/cycle-time details, workload breakdowns, and report payloads as needed.

- [x] Task UI-AUDIT-102: Remove analytics fallback datasets once backend data exists.
  Frontend: stop using static fallback sprint history and workload distribution when API data is missing; show empty/error states instead.
  Backend: ensure `GET /analytics/projects/{id}/stats` returns `sprintVelocityHistory` and `workloadDistribution` consistently.

- [x] Task UI-AUDIT-103: Implement analytics report export.
  Frontend: reports text says JSON/CSV/PDF export is ready, but no export action exists; add export buttons and download handling.
  Backend: `GET /reports/projects/{id}` exists; add CSV/PDF formats or query parameters such as `?format=json|csv|pdf`.

## Settings Page

- [x] Task UI-AUDIT-110: Make profile fields editable.
  Frontend: edit buttons for username, email, role, and avatar are currently visual; implement editable states and save/cancel behavior.
  Backend: `PUT /users/me` currently updates username only; add email update, avatar upload/profile image, and role-change rules if role editing is allowed.

- [ ] Task UI-AUDIT-111: Replace static profile completion/security values.
  Frontend: compute or fetch profile completion and security status instead of always showing `70%` and `Secure`.
  Backend: add account overview fields to `GET /users/me` or add `GET /users/me/account-overview` with profile completion and security status.

- [ ] Task UI-AUDIT-112: Make settings Notifications, Appearance, and Security tabs real.
  Frontend: replace placeholder panels with notification preferences, theme/display preferences, and password/security forms.
  Backend: add user preference endpoints, password change endpoint, and security/session metadata endpoints.

- [ ] Task UI-AUDIT-113: Replace static settings recent activity.
  Frontend: replace hardcoded `Profile updated`, `Logged in from Chrome on macOS`, and `Password changed` rows with real account activity.
  Backend: use `GET /users/me/activity` for product activity and add account/security audit logs if login/password events should be shown.

- [ ] Task UI-AUDIT-114: Make workspace membership ownership labels accurate.
  Frontend: show `Owner` only for workspaces the current user owns, otherwise show member role/status.
  Backend: include current user's membership role/ownership in `WorkspaceResponseDTO` or derive it reliably from owner id.

## Landing / Public Pages

- [ ] Task UI-AUDIT-120: Decide which marketing CTAs are real.
  Frontend: `Book a demo`, `Explore all features`, `View all reports`, `Learn more`, and `View full board` currently use `href="#"`; route them to real pages/sections or remove them.
  Backend: no backend required unless demo requests or contact forms are added.

- [ ] Task UI-AUDIT-121: Replace or label static landing preview stats.
  Frontend: mockup stats, kanban cards, testimonials, logos, and feature preview data are static marketing content; either keep them explicitly as marketing examples or connect them to public stats/content.
  Backend: add public content/config endpoints only if marketing content should be managed dynamically.

## Patterns Page

- [ ] Task UI-AUDIT-130: Remove hardcoded Swagger URL.
  Frontend: replace `http://localhost:8080/swagger-ui.html` with an environment-based API docs URL.
  Backend: no backend change required; ensure Swagger remains exposed in configured environments.
