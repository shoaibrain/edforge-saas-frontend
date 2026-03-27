# EdForge School Details V2 — Agent Implementation Prompt
## Sprint: `settings-school-details-v2`
## Target: `apps/settings/src/` (frontend only — zero server-side changes)
## Executor: Claude Code Opus
## Date: 2026-03-27

---

## PRIME DIRECTIVE

You are implementing the **V2 redesign of the School Details page** in the EdForge Settings module.

This is a **frontend-only sprint**. You will touch nothing in `server/`. No NestJS microservices, no Lambda, no DynamoDB, no CDK, no EventBridge — those are all **read-only**. Every change you make lives in `apps/settings/src/` and potentially `packages/ui/src/` for any new shared primitives.

You are acting as a **staff-level frontend engineer AND product designer**. You do not just execute — you think critically, catch inconsistencies, and produce production-grade, pixel-faithful output. The prototype HTML file `edforge_school_details_v2.html` is your **authoritative visual specification**. When in doubt, match the prototype exactly.

---

## MANDATORY WORKFLOW — DO NOT SKIP ANY STEP

```
STEP 1: Deep Audit  →  STEP 2: Sub-Agent Design Review Gate  →  STEP 3: Implementation  →  STEP 4: Cleanup  →  STEP 5: Validation  →  STEP 6: Sprint Docs
```

**You may not begin STEP 3 until STEP 2 is complete and approved.**

---

## STEP 1 — DEEP CODEBASE AUDIT (Read Before Touching Anything)

Before writing a single line of implementation code, execute this full audit. Write your findings to `docs/school-details-v2-audit.md`.

### 1A — Locate the School Details Page

Search the entire `apps/settings/src/` directory for:

```bash
# Find the school details page/component
grep -r "SchoolDetails\|school-details\|schoolId\|SchoolDetail" apps/settings/src/ --include="*.tsx" --include="*.ts" -l

# Find the current tab implementation
grep -r "Configuration\|Departments\|Academic Years\|Calendar\|Bell Schedule\|Rooms\|Audit Log" apps/settings/src/ --include="*.tsx" -l

# Find the route definition
grep -r "schools/:id\|schools/:schoolId\|school-details\|SchoolDetails" apps/settings/src/ -r --include="*.tsx" --include="*.ts"
```

Map the exact file tree for the school details feature. Document:
- The main page component file path
- Each tab component file path
- The router config file where the school route is defined
- Any `useQuery` / `useMutation` hooks for school data
- Any Zustand store slices touching school state

### 1B — Audit Existing Tab Components

For each of the 7 current tabs, read the component file completely and document:

| Tab | File Path | Lines of Code | API Calls (list each) | State Management | Issues Observed |
|-----|-----------|--------------|----------------------|------------------|-----------------|

### 1C — Audit the Generate Calendar Implementation

Find and read the calendar generation logic. Specifically:
```bash
grep -r "generateCalendar\|GenerateCalendar\|generate.*calendar\|calendar.*generate" apps/settings/src/ --include="*.tsx" --include="*.ts" -l
```
Document exactly:
- What weekends does the current implementation assume? (Is it hardcoded to Sat+Sun?)
- Where is the weekend configuration coming from? (hardcoded, prop, API?)
- Is there any locale/tenant awareness at all?

### 1D — Audit Bell Schedule Templates

Find the bell schedule template data:
```bash
grep -r "Elementary Schedule\|High School Schedule\|template\|Template" apps/settings/src/ --include="*.tsx" --include="*.ts" -l
```
Document: Are templates hardcoded? Where? What templates exist? Is there any Nepal/locale-specific template?

### 1E — Audit Tenant Settings Hook

Search for the tenant settings API call across the frontend:
```bash
grep -r "tenant.*settings\|tenantSettings\|/api/tenants\|regional\|defaultWeekStartsOn\|defaultCalendarSystem\|bikram_sambat" apps/ --include="*.tsx" --include="*.ts" -l
```
Document: Is `GET /api/tenants/{tenantId}/settings` being called anywhere? Is the `regional` object being consumed anywhere in the settings module? If not, where is the tenant context stored (Zustand store, React context, React Query cache)?

### 1F — Audit URL/Tab Routing

Check how tab navigation currently works:
```bash
grep -r "currentTab\|activeTab\|tab=\|searchParams\|useSearchParams" apps/settings/src/ --include="*.tsx" --include="*.ts" -l
```
Document: Do tabs currently update the URL? Is there `?tab=` query param behavior? What happens on browser refresh — does the correct tab load?

### 1G — Audit Outdated/Dead Code

Identify code that will become obsolete after this sprint:
- Any components exclusively used by the 7-tab layout that will not exist in the 4-tab layout
- Any Notifications UI components (confirmed NOT built — must be removed)
- Any Attendance Settings UI (out of MVP scope — must be removed)
- Any Academic Settings grading-scale UI in Configuration tab (out of MVP — must be removed)  
- Any Enabled Features toggle UI in Configuration tab (out of MVP — must be removed)
- Any "How bell schedules work" modal/overlay that is now embedded in the wizard

List each file/component with its current purpose and your recommended action: `DELETE` | `REFACTOR` | `KEEP`.

### 1H — Audit Departments Scope Bug

Read the department creation flow completely:
```bash
grep -r "department\|Department\|createDepartment\|AddDepartment" apps/settings/src/ --include="*.tsx" --include="*.ts" -l
```
Find the API call for creating departments. Document:
- What payload is sent?
- Is `scope` field (`school` vs `organization`) being sent to the API?
- Is the scope selector UI connected to the form submission payload?
- Where exactly does organization-level department creation break?

### 1I — Audit Academic Sessions UI

Find the Academic Sessions panel:
```bash
grep -r "AcademicSession\|academicSession\|session.*panel\|Sessions.*sidebar" apps/settings/src/ --include="*.tsx" --include="*.ts" -l
```
Document how sessions are currently presented and created.

---

## STEP 2 — SUB-AGENT DESIGN REVIEW GATE

**YOU MUST STOP HERE.** Before writing any implementation code, spawn a sub-agent with the following prompt. Do not proceed to Step 3 until the sub-agent confirms the plan.

```
SUB-AGENT REVIEW PROMPT:

You are a senior staff engineer reviewing an implementation plan for the EdForge School 
Details V2 redesign sprint.

Read these files in full:
1. edforge_school_details_v2.html  ← the authoritative prototype
2. docs/school-details-v2-audit.md ← the audit findings from Step 1

Review the following proposed implementation plan and identify ANY risks, gaps, or 
architectural concerns before the implementing agent proceeds:

PROPOSED PLAN:
[The implementing agent must paste its proposed implementation plan here before running this gate]

Review for:
1. Any proposed change that touches server/ — FLAG IMMEDIATELY (this sprint is frontend only)
2. Any proposed deletion of a component that is imported/used elsewhere in the app
3. Any tab routing implementation that would break existing deep-links to school details
4. Any state management approach that conflicts with existing Zustand store structure
5. Any React Query key naming that conflicts with existing query keys in the codebase
6. Any tenant settings consumption approach that doesn't handle the case where 
   /api/tenants/{tenantId}/settings returns an error or slow response
7. Confirm the prototype's 4-tab structure (Configuration / Academic Setup / Structure / Audit Log)
   is correctly mapped to the proposed component architecture
8. Confirm the Nepal locale defaulting logic is correct:
   - If defaultWeekStartsOn = "sunday" AND defaultCalendarSystem = "bikram_sambat" → Saturday-only weekend
   - If defaultWeekStartsOn = "sunday" AND no bikram_sambat → still Saturday-only weekend  
   - If defaultWeekStartsOn = "monday" → Saturday+Sunday weekend (international default)
9. Confirm deleted files are truly dead code and not imported anywhere via barrel exports
10. Confirm the Academic Setup wizard steps (Years → Sessions → Calendar → Bell Schedule) 
    are correctly sequenced with the right dependency guards

Respond with:
- APPROVED (proceed to implementation)
- APPROVED WITH CONDITIONS (list conditions that must be addressed during implementation)
- BLOCKED (list blockers that require re-audit before proceeding)
```

**Only proceed to Step 3 after receiving APPROVED or APPROVED WITH CONDITIONS.**

---

## STEP 3 — IMPLEMENTATION

### 3.0 — Tenant Regional Settings Hook (Foundation — Do This First)

Before touching any school UI, ensure there is a clean hook for consuming tenant regional settings. The tenant settings API endpoint is:

```
GET /api/tenants/{tenantId}/settings
```

Example response:
```json
{
  "tenantId": "ad02541f-911b-4a7f-b61f-9ce7541ea557",
  "regional": {
    "defaultLocale": "en-US",
    "defaultDateFormat": "MM/DD/YYYY",
    "defaultCalendarSystem": "bikram_sambat",
    "defaultTimeFormat": "12h",
    "defaultCurrency": "NPR",
    "defaultWeekStartsOn": "sunday",
    "defaultTimezone": "Asia/Kathmandu"
  },
  "branding": { "organizationName": "tenant1" },
  "policies": { "defaultAttendancePolicy": "daily" },
  "isLocked": false
}
```

**If a `useTenantSettings` hook already exists** — read it, understand it, use it. Do not create a duplicate.

**If it does not exist** — create `apps/settings/src/hooks/useTenantSettings.ts`:
```typescript
// Derive locale-aware defaults from tenant regional settings
// useTenantSettings() returns:
// {
//   data: TenantSettings | undefined,
//   isLoading: boolean,
//   weekendDays: ('saturday' | 'sunday')[],       // derived
//   schoolDays: DayOfWeek[],                       // derived
//   calendarSystem: 'gregorian' | 'bikram_sambat', // derived
//   isNepalLocale: boolean,                        // derived
// }
```

**Weekend derivation logic** (implement exactly as follows — this is business-critical):

```typescript
function deriveWeekendDays(regional: TenantRegionalSettings): ('saturday' | 'sunday')[] {
  const { defaultWeekStartsOn, defaultCalendarSystem } = regional;
  
  // Nepal / BS calendar: Sunday is first working day, Saturday is weekend
  if (
    defaultCalendarSystem === 'bikram_sambat' ||
    defaultWeekStartsOn === 'sunday'
  ) {
    return ['saturday'];  // Saturday-only weekend
  }
  
  // International default: Saturday + Sunday weekend
  return ['saturday', 'sunday'];
}

function deriveSchoolDays(weekendDays: string[]): DayOfWeek[] {
  const allDays: DayOfWeek[] = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  return allDays.filter(d => !weekendDays.includes(d));
}
```

This hook must be consumed by:
- The school Configuration tab (school days picker defaults)
- The Academic Setup → Calendar generation (weekend config, day picker defaults)
- The Bell Schedule template selection (Nepal Standard template shown first)

---

### 3.1 — URL-Based Tab Routing

**Current state (from your audit):** Tabs likely do not sync to URL.

**Required state:** Tab state must live in the URL query parameter `?tab=`:

```
/settings/organization/schools/{schoolId}?tab=config        ← default
/settings/organization/schools/{schoolId}?tab=academic-setup
/settings/organization/schools/{schoolId}?tab=structure
/settings/organization/schools/{schoolId}?tab=audit-log
```

Implementation requirements:
- Use `useSearchParams` from React Router (it is already in the shell — do not add a new dependency)
- Default to `config` if no `?tab=` param is present
- `switchTab(tabId)` calls `setSearchParams({ tab: tabId })` — no other state mutation needed
- Browser back/forward must navigate between tabs correctly
- Deep-linking to `?tab=academic-setup` must open the Academic Setup tab directly
- The wizard step within Academic Setup also uses a URL sub-param: `?tab=academic-setup&step=sessions` etc. (implement if time allows; minimum requirement is the 4 main tabs)

---

### 3.2 — School Page Header

Implement the school header exactly as in the prototype:

```tsx
// School header layout:
// [48px school avatar (initial, gradient)] [School Name 20px/700] [CS chip] [K-12 chip] [Status chip]
//                                                                                Right: [...] [Activate School →]

// School avatar: 48px square, border-radius:12px
// Gradient logic: derive from school name hash (reuse getStudentGradient pattern from academics utils)
// Status chip variants:
//   setup mode  → amber  background:rgba(239,159,39,0.1) border:rgba(239,159,39,0.2) color:#EF9F27
//   active      → green  background:rgba(29,158,117,0.1) border:rgba(29,158,117,0.2) color:#1D9E75
//   inactive    → gray   background:rgba(255,255,255,0.06) color:var(--text-hint)

// "Activate School →" button: primary green #1D9E75
// Only show "Activate School" button when school status is "setup" or "planning"
// Show "⋯" more actions button always
```

---

### 3.3 — Setup Progress Banner

This replaces the generic "This school is in setup mode" banner. The banner is conditional — **only show when school status is NOT `active`**.

```tsx
interface SetupTask {
  id: string;
  label: string;
  tab: string;          // which tab to navigate to
  completed: boolean;   // derived from school data
}

// The 5 tasks and their completion logic:
const setupTasks: SetupTask[] = [
  {
    id: 'identity',
    label: 'School Identity',
    tab: 'config',
    // completed = school has nameOfInstitution AND schoolType populated
    completed: !!school.nameOfInstitution && !!school.schoolType,
  },
  {
    id: 'academic-year',
    label: 'Academic Year',
    tab: 'academic-setup',
    // completed = at least one academic year exists for this school
    completed: academicYears.length > 0,
  },
  {
    id: 'calendar',
    label: 'Calendar',
    tab: 'academic-setup',
    // completed = at least one calendar date exists for the current/upcoming academic year
    completed: calendarDates.length > 0,
  },
  {
    id: 'bell-schedule',
    label: 'Bell Schedule',
    tab: 'academic-setup',
    // completed = at least one bell schedule exists
    completed: bellSchedules.length > 0,
  },
  {
    id: 'departments',
    label: 'Departments',
    tab: 'structure',
    // completed = at least one department exists scoped to this school
    completed: departments.length > 0,
  },
];

// Progress bar: completedCount / totalCount
// Each step chip: clickable → navigates to the correct tab via setSearchParams
// Completed chips: green variant (rgba(29,158,117,...))
// Pending chips: muted variant (rgba(255,255,255,0.03))
```

---

### 3.4 — Tab Bar

4 tabs. Settings module accent color is `#378ADD` (blue).

```tsx
const TABS = [
  { id: 'config',         label: 'Configuration',   icon: '⚙️' },
  { id: 'academic-setup', label: 'Academic Setup',   icon: '📅', badge: pendingAcademicTasks },
  { id: 'structure',      label: 'Structure',        icon: '🏛️', badge: pendingStructureTasks },
  { id: 'audit-log',      label: 'Audit Log',        icon: '🛡️' },
];

// Tab active styles:
// color: #378ADD
// border-bottom: 2px solid #378ADD
// Pending badge: amber chip (rgba(239,159,39,...)) when count > 0
// Completed badge: green chip when all done
```

---

### 3.5 — TAB: Configuration

**CRITICAL: Remove the following sections entirely — they are OUT of MVP scope:**
- `Enabled Features` toggles section (all 8 toggles) — delete component
- `Notifications` section — delete component  
- `Attendance Settings` section — delete component
- `Academic Settings` section (grading scale, term structure) — delete component

**Keep and redesign with V2 section-card pattern:**

#### Section 1: School Identity
```tsx
// Fields: Display Name*, Short Code, School Type*, Website
// Layout: 2-column grid
// Per-section save button (NOT global floating save — this is a Global Rule)
// Ed-Fi annotation on School Type: maps to Ed-Fi educationOrganizationTypeDescriptor
```

#### Section 2: Location & Contact
```tsx
// Fields: Street/Tole, Municipality/VDC, Ward No., District (select), Province (select), Phone, Email
// Layout: 2-column grid, Street/Tole spans full width
// Province and District options: populated from Nepal administrative divisions
//   OR from workspace regional settings if tenant is non-Nepal
// Per-section save button
```

#### Section 3: Schedule & Operations
```tsx
// Fields: School Days (day picker), School Start Time, School End Time, Period Duration (minutes)
// School Days picker: 7 day buttons (S M T W T F S)
//   Default from tenant regional settings:
//   - If isNepalLocale → Sun–Fri active (Saturday inactive = weekend)
//   - Otherwise → Mon–Fri active (Sat+Sun inactive)
// Hint text below days picker: dynamically shows current locale weekend rule
// Per-section save button
```

**Inherit from Workspace banner** (info style, bottom of config tab):
```
ℹ️ Inheriting from Workspace: Some settings are inherited from your organization's workspace settings. 
   Changes here will override the workspace defaults for this school only.
```

---

### 3.6 — TAB: Academic Setup

This is the most complex tab. It uses a **wizard-style left-nav + content-area layout**.

```tsx
// Layout: CSS Grid — 220px wizard-nav | 1fr content-area
// Wizard nav is sticky (position: sticky, top: 0)
// 4 wizard steps with completion state tracking
```

#### Wizard Step Navigation

```tsx
type WizardStep = 'years' | 'sessions' | 'calendar' | 'bell-schedule';

// Step completion logic:
// years:         academicYears.length > 0
// sessions:      sessions.length > 0 (for the current/active year)
// calendar:      calendarDates.length > 0
// bell-schedule: bellSchedules.length > 0

// Step states:
// done   → green checkmark icon, color: #1D9E75
// active → blue icon/text, color: #378ADD
// todo   → muted, number label

// Default active step: first incomplete step
// URL sub-param: ?tab=academic-setup&step=sessions (optional enhancement)
// Step nav click → update activeStep state (and URL sub-param if implemented)
```

---

#### Wizard Step 1: Academic Years

```tsx
// Header: "Academic Years" title + "Manage temporal boundaries" subtitle
// CTA: "+ New Academic Year" (green primary button, top right)

// Academic Year Card (for each year):
// [calendar icon] [Year label: "2082–2083 BS" + "2026–2027 AD" subscript]
// [Date range: Gregorian primary, BS secondary line]
// Status chip: Planning (amber) | Active (green) | Archived (gray)
// Actions: Edit (ghost) | Activate (primary green) — only show Activate if status is Planning

// IMPORTANT BS date display:
// If tenant calendarSystem = 'bikram_sambat':
//   Primary label: "2082–2083 BS"
//   Secondary line: "2026–2027 AD"
//   Date ranges: show BS date primary, AD date secondary
// If calendarSystem = 'gregorian':
//   Primary label: "2026–2027"  
//   No secondary BS line

// Timeline section (below year cards):
// Simple vertical timeline showing all years chronologically
// Each timeline item: dot (planning/active color) + year label + date range + actions

// Bottom info banner:
// "Academic years cannot be deleted once created. This preserves historical data integrity..."
```

---

#### Wizard Step 2: Sessions & Terms

```tsx
// Header: "Sessions & Terms" title + "Define semesters, trimesters, or quarters within [active year]"
// CTA: "+ Add Session" (green primary button, top right)

// Ed-Fi annotation banner:
// "Sessions define grading periods. Each session maps to Ed-Fi GradingPeriodDescriptor. 
//  Students receive report cards per session."

// If no sessions exist: show inline create form + Nepal suggestions panel

// Inline create form fields:
// - Session Name* (text input, placeholder: "e.g., First Semester")
// - Term Type* (select: Semester | Trimester | Quarter | Annual)
// - Begin Date* (date picker)
// - End Date* (date picker)
// - Cancel / Create Session buttons

// Nepal Suggestions Panel (show when isNepalLocale AND sessions.length === 0):
// Two suggestion rows:
//   "First Semester"  → Baishakh–Ashwin  (Apr–Oct)  [+ Use button]
//   "Second Semester" → Kartik–Chaitra   (Oct–Mar)  [+ Use button]
// Clicking "+ Use" pre-fills the inline form with that session's details

// If sessions exist: show session list cards
// Each session card: colored left border | session name | term type chip | date range | edit/delete actions
```

---

#### Wizard Step 3: Calendar

```tsx
// Header: "School Calendar" + "2082–2083 Calendar Management" subtitle
// CTAs: "📋 Sessions" (secondary) + "✨ Generate Calendar" (primary green)

// Calendar Stats row (3 cards):
// [Academic Year | "2082–2083" + "0 of 0 days elapsed"]
// [Instructional Days | count (blue) | "X completed · Y remaining"]
// [Holidays | count (amber) | "No holidays scheduled" if 0]

// Generate Calendar Panel:
// Title: "✨ Generate Calendar"
// Sub: "Auto-generate instructional and non-instructional days..."
//
// Locale info chip (derived from tenant settings):
//   "🌏 Detected locale: Nepal (NP) · Bikram Sambat calendar"
//   OR "🌐 Locale: United States (US) · Gregorian calendar"
//
// Form fields:
// - Country / Locale (select — default from tenant regional.defaultLocale)
// - Weekends (select — default derived from useTenantSettings():
//     Nepal → "Saturday only (Nepal default)" selected
//     International → "Saturday & Sunday" selected
//   Options: "Saturday only", "Saturday & Sunday", "Friday & Saturday", "Sunday only"
//
// - School Days picker (7 day buttons — defaults from deriveSchoolDays())
//   Hint: "Sun–Fri instructional · Sat non-instructional weekend"  (if Nepal)
//   Hint: "Mon–Fri instructional · Sat–Sun non-instructional"       (if international)
//
// Preview text block (dynamically generated from form state):
// "Will generate dates from [start] to [end]
//  ✔ [active days] → Instructional days
//  ✔ [weekend days] → Non-instructional (weekend)
//  ✔ National holidays from [locale] public holiday calendar will be imported
//  ⚠ Existing dates for this year will be replaced"
//
// Buttons: Cancel (ghost) | ✨ Generate Calendar (primary green)
//
// BUSINESS LOGIC GUARD: Generate Calendar button must be disabled if:
//   - No academic year exists
//   - No session exists for the year (warn with info banner, do not hard-block)

// Day type legend chips (below generate panel):
// Instructional (green) · Holiday (red) · Teacher Only (amber) · Break · Non-Instructional · 
// Student Holiday · Early Release (blue) · Late Start · Make-up Day · Weather Day · 
// Testing Day · Conference · Graduation · In-Service
```

---

#### Wizard Step 4: Bell Schedule

```tsx
// Header: "Bell Schedule" title + subtitle
// CTAs: "Use Template" (secondary) | "+ New Schedule" (primary green)

// How it works collapsible explainer (collapsed by default after first visit):
// 3 cards: 1) Create a schedule  2) Add periods to it  3) Assign to calendar

// Template Picker section:
// *** NEPAL STANDARD TEMPLATE MUST BE FIRST AND HIGHLIGHTED ***
// Template cards (in order):
//   1. "Nepal Standard (Sun–Fri)"  — 7 periods · 10:00 AM – 4:00 PM · Assembly, lunch, recess
//      → PRIMARY green "Apply" button (this is the locale-correct default)
//   2. "Elementary Schedule (US)" — 9 periods · 8:00 AM – 2:00 PM · Homeroom, recess, lunch
//      → ghost "Apply" button
//   3. "High School Schedule (US)" — 9 periods · 7:30 AM – 3:05 PM · Advisory, lunch
//      → ghost "Apply" button
//
// Show Nepal Standard first if isNepalLocale, otherwise show all 3 equally

// If no schedules exist: purposeful empty state + "Create First Schedule" button
// If schedules exist: schedule list with period breakdown

// Bell Schedule display card:
// Header: schedule name + day type chip + default badge (if default)
// Period list:
//   [colored dot] [period name] [time range] [type chip: academic/lunch/break/homeroom]
// Footer: Edit | Add Period | Delete actions
```

---

### 3.7 — TAB: Structure (Departments + Rooms)

```tsx
// Layout: 2-column CSS grid (1fr 1fr) — departments on left, rooms on right
// Each column has its own header row with CTA button

// DEPARTMENTS COLUMN:
// Warning banner (amber): "Known issue: Organization-level departments are not creating 
//   correctly — only school-level departments work. A detailed code review is in progress."
//   → This banner must be visible to help admin users understand the bug. Do NOT hide it.

// Department list (from API):
// Each row: dept name | scope chip (school=blue / org=purple) | member count | edit/delete

// Scope filter (select dropdown): All Scopes | School Only | Organization
// Search input

// Empty state: icon + "No departments found" + "Create your first department..." + "Create Department" button

// Scope explainer card (below list):
// "School-level departments belong to this school only.
//  Organization-level departments are shared across all schools in your organization."

// ROOMS COLUMN:
// Rooms list (from API)
// Each room card: room number (large) | room name | type chip | capacity | active/inactive status
// Empty state: icon + "No rooms configured" + CTA

// Room type chips: Classroom (blue) | Lab (teal) | Hall (amber) | Gym (green) | Office (muted)

// Room fields hint card (below list):
// "Room fields: Number, name, type, capacity, building/floor, active status"
```

---

### 3.8 — TAB: Audit Log

```tsx
// Header: "Audit Log" title + filter controls (right)
// Filter: Action type select (All Actions | Create | Update | Delete | Status Change | Version Change)
// Export CSV button (far right — follows Global Rule #1)

// Audit entry row:
// [action icon square] [action label + detail text] [actor name + timestamp right-aligned]
// Action icon colors: Create=green | Update=blue | Delete=red | Status Change=amber

// Empty state: shield icon + "No audit entries yet" + description
// Entry count label: "X entries"
```

---

## STEP 4 — SAFE CLEANUP OF OUTDATED CODE

After implementing all V2 components, perform the cleanup. **Follow this process exactly to avoid breaking other parts of the app.**

### 4A — Pre-Deletion Checklist (run for every file before deleting)

For each file marked `DELETE` in your audit:

```bash
# 1. Check if anything imports this file
grep -r "from.*<filename>\|require.*<filename>" apps/ packages/ --include="*.tsx" --include="*.ts"

# 2. Check if it's re-exported from a barrel (index.ts)
grep -r "<ComponentName>" apps/settings/src/index.ts apps/settings/src/components/index.ts 2>/dev/null

# 3. Check if it's used in any test files
grep -r "<ComponentName>" apps/settings/src/__tests__/ 2>/dev/null
```

**Only delete if all 3 checks return no results.**

### 4B — Components to Delete (confirmed dead after V2)

Delete ONLY after confirming with the checklist above:

```
❌ DELETE if exclusive to removed Configuration sections:
   - EnabledFeaturesSection.tsx (or equivalent) — all 8 feature toggles
   - NotificationsSection.tsx — notification settings UI
   - AttendanceSettingsSection.tsx — attendance settings UI
   - AcademicSettingsSection.tsx — grading scale, term structure in config tab

❌ DELETE if replaced by V2 Academic Setup wizard:
   - AcademicYearsTab.tsx — replaced by wizard step
   - CalendarTab.tsx — replaced by wizard step
   - BellScheduleTab.tsx — replaced by wizard step
   - Any "GenerateCalendarModal.tsx" if replaced by inline panel
   - Any "AcademicSessionsPanel.tsx" / "AcademicSessionsSidebar.tsx" if replaced by wizard step
   - Any "StartFromTemplateModal.tsx" if replaced by inline template picker
   - Any "NewBellScheduleDrawer.tsx" / "NewSchedulePanel.tsx" if replaced by inline form
   - Any "NewSessionDrawer.tsx" if replaced by inline form

❌ DELETE if replaced by V2 Structure tab:
   - DepartmentsTab.tsx — replaced by Structure tab left column
   - RoomsTab.tsx — replaced by Structure tab right column

❌ DELETE if replaced by V2 Audit Log tab:
   - AuditLogTab.tsx — replaced only if the V2 version is a full rewrite
```

### 4C — Code to COMMENT OUT (not delete) — Missing backend features

```tsx
// COMMENT OUT (not delete) — backend not yet built:
// - Any "SMS Notifications" toggle
// - Any "Parent Portal" or "Student Portal" toggle
// - Any attendance policy configuration that calls a missing API endpoint
// - Any grading scale configuration that calls a missing API endpoint

// Add comment: // TODO: MVP-EXCLUDED — Not built in V1 backend. Re-enable in V2.
```

### 4D — After Deleting, Clean Up

```bash
# Remove orphaned imports
# Search for any remaining imports of deleted components
grep -r "EnabledFeatures\|NotificationsSection\|AttendanceSettings\|AcademicSettings" apps/settings/src/ --include="*.tsx" --include="*.ts"

# Remove from barrel exports if present
# Check apps/settings/src/components/index.ts and apps/settings/src/index.ts
```

---

## STEP 5 — VALIDATION

Run this checklist before declaring the sprint complete. Fix every item that fails.

### 5A — Build Validation
```bash
cd apps/settings
npx tsc --noEmit          # zero TypeScript errors
npm run build             # clean production build
```

### 5B — Visual Checklist

Open `http://localhost:3000/settings/organization/schools/{schoolId}` and verify:

**Tab Routing:**
- [ ] Default URL (no `?tab=`) → Configuration tab active
- [ ] `?tab=config` → Configuration tab active
- [ ] `?tab=academic-setup` → Academic Setup tab active
- [ ] `?tab=structure` → Structure tab active
- [ ] `?tab=audit-log` → Audit Log tab active
- [ ] Browser back/forward → tab changes correctly
- [ ] Page refresh on `?tab=academic-setup` → Academic Setup tab loads (not flicker to config)

**Tab Bar:**
- [ ] Settings module accent (#378ADD blue) on active tab
- [ ] Amber badge shows on Academic Setup when pending tasks > 0
- [ ] Badge disappears when all academic setup tasks are complete

**Setup Banner:**
- [ ] Shows when school status is NOT active
- [ ] Does NOT show when school status is active
- [ ] Progress bar width reflects actual completion %
- [ ] Each step chip is clickable and navigates to correct tab
- [ ] Completed steps show green chip variant
- [ ] Pending steps show muted chip variant

**Configuration Tab:**
- [ ] NO Enabled Features toggles present
- [ ] NO Notifications section present
- [ ] NO Attendance Settings section present
- [ ] NO Grading Scale / Academic Settings section present
- [ ] Per-section save buttons present (NOT global floating save)
- [ ] School days picker defaults correctly based on tenant regional settings:
      Nepal tenant (bikram_sambat) → Sun–Fri active, Saturday inactive
      International tenant → Mon–Fri active, Sat+Sun inactive
- [ ] Inherit from Workspace info banner present at bottom

**Academic Setup Tab:**
- [ ] 4-step wizard nav renders on left
- [ ] Correct step is highlighted based on completion state
- [ ] Academic Years: BS date shown as primary if bikram_sambat, AD as secondary
- [ ] Sessions: Nepal semester suggestions shown when isNepalLocale AND sessions empty
- [ ] Calendar Generate panel: 
      "Saturday only (Nepal default)" pre-selected for Nepal tenant
      "Saturday & Sunday" pre-selected for international tenant
- [ ] School days in calendar generator match tenant locale defaults
- [ ] Bell Schedule: "Nepal Standard (Sun–Fri)" template listed FIRST for Nepal tenant

**Structure Tab:**
- [ ] 2-column layout (Departments left, Rooms right)
- [ ] Department scope bug warning banner visible (amber)
- [ ] Scope filter dropdown works
- [ ] Empty states are correct (no marketing cards)

**Audit Log Tab:**
- [ ] Action type filter works
- [ ] Empty state correct
- [ ] Export CSV button is far right

### 5C — Deleted Code Verification
```bash
# Confirm no imports of deleted components remain
grep -r "EnabledFeaturesSection\|NotificationsSection\|AttendanceSettings\|AcademicSettings" apps/settings/src/ --include="*.tsx" --include="*.ts"
# Expected: no results

# Confirm no TypeScript errors from deletions
npx tsc --noEmit
# Expected: 0 errors
```

### 5D — Tenant Regional Settings Verification

Test with the live tenant settings API. In DevTools Network tab:
- [ ] `GET /api/tenants/{tenantId}/settings` is called on school details page load
- [ ] Response is not cached from a stale previous session
- [ ] Weekend config in Calendar generator matches the API response:
      `defaultWeekStartsOn: "sunday"` → Saturday-only weekend selected in UI
      `defaultCalendarSystem: "bikram_sambat"` → Nepal locale chip shown

---

## STEP 6 — SPRINT DOCUMENTATION

After all validation passes, write the sprint document to `docs/school-details-v2-sprint.md`.

The document must include:

```markdown
# School Details V2 Sprint
## Date: {date}
## Status: COMPLETE

## Summary
[2-3 sentence summary of what was built]

## Tab Architecture
| New Tab | Old Tabs Merged | Route Param |
|---------|----------------|-------------|
| Configuration | Configuration (stripped) | ?tab=config |
| Academic Setup | Academic Years + Calendar + Bell Schedule | ?tab=academic-setup |
| Structure | Departments + Rooms | ?tab=structure |
| Audit Log | Audit Log | ?tab=audit-log |

## Files Created
[List of all new files with one-line description each]

## Files Modified  
[List of all modified files with what changed]

## Files Deleted
[List of all deleted files with reason for deletion]

## Files Commented Out (MVP-Excluded)
[List of any commented-out code with reason]

## Tenant Regional Settings Integration
[Describe how useTenantSettings() is used and what it drives]

## Nepal Locale Business Logic
[Describe the weekend derivation logic and where it's applied]

## Known Remaining Issues
[Any bugs found but not fixed in this sprint — with ticket-level descriptions]

## Department Scope Bug — Status
[Document current status of the organization-level department bug:
 - Root cause identified? Yes/No
 - Fixed in this sprint? Yes/No
 - If not fixed: what was found and what remains]

## Validation Results
[Paste the 5B checklist with all items marked pass/fail]
```

---

## CONSTRAINTS — NON-NEGOTIABLE

These constraints override any implementation instinct. Do not rationalize past them.

1. **FRONTEND ONLY** — Zero changes to `server/`. If you find yourself editing anything in `server/`, `infrastructure/`, or any `.stack.ts` CDK file — STOP. You are in the wrong place.

2. **DO NOT REBUILD TANSTACK TABLE** — The existing TanStack Table instances are sacred. If a table needs new columns or cell renderers, modify column definitions only. Never replace the table library.

3. **DO NOT TOUCH DICEBEAR LOGIC** — Any avatar generation using DiceBear must not be modified. URL generation, seed logic, style selection — all untouched.

4. **DO NOT MODIFY MODULE FEDERATION CONFIG** — `webpack.config.js`, `module-federation.config.ts`, or any Module Federation setup file is off-limits.

5. **DO NOT MODIFY REACT ROUTER CONFIG** — Do not add new top-level routes. The school details page already has a route. You are only adding `?tab=` query param behavior to an existing route.

6. **DO NOT MODIFY EXISTING ZUSTAND STORES** — You may add new slices or new fields to stores if absolutely necessary, but never rename, delete, or restructure existing store keys. Any breaking change to Zustand store shape will break other modules.

7. **REUSE EXISTING HOOKS** — If `useSchool`, `useAcademicYears`, `useCalendar`, `useBellSchedules`, or `useDepartments` hooks already exist, extend them rather than creating parallel duplicates. Check `apps/settings/src/hooks/` and `apps/academics/src/hooks/` before creating anything new.

8. **PER-SECTION SAVE ONLY** — No global floating save button anywhere on this page. Every section has its own Save button (Global Rule #13).

9. **NO KPI TILES** — This is a Settings page. No StatCard / KPI tiles anywhere. Section-card pattern only (Global Rule #12).

10. **PRIMARY BUTTONS ARE ALWAYS GREEN #1D9E75** — Never amber, never blue, never purple for primary CTAs (Global Rule #3).

11. **EMPTY STATES: NO MARKETING CARDS** — Every empty state must be: icon + heading + actionable description + action button. No "coming soon" cards, no feature marketing language (Global Rule #8).

12. **BOTH THEMES MUST WORK** — All V2 components must render correctly in both dark and light theme. Use CSS variables exclusively — no hardcoded hex colors in component styles (Global Rule #9).

13. **SECTIONERRORBOUNDARY ON ALL DATA SECTIONS** — Wrap each major data section (academic years list, sessions list, departments list, rooms list, audit log) in `SectionErrorBoundary` from `@edforge/ui`.

14. **SAFE DELETION ONLY** — Never delete a file without running the 3-step pre-deletion checklist in Step 4A. If in doubt, comment out rather than delete.

---

## REFERENCE FILES (attach these when executing)

The following files must be available to the agent at execution time:

| File | Purpose |
|------|---------|
| `edforge_school_details_v2.html` | **Authoritative visual spec** — match this exactly |
| Screenshots 1–12 (provided) | Current state reference — shows what exists today |
| `EdForge_V2_Design_System___Master_Context_Document` | Design tokens, component specs, 15 global rules |
| `edforge_payments_v2.html` | V2 reference for how a complete V2 page looks |

---

## EXPECTED DELIVERABLES

At sprint completion, the following must exist:

- [ ] `apps/settings/src/pages/SchoolDetails/` — V2 page with 4-tab architecture
- [ ] `apps/settings/src/pages/SchoolDetails/tabs/ConfigurationTab.tsx`
- [ ] `apps/settings/src/pages/SchoolDetails/tabs/AcademicSetupTab.tsx`
- [ ] `apps/settings/src/pages/SchoolDetails/tabs/StructureTab.tsx`
- [ ] `apps/settings/src/pages/SchoolDetails/tabs/AuditLogTab.tsx`
- [ ] `apps/settings/src/hooks/useTenantSettings.ts` — (if not already existing)
- [ ] `apps/settings/src/utils/localeDefaults.ts` — weekend/school day derivation logic
- [ ] `docs/school-details-v2-audit.md` — Step 1 audit findings
- [ ] `docs/school-details-v2-sprint.md` — Step 6 sprint documentation
- [ ] Zero TypeScript compilation errors
- [ ] Zero deleted component imports remaining in codebase
