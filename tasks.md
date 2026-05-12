# TeamSync — Redesign Task List

> These tasks replace the previous frontend phases entirely.
> Agent rule: find first ☐, implement pixel-perfectly matching the reference screenshots, verify, mark ✅, commit, push, repeat.
> Every task must match the reference design exactly before moving on.
> If backend endpoints are missing, implement them first before the Angular task.

---

## Design System Reference (read this before every task)

### Color Palette (extracted from screenshots)
```scss
// Backgrounds — near-black with warm undertones
$bg-base:       #0C0C0E;   // deepest background
$bg-surface:    #141416;   // cards, sidebar
$bg-elevated:   #1C1C1F;   // hover states, inputs
$bg-overlay:    #242428;   // modals, dropdowns

// Borders
$border-subtle: rgba(255,255,255,0.06);
$border-default: rgba(255,255,255,0.10);
$border-strong: rgba(255,255,255,0.18);

// Accent — warm amber/gold (from screenshots, NOT cold indigo)
$accent:        #D4A853;   // primary gold/amber
$accent-hover:  #E8BC6B;
$accent-dim:    rgba(212,168,83,0.15);

// Status colors (subtle, muted — not neon)
$success:       #4ADE80;   // green — DONE tasks
$warning:       #F59E0B;   // amber — IN_REVIEW, AT_RISK
$danger:        #EF4444;   // red — BLOCKED, OVERDUE
$info:          #60A5FA;   // blue — IN_PROGRESS
$muted-text:    #6B6B7A;   // secondary text

// Text
$text-primary:  #F2F2F5;
$text-secondary: #9999A8;
$text-tertiary: #5A5A6A;

// Special — warm glow effect behind hero sections (seen in workspace/analytics headers)
$warm-glow: radial-gradient(ellipse 60% 40% at 70% 20%, rgba(180,130,60,0.18) 0%, transparent 70%);
```

### Typography
```scss
// Font: Geist Sans (primary), Geist Mono (code/ids)
// Import in index.html: https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap
// Use Inter as fallback if Geist unavailable

$font-xs:   11px;  // metadata, chips
$font-sm:   12px;  // secondary labels
$font-base: 13px;  // body text (smaller than typical — this app is dense)
$font-md:   14px;  // default UI text
$font-lg:   16px;  // section headings
$font-xl:   20px;  // page titles
$font-2xl:  24px;  // dashboard greeting sub
$font-3xl:  32px;  // hero numbers
$font-hero: 56px;  // landing page headline
```

### Spacing & Layout
```
Sidebar width: 200px (NOT 240px — tighter, more content space)
Navbar height: 52px
Content padding: 32px
Card padding: 20px
Gap between cards: 12px
Border radius: 8px (cards), 6px (inputs/buttons), 12px (modals)
```

### Component Patterns (from screenshots)
```
Stat cards: bg-surface, border border-subtle, rounded-lg, p-5
  → Large number (font-3xl, font-bold), label (font-sm, text-secondary)
  → Small sparkline chart bottom (Canvas, 60px tall, no axes, no gridlines)
  → Trend indicator: ↑12% from last week (green if positive, red if negative)

Task cards (Kanban): bg-elevated, rounded-md, p-4, no heavy border
  → Title (font-md, font-medium), priority dot, date, avatars, comment count
  → Selected card: slightly brighter background + subtle left accent border

Project rows (Workspace): full-width list item with thumbnail image (left), data columns (right)
  → NOT a card grid — it's a table-like list with image previews

Navbar: bg-base, border-b border-subtle, flex row
  → Left: search bar (rounded-full, bg-elevated, 400px wide)
  → Center: breadcrumb (Workspace → Project)
  → Right: + New button, notification bell with count, workspace selector, avatar stack

Sidebar: bg-surface, border-r border-subtle, no heavy styling
  → Nav items: icon (18px) + label, active = bg-elevated + text-primary, inactive = text-tertiary
  → Bottom: user avatar + name + role, AI Assistant badge
```

---

## PHASE R1 — Design System Overhaul (Foundation)

### Task R1.1 — Replace Design System Tokens ✅
```
This is the most critical task. Everything visual depends on these tokens being correct.
Wrong tokens = every page looks wrong. Get this exactly right.

BACKEND: No changes needed.

FRONTEND: Complete rewrite of src/styles.scss and all token files.

Step 1 — Update src/styles.scss completely:

:root {
  /* Backgrounds */
  --bg-base:      #0C0C0E;
  --bg-surface:   #141416;
  --bg-elevated:  #1C1C1F;
  --bg-overlay:   #242428;

  /* Borders */
  --border-subtle:  rgba(255,255,255,0.06);
  --border-default: rgba(255,255,255,0.10);
  --border-strong:  rgba(255,255,255,0.18);

  /* Accent — warm amber/gold */
  --accent:       #D4A853;
  --accent-hover: #E8BC6B;
  --accent-dim:   rgba(212,168,83,0.15);
  --accent-glow:  rgba(212,168,83,0.08);

  /* Status */
  --success:      #4ADE80;
  --success-dim:  rgba(74,222,128,0.12);
  --warning:      #F59E0B;
  --warning-dim:  rgba(245,158,11,0.12);
  --danger:       #EF4444;
  --danger-dim:   rgba(239,68,68,0.12);
  --info:         #60A5FA;
  --info-dim:     rgba(96,165,250,0.12);

  /* Text */
  --text-primary:   #F2F2F5;
  --text-secondary: #9999A8;
  --text-tertiary:  #5A5A6A;
  --text-accent:    #D4A853;

  /* Spacing */
  --sidebar-width:   200px;
  --navbar-height:   52px;
  --content-padding: 32px;

  /* Radius */
  --radius-sm:  4px;
  --radius-md:  6px;
  --radius-lg:  8px;
  --radius-xl:  12px;
  --radius-2xl: 16px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm:  0 1px 2px rgba(0,0,0,0.4);
  --shadow-md:  0 4px 12px rgba(0,0,0,0.5);
  --shadow-lg:  0 8px 24px rgba(0,0,0,0.6);
  --shadow-glow: 0 0 20px rgba(212,168,83,0.15);
}

* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; }
body {
  background: var(--bg-base);
  color: var(--text-primary);
  font-family: 'Inter', -apple-system, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

/* Scrollbar styling */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--border-strong); }

/* Selection */
::selection { background: var(--accent-dim); color: var(--text-primary); }

Step 2 — Update src/app/shared/components/ — rewrite ALL shared components with new tokens:

button.component.scss:
  primary: bg accent, text black (#0C0C0E), font-weight 500, border-radius radius-md
    hover: bg accent-hover, shadow-glow
  secondary: bg transparent, border border-default, text text-primary
    hover: bg bg-elevated, border border-strong
  danger: bg transparent, border danger, text danger
    hover: bg danger-dim
  ghost: bg transparent, text text-secondary
    hover: bg bg-elevated, text text-primary
  All buttons: font-size 13px, height 32px (sm), 36px (md), 40px (lg), padding 0 14px

input.component.scss:
  bg: bg-elevated
  border: 1px solid border-subtle
  border-radius: radius-md
  color: text-primary
  font-size: 13px
  height: 36px
  placeholder: text-tertiary
  focus: border-color border-default, outline: none
  error: border-color danger
  Label: font-size 12px, color text-secondary, margin-bottom 6px

badge.component.scss — new variant map:
  success: bg success-dim, color success, font-size 11px, padding 2px 8px, radius full
  warning: bg warning-dim, color warning
  danger:  bg danger-dim, color danger
  info:    bg info-dim, color info
  muted:   bg bg-elevated, color text-secondary
  accent:  bg accent-dim, color accent

Step 3 — Add Inter font to src/index.html:
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">

Step 4 — Create src/app/shared/styles/_mixins.scss:
  @mixin card {
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-lg);
  }
  @mixin card-elevated {
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-lg);
  }
  @mixin warm-glow-bg {
    position: relative;
    overflow: hidden;
    &::before {
      content: '';
      position: absolute;
      top: 0; right: 0;
      width: 60%; height: 100%;
      background: radial-gradient(ellipse 80% 60% at 80% 30%, rgba(180,130,60,0.18) 0%, transparent 70%);
      pointer-events: none;
    }
  }
  @mixin truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  @mixin flex-center { display: flex; align-items: center; justify-content: center; }
  @mixin flex-between { display: flex; align-items: center; justify-content: space-between; }

Verify: ng build --configuration=production has zero errors.
Verify: Visual check — background is deep near-black, not the old #0F1117.
Verify: Accent color is warm amber #D4A853, not the old indigo #6366F1.
```

### Task R1.2 — Redesign Layout Shell (Sidebar + Navbar) ✅
```
Reference: screenshot 2:  c:\Users\pp\Downloads\ChatGPT Image 12 mai 2026, 17_04_31.png — study the sidebar and navbar carefully.

BACKEND: No changes needed.

FRONTEND: Complete rewrite of layout/ components.

--- SIDEBAR (src/app/layout/sidebar/sidebar.component) ---

Exact measurements from screenshots:
  Width: 200px
  Background: var(--bg-surface)
  Border-right: 1px solid var(--border-subtle)
  Padding-top: 20px

Logo area (top):
  Height: 52px (matches navbar)
  Display: flex, align-items: center, padding: 0 16px
  Logo: white diamond/crystal icon (use ◈ unicode or SVG) + "TeamSync" text
  Font: 15px, font-weight 600, color text-primary
  NO horizontal rule below logo — clean transition to nav items

Nav items:
  Each item: display flex, align-items center, gap 10px
  Padding: 8px 12px, margin: 2px 8px
  Border-radius: var(--radius-md)
  Font-size: 13px, font-weight 400
  Icon: 16px, color text-tertiary (inactive), text-primary (active)
  Text: color text-tertiary (inactive), text-primary (active)
  Active: background var(--bg-elevated), color text-primary, icon text-primary
  Hover: background var(--bg-elevated)/60, color text-secondary
  NO bold on active — just brightness change

Nav items list (match screenshot 2 exactly):
  - Dashboard (grid-2x2 icon)
  - Workspaces (building icon)
  - Projects (folder icon)
  - Tasks (checkbox icon)
  - Analytics (chart-bar icon)
  - Notifications (bell icon) — shows count badge
  - Settings (gear icon)
  [separator line — thin, border-subtle]
  
Bottom section (pinned to bottom):
  AI Assistant item:
    Avatar circle (gradient purple-to-blue, 28px)
    "AI Assistant" label + green online dot
    "+" button on right
  Trial usage bar:
    "Trial usage" label, "78%" right, progress bar (accent color, 4px tall)
    "Upgrade plan →" small link
  User section:
    Avatar (32px circle, real initials), username, role text
    Down chevron for dropdown

Sidebar collapse: clicking the top-right collapse button (<<) reduces to 52px wide, icons only.
At 52px: hide all text, center icons, tooltip on hover showing label.

--- NAVBAR (src/app/layout/navbar/navbar.component) ---

Exact structure from screenshot 4:
  Height: 52px
  Background: var(--bg-base)
  Border-bottom: 1px solid var(--border-subtle)
  Padding: 0 20px
  Display: flex, align-items: center, gap: 12px

Left side (breadcrumb, screenshot 4 style):
  [workspace icon] "Product Design Workspace" → "Design:System 2.0"
  Each segment: text-secondary, font-size 13px
  Arrow separator: › in text-tertiary
  Last segment: text-primary
  Clickable — navigate to workspace/project respectively

Center (search bar, screenshots 2 and 4):
  Width: 320px, flex: 0 0 320px
  Background: var(--bg-elevated)
  Border: 1px solid var(--border-subtle)
  Border-radius: var(--radius-full)
  Height: 32px
  Padding: 0 12px
  Font-size: 13px, color text-secondary
  Left icon: search (14px, text-tertiary)
  Right: "/" shortcut key pill (6px 8px, bg bg-overlay, border border-subtle, font-size 11px)
  Placeholder: "Search projects, tasks, people..."
  On focus: border-color border-default

Right side (from left to right):
  "+ New" button:
    Height 32px, padding 0 14px
    Border: 1px solid var(--border-default)
    Border-radius: var(--radius-md)
    Background: var(--bg-elevated)
    Font-size: 13px, color text-primary
    "▾" dropdown indicator on right
  
  Notification bell:
    Icon button, 32x32
    Bell icon (16px, text-secondary)
    Count badge: 8px diameter circle, bg danger, font-size 10px, positioned top-right of icon
    Hover: bg bg-elevated, icon text-primary
  
  Workspace selector (screenshot 3):
    Shows current workspace icon + name
    Background bg-elevated, border border-subtle, border-radius radius-md
    Height 32px, padding 0 10px
    Down chevron
  
  Avatar stack (right-most):
    3 overlapping avatar circles (28px each), overlapping by -8px
    "+2" text badge for overflow
    Hover: slight spread animation

Verify: navbar looks like screenshot 2/3/4 exactly. Search bar centered. Breadcrumb on left.
Verify: sidebar active item highlighted, all icons render, bottom section shows correctly.
```

---

## PHASE R2 — Landing / Home Page

### Task R2.1 — Backend: Add Public Stats Endpoint ✅
```
The landing page needs real-sounding (but public) stats.
Add to backend:

NEW endpoint: GET /public/stats
  Returns: { activeTeams: 25000, uptime: 99.9, userRating: 4.9 }
  This is a hardcoded response — no DB query needed.
  No auth required. Add to SecurityConfig permit list.

NEW endpoint: GET /public/health  
  Returns: { status: "healthy", version: "1.0.0" }
  Already standard Spring Boot practice.

Controller: PublicController.java in presentation/controller/
No service needed — return static data directly.

Verify: curl http://localhost:8080/public/stats returns JSON without token.
```

### Task R2.2 — Landing Page (Public Homepage) ✅
```
Reference: c:\Users\pp\Downloads\ChatGPT Image 12 mai 2026, 17_04_11.png — the full marketing landing page.

This is a STANDALONE route at / (before login).
Route: /home or / → redirects to /dashboard if authenticated, else shows landing.
No sidebar. No app navbar. Has its own marketing nav.

FRONTEND: Create src/app/features/landing/landing.component.ts

This page has 8 sections. Build them all in one task. Use pure Angular + SCSS, no libraries.

--- SECTION 1: MARKETING NAV ---
Position: fixed top, full width
Background: rgba(12,12,14,0.8) + backdrop-filter: blur(20px)
Border-bottom: 1px solid var(--border-subtle)
Height: 56px, padding: 0 80px
Layout: flex, space-between

Left: TeamSync logo (◈ icon + "TeamSync" text, 15px 600)
Center: nav links — Product, Features, Solutions, Resources, Pricing
  Font-size: 13px, color text-secondary
  Hover: color text-primary
  Gap: 32px between links
Right:
  "Log in" — ghost button, 13px, text-secondary → text-primary on hover
  "Start free trial →" — primary button, bg accent, color #0C0C0E, border-radius radius-md, font-weight 500

--- SECTION 2: HERO ---
Min-height: 100vh
Background: var(--bg-base)
Padding: 120px 80px 80px
Two columns (50/50 split):

LEFT COLUMN:
  Label: "✦ AI-POWERED PROJECT MANAGEMENT" — font-size 11px, letter-spacing 0.1em, color text-secondary, uppercase
  Headline (3 lines, large):
    "Collaborate." — font-size 64px, font-weight 700, color text-primary
    "Track."       — same
    "Deliver."     — same
  Each word on its own line. Bold and impactful.
  Body text: "TeamSync brings your teams, tasks, and tools together in one intelligent workspace—so you can ship exceptional work, every time."
    Font-size: 15px, color text-secondary, max-width: 400px, line-height: 1.6, margin-top: 24px
  CTA row (margin-top: 36px):
    "Start free trial →" — primary button (accent bg, black text), height 44px, padding 0 24px
    "Book a demo" — secondary button, height 44px, padding 0 24px, border border-default
    Gap: 12px between buttons
  Social proof (margin-top: 32px):
    5 overlapping avatar circles (32px, colored with initials) + "Trusted by 25,000+ teams worldwide"
    Font-size: 13px, color text-secondary

RIGHT COLUMN:
  App screenshot mockup — a realistic-looking browser/app window mockup
  Use a div styled as an app window:
    Background: var(--bg-surface)
    Border: 1px solid var(--border-default)
    Border-radius: 12px
    Box-shadow: 0 32px 64px rgba(0,0,0,0.6)
    Padding: 0
    Overflow: hidden
  Inside, render a simplified version of the dashboard:
    Top bar: dark bar with 3 dots (red/yellow/green circles) on left
    Content: simplified kanban with colored columns
    Must look like a real app, not a placeholder
  Subtle warm glow behind: radial-gradient amber at top-right

--- SECTION 3: TRUSTED BY ---
Background: var(--bg-base)
Padding: 48px 80px
Label: "TRUSTED BY INNOVATIVE TEAMS" — 11px, text-tertiary, letter-spacing 0.1em, uppercase, text-center
Company logos row (centered, space-evenly):
  Linear, Vercel, Framer, Raycast, Notion, GitHub
  Each: icon/logo mark + name, font-size 14px, color text-tertiary
  Filter: grayscale(1) opacity(0.5), hover: grayscale(0) opacity(1), transition 0.2s

--- SECTION 4: FEATURES GRID ---
Padding: 80px
Left column (30%): "FEATURES" label + "Everything your team needs to move faster" (h2, 32px, 700) + body text + "Explore all features →" link
Right column (70%): 2x3 grid of feature cards (or 3+3):
  Feature cards: bg var(--bg-surface), border var(--border-subtle), rounded-lg, p-5
  Each: icon (20px, accent colored) + title (14px, 600) + description (13px, text-secondary)
  Features to show (match backend capabilities):
    - Task Management (checkbox icon)
    - Workspace Collaboration (users icon)
    - AI Workflow Automation (sparkles icon — placeholder, no AI backend needed)
    - Analytics & Reports (chart icon)
    - Smart Notifications (bell icon)
    - Smart Scheduling (calendar icon)
  Hover: border-color var(--border-default), transform: translateY(-2px), transition 0.2s

--- SECTION 5: ANALYTICS SHOWCASE ---
Padding: 80px
Two columns:
LEFT: "ANALYTICS" label + "Data that drives better decisions" (h2) + body + "View all reports →" link
RIGHT: Analytics mockup card (bg var(--bg-surface), border, rounded-xl, p-5):
  4 mini stat cards in a row: Project health 92%, Completion rate 68%, Team workload "Balanced", Velocity 24.5
  Each: small label + big number + tiny sparkline (use SVG paths — simple wave shapes)
  These are STATIC — no API call for this section

--- SECTION 6: COLLABORATION SHOWCASE ---
Reverse two-column layout:
LEFT: Chat/collaboration mockup (conversation threads, file sharing, team activity)
  Build as a styled div with hardcoded content — just visual
RIGHT: "COLLABORATION" label + "Work together, anywhere" (h2) + body + "Learn more →"

--- SECTION 7: KANBAN SHOWCASE ---
Two columns:
LEFT: "KANBAN BOARD" label + "Visualize work. Deliver results." (h2) + body + "View full board →"
RIGHT: Mini Kanban board mockup — 4 columns (To Do, In Progress, Review, Done) with card items
  Styled divs, NO real data, pure visual representation

--- SECTION 8: TESTIMONIALS ---
Padding: 80px
Heading: "Loved by teams building the future" (h2, left-aligned)
3 testimonial cards side-by-side:
  bg var(--bg-surface), border var(--border-subtle), rounded-xl, p-6
  Quote text (14px, text-secondary, line-height 1.7)
  Author: avatar circle + name (font-medium) + title (text-tertiary, 12px)

Stats bar below testimonials:
  bg var(--bg-elevated), border, rounded-xl, p-6
  "25K+ Active teams" | "99.9% Uptime" | "4.9/5 User rating" — separated by vertical dividers
  Then company logos row (same as section 3)

--- SECTION 9: CTA FOOTER ---
Padding: 80px
Left: "READY TO GET STARTED?" label + "Bring your team together. Ship exceptional work." (h2, large)
Right: Email input + "Start free trial →" button (full width of right column)
  Input: height 48px, placeholder "Enter your work email", bg bg-elevated, border, rounded-md
  Button: height 48px, bg accent, color black, font-weight 600
  Below: "No credit card required • Free forever plan available"

--- SECTION 10: FOOTER ---
Background: var(--bg-surface), border-top border-subtle
Padding: 48px 80px 32px
5 columns:
  TeamSync (logo + description + social icons)
  Product (Features, Pricing, Enterprise, Security)
  Resources (Documentation, Guides, Templates, API)
  Company (About, Blog, Careers, Contact)
  Legal (Privacy, Terms, Cookies)
  "Stay in the loop" (email newsletter subscribe)
Bottom bar: "© 2024 TeamSync. All rights reserved." + "Made with ♥ by TeamSync"

Routing:
  Update AppRoutes: "/" → redirect to "/home" if not authenticated, else "/dashboard"
  Add "/home" route → LandingComponent (no auth guard)

Verify: landing page renders fully at /home. All 10 sections present.
Verify: nav "Log in" navigates to /login. "Start free trial" navigates to /register.
Verify: page is responsive — mobile nav collapses to hamburger.
Verify: ng build --configuration=production has zero warnings.
```

---

## PHASE R3 — Dashboard Redesign

### Task R3.1 — Backend: Dashboard Stats Endpoint ✅
```
The dashboard needs pre-aggregated stats the current backend doesn't provide.
Add these endpoints to backend:

NEW: GET /dashboard/stats
  Response: {
    activeTasks: number,         // tasks assigned to me with status IN_PROGRESS
    completionRate: number,      // % of my tasks that are DONE
    teamVelocity: number,        // total tasks completed this week across all my projects
    overdueItems: number,        // tasks past dueDate and not DONE
    trendActiveTasks: number,    // % change vs last week (mock: return random -20 to +20)
    trendCompletion: number,
    trendVelocity: number,
    trendOverdue: number
  }
  Auth: required. Computed for current authenticated user.

NEW: GET /dashboard/upcoming-deadlines
  Response: List of tasks due in next 7 days, assigned to current user, not DONE
  Ordered by dueDate ASC. Limit 5.
  Each task includes: id, title, dueDate, priority, project.title

NEW: GET /dashboard/projects-overview
  Response: List of projects (current user is member of), each with:
  { id, title, progress, status, taskCount }
  Limit 5, ordered by updatedAt DESC

Create DashboardController.java and DashboardService.java.
Add to SecurityConfig: require auth for /dashboard/**.

Verify: all 3 endpoints return correct data with a valid JWT token.
```

### Task R3.2 — Dashboard Page Redesign ✅
```
Reference: Screenshot 2 : c:\Users\pp\Downloads\ChatGPT Image 12 mai 2026, 17_04_48.png— study every pixel of this dashboard.

FRONTEND: Complete rewrite of src/app/features/dashboard/

--- EXACT LAYOUT FROM SCREENSHOT 2 ---

The dashboard has NO page title header — it starts immediately with the greeting.

TOP GREETING AREA (full width, padding 32px 32px 0):
  Left side (flex: 1):
    Icon: ☀ (sun emoji or SVG, 28px, warm yellow)
    "Good morning, {username}." — font-size 28px, font-weight 600, color text-primary
    Subtext: "You have {activeProjects} active projects and {activeTasks} tasks in progress."
    Subtext: "Let's make today productive."
    Font-size: 14px, color text-secondary, margin-top: 4px
  
  Right side: "AI Insight" card
    Background: var(--bg-surface), border: 1px solid var(--border-subtle), border-radius: var(--radius-lg)
    Padding: 16px 20px, max-width: 280px
    Top: "⚡ AI Insight" — 12px, font-weight 500, color accent
    Body: "You're on track to complete 91% of your tasks this week."
    Font-size: 13px, color text-secondary, line-height: 1.5
    Link: "View details →" — 12px, color accent
  
  Data for greeting: call GET /dashboard/stats on init.

STAT CARDS ROW (4 cards, equal width, gap 12px, padding 24px 32px):
  Each card: @mixin card, padding: 20px, min-height: 120px

  Card 1 — Active Tasks:
    Label: "Active Tasks" — font-size 12px, color text-secondary, font-weight 400
    Number: activeTasks — font-size 36px, font-weight 700, color text-primary
    Trend: "↑ {trendActiveTasks}% from last week" — font-size 12px, color success (if positive)
    Sparkline: canvas/SVG wave line, 100% width, 48px tall, color success, no axes

  Card 2 — Completion Rate:
    Number: "{completionRate}%"
    Trend: "↑ {trend}% from last week"
    Visual: circular progress ring (SVG, 64x64, stroke-width 6, accent color, centered)
    NOT a sparkline — a donut ring showing the percentage

  Card 3 — Team Velocity:
    Number: "{teamVelocity}" (tasks per week)
    Trend: "↑ {trend}% from last week"
    Sparkline: bar chart style (8 bars, alternating heights), color accent

  Card 4 — Overdue Items:
    Number: "{overdueItems}" — color danger if > 0, else text-primary
    Trend: "↓ {trend} from last week" — color success if improving
    Sparkline: jagged wave, color danger

  Sparklines: use SVG paths. Generate random-but-plausible data for the visual.
  Width: 100%, height: 48px, no axes, no labels, smooth curved paths.

PROJECT BOARD SECTION (padding 0 32px):
  Header row:
    "Project Board" — font-size 16px, font-weight 600
    Dropdown: "Website Redesign ▾" — shows current project selector
      Clicking opens a list of user's projects to switch the kanban view
    Right: "Filter" button + "Customize" button + "..." more button
    All right buttons: ghost style, 12-13px, icons + text
  
  KANBAN (embedded directly in dashboard — NOT a separate page):
    4 visible columns: To Do, In Progress, Review, Done
    Each column header: status name + count badge + "+" add task button
    Column: bg transparent, no border, width ~220px each
    Task cards (see Task R3.3 for detailed card design)
    Max height 400px per column, overflow-y: auto (scrollable column)
    NO drag-drop on dashboard kanban — click to open task detail only
    
    Data: call GET /projects/{selectedProjectId}/tasks
    When user changes project dropdown → reload tasks

ANALYTICS OVERVIEW SECTION (padding 0 32px 24px):
  Header: "Analytics Overview" + period dropdown "This week ▾"
  4 analytics cards in a row:
    Card 1 — Progress Overview:
      Label, "68%" large number, trend
      Line chart SVG (same width as card, 80px tall, green line, subtle grid)
      X-axis labels: M T W T F S S
    Card 2 — Tasks by Priority:
      Donut chart (SVG, 100px, multicolor segments: High=orange, Medium=blue, Low=green)
      Legend: High 8 / Medium 12 / Low 8
      Center: "28 Total"
    Card 3 — Team Workload:
      "Balanced" or "Overloaded" in large text
      Team member avatars (4, overlapping)
      "No issues detected" in text-secondary
    Card 4 — Time Tracked (display from activityLog count):
      Big number "128h" (computed from activity logs — count * estimated hours, or just total tasks * 1h)
      Trend sparkline

BOTTOM TWO-COLUMN SECTION (gap 12px, padding 0 32px 32px):
  LEFT COLUMN (flex: 1):
    Recent Activity:
      Header "Recent Activity" + "View all activity →" link (accent color)
      List of 5 activity entries from GET /projects/{id}/activity or /users/me/activity:
        Each: avatar circle (28px) + "[Username] {action}" + relative time on right
        Username: font-weight 500, rest: font-weight 400, color text-secondary
        Hover: bg bg-elevated, rounded-md
      "View all activity →" link at bottom

    Upcoming Deadlines:
      Header "Upcoming Deadlines" + "View calendar →" link
      List from GET /dashboard/upcoming-deadlines:
        Each: calendar icon + task title (flex 1) + due date + priority dot
        Overdue: title in danger color

  RIGHT COLUMN (flex: 0 0 380px):
    AI Assistant card:
      Header: "⚡ AI Assistant" (accent color)
      Subtext: "Here are some suggestions to boost your productivity"
      3 insight rows (hardcoded, styled):
        Red dot + "2 tasks are at risk of being overdue" + "Review now →" link
        Yellow dot + "You can complete 5 more tasks this week" + "View tasks →"
        Green dot + "Team workload is perfectly balanced" + "Great job! →"
      Each row: icon circle (28px) + text (flex 1) + link

    Team Members card:
      Header: "Team Members" + "View all →" link
      List of 4 members from workspace.members (first 4):
        Avatar + username + role + "● Working on {task title}" (green dot)
        Task title from their current IN_PROGRESS task

    Projects Overview card:
      Header: "Projects Overview" + "View all projects →"
      List from GET /dashboard/projects-overview:
        Each: project icon + project title + progress bar (right-aligned %)
        Progress bar: 8px tall, colored by health (green/yellow/red)

Verify: all sections render with real data from the new backend endpoints.
Verify: project board dropdown switches the kanban view.
Verify: sparklines render (even if just styled SVG placeholders with smooth curves).
Verify: screenshot 2 match — layout, typography, spacing all correct.
```

### Task R3.3 — Task Card Redesign ✅
```
Reference: Screenshot 2 (kanban section) and screenshot 4 (board behind the drawer).

The task card is used in kanban columns everywhere. Redesign it completely.

BACKEND: No changes needed.

FRONTEND: Rewrite src/app/features/task/task-card/task-card.component

Exact card design from screenshot 2:
  Background: var(--bg-elevated)
  Border: 1px solid var(--border-subtle)
  Border-radius: var(--radius-lg)
  Padding: 14px 16px
  Margin-bottom: 8px
  Cursor: pointer
  Transition: background 0.15s, border-color 0.15s

  Hover state:
    Background: #222228 (slightly lighter than bg-elevated)
    Border-color: var(--border-default)

  Selected state (when open in drawer):
    Border-left: 3px solid var(--accent)
    Background: rgba(212,168,83,0.05)

  CARD INTERNAL LAYOUT:

  Row 1 (space-between):
    Left: Task title
      Font-size: 13px, font-weight: 500, color: text-primary
      Max 2 lines, then ellipsis
    Right: (empty on most cards, priority dot on some)

  Row 2 (priority indicator):
    Small colored dot (6px circle) + priority text
    LOW:      var(--text-tertiary) dot + text
    MEDIUM:   #60A5FA (blue) dot + text
    HIGH:     var(--warning) dot + text
    CRITICAL: var(--danger) dot + text
    Font-size: 12px, color text-secondary

  Row 3 (bottom row, space-between):
    Left: overlapping avatar stack (24px circles, -6px overlap)
      Shows assignee avatar. If unassigned: dashed circle with "+" sign
    Center: date — "May 24" format, font-size 11px, color text-tertiary
      If overdue: color danger
    Right: comment icon + count — "💬 2", font-size 11px, color text-tertiary

  DONE column tasks (from screenshot 2):
    Show a green checkmark circle before the title
    Title has text-decoration: line-through, color text-tertiary
    Overall card: slightly dimmed (opacity 0.7)

  Priority dot colors:
    Low:      rgba(255,255,255,0.2)
    Medium:   #60A5FA
    High:     #F59E0B
    Critical: #EF4444

  "Add task" button at bottom of each column:
    Full width, dashed border, bg transparent
    "＋ Add task" text, color text-tertiary, font-size 13px
    Hover: bg bg-elevated, color text-secondary
    Border: 1px dashed var(--border-default)
    Border-radius: var(--radius-md)
    Height: 36px

Column header redesign:
  Status name: font-size 13px, font-weight 500, color text-secondary
  Count badge: bg bg-elevated, border border-subtle, font-size 11px, padding 2px 8px, border-radius radius-full
  "+" button: 24px circle, bg bg-elevated, hover bg bg-overlay, icon text-secondary

Column container:
  Width: ~220px, flex: 0 0 220px
  Background: transparent (NO column background — cards float on the main bg)
  Padding: 0

Verify: cards look exactly like screenshot 2 kanban section.
Verify: DONE tasks have strikethrough and checkmark.
Verify: priority dots have correct colors.
```

---

## PHASE R4 — Workspace Detail Redesign

### Task R4.1 — Backend: Project Health + Workspace Activity ✅
```
The workspace detail page needs endpoints the current backend partially has but needs to enhance.

ENHANCE: GET /workspaces/{id}/projects — add health field to each project in response
  Current response only has: id, title, status, deadline, progress, manager
  Add to ProjectResponseDTO: health (String: "ON_TRACK" | "AT_RISK" | "DELAYED")
  Compute: ON_TRACK if progress >= 70% and no overdue tasks
            AT_RISK if progress >= 40% or has 1-2 overdue tasks
            DELAYED if progress < 40% or has 3+ overdue tasks

ADD "insight" field to project response:
  insight: String — hardcoded strings based on health:
    ON_TRACK: "Components are ahead of schedule. Consider starting documentation early."
    AT_RISK:  "User testing results suggest reviewing the onboarding flow."
    DELAYED:  "Significant delays detected. Schedule a team sync immediately."
  (This mimics the "AI Insight" shown in screenshot 3 — can be rule-based)

ENHANCE: GET /workspaces/{id}/activity — already exists, ensure it returns:
  user object (not just userId), action string, entityType, entityId, createdAt
  Grouped by date (TODAY / YESTERDAY / earlier) in response or sort by createdAt DESC

Verify: GET /workspaces/{id}/projects returns health and insight fields.
```

### Task R4.2 — Workspace Detail Page Redesign ✅
```
Reference: Screenshot 3 : c:\Users\pp\Downloads\ChatGPT Image 12 mai 2026, 17_04_31.png— the "Product Design Workspace" page.

FRONTEND: Complete rewrite of src/app/features/workspace/workspace-detail/

--- EXACT LAYOUT FROM SCREENSHOT 3 ---

The workspace detail page has a TWO-PANEL layout:
  Left panel: flex: 1 (main content)
  Right panel: flex: 0 0 340px, border-left: 1px solid var(--border-subtle) (activity feed)

This is DIFFERENT from the previous design — the activity feed is always visible on the right.

LEFT PANEL:

Hero section (padding 32px 32px 0):
  Apply @mixin warm-glow-bg to this section.
  Breadcrumb: "✦ WORKSPACE" — 11px, text-tertiary, letter-spacing 0.08em, uppercase
  
  Title: workspace.name — font-size 40px, font-weight 700, color text-primary, margin-top 12px
  Description: workspace.description — font-size 15px, color text-secondary, max-width 600px, line-height 1.6

  Members + actions row (margin-top 24px):
    Left: overlapping avatar circles (36px, -10px overlap) for members
      After avatars: "+" circle button (bg bg-elevated, border dashed border-default)
      Count text: "12 members" (font-size 13px, color text-secondary)
      Green dot + "5 active" (color success, font-size 13px)
    Right: two buttons:
      "👤 Invite members" — secondary button, height 36px
      "⚙ Workspace settings" — secondary button, height 36px
      Gap: 8px

Projects section (padding 32px):
  Header row:
    "Projects" — font-size 16px, font-weight 600
    View toggle: grid icon (active) / list icon — 28px buttons, bg bg-elevated on active
    "Filter" button (ghost, icon + text)
    "All projects ▾" dropdown
    "Sort: Recent ▾" dropdown
  
  Project list (NOT a card grid — it's a list of wide rows like screenshot 3):
    Each project row: min-height 120px, bg var(--bg-surface), border var(--border-subtle), rounded-xl, margin-bottom 12px
    Layout: image thumbnail (120x120, rounded-lg, left) + content area (flex: 1)

    Image thumbnail: 
      bg var(--bg-elevated), border-radius var(--radius-lg)
      Show a gradient placeholder with abstract shapes (use CSS gradients — different per project)
      First project: radial-gradient(circle at 70% 30%, #3D2B0A, #1A1200) — warm dark amber
      Second: radial-gradient(circle at 30% 70%, #0A1A2B, #000D1A) — cool dark blue
      Third: radial-gradient(circle at 50% 50%, #1A0A2B, #0D0014) — purple dark

    Content area (padding 20px):
      Top row:
        Project title — font-size 17px, font-weight 600, color text-primary
        Star/bookmark icon — text-tertiary, hover text-accent
        "..." more menu — text-tertiary
      Description — font-size 13px, color text-secondary, max 2 lines, margin-top 4px
      Member avatars (24px, overlapping) — margin-top 12px
      
      Stats row (margin-top 12px, display: grid, 3 columns):
        Column 1: "Progress" label (11px, text-tertiary) + "{progress}%" (14px, font-weight 600)
                  Progress bar: 4px tall, width 120px, color based on health
        Column 2: "Due date" label + "May 24, 2024" (14px, font-weight 600)
        Column 3: "Health" label + colored dot + status text ("On track" / "At risk" / "Delayed")
                  ON_TRACK: success color, AT_RISK: warning, DELAYED: danger
      
      AI Insight row (margin-top 12px):
        "⚡ AI Insight" pill (font-size 11px, color accent, bg accent-dim, padding 2px 8px, rounded-full)
        Insight text — font-size 12px, color text-secondary (from insight field in API response)
        "→" arrow link on right

RIGHT PANEL — Recent Activity:
  Width: 340px
  Padding: 32px 24px
  Header: "Recent activity" — font-size 14px, font-weight 600 (left) + "All activity ▾" dropdown (right)
  
  Timeline grouped by date:
    Date label: "Today" — font-size 11px, text-tertiary, font-weight 600, uppercase, letter-spacing 0.06em
    Activity items (from GET /workspaces/{id}/activity):
      Layout: time (left, 11px, text-tertiary, min-width 52px) + avatar (28px) + content (flex 1)
      Time: "10:24 AM"
      Content: "{username} {action}" — username is font-weight 500, rest is font-weight 400, 13px
      If action contains a link target (entityType=TASK): project name shown in accent color with link
      Quoted comment text (if action=COMMENT_ADDED): shown in blockquote style, border-left 2px accent-dim, padding-left 8px, text-secondary 12px
      Message icon button on right (text-tertiary, 14px)
    Gap between items: 20px
    "Yesterday" date label, same pattern
    "View all activity →" link at bottom (accent color)

Verify: layout matches screenshot 3 exactly — two-panel, hero with warm glow, project list rows with thumbnails.
Verify: "AI Insight" pill shows per project. Health badge shows correct color.
Verify: activity feed on right shows real data grouped by date.
```

---

## PHASE R5 — Task Board + Task Detail Drawer Redesign

### Task R5.1 — Backend: Task Identifier + Subtasks ✅
```
The task detail drawer (screenshot 4) shows:
  - Task identifier: "DES-120" (short ID format)
  - Subtasks list with completion tracking
  - Activity tab inside the drawer

Add to backend:

1. Task identifier field:
   Add taskIdentifier (String) to Task entity.
   Format: first 3 letters of project title (uppercase) + "-" + sequential number per project.
   Generate on task creation in TaskService.createTask().
   Example: project "Design System 2.0" → tasks get "DES-1", "DES-2", etc.
   Add taskIdentifier to TaskResponseDTO.

2. Subtasks:
   Add subtasks support to Task entity:
   - Add Subtask entity: { id UUID, title String, completed boolean, task ManyToOne Task, assignee ManyToOne User nullable, dueDate LocalDate nullable, createdAt }
   - SubtaskRepository
   - SubtaskService: createSubtask(taskId, title), toggleSubtask(subtaskId), deleteSubtask(subtaskId)
   - Add subtasks: List<SubtaskResponseDTO> to TaskResponseDTO
   - SubtaskResponseDTO: { id, title, completed, assignee, dueDate }

3. New endpoints:
   POST   /tasks/{id}/subtasks          body: { title: string, assigneeId?, dueDate? }
   PUT    /tasks/{id}/subtasks/{sid}/toggle    → toggles completed boolean
   DELETE /tasks/{id}/subtasks/{sid}

Verify: GET /tasks/{id} now returns taskIdentifier and subtasks array.
Verify: POST /tasks/{id}/subtasks creates a subtask. Toggle works.
```

### Task R5.2 — Task Board Page Redesign ✅
```
Reference: Screenshot 4 : c:\Users\pp\Downloads\ChatGPT Image 12 mai 2026, 17_04_44.png — the board BEHIND the open drawer.

FRONTEND: Redesign src/app/features/task/task-board/task-board.component

--- EXACT LAYOUT FROM SCREENSHOT 4 ---

The board when inside a project context:
  Navbar (top): app navbar with breadcrumb showing "Product Design Workspace → Design:System 2.0 ▾"
  Board area (below navbar): full width, full height, no sidebar (or sidebar visible on left)

Board header (NOT shown in dashboard version):
  NOT needed here — the project-detail component wraps this with tabs.
  The board is the "Board" tab content.

Column design (from screenshot 4):
  "To do  12" — name + count (text-tertiary, font-size 13px)
  "+" add task button (text-tertiary, 20px, absolute right of header)
  Columns: horizontal flex, overflow-x: auto, padding: 16px 0, gap: 12px
  Each column: width: 240px, flex: 0 0 240px
  Column header: padding 0 0 12px, border-bottom: 1px solid var(--border-subtle)

Task cards (detailed in R3.3 — ensure those changes are applied here too).

Board scroll behavior:
  The board scrolls horizontally if more columns than screen width.
  Custom scrollbar at bottom.

Drag and drop:
  Keep the existing CDK drag-drop logic.
  Visual: dragging card shows shadow-lg + slight rotation (transform: rotate(2deg)).
  Drop zone: column shows dashed border when dragging over.

Filter bar above board:
  Position: above the board, inside the project-detail "board tab" area.
  Search input: magnifier icon + "Search tasks..." — matches navbar search style
  Priority pills: "All" | "High" | "Medium" | "Low" — pill buttons, accent-colored when active
  Assignee filter: avatar dropdown

Verify: board looks like the background of screenshot 4.
Verify: drag and drop still works (test by dragging a card between columns).
```

### Task R5.3 — Task Detail Drawer Redesign ✅
```
Reference: Screenshot 4: c:\Users\pp\Downloads\ChatGPT Image 12 mai 2026, 17_04_44.png — the right-side drawer overlay.

FRONTEND: Complete rewrite of src/app/features/task/task-detail/task-detail.component

--- EXACT DRAWER DESIGN FROM SCREENSHOT 4 ---

The drawer is a right-side panel that slides over the board.
Board BEHIND is still visible (dimmed) — not a modal overlay.

Drawer dimensions:
  Width: 680px (wider than before — screenshot shows ~55% of the screen)
  Height: 100vh
  Position: fixed, right: 0, top: 0
  Background: var(--bg-surface)
  Border-left: 1px solid var(--border-default)
  Box-shadow: -8px 0 32px rgba(0,0,0,0.5)
  Z-index: 100
  Animation: slide in from right (translateX(100%) → translateX(0)), 200ms ease-out

Backdrop (left of drawer):
  Position: fixed, left: 0, top: 0, right: 680px, bottom: 0
  Background: rgba(0,0,0,0.4)
  Click closes drawer

DRAWER HEADER (height 52px, padding 0 20px, border-bottom border-subtle):
  Left: 3 icon buttons (screenshot 4 style):
    [↗] expand to full page — ghost icon button, 32x32
    [🔗] copy link — ghost icon button
    [···] more options — ghost icon button
  Right:
    "⚡ Create" — small button, accent color text, icon
    [✕] close button — ghost icon button

DRAWER BODY (overflow-y: auto, padding 24px 28px):

  BREADCRUMB (top of body):
    "{taskIdentifier}" pill + "📄" icon + "• {projectName}"
    taskIdentifier: font-family: 'Courier New', monospace, font-size 12px, color text-tertiary, bg bg-elevated, padding 2px 8px, rounded
    projectName: font-size 13px, color text-secondary

  TITLE (margin-top 16px):
    Large h1, font-size 28px, font-weight 600, color text-primary
    Editable: click shows cursor, blur saves. No input border visible until focused.
    Pencil icon on hover (text-tertiary, 14px, appears inline after title)
    Example: "Design system foundations"

  DESCRIPTION (margin-top 8px):
    Font-size 14px, color text-secondary, line-height 1.6
    Editable textarea: click to edit, same style as title.

  METADATA ROW (margin-top 24px, display: grid, 4 columns, border-top border-subtle, padding-top 20px):
    From screenshot 4 exactly:
    Column 1 — Priority:
      Label: "Priority" (11px, text-tertiary, uppercase)
      Value: colored dot + priority text in a pill selector
      Clickable dropdown: LOW / MEDIUM / HIGH / CRITICAL
    Column 2 — Status:
      Label: "Status"
      Value: colored dot + status text in a pill selector  
      Clickable dropdown: all 5 statuses
    Column 3 — Assignees:
      Label: "Assignees"
      Value: overlapping avatar circles (28px) + "+{n}" overflow
      Click: opens member picker popup
    Column 4 — Due date:
      Label: "Due date"
      Value: 📅 icon + "May 26, 2024" text
      Click: date picker popup
    Far right: refresh/sync icon button

  SUBTASKS SECTION (margin-top 28px):
    Header: "Subtasks" (font-size 14px, font-weight 500) + "{completed}/{total}" count + progress bar (right-aligned)
    Progress bar: 120px wide, 4px tall, success color fill
    Subtask list (from task.subtasks):
      Each subtask row:
        Checkbox (custom styled — green checkmark when done, circle outline when pending)
        Title (font-size 13px, text-primary uncompleted, line-through text-tertiary completed)
        Assignee avatar on right (24px)
        Due date on far right (11px, text-tertiary)
        Completed subtasks: strikethrough title styling
      Hover: show delete button (×) on right
    
    "Add subtask" input at bottom (click to expand):
      Shows: + icon + "Add a subtask..." placeholder text
      Click: transforms into real input, press Enter to save, Escape to cancel

  TABS (margin-top 28px):
    Tab buttons: "Comments {count}" | "Activity" | "Files {count}" | "AI Assistant"
    Active tab: text-primary, border-bottom 2px accent
    Inactive: text-secondary, no border
    Font-size: 13px
    
    Comments tab content:
      Comment input (top — NOT bottom like before):
        Avatar (28px, current user) + "Add a comment..." placeholder
        Click: expands to textarea
        Emoji and gif buttons inside input area
      
      Comments list below:
        Each comment:
          Avatar (32px) + username (font-weight 500, 13px) + "2 hours ago" (text-tertiary, 12px) + content (13px, text-secondary, line-height 1.6)
          "Reply" button (text-tertiary, 12px) + emoji reaction buttons (😊 👍 small buttons)
          Replies nested below with 32px left indent
    
    Activity tab content:
      Timeline of all actions on this task from GET /projects/{id}/activity filtered by entityId
    
    Files tab: placeholder "No files attached" + "Upload file" button
    
    AI Assistant tab:
      Title: "Design system recommendations" (14px, font-weight 500)
      Subtext: "Based on similar projects and best practices in design systems."
      List of 2-3 AI suggestions (hardcoded):
        Green circuit icon + "Consider adding semantic color tokens for states (success, warning, error)."
        Blue accessibility icon + "Add focus states for accessibility compliance."
      "View full recommendations →" link (accent)

RIGHT SIDEBAR OF DRAWER (shown in screenshot 4 — the AI Assistant panel on the right):
  Wait — screenshot 4 shows the drawer is divided:
  Left 2/3: main content (title, description, metadata, subtasks, tabs)
  Right 1/3 (about 220px): AI Assistant panel
  Border-left: 1px solid var(--border-subtle)
  Padding: 20px
  
  AI Assistant panel:
    Header: "⚡ AI Assistant" (accent color) + "BETA" badge (bg bg-elevated, font-size 10px, border border-subtle)
    Title: "Design system recommendations"
    Description: 13px, text-secondary
    Suggestion items: icon circle (28px) + suggestion text (13px, text-secondary)
    "View full recommendations →" link

Verify: drawer matches screenshot 4 exactly.
Verify: taskIdentifier shows correctly (e.g., "DES-120").
Verify: subtasks list renders with checkboxes, completion state shown correctly.
Verify: all 4 tabs switch content without reloading the drawer.
Verify: adding a subtask works (calls POST /tasks/{id}/subtasks).
Verify: toggling a subtask updates the progress bar.
```

---

## PHASE R6 — Analytics Page Redesign

### Task R6.1 — Backend: Enhanced Analytics Endpoints ✅
```
The analytics page (screenshot 5) needs more data than the current backend provides.

ENHANCE: GET /analytics/projects/{id}/stats — add:
  completionRate: number (percent)
  teamVelocity: number (tasks completed per sprint/week)
  workloadBalance: string ("Balanced" | "Overloaded" | "Underutilized")
  projectsHealth: number (percent of projects ON_TRACK)
  sprintVelocityHistory: List<{sprint: string, value: number}> — last 5 sprints mock data
  workloadDistribution: List<{category: string, count: number, percent: number}>
    (group tasks by project and compute percentages)

NEW: GET /analytics/team/performance
  Auth required. Returns workspace-level analytics for current user's workspaces.
  Response: {
    completionRate: number,
    trendCompletion: number,
    teamVelocity: number,
    trendVelocity: number,
    workloadBalance: string,
    projectsHealth: number,
    trendHealth: number,
    teamProductivity: { tasksCompleted: number, trend: number },
    focusTime: { hours: number, trend: number },
    cycleTime: { days: number, trend: number },
    onTimeDelivery: { percent: number, trend: number }
  }

NEW: GET /analytics/insights
  Returns list of AI insight cards (hardcoded rule-based):
  [
    { type: "warning", title: "Burnout Risk Detected", description: "3 team members show signs of burnout risk...", action: "View affected members", actionUrl: "/workspaces/{id}/members" },
    { type: "success", title: "Sprint Recommendation", description: "Based on your velocity trend...", action: "Adjust sprint scope" },
    { type: "info", title: "Team Performance", description: "Your team's productivity is peaking on Tuesdays...", action: "View detailed analysis" }
  ]
  Compute "burnout risk" as: members with > 5 BLOCKED or overdue tasks.

Create AnalyticsController additions. Update existing AnalyticsService.

Verify: GET /analytics/team/performance returns all fields.
Verify: GET /analytics/insights returns at least 1 insight based on real task data.
```

### Task R6.2 — Analytics Page Redesign ✅
```
Reference: Screenshot 5: c:\Users\pp\Downloads\ChatGPT Image 12 mai 2026, 17_04_48.png — "Team Performance Insights" page.

FRONTEND: Complete rewrite of src/app/features/analytics/

This page uses a LEFT SIDEBAR (analytics sub-nav) + MAIN CONTENT + RIGHT PANEL layout.
Different from other pages — it has its own sub-navigation.

--- LAYOUT ---
Left sub-sidebar (180px):
  Title: "Analytics" + "Beta" badge (bg accent-dim, color accent, font-size 10px)
  Nav items:
    Overview (active state — bg bg-elevated)
    Team Performance
    Projects
    Sprint Analytics
    Workload
    Flow Metrics
    Reports
  Font-size: 13px, text-secondary inactive, text-primary active
  Padding: 16px 12px per item

Main content area (flex: 1):
  Padding: 32px

Right AI panel (300px):
  Border-left: 1px solid var(--border-subtle)
  Padding: 24px

--- MAIN CONTENT ---

PAGE HEADER:
  "Team Performance Insights" — font-size 28px, font-weight 600
  Subtext: "AI-powered analytics for modern collaborative teams." — 14px, text-secondary
  
  Right side (header row):
    Date range picker: "May 12 – Jun 12, 2024" with calendar icon + "▾" — bg bg-elevated, border, rounded-md, height 36px
    "⬆ Share" button — secondary
    "⬇ Filter" button — secondary with filter icon

TOP STATS ROW (4 cards, gap 12px):
  Call GET /analytics/team/performance.
  
  Card 1 — Completion Rate:
    Label: "Completion Rate" (12px, text-secondary)
    Value: "{completionRate}%" (36px, font-weight 700)
    Trend: "↑ {trend}% from last period" (12px, success)
    Sparkline: smooth green line, 100% width, 48px tall
  
  Card 2 — Team Velocity:
    Label: "Team Velocity"
    Value: "{teamVelocity}"
    Trend: "↑ {trend}%..."
    Visual: bar chart sparkline (8 bars, accent color)
  
  Card 3 — Workload Balance:
    Label: "Workload Balance"
    Value: "{workloadBalance}" (large, font-size 24px)
    Subtext: "All teams are optimal" (success color) or appropriate message
    Visual: donut ring (SVG, 80px) — balanced = full green circle
  
  Card 4 — Projects Health:
    Label: "Projects Health"
    Value: "{projectsHealth}%"
    Trend: "↑ {trend}%..."
    Sparkline: green line

MIDDLE CHARTS ROW (two equal cards, gap 12px):
  LEFT — Sprint Velocity chart:
    Header: "Sprint Velocity" + "Last 5 sprints ▾" dropdown
    Chart: Line chart using Chart.js (ng2-charts)
      X-axis: sprint dates (May 12, May 19, May 26, Jun 2, Jun 9)
      Y-axis: 0 to 40, gridlines (very subtle: rgba(255,255,255,0.04))
      Line: color accent (#D4A853), strokeWidth: 2, filled area: accent-dim gradient below line
      Data points: circles on the line
      Chart height: 200px
      NO chart border. Chart background: transparent.
      X/Y axis labels: 11px, text-tertiary

  RIGHT — Workload Distribution chart:
    Header: "Workload Distribution"
    Chart: Donut chart (Chart.js)
      Center label: "{totalTasks} Tasks" in large text
      Segments: 5 colors for different projects/categories
      Legend below: colored dot + label + percentage
      Chart size: 180x180px, centered

BOTTOM STATS ROW (4 smaller cards, gap 12px):
  Same width as top stats row.
  Each: same card style but shows a secondary metric with sparkline.

  Card 1 — Team Productivity:
    "Team Productivity" + "This week ▾"
    "Tasks completed" label + "{tasksCompleted}" (28px, font-weight 700)
    Trend, sparkline (amber line)

  Card 2 — Focus Time:
    "Focus Time" + "This week ▾"  
    "Deep work hours" label + "{focusTime}h" (28px)
    Trend, sparkline

  Card 3 — Cycle Time:
    "Cycle Time" + "This week ▾"
    "Average cycle time" label + "{cycleTime} days" (28px)
    Trend, sparkline (shows red/amber if increasing)

  Card 4 — On-Time Delivery:
    "On-Time Delivery" + "This week ▾"
    "On-time completion" label + "{onTimeDelivery}%" (28px)
    Trend, sparkline (green)

  For sparklines in this section: use Chart.js micro line charts (60px tall, no axes, no labels).

--- RIGHT PANEL: AI INSIGHTS ---

Header: "⚡ AI Insights" (font-size 15px, font-weight 600, accent icon) — "Smart insights to help your team perform better."

Insight cards (from GET /analytics/insights):
  Each card: bg bg-elevated, border border-subtle, rounded-lg, padding 16px, margin-bottom 12px
  
  Header row:
    Icon circle (32px): warning=red, success=green, info=blue gradient
    Title (font-size 14px, font-weight 600)
  
  Description (font-size 13px, text-secondary, line-height 1.5, margin-top 6px)
  
  Action button: text + "→" (font-size 12px, color accent)
    Inline button, no border, just link-like
  
  Example cards (from screenshot 5):
    🔴 "Burnout Risk Detected" — warning icon, description, "View affected members →"
    🟢 "Sprint Recommendation" — success icon, description, "Adjust sprint scope →"
    📊 "Team Performance" — info icon, description, "View detailed analysis →"

AI Assistant input at bottom:
  Header: "⚡ AI Assistant  Beta"
  Subtext: "Ask anything about your team's performance..."
  Input: full width, bg bg-elevated, border border-subtle, rounded-md, 36px height
  Placeholder: "Ask a question..."
  Right: send icon button
  Quick action pills below: "Why is velocity declining?" | "Show workload balance"
  Pills: bg bg-elevated, border border-subtle, 11px, text-secondary, rounded-full, clickable (puts text in input)
  On send: just show "Coming soon" toast — no backend AI needed.

Sub-navigation routing:
  The sub-sidebar links change the content area:
  Overview → shows the full layout above
  Team Performance → show GET /analytics/team/performance in more detail
  Projects → show GET /analytics/projects/{id}/stats for each project (project selector dropdown)
  Workload → show GET /analytics/projects/{id}/team-workload as a table/chart
  Reports → show GET /reports/projects/{id}?format=json|csv|pdf download buttons

Verify: screenshot 5 match — charts render, AI Insights panel shows real data.
Verify: Sprint Velocity chart renders as line chart with Chart.js.
Verify: Workload Distribution donut chart renders with segments.
Verify: sub-navigation switches content without page reload.
```

---

## PHASE R7 — Auth Pages Redesign

### Task R7.1 — Auth Pages Redesign ✅
```
The login and register pages need to match the design language of the rest of the app.
They are currently generic. Make them premium.

BACKEND: No changes needed.

FRONTEND: Rewrite both auth pages.

--- LOGIN PAGE ---

Full screen layout (100vw, 100vh, bg var(--bg-base)):
  Display: grid, grid-template-columns: 1fr 1fr (desktop), 1fr (mobile)

LEFT PANEL (hidden on mobile):
  Background: linear-gradient(135deg, #0C0C0E 0%, #1A1200 50%, #0C0C0E 100%)
  Plus warm radial glow: radial-gradient(ellipse 70% 50% at 60% 40%, rgba(180,130,60,0.25) 0%, transparent 70%)
  Padding: 60px
  Display: flex, flex-direction: column, justify-content: space-between

  TOP:
    Logo: ◈ icon (28px, text-accent) + "TeamSync" (18px, font-weight 600, text-primary)
  
  MIDDLE:
    Large quote: "The best project management tool we've ever used. Intuitive, powerful, and packed with intelligence."
    Font-size: 24px, font-weight: 400, color text-primary, line-height: 1.5, max-width 480px
    Author: avatar circle + "Sarah Chen, CEO at TechFlow" — font-size 13px, text-secondary, margin-top 24px
  
  BOTTOM:
    Stats row: "25K+ Teams" | "99.9% Uptime" | "4.9/5 Rating" — separated by · dots, font-size 13px, text-secondary

RIGHT PANEL (the form):
  Background: var(--bg-base)
  Display: flex, flex-direction: column, justify-content: center, align-items: center
  Padding: 60px 80px
  
  Form container (max-width: 380px, width: 100%):
    "Welcome back" — font-size 24px, font-weight 600, color text-primary
    "Sign in to your TeamSync account" — font-size 14px, color text-secondary, margin-top 6px
    
    Form fields (margin-top 32px, display flex flex-col gap 16px):
      Email: label + input (--radius-md, height 40px, bg bg-elevated, border border-subtle)
      Password: label + input + show/hide toggle icon inside input on right
      
      "Forgot password?" link — right-aligned, font-size 12px, color accent
      
      Submit button: full width, height 40px, bg accent, color #0C0C0E, font-weight 600, rounded-md
      "Sign in" text
    
    Divider: "or continue with" — horizontal rule + text (text-tertiary, 12px)
    
    "Don't have an account? Create one →" — font-size 13px, text-secondary, center
      "Create one →" is accent color link

--- REGISTER PAGE ---
Same two-panel layout.
Left panel same style (different quote if desired).
Right panel:
  "Create your account" heading
  Form: Username, Email, Password, Role selector
  Submit: "Create account →"
  Link: "Already have an account? Sign in"

Verify: login page looks premium. Dark, moody left panel. Clean right panel form.
Verify: form validation works — inline error messages below fields.
Verify: successful login → redirects to /dashboard.
```

---

## PHASE R8 — Final Quality Pass

### Task R8.1 — Global Micro-interactions + Animations ✅
```
These small details are what separate a premium app from a generic one.
Apply globally across ALL pages.

ANGULAR ANIMATIONS (src/app/app.animations.ts):
  Create reusable animation definitions:

  fadeIn: opacity 0→1, duration 200ms, ease-out
  slideInRight: translateX(100%)→(0), duration 200ms, ease-out (drawer)
  slideInUp: translateY(16px)→(0) + opacity 0→1, duration 200ms, ease-out (modals, cards on load)
  scaleIn: scale(0.95)→(1) + opacity 0→1, duration 150ms, ease-out (dropdowns)

Apply animations:
  Page transitions: route changes → fadeIn on the page content
  Dashboard stat cards: slideInUp with stagger (each card 50ms delay after previous)
  Drawer: slideInRight
  Dropdowns/modals: scaleIn
  Toast notifications: slideInRight from top-right

HOVER STATES (go through every interactive element):
  Cards: transition: background 0.15s, border-color 0.15s, transform 0.15s
  Buttons: transition: background 0.15s, box-shadow 0.15s, transform 0.1s
    Primary button hover: transform: translateY(-1px), shadow-glow
  Task cards: transition: background 0.15s, border-color 0.15s
  Nav items: transition: background 0.1s, color 0.1s
  Project rows: transition: background 0.15s
  Links: transition: color 0.15s

LOADING SKELETON REDESIGN:
  Previous skeletons used gray blocks — replace with the correct dark theme:
  Skeleton base: var(--bg-elevated)
  Shimmer animation: linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent) moving left-to-right
  Apply to: stat cards, project rows, task cards, activity items

CURSOR:
  All interactive elements: cursor: pointer
  Disabled elements: cursor: not-allowed, opacity: 0.5
  Text editing areas: cursor: text

FOCUS STATES:
  All focusable elements: outline: none (remove browser default)
  Instead: box-shadow: 0 0 0 2px var(--accent-dim), 0 0 0 1px var(--accent)
  This gives a clean amber glow on focus

SCROLLBARS (enhance from R1.1):
  Thin, styled, matches the dark theme.

NUMBER ANIMATIONS:
  When stat numbers load (dashboard cards, analytics):
  Animate from 0 to the real value over 800ms using requestAnimationFrame.
  Easing: ease-out (fast at start, slows at end).
  This makes the numbers feel alive when the page loads.

Verify: all animations are smooth (60fps). No jank.
Verify: hover states on every card, button, and nav item work correctly.
Verify: skeleton loading appears correctly before data loads.
Verify: number animation plays on dashboard stat cards on page load.
```

### Task R8.2 — Cross-browser + Performance + Final Build ☐
```
Final quality check and production preparation.

BACKEND:
  Add CORS configuration to allow the production frontend URL (update when known).
  Ensure all new endpoints from the redesign tasks are covered:
    GET /public/stats ✓
    GET /dashboard/stats ✓
    GET /dashboard/upcoming-deadlines ✓
    GET /dashboard/projects-overview ✓
    POST /tasks/{id}/subtasks ✓
    PUT /tasks/{id}/subtasks/{sid}/toggle ✓
    DELETE /tasks/{id}/subtasks/{sid} ✓
    GET /analytics/team/performance ✓
    GET /analytics/insights ✓
  Run all existing tests: mvn test — must pass.

FRONTEND:

Performance:
  Lazy load all feature routes (already done in routing — verify).
  Images: all placeholder gradient backgrounds use CSS, no actual images to load.
  Chart.js: import only needed components (tree-shakeable imports):
    import { Chart, LineController, LineElement, ... } from 'chart.js'
    Chart.register(LineController, ...)
    Do NOT import entire Chart.js bundle.
  
  OnPush change detection: apply ChangeDetectionStrategy.OnPush to:
    task-card.component
    stat-card.component (new)
    project-row.component (new)
    avatar.component
    badge.component
    progress-bar.component
    sparkline.component (new)

Accessibility:
  All interactive elements: role, aria-label
  Color contrast: verify all text passes WCAG AA (4.5:1 ratio minimum)
    text-primary (#F2F2F5) on bg-surface (#141416): passes
    text-secondary (#9999A8) on bg-surface (#141416): verify with a contrast checker
    If failing: darken text-secondary to #AAAABC
  Keyboard navigation: Tab through all interactive elements in logical order
  Screen reader: all icon-only buttons have aria-label

Final build checks:
  ng lint — zero errors
  ng build --configuration=production — zero errors, zero warnings
  Bundle size: ensure main bundle < 500KB gzipped (verify with source-map-explorer)
    If over: find and remove unused Chart.js components

Browser testing:
  Chrome 120+: full functionality
  Firefox 120+: full functionality
  Safari 17+: check backdrop-filter blur (may need -webkit- prefix)
  Add to styles.scss: -webkit-backdrop-filter: blur(20px); alongside backdrop-filter.

Responsive final check:
  375px (iPhone SE): landing page readable, auth pages single column, dashboard stacks
  768px (iPad): sidebar collapses, 2-column grids
  1280px (laptop): full layout
  1440px+: max-width: 1440px on content, centered

Update README.md:
  ## Frontend Design System
  - Colors: near-black backgrounds (#0C0C0E), warm amber accent (#D4A853)
  - Font: Inter (Google Fonts)
  - Component library: custom Angular standalone components
  - Charts: Chart.js with ng2-charts
  - Animations: Angular Animations

  ## Screenshots
  [placeholder for screenshots after build]

Final verification flow (must all work end-to-end):
  1. Visit /home → landing page loads fully, all 10 sections visible
  2. Click "Start free trial" → /register → create account → auto-login → /dashboard
  3. Dashboard: stat cards show numbers, sparklines render, kanban shows tasks
  4. Navigate to /workspaces → workspace list → click workspace → workspace detail
  5. Workspace detail: warm glow hero, project list with thumbnails and AI Insight, activity feed on right
  6. Click project → project detail → board tab → kanban loads
  7. Click a task card → drawer slides in with taskIdentifier, subtasks, tabs
  8. Add subtask → toggle subtask → progress bar updates
  9. Navigate to Analytics → charts render, AI Insights show, sub-nav works
  10. Logout → /login → log back in → back to dashboard

Verify: the full flow works without errors.
Verify: ng build --configuration=production succeeds.
Verify: the app visually matches the 5 reference screenshots provided.
```

---

## Pattern Checklist (unchanged — all done)

| # | Pattern | Done |
|---|---|---|
| 1-14 | All 14 GoF Patterns | ✅ |
