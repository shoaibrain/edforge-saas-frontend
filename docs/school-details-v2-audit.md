# School Details V2 — Deep Codebase Audit

## Date: 2026-03-27

---

## 1A — School Details Page Structure

### Main Page Component
- **File:** `apps/shell/src/pages/settings/school-detail.tsx`
- **Lines:** ~560
- **Route:** `/organization/schools/$schoolId` (defined in `apps/shell/src/router.tsx`, lines 545-549)

### Tab Components (Current 7-Tab Layout)

| Tab | File Path | Lines (approx) |
|-----|-----------|-----------------|
| Configuration | `apps/shell/src/pages/settings/school-configuration.tsx` | 700+ |
| Departments | `apps/shell/src/pages/settings/school-departments.tsx` | 400+ |
| Academic Years | `apps/shell/src/pages/settings/school-academic-years.tsx` | 600+ |
| Calendar | `apps/shell/src/pages/settings/school-calendar.tsx` | 700+ |
| Bell Schedule | `apps/shell/src/pages/settings/school-bell-schedule.tsx` | 600+ |
| Rooms | `apps/shell/src/pages/settings/school-rooms.tsx` | 400+ |
| Audit Log | `apps/shell/src/components/settings/AuditLogViewer.tsx` | 200+ |

### Barrel Export
- `apps/shell/src/pages/settings/index.ts` — barrel exports for all page components

### Query Hooks for School Data
- `useQuery(['school', schoolId])` → `tenantService.getSchool(schoolId)` (school-detail.tsx:257-265)
- `useQuery(['schoolConfiguration', schoolId])` → `tenantService.getSchoolConfiguration(schoolId)` (school-configuration.tsx:148-153)
- `useMutation` → `tenantService.deleteSchool()` (school-detail.tsx:268-281)
- `useMutation` → `tenantService.transitionSchoolStatus()` (school-detail.tsx:284-299)
- `useMutation` → `tenantService.updateSchool()` (school-configuration.tsx:268-274)
- `useMutation` → `tenantService.updateSchoolConfiguration()` (school-configuration.tsx:276-281)

### Zustand Store Slices (School State)
- **File:** `apps/shell/src/stores/app.store.ts`
- `activeSchoolId: string | null` (line 12)
- `activeSchoolStatus: string | null` (line 13)
- `isSchoolTransitioning: boolean` (line 16)
- Actions: `setActiveSchoolId`, `setActiveSchoolStatus`, `setSchoolTransitioning`
- Selector hooks: `useActiveSchoolId()`, `useActiveSchoolStatus()`, `useIsSchoolTransitioning()`
- Persistence: cookie-based (`edforge-app`), 24h max age

---

## 1B — Tab Component Audit

| Tab | File Path | API Calls | State Management | Issues |
|-----|-----------|-----------|------------------|--------|
| Configuration | `school-configuration.tsx` | `getSchool`, `getSchoolConfiguration`, `updateSchool`, `updateSchoolConfiguration` | Local state (`formState`), dirty tracking | Global save button (violates per-section save rule); contains Enabled Features, Notifications, Attendance, Grading sections that are OUT of MVP |
| Departments | `school-departments.tsx` | `getDepartments`, `createDepartment`, `deleteDepartment` | React Query + local form state | No scope field in creation payload — org-level creation broken |
| Academic Years | `school-academic-years.tsx` | `getAcademicYears`, `createAcademicYear`, `updateAcademicYear`, `activateAcademicYear` | React Query + local modal state | BS date support exists but may need dual display |
| Calendar | `school-calendar.tsx` | `getCalendarDates`, `generateCalendar`, `updateCalendarDate` | React Query + `useCalendarStats()` | Weekend logic is partially configurable via `schoolDays` param but isWeekend() helper is hardcoded to Sat+Sun |
| Bell Schedule | `school-bell-schedule.tsx` | `getBellSchedules`, `createBellSchedule`, `deleteBellSchedule`, `setDefaultBellSchedule` + class period CRUD | React Query + local state | Only 2 US-centric presets (elementary, highSchool); no Nepal Standard template |
| Rooms | `school-rooms.tsx` | `useLocations()`, `useCreateLocation()`, `useUpdateLocation()`, `useDeleteLocation()` | Custom hooks from `useLocations.ts` | Clean implementation |
| Audit Log | `AuditLogViewer.tsx` | `useQuery(['auditLog', schoolId, actionFilter])` | React Query + filter state | Minimal implementation, needs V2 styling |

---

## 1C — Calendar Generation Weekend Logic

**Frontend calendar service:** `apps/shell/src/services/calendar.service.ts` (lines 119-128)
- Calls: `POST /schools/${schoolId}/academic-years/${yearId}/generate-calendar`
- Sends `GenerateCalendarDto` with `schoolDays` array

**Server-side generation:** `server/application/microservices/identity/src/common/entities/calendar-date.entity.ts`
- `isWeekend()` helper (lines 160-165): **HARDCODED to Saturday (6) + Sunday (0)**
- `generateCalendarDatesForRange()` (lines 170-244): Uses `options.schoolDays` if provided, defaults to `['monday','tuesday','wednesday','thursday','friday']`
- Weekend detection at line 213: `const weekend = !schoolDays.includes(dayOfWeek)` — this IS configurable if `schoolDays` is passed

**Country-specific school days:** `country-config.ts` (lines 162-221)
- Nepal: `[0,1,2,3,4,5]` (Sun-Fri, Saturday weekend)
- USA: `[1,2,3,4,5]` (Mon-Fri, Sat+Sun weekend)

**Conclusion:** The `isWeekend()` helper is hardcoded, but calendar generation itself uses `schoolDays` param correctly. The frontend just needs to pass the correct school days derived from tenant regional settings.

---

## 1D — Bell Schedule Templates

**File:** `apps/shell/src/pages/settings/school-bell-schedule.tsx` (lines 115-139)

**Hardcoded PRESETS:**
1. `elementary` — 9 periods, 8:00 AM – 2:00 PM (Homeroom, 6 academic, Recess, Lunch)
2. `highSchool` — 9 periods, 7:30 AM – 3:05 PM (7 academic, Advisory, Lunch)

**No Nepal Standard template exists.** Must be added:
- Nepal Standard (Sun-Fri): 7 periods, 10:00 AM – 4:00 PM, Assembly + Lunch + Recess

**Templates are applied via `applyPreset()` function** (line 572-605) which POSTs to `/schools/{schoolId}/bell-schedules`.

---

## 1E — Tenant Settings Hook

### useTenantSettings — DOES NOT EXIST

**How tenant settings are currently accessed:**
1. **React Context:** `useShell()` and `useWorkspaceSettings()` from `apps/shell/src/lib/shell-context.tsx`
2. **ShellProvider** (line 182-188) fetches workspace settings:
   ```typescript
   useQuery({
     queryKey: ['workspaceSettings', user?.tenantId],
     queryFn: () => tenantService.getWorkspaceSettings(user!.tenantId),
     enabled: isAuthenticated && !!user?.tenantId,
     staleTime: 5 * 60 * 1000,
   })
   ```
3. **Endpoint:** `GET /tenants/{tenantId}/workspace-settings` (NOT `/settings`)

### ShellContextValue exposes:
- `workspaceSettings: WorkspaceSettings['regional'] | null` — regional settings from tenant
- `resolvedSettings: ResolvedSettings` — merged precedence chain (tenant → school)

### RegionalSettings interface (from workspace-settings.entity.ts):
```typescript
interface RegionalSettings {
  defaultTimezone: string;
  defaultLocale: string;
  defaultDateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  defaultTimeFormat: '12h' | '24h';
  defaultWeekStartsOn: 'sunday' | 'monday';
  defaultCurrency: string;
  defaultCalendarSystem: 'gregorian' | 'bikram_sambat';
  enableDualDateDisplay: boolean;
  defaultNumberFormat: 'south_asian' | 'international';
}
```

### Nepal defaults (hardcoded in workspace-settings.entity.ts lines 63-95):
- `defaultCalendarSystem: 'bikram_sambat'`
- `defaultWeekStartsOn: 'sunday'`
- `defaultCurrency: 'NPR'`
- `enableDualDateDisplay: true`

**Decision:** Instead of creating a new `useTenantSettings` hook that duplicates the API call, we should create a `useLocaleDefaults()` hook that derives weekend/school day logic FROM the existing `useShell().workspaceSettings` context value. This avoids duplicate fetching.

---

## 1F — URL/Tab Routing

**Current state:** Tabs use **local React state** — NOT URL params.

- `school-detail.tsx` line 241: `const [activeTab, setActiveTab] = useState<SchoolTab>('configuration')`
- Tab click handler (line 475): `setActiveTab(tab.id)` — state-only mutation
- No `useSearchParams` usage anywhere on this page
- **Browser refresh → always resets to Configuration tab**
- **No deep-linking support**
- **No browser back/forward tab navigation**

**Required:** Must migrate to `useSearchParams` for `?tab=` query param.

**Note:** The router uses `@tanstack/react-router` (NOT react-router-dom). Need to use TanStack Router's `useSearch` or route-level `validateSearch` for query params, NOT `useSearchParams` from react-router-dom.

---

## 1G — Outdated/Dead Code Analysis

| Component / Section | File | Current Status | Action |
|---------------------|------|----------------|--------|
| **NotificationsPage** | `pages/settings/notifications.tsx` | MVP-PARKED, commented out in router, redirects to /preferences | DELETE |
| **GradingScaleEditor** | `components/settings/GradingScaleEditor.tsx` | SUPERSEDED — grading now in Grades module. Only type import remains | REFACTOR (move type, delete component) |
| **FeatureToggles** | `components/settings/FeatureToggles.tsx` | ACTIVE — used in school-configuration.tsx line 43 | DELETE after V2 (out of MVP scope) |
| **Enabled Features section** | Inline in `school-configuration.tsx` lines 635-638 | OUT OF MVP | REMOVE from V2 Configuration tab |
| **Notifications section** | Inline in `school-configuration.tsx` lines 642-672 | OUT OF MVP | REMOVE from V2 Configuration tab |
| **Attendance Settings section** | Inline in `school-configuration.tsx` lines 674-686 | OUT OF MVP | REMOVE from V2 Configuration tab |
| **Academic Settings section** | Inline in `school-configuration.tsx` lines 612-625 | SUPERSEDED — now links to Grades module | REMOVE from V2 Configuration tab |
| **"How bell schedules work" section** | Inline in `school-bell-schedule.tsx` lines 773-851 | ACTIVE — collapsible help | KEEP — embed in V2 wizard step 4 |

### Components that will become obsolete after 7→4 tab consolidation:
- The individual tab imports in `school-detail.tsx` (lines 45-51) will change
- The 7-item `TABS` constant (lines 104-112) will be replaced with 4 items
- Individual tab files may be refactored but NOT deleted — their logic will be recomposed into the 4 new tab components

---

## 1H — Department Scope Bug

**Frontend form:** `school-departments.tsx` lines 65-72

**Payload sent:**
```typescript
{ name, code, description }
```

**No `scope` field is included in the payload.** The `CreateDepartmentDto` schema (from `department.schema.ts` lines 16-21) only has: `code`, `name`, `description`, `headUserId`.

**API endpoint:** `POST /schools/{schoolId}/departments`

**Root cause hypothesis:** The backend infers scope from the URL context (`/schools/{schoolId}/departments`). To create organization-level departments, a different endpoint may be needed (e.g., `POST /organizations/{orgId}/departments` or a `scope` field in the DTO). The backend likely doesn't have this alternate path or DTO field.

**Status:** Root cause is in the backend — **cannot fix in this frontend-only sprint**. Must show warning banner to users.

---

## 1I — Academic Sessions UI

**File:** `apps/shell/src/pages/settings/school-academic-years.tsx`

**Current implementation:**
- Sessions/terms are shown as part of the Academic Years tab, within each year card
- Timeline visualization (lines 110-187) shows years with status badges
- Create Academic Year modal (lines 202-266) includes term structure selection (semester/trimester/quarter)
- BS date support: auto-converts AD→BS dates on creation (lines 259-264)

**Session management hooks:** `apps/shell/src/hooks/useCalendar.ts` contains:
- `useAcademicSessions(schoolId, yearId)` — fetches sessions for a year
- `useCreateAcademicSession()` — creates a session
- `useUpdateAcademicSession()` — updates a session
- `useDeleteAcademicSession()` — deletes a session

**Current UX gap:** Sessions are not prominently surfaced — they're nested within the Academic Years tab. The V2 wizard gives sessions their own dedicated step (Step 2), which is a significant UX improvement.

---

## Summary of Key Findings

1. **No useTenantSettings hook** — workspace settings already available via `useShell().workspaceSettings`; need a derived `useLocaleDefaults()` utility
2. **Tab routing is state-only** — must migrate to URL query params (TanStack Router `useSearch`)
3. **Weekend logic partially configurable** — `schoolDays` param works in calendar generation but nothing derives it from tenant settings
4. **No Nepal bell schedule template** — only US presets exist
5. **Department scope bug is backend** — cannot fix, must show warning
6. **Configuration tab has 4 sections to remove** (Features, Notifications, Attendance, Academic/Grading)
7. **Global save button** in current Configuration tab violates per-section save rule
8. **TanStack Router** is used (not react-router-dom) — search params approach must match
