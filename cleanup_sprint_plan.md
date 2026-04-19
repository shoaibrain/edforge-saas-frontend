# Clean Up Non-Functional & Coming Soon Interfaces — Sprint Plan

> **Branch:** `clean-upcoming-interfaces-from-app`
> **Goal:** Remove all non-functional Coming Soon/POC interfaces, replace the Classroom Detail "Stream" tab with a working "Overview" tab using existing backend APIs, and clean up parked module routes, mock data, and placeholder UI across the entire frontend.

---

## Audit Summary

### What's Broken / Coming Soon / Mock

| Area | Feature | Current State | Action |
|------|---------|--------------|--------|
| **Classroom Detail** | Stream tab | `ComingSoonBanner` (in `@edforge/ui`) + unused PostComposer, StreamPostCard, CommentThread | Replace with **Overview** tab; delete all `stream/` components |
| **Shell Router** | Messages module (`/messages/$`) | Catch-all → `<ComingSoon>` page (shell-local component) | Remove route + sidebar entry |
| **Shell Router** | Analytics module (`/analytics/$`) | Catch-all → `<ComingSoon>` page | Remove route + sidebar entry |
| **Shell Router** | State Reporting (`/edfi/$`) | Catch-all → `<ComingSoon>` page | Remove route + sidebar entry |
| **Shell Router** | Special Programs (`/special-programs/$`) | Catch-all → `<ComingSoon>` page | Remove route + sidebar entry |
| **Shell Router** | Student Portal — Assignments, Curriculum, Calendar | `<ComingSoon>` pages | Remove routes |
| **Shell Router** | Parent Portal — Calendar | `<ComingSoon>` page | Remove route |
| **Settings** | MFA + Session Management | `ComingSoonBanner` in `security.tsx:577,599` | Remove sections |
| **Settings** | Audit Log | `ComingSoonBanner` in `rbac-security.tsx:453` | Remove section |
| **Settings** | Profile Photo Upload | `ComingSoonBadge` in `account.tsx:187` | Remove badge |
| **Login** | Self-Registration button | Toast "coming soon" `LoginPage.tsx:94` | Remove button |
| **Login** | Google Sign-In button | Toast "coming soon" `LoginPage.tsx:130` | Remove button |
| **Dashboard Widget** | Upcoming Events | Mock data behind `ComingSoonOverlay` in `UpcomingEventsWidget.tsx` | Remove widget or show empty state |
| **Dashboard Widget** | Recently Visited Carousel | `EXTENDED_MOCK_PAGES` fallback in `CarouselWidget.tsx` | Remove mock entries |
| **Messages App** | Calendar, Notifications, Settings routes | Inline placeholder text | Remove placeholder routes |
| **Messages App** | `BootstrapPage` component | "Feature Coming Soon" component | Delete if unused after route cleanup |
| **Analytics App** | Enrollment, Attendance, Performance, Finance, Custom Dashboards | Inline placeholder text | Remove placeholder routes |
| **Special Programs App** | IEPs, IEP Meetings, IEP Goals, 504 Plans, Accommodations, Accessibility, Counseling, Interventions | Inline placeholder text | Remove placeholder routes |
| **Ed-Fi App** | Entire module internals | Mock data (MOCK_CATEGORIES, MOCK_ERRORS, etc.) | Out of scope (unreachable after route removal) |
| **People App** | Departments, Roles, Settings, Analytics, HR routes | Inline "to be populated" stubs | Remove placeholder routes |
| **People App** | `BootstrapPage` component | Exists but NOT imported anywhere | Delete orphaned file |
| **People App** | Staff page — Import CSV, Bulk Add buttons | `toast.info('... coming soon')` at `staff.tsx:399,418` | Remove buttons |
| **Build Config** | `rsbuild.config.ts` MVP-PARKED remotes | Commented-out module federation for edfi, special-programs, messages, analytics | Remove comments |
| **Settings** | `organization.tsx:17` | `// [MVP-PARKED] FileJson2,` import | Remove comment |
| **Settings** | `settings/index.ts` | 5 `[MVP-PARKED]` commented exports | Remove comments |

### What's Working (No Touch)

- Classwork tab (fully functional with API integration)
- People tab (roster management, enrollment)
- Progress tab (Grades + Attendance with sub-views)
- Classrooms listing page (Overview, Gradebook, Grading Policies, Attendance tabs)
- Payment routes (live payment flow — **CAUTION**: payment callback/receipt routes are nested inside the `[MVP-PARKED]` block in `router.tsx` — must NOT be deleted)

### Two Distinct `ComingSoon` Components

| Component | Location | Used By |
|-----------|----------|---------|
| `ComingSoon` (full page) | `apps/shell/src/components/layout/ComingSoon.tsx` | Shell router catch-all routes |
| `ComingSoonBanner` / `ComingSoonBadge` / `ComingSoonOverlay` | `packages/ui/src/components/ComingSoon.tsx` | Settings, UpcomingEventsWidget, StreamFeed |

### Available Backend APIs for New Overview Tab

| Endpoint | Data |
|----------|------|
| `GET /academics/sections/:id` | Section details (name, course, teacher, enrollment, room, status) |
| `GET /academics/sections/:id/students` | Roster with `totalCount` |
| `GET /academics/grades/section/:sectionId` | All grades for section (class averages, distribution) |
| `GET /academics/section-attendance?sectionId=&date=` | Today's attendance records |
| Classwork hooks (`useClassworkItems`) | Classwork items + topics (for upcoming/recent counts) |

---

## Design Decision: Removed Route Behavior

When users navigate to removed module paths (`/messages`, `/analytics`, etc.) — either via bookmarks or manual URL entry — the app should **redirect to the home page** (not show a raw 404). This is better UX for a SaaS app.

**Implementation:** Add a catch-all redirect in the shell router that sends unknown paths to `/`.

---

## Sprint 1: Classroom Detail — Stream → Overview Refactor

**Goal:** Replace the non-functional Stream tab with a working Overview tab that surfaces real classroom data using existing APIs.

**Demoable Outcome:** Opening a classroom detail page lands on an "Overview" tab showing section info, quick actions, grade summary, attendance summary, and recent classwork — all from live data.

> **Note on ordering:** Tickets 1.3-1.7 all modify `ClassroomOverview.tsx` and are sequential (not parallelizable). Ticket 1.3 creates the scaffold AND wires it into the tab content area immediately, so the component is visible from the first commit.

### Ticket 1.1: Delete Stream Components, Rename Tab, Wire Scaffold

**Atomic commit:** Delete all stream code, rename tab to Overview, create minimal `ClassroomOverview` scaffold, and wire it into the tab content area — making the Overview tab immediately visible.

**Files to delete:**
- `apps/academics/src/components/classrooms/stream/StreamFeed.tsx`
- `apps/academics/src/components/classrooms/stream/PostComposer.tsx`
- `apps/academics/src/components/classrooms/stream/StreamPostCard.tsx`
- `apps/academics/src/components/classrooms/stream/CommentThread.tsx`
- `apps/academics/src/components/classrooms/stream/types.ts`
- `apps/academics/src/components/classrooms/stream/index.ts`

**New files:**
- `apps/academics/src/components/classrooms/overview/ClassroomOverview.tsx` — minimal scaffold with section info card only
- `apps/academics/src/components/classrooms/overview/index.ts`

**Files to update — `$sectionId.tsx`:**
1. Remove `import { StreamFeed } from '../../components/classrooms/stream'`
2. Add `import { ClassroomOverview } from '../../components/classrooms/overview'`
3. Change `ClassroomDetailTab` type: `'stream'` → `'overview'`
4. Update `TABS` array: `{ id: 'overview', label: 'Overview', icon: LayoutDashboard }` (import `LayoutDashboard` from `lucide-react`, remove `MessageSquare` if unused)
5. Update default tab: `'stream'` → `'overview'`
6. Add legacy redirect: `if (resolvedTab === 'stream') resolvedTab = 'overview'`
7. Replace `activeTab === 'stream'` block with `activeTab === 'overview'` rendering `ClassroomOverview`

**`ClassroomOverview` scaffold (section info card):**
```tsx
interface ClassroomOverviewProps {
  sectionId: string
  section: SectionResponseDto
  onNavigateTab: (tab: string) => void
}
```
Contents: Course name + code, primary teacher, room/location, enrollment bar (`currentEnrollment / maxEnrollment`).

**Validation:**
- `pnpm build` passes
- `pnpm tsc --noEmit` passes for the academics app
- No references to `StreamFeed`, `PostComposer`, `StreamPostCard`, `CommentThread` remain (verified via `grep -r`)
- Navigate to `/classrooms/:id` — Overview tab loads with section info
- Navigate to `/classrooms/:id?tab=stream` — redirects to `?tab=overview`
- Classwork, People, Progress tabs still load correctly
- Handles missing optional fields gracefully (no teacher, no room)

---

### Ticket 1.2: Add Quick Actions Bar to Overview

**File:** `apps/academics/src/components/classrooms/overview/ClassroomOverview.tsx`

**Relocate the quick action buttons from the old StreamFeed:**
- **Take Attendance** → `onNavigateTab('progress:attendance')`
- **Open Gradebook** → `onNavigateTab('progress:gradebook')`
- **Classwork** → `onNavigateTab('classwork')`
- **View Roster** → `onNavigateTab('people')`

**Validation:**
- Each button navigates to the correct tab/sub-view
- `progress:attendance` and `progress:gradebook` correctly parse in parent route handler
- Buttons styled consistently with design system

---

### Ticket 1.3: Add Grade Summary Widget to Overview

**File:** `apps/academics/src/components/classrooms/overview/ClassroomOverview.tsx`

**Reuse logic from the existing `ProgressOverview` component** (lines 336-527 of `$sectionId.tsx`):
- Fetch grades via `useSectionGrades(sectionId, { schoolId })`
- Display: class average %, grade distribution bar (A/B/C/D/F), student counts per letter grade
- "Open Gradebook →" link calling `onNavigateTab('progress:gradebook')`
- Empty state: "No grades recorded yet" with icon

**Error handling:** If the grades API fails, the widget should show an inline error message (not crash the whole Overview tab). The parent `TabErrorBoundary` is the fallback, but the widget should handle API errors gracefully.

**Validation:**
- Grade summary displays correctly with real data
- Distribution bar colors match existing Progress Overview (emerald=A, blue=B, amber=C, orange=D, red=F)
- Empty state renders when no grades exist
- API error shows inline error, not white screen
- Link navigates to gradebook sub-view

---

### Ticket 1.4: Add Attendance Summary Widget to Overview

**File:** `apps/academics/src/components/classrooms/overview/ClassroomOverview.tsx`

**Reuse logic from the existing `ProgressOverview` component:**
- Fetch today's attendance via `useSectionAttendanceRecords({ sectionId, schoolId, date: today })`
- Fetch roster via `useSectionRoster({ sectionId, schoolId })`
- Display: today's attendance rate %, status breakdown bar, present/late/remote/absent counts
- "Open Attendance →" link calling `onNavigateTab('progress:attendance')`
- Empty states: "No attendance recorded for today yet" vs "No students enrolled yet"

**Validation:**
- Attendance summary displays correctly with real data
- Rate color coding works (>=95% green, >=90% amber, <90% red)
- Handles zero-enrolled section vs. enrolled-but-no-attendance-today correctly
- API error shows inline error
- Link navigates to attendance sub-view

---

### Ticket 1.5: Add Recent Classwork Widget to Overview

**File:** `apps/academics/src/components/classrooms/overview/ClassroomOverview.tsx`

**Fetch classwork via existing `useClassworkItems(sectionId, schoolId)` hook:**
- Show count of classwork items by type (assignments, quizzes, materials, questions)
- Show last 3 recently created/updated items with title, type icon, due date
- "View All Classwork →" link calling `onNavigateTab('classwork')`
- Empty state: "No classwork items yet"

**Validation:**
- Classwork summary fetches and displays real data
- Item type icons match the `ClassworkItemCard` component icons
- Link navigates to classwork tab
- Empty state renders when no classwork exists
- Loading state doesn't cause layout shift (4 widgets fetching independently)

---

## Sprint 2: Clean Up Parked Module Routes & Sidebar Navigation

> **Can be executed in parallel with Sprint 1** — touches different areas of the codebase.

**Goal:** Remove all catch-all Coming Soon routes for parked modules and their sidebar navigation entries, so users never encounter dead-end placeholder pages.

**Demoable Outcome:** No navigation item leads to a "Coming Soon" page. Removed paths redirect to home.

### Ticket 2.1: Remove Parked Module Routes from Shell Router

**File:** `apps/shell/src/router.tsx`

> **CRITICAL WARNING:** Payment callback and receipt routes (`/payments/callback`, `/payments/receipt`) are nested INSIDE the `[MVP-PARKED] COMING SOON CATCH-ALL ROUTES` block (approx. lines 866-883). These are LIVE payment routes and MUST NOT be deleted. Move them outside the parked block first, then delete the parked routes.

**Remove these route definitions:**
- `/messages/$` → `<ComingSoon moduleName="Messages" />`
- `/analytics/$` → `<ComingSoon moduleName="Analytics" />`
- `/edfi/$` → `<ComingSoon moduleName="State Reporting" />`
- `/special-programs/$` → `<ComingSoon moduleName="Special Programs" />`
- `/student-portal/assignments` → `<ComingSoon moduleName="Assignments" />`
- `/student-portal/curriculum` → `<ComingSoon moduleName="Curriculum" />`
- `/student-portal/calendar` → `<ComingSoon moduleName="School Calendar" />`
- `/parent-portal/calendar` → `<ComingSoon moduleName="School Calendar" />`

Also remove associated lazy imports for these modules.

**Add catch-all redirect:** Unknown paths should redirect to `/` (home) instead of showing a 404.

**Validation:**
- `pnpm build` passes
- Payment routes (`/payments/callback`, `/payments/receipt`) still work
- Navigating to `/messages`, `/analytics`, `/edfi`, `/special-programs` redirects to home
- No `ComingSoon` component import in `router.tsx` (for the shell-local full-page component)

---

### Ticket 2.2: Remove Parked Module Sidebar Entries

**File:** `apps/shell/src/config/sidebar-modules.ts`

**Remove sidebar module configs for:**
- Messages module (`messagesModule`)
- Analytics module (`analyticsModule`)
- Ed-Fi / State Reporting module (`edfiModule`)
- Special Programs module
- Student/Parent portal nav items pointing to removed routes (assignments, curriculum, calendar)

Remove their associated icon imports from `lucide-react` if no longer used.

**Validation:**
- Sidebar does not show links to Messages, Analytics, Ed-Fi, or Special Programs
- Student/Parent portal sidebars don't show dead links
- No unused import warnings
- Build passes

---

### Ticket 2.3: Remove All MVP-PARKED Comments & Dead Code

**Complete file list (all files containing `[MVP-PARKED]` markers):**

| File | What to remove |
|------|---------------|
| `apps/shell/src/config/sidebar-modules.ts` | Parked module configs + icon imports |
| `apps/shell/src/config/modules.config.ts` | Parked module entries |
| `apps/shell/src/router.tsx` | Parked lazy imports + route blocks (done in 2.1, verify cleanup) |
| `apps/shell/src/pages/SettingsPage.tsx` | Parked settings tab references |
| `apps/shell/src/pages/settings/organization.tsx:17` | `// [MVP-PARKED] FileJson2,` import |
| `apps/shell/src/pages/settings/index.ts` | 5 `[MVP-PARKED]` commented exports |
| `apps/shell/src/hooks/useRecentlyVisited.ts` | Parked module references |
| `apps/shell/src/components/layout/pages/HomePage.tsx` | Parked module references |
| `apps/shell/src/components/home/RecentlyVisitedCarousel.tsx` | Parked module entries |
| `apps/shell/rsbuild.config.ts` (lines 113-118) | Commented-out module federation remotes for edfi, special-programs, messages, analytics |
| `federation/tenant-resolver.ts` | Parked module tenant config |

**Changes:**
- Remove all `[MVP-PARKED]` commented-out code blocks
- Remove unused icon imports kept only for parked modules
- Clean up any conditional logic gating parked modules

**Validation:**
- `grep -r "MVP-PARKED"` returns zero results in the entire frontend repo
- Build passes
- No runtime errors on all navigable pages

---

### Ticket 2.4: Delete Shell `ComingSoon` Page Component

**File:** `apps/shell/src/components/layout/ComingSoon.tsx`

This is the **full-page** Coming Soon component (distinct from `@edforge/ui` `ComingSoonBanner`).

After Tickets 2.1-2.3, verify no remaining imports:
- `grep -r "from.*ComingSoon\|import.*ComingSoon" apps/shell/src/`
- If zero usages: delete the file and remove from any barrel exports
- If usages remain: investigate and remove them

**Validation:**
- `grep -r "ComingSoon" apps/shell/src/components/layout/` returns zero results
- Build passes

---

### Ticket 2.5: Remove Placeholder Routes from Module Apps

**Files and routes to remove:**

**`apps/messages/src/router.tsx`:**
- `/messages/calendar` — "Calendar integration coming soon..."
- `/messages/notifications` — "Notification settings coming soon..."
- `/messages/settings` — "Messaging settings coming soon..."

**`apps/messages/src/components/layout/BootstrapPage.tsx`:**
- Delete this file if not imported after route cleanup

**`apps/analytics/src/router.tsx`:**
- `/analytics/enrollment` — "Enrollment trends and projections coming soon..."
- `/analytics/attendance` — "Attendance trends and patterns coming soon..."
- `/analytics/performance` — "Academic performance analytics coming soon..."
- `/analytics/finance` — "Financial reports and forecasts coming soon..."
- `/analytics/custom` (or similar) — "Custom dashboards coming soon..."

**`apps/special-programs/src/router.tsx`:**
- `/special-programs/ieps` — "IEP management coming soon..."
- `/special-programs/ieps/meetings` — "IEP meetings coming soon..."
- `/special-programs/ieps/goals` — "Goals & Objectives coming soon..."
- `/special-programs/504-plans` — "504 Plans management coming soon..."
- `/special-programs/accommodations` — "Accommodations management coming soon..."
- `/special-programs/accessibility` — "Accessibility services coming soon..."
- `/special-programs/counseling` — "Counseling services coming soon..."
- `/special-programs/interventions` — "Interventions management coming soon..."

**Note:** Preserve the app packages for future development. Only strip placeholder routes and unused components.

**Validation:**
- `grep -r "coming soon" apps/messages/ apps/analytics/ apps/special-programs/` returns zero results (case-insensitive)
- Each app builds cleanly
- Full monorepo build passes

---

### Ticket 2.6: Remove Mock Data from Dashboard Widgets

**File:** `apps/shell/src/components/dynamic-page/widgets/UpcomingEventsWidget.tsx`
- Remove `MOCK_UPCOMING_EVENTS` mock data (lines 74-263)
- Remove `ComingSoonOverlay` and `ComingSoonBadge` usage
- Replace with empty state: "No upcoming events" (no real calendar API available yet)

**File:** `apps/shell/src/components/dynamic-page/widgets/CarouselWidget.tsx`
- Remove `EXTENDED_MOCK_PAGES` (lines 462-520) that include parked module entries
- Remove conditional logic that falls back to mock data
- Show only real recently-visited pages

**Validation:**
- Dashboard renders without mock data
- No `MOCK_` prefixed exports remain in widget files
- Empty state displays when no events/pages available
- Build passes

---

### Ticket 2.7: Clean Up Parked Quick Actions & Welcome Tips

**File:** `apps/shell/src/components/dynamic-page/widgets/QuickActionsWidget.tsx`
- Remove parked quick actions: "Schedule Meeting", "Messages" (across all role types)

**File:** `apps/shell/src/components/dynamic-page/widgets/WelcomeTipWidget.tsx`
- Remove parked tips: Analytics module tip ("Insights & Analytics"), Messages module tip ("Communicate")

**Validation:**
- Widgets render only functional actions/tips
- No `[MVP-PARKED]` comments remain in widget files
- Build passes

---

## Sprint 3: Clean Up Settings, Auth & People Coming Soon Features

> **Can be executed in parallel with Sprints 1 and 2** — touches settings/auth pages which are independent from classroom and routing code.

**Goal:** Remove all Coming Soon sections from Settings pages, non-functional auth buttons from Login, and placeholder stubs from the People module.

**Demoable Outcome:** Settings pages show only implemented features. Login page shows only functional auth methods. People module has no "coming soon" stubs.

### Ticket 3.1: Remove Coming Soon Sections from Security Settings

**File:** `apps/shell/src/pages/settings/security.tsx`

Remove both:
- The "Two-Factor Authentication" section (around line 577) with `ComingSoonBanner` + `// COMING_SOON: mfa`
- The "Session Management" section (around line 599) with `ComingSoonBanner` + `// COMING_SOON: sessions`

**Validation:**
- Security settings page renders without MFA or Session Management sections
- No layout issues from removed content
- Build passes

---

### Ticket 3.2: Remove Audit Log Coming Soon Section

**File:** `apps/shell/src/pages/settings/rbac-security.tsx`

- Remove the "Audit Log" section (around line 453) with `ComingSoonBanner`
- Remove `// COMING_SOON: audit-log` comment

**Validation:**
- RBAC security settings page renders without audit log section
- Build passes

---

### Ticket 3.3: Remove Profile Photo Coming Soon Badge

**File:** `apps/shell/src/pages/settings/account.tsx`

- Remove the `ComingSoonBadge` (around line 187) from the profile photo upload area
- Remove the non-functional upload UI or replace with a static avatar/initials placeholder

**Validation:**
- Account settings page renders without "coming soon" badge
- Build passes

---

### Ticket 3.4: Remove Non-Functional Auth Buttons from Login Page

**File:** `apps/shell/src/components/layout/LoginPage.tsx`

- Remove the "Sign Up" button/link that triggers the `signUpComingSoon` toast (line 94)
- Remove the "Sign in with Google" button that triggers the `googleComingSoon` toast (line 130)
- Remove associated i18n keys from `packages/i18n/src/locales/en/auth.json` (`signUpComingSoon`, `googleComingSoon`)

**Validation:**
- Login page shows only the functional username/password form
- No "coming soon" toasts can be triggered
- Build passes

---

### Ticket 3.5: Clean Up People App Placeholder Routes & Stubs

**Routes to remove (inline "to be populated" stubs):**
- `apps/people/src/routes/departments.tsx`
- `apps/people/src/routes/roles.tsx`
- `apps/people/src/routes/settings.tsx`
- `apps/people/src/routes/analytics.tsx`
- `apps/people/src/routes/hr/index.tsx` (scaffolded empty state with "notify me" toast)

**Orphaned component to delete:**
- `apps/people/src/components/layout/BootstrapPage.tsx` (not imported anywhere)

**Coming Soon toasts to remove:**
- `apps/people/src/routes/staff.tsx:399` — `toast.info('Import from CSV coming soon')`
- `apps/people/src/routes/staff.tsx:418` — `toast.info('Bulk add coming soon')`
- Remove the buttons that trigger these toasts

**Also remove associated sidebar entries** in the People app if they point to removed routes.

**Validation:**
- `grep -r "coming soon" apps/people/` returns zero results (case-insensitive)
- `grep -r "to be populated" apps/people/` returns zero results
- People app builds cleanly
- No navigation leads to placeholder/stub pages in People module
- Staff page no longer shows "Import CSV" or "Bulk Add" buttons

---

## Sprint 4: Final Cleanup, Shared Component Audit & Verification

**Goal:** Remove orphaned shared components, verify no Coming Soon artifacts remain, ensure full build + smoke test passes.

**Demoable Outcome:** Clean build with zero Coming Soon references. Every navigable page is functional.

### Ticket 4.1: Audit & Clean Up Shared `ComingSoon` UI Components

**File:** `packages/ui/src/components/ComingSoon.tsx` (343 lines)

This is the **shared package** component (exports `ComingSoonBanner`, `ComingSoonBadge`, `ComingSoonOverlay`) — distinct from the shell's full-page `ComingSoon`.

After all previous tickets, check remaining usages:
```bash
grep -r "ComingSoonBanner\|ComingSoonBadge\|ComingSoonOverlay" --include="*.tsx" --include="*.ts" apps/ packages/
```

If zero usages remain:
- Delete `packages/ui/src/components/ComingSoon.tsx`
- Remove its export from `packages/ui/src/components/index.ts` (or barrel export)

If usages remain: document which features still use it and why.

**Validation:**
- Build passes
- No orphaned exports

---

### Ticket 4.2: Clean Up i18n Keys, Parking Docs & Final Artifacts

**i18n keys to remove (if no longer referenced):**
- `packages/i18n/src/locales/en/errors.json` — `comingSoon.title`, `comingSoon.titleWithModule`, `comingSoon.description`
- `packages/i18n/src/locales/en/common.json` — `comingSoon`
- `packages/i18n/src/locales/en/people.json` — `bootstrap.comingSoon`

**Documentation to delete:**
- `docs/MODULE_PARKING.md`
- `docs/MVP_MODULE_PARKING_SPRINT_PLAN.md`

**Validation:**
- `grep -r "comingSoon\|coming_soon\|COMING_SOON" packages/i18n/` returns zero or only intentional results
- No references to deleted docs in README or other docs
- Build passes

---

### Ticket 4.3: Full Build, Lint & E2E Verification

**Commands:**
```bash
pnpm build          # Full monorepo build
pnpm tsc --noEmit   # TypeScript type checking across all apps
pnpm lint           # ESLint across all apps
```

**Also verify existing e2e tests still pass** (check `e2e/tests/` for any tests covering affected areas):
```bash
pnpm test:e2e       # or equivalent e2e runner
```

**Validation:**
- Zero build errors
- Zero TypeScript errors
- Zero ESLint errors related to removed code
- All existing e2e tests pass

---

### Ticket 4.4: Manual Smoke Test Checklist

Run the app locally (`pnpm dev`) and verify each navigable page:

**Classroom Detail Page:**
- [ ] `/classrooms/:id` — Overview tab loads with section info, quick actions, grade/attendance/classwork summaries
- [ ] `/classrooms/:id?tab=overview` — same as above
- [ ] `/classrooms/:id?tab=stream` — redirects to `?tab=overview`
- [ ] `/classrooms/:id?tab=classwork` — Classwork tab loads, items fetchable, create/edit works
- [ ] `/classrooms/:id?tab=people` — People tab loads, roster visible
- [ ] `/classrooms/:id?tab=progress` — Progress tab loads with Overview, Gradebook, Attendance sub-views
- [ ] Quick action buttons on Overview navigate correctly to each target tab
- [ ] Overview grade widget shows data or proper empty state
- [ ] Overview attendance widget shows data or proper empty state
- [ ] Overview classwork widget shows data or proper empty state
- [ ] API error on one widget doesn't crash the whole Overview tab

**Removed Module Paths (redirect to home):**
- [ ] `/messages` → redirects to home
- [ ] `/analytics` → redirects to home
- [ ] `/edfi` → redirects to home
- [ ] `/special-programs` → redirects to home

**Sidebar Navigation:**
- [ ] No "Messages" link in sidebar
- [ ] No "Analytics" link in sidebar
- [ ] No "Ed-Fi" / "State Reporting" link in sidebar
- [ ] No "Special Programs" link in sidebar
- [ ] Student/Parent portal sidebars have no dead links

**Settings:**
- [ ] Security settings — no MFA section, no Session Management section
- [ ] RBAC Security — no Audit Log section
- [ ] Account settings — no "Coming Soon" badge on photo upload

**Login:**
- [ ] No "Sign Up" button visible
- [ ] No "Google Sign-In" button visible
- [ ] Only username/password form present

**Dashboard:**
- [ ] No mock upcoming events (empty state or widget removed)
- [ ] Recently visited carousel shows no parked module entries
- [ ] Quick actions show no parked module actions
- [ ] Welcome tips show no parked module tips

**People Module:**
- [ ] No "Feature Coming Soon" pages accessible
- [ ] Staff page has no "Import CSV" or "Bulk Add" buttons with coming soon toasts
- [ ] No "to be populated" stub pages

**Payments (regression):**
- [ ] Payment callback route still works
- [ ] Payment receipt route still works

---

## Dependency Graph

```
Sprint 1 (Classroom Detail)     Sprint 2 (Parked Modules)     Sprint 3 (Settings/Auth/People)
  1.1 Delete+Scaffold+Wire ─┐    2.1 Remove Routes ──┐         3.1 Security Settings ──┐
  1.2 Quick Actions ─────────┤    2.2 Remove Sidebar ─┤         3.2 Audit Log ──────────┤
  1.3 Grade Widget ──────────┤    2.3 MVP-PARKED ──────┤         3.3 Profile Photo ──────┤
  1.4 Attendance Widget ─────┤    2.4 Shell ComingSoon ┤         3.4 Login Buttons ──────┤
  1.5 Classwork Widget ──────┘    2.5 App Placeholders ┤         3.5 People Stubs ───────┘
                                  2.6 Mock Widgets ────┤                    │
                                  2.7 Quick Actions ───┘                    │
          │                                │                                │
          └────────────────┬───────────────┘────────────────────────────────┘
                           ▼
                  Sprint 4 (Final Cleanup)
                    4.1 ComingSoon UI Components
                    4.2 i18n + Docs
                    4.3 Build & E2E Verification
                    4.4 Smoke Test
```

**Sprints 1, 2, and 3 can all be executed in parallel** — they touch independent areas of the codebase (academics app, shell router/sidebar/widgets, and settings/auth/people pages respectively). Sprint 4 depends on all three completing first.

---

## Risk Notes

1. **CRITICAL — Payment routes in MVP-PARKED block:** In `apps/shell/src/router.tsx`, the payment callback/receipt routes (approx. lines 866-883) are nested INSIDE the `[MVP-PARKED] COMING SOON CATCH-ALL ROUTES` block. Ticket 2.1 MUST move these routes outside the block BEFORE deleting parked routes. Failure to do this will break the live payment flow.

2. **Bookmark breakage:** Users with bookmarked URLs to `/classrooms/:id?tab=stream` need the redirect in Ticket 1.1. Deep links to removed modules (`/messages`, `/analytics`, etc.) will redirect to home after Sprint 2.

3. **Shared `ComingSoon` component:** Don't delete `packages/ui/src/components/ComingSoon.tsx` prematurely — Sprint 4 Ticket 4.1 audits remaining usages first. The shell's full-page `ComingSoon` is a separate file.

4. **Parked module app packages:** Sprints 2 and 2.5 remove routes but preserve the app packages (`apps/messages/`, `apps/analytics/`, etc.) for future development. Only placeholder content is stripped.

5. **Ed-Fi app internals:** The Ed-Fi app contains extensive mock data (MOCK_CATEGORIES, MOCK_ERRORS, etc.) but since its routes are removed in Sprint 2, this is unreachable. Cleaning the Ed-Fi app's internals is explicitly **out of scope** for this plan.

6. **Rollback strategy:** This branch should be deployed to UAT/staging before merging to main. All sprints produce independent, demoable states — if any sprint introduces regressions, it can be reverted independently.

7. **Overview tab data fetching:** The new Overview tab makes 4 independent API calls (section info via parent, grades, attendance, classwork). Ensure loading states for each widget are independent — one slow/failed API should not block the others from rendering.
