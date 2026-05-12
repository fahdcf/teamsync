# TeamSync Frontend — Missing Pages Task List

## Context
Sidebar nav items and their routes. All must work — no 404s.
Design system: dark theme (#0C0C0E base), amber/gold accent (#D4A853), surfaces #141416/#1C1C1F.
Every page must match the Dashboard's style and color palette.

---

## Tasks

### ✅ Task 1 — Projects List Page (`/projects`)
- Created `src/app/features/project/project-list/project-list.component.ts`
- Card grid with status filter, progress bars, deadline, workspace name, manager avatar
- Route registered in `app.routes.ts`

### ✅ Task 2 — Tasks List Page (`/tasks`)
- Created `src/app/features/task/task-list/task-list.component.ts`
- Table view with status + priority filter pills, assignee avatar, due date
- Route registered in `app.routes.ts`

### ✅ Task 3 — Calendar Page (`/calendar`)
- Created `src/app/features/calendar/calendar.component.ts`
- Monthly grid with task chips colored by priority, prev/next navigation, today highlight
- Route registered in `app.routes.ts`

### ✅ Task 4 — Messages Page (`/messages`)
- Created `src/app/features/messages/messages.component.ts`
- Two-panel layout: contact list + chat thread, functional send, unread badges
- Route registered in `app.routes.ts`

### ✅ Task 5 — Files Page (`/files`)
- Created `src/app/features/files/files.component.ts`
- Card grid with emoji file icons, search, type filter, upload button
- Route registered in `app.routes.ts`

### ✅ Task 6 — Settings Page (`/settings`)
- Created `src/app/features/settings/settings.component.ts`
- Tabs: Profile (from auth store) / Notifications (toggles) / Appearance / Security
- Route registered in `app.routes.ts`
