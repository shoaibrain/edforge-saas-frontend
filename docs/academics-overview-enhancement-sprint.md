# Academics Module Overview — Enhancement Sprint Plan

## Context

The Finance Module Overview page has been enhanced to enterprise-grade quality with contextual insight strip, quick-select filters, unified BillingHealthCard (donut + aging spectrum + payment methods), compact CollectionPerformanceCard, and proper action buttons. The Academics Overview page needs matching enhancements to achieve parity across the edforge platform.

**Issues identified from live screenshots:**
1. KPI cards squeezed vertically — `space-y-3` (12px) vs Finance's `space-y-5` (20px)
2. No filters, no export functionality
3. No "Enroll Student" action button in header
4. At-risk student DiceBear avatars render at ~100px instead of 30px — broken sizing
5. No Academics health dashboard card (equivalent to BillingHealthCard)
6. EnrollmentSnapshotCard is redundant — 6 of 7 data points shown elsewhere on page

---

## Sprint 1: Header Parity, Avatar Fix & Spacing

**Goal:** Header matches Finance with action buttons, insight strip, proper spacing, and correctly sized avatars.

---

### Ticket 1.1 — Add Action Buttons to Header & Fix Spacing

**Files:**
- `apps/academics/src/routes/overview.tsx` (lines 128-172, 134)

**Changes:**
1. Import `useNavigate` from `@tanstack/react-router` and `UserPlus` from `lucide-react`
2. Add two action buttons to header right side (matching Finance pattern):
   - "Enroll Student" — outline style, `UserPlus` icon, navigates to `/students/enrollment`
   - "Take Attendance" — primary brand style, `ClipboardCheck` icon (already imported), navigates to `/classrooms?tab=attendance`
3. Move academic year badge from right side into left group after the date separator (preserve conditional render: `data.academicYear.name &&`)
4. Change outer container from `space-y-3` to `space-y-5` (matches Finance's 20px spacing)

**Verify:** Header is 44px, buttons render correctly with Finance-matching styles (11px font, 7px border-radius, gap-1.5), navigation works, spacing is consistent across all sections.

---

### Ticket 1.2 — Add Contextual Insight Strip

**Files:**
- `apps/academics/src/routes/overview.tsx` (add inline component, render below header)

**Changes:**
1. Create inline `AcademicsInsightStrip` component (same pattern as Finance's inline `InsightStrip`)
2. Text parts joined by ` · `:
   - `"22 students enrolled across 11 grades"`
   - `"50% attendance today"` (or `"no attendance data"`)
   - `"15 at-risk students"` (or `"no at-risk students"`)
3. Style: `text-[11px] leading-relaxed`, `color: var(--v2-text-hint)`
4. Skeleton: `h-5 rounded-lg v2-skeleton-pulse` at 60% width
5. Return `null` when `totalEnrolled === 0`
6. Wrap header + insight strip in a `space-y-1` div (matching Finance)

**Verify:** Strip renders with correct data, skeleton shows during loading, null when no data.

---

### Ticket 1.3 — Fix At-Risk Student & Staff Avatar Sizing

**Files:**
- `apps/academics/src/lib/avatar.ts` (getStudentAvatar, getStaffAvatar)
- `apps/academics/src/components/overview-v2/AtRiskStudentsCard.tsx` (StudentAvatar, lines 60-86)
- `apps/academics/src/components/overview-v2/StaffRosterCard.tsx` (StaffAvatar)

**Changes:**
1. In `avatar.ts`: Change default size in `getStudentAvatar` and `getStaffAvatar` to `size: 64` (2x for Retina at 30-32px rendered size)
2. In `AtRiskStudentsCard.tsx` `StudentAvatar`: Add explicit HTML attributes `width={30} height={30}` on the `<img>` element, add `style={{ maxWidth: 30, maxHeight: 30 }}` as CSS fallback, remove `object-cover` (not meaningful for SVGs)
3. In `StaffRosterCard.tsx` `StaffAvatar`: Same fix — add `width={32} height={32}` and `maxWidth/maxHeight: 32` style

**Verify:** Student avatars render at exactly 30x30px, staff avatars at 32x32px, initials fallback still works, DiceBear URLs request `size=64`.

---

## Sprint 2: Filter Row & Export

**Goal:** Fully functional filter row with academic-context-appropriate filters and CSV export.

---

### Ticket 2.1 — Create AcademicsFilterRow Component

**Files to create:**
- `apps/academics/src/components/overview-v2/AcademicsFilterRow.tsx`

**Files to modify:**
- `apps/academics/src/hooks/useAcademicsOverviewV2.ts` (add filter state, export handler)
- `apps/academics/src/routes/overview.tsx` (integrate FilterRow)

**Design — Adapted from Finance, not cloned:**

Quick-select pills use academics-appropriate labels:
- `Last 7 days` | `Last 30 days` | `This semester` | `This year`
- These scope the attendance trend chart date range

Additional filters:
- Date range inputs (From / To) — scopes attendance data
- Academic year dropdown — switches the academic year for all queries (already available as `data.academicYear`)
- Grade level dropdown — filters at-risk students and enrollment chart. Options: "All Grades" + grades from `enrollment.data`
- Clear button when any filter active

Export button:
- Uses `getEnrollmentExportUrl(schoolId, academicYearId)` from `academics.service.ts`
- Triggers `window.open(url, '_blank')` for download
- **Disabled** when `academicYear.id` is undefined/loading, with reduced opacity

Props interface:
```typescript
interface AcademicsFilterRowProps {
  fromDate: string
  toDate: string
  academicYear: string
  academicYears: Array<{ id: string; name: string }>
  gradeLevelFilter: string
  gradeLevels: string[]
  hasActiveFilters: boolean
  isExporting: boolean
  onFromChange: (v: string) => void
  onToChange: (v: string) => void
  onAcademicYearChange: (v: string) => void
  onGradeLevelChange: (v: string) => void
  onClear: () => void
  onExport: () => void
}
```

Hook extension in `useAcademicsOverviewV2.ts`:
- Add `useState` for fromDate, toDate, gradeLevelFilter
- Wire fromDate/toDate into `useAttendanceTrendData` date range (replace default 30-day window when set)
- Wire gradeLevelFilter into at-risk student filtering (client-side filter on `students` array)
- Export handler with `getEnrollmentExportUrl`
- Return all filter state + setters + clearFilters + hasActiveFilters

**Verify:** Pills toggle correctly, date inputs update state, academic year dropdown populates, grade filter works, Export CSV downloads file (or shows error toast), disabled when no academic year. Styling matches Finance FilterRow exactly.

---

## Sprint 3: Academics Health Dashboard Card

**Goal:** Enterprise-grade health card showing enrollment status distribution and attendance health, analogous to Finance's BillingHealthCard.

---

### Ticket 3.1 — Create AcademicsHealthCard Component

**Files to create:**
- `apps/academics/src/components/overview-v2/AcademicsHealthCard.tsx`

**Files to modify:**
- `apps/academics/src/hooks/useAcademicsOverviewV2.ts` (surface enrollmentByStatus data)
- `apps/academics/src/routes/overview.tsx` (add card to layout, remove EnrollmentSnapshotCard)

**Design — Two sections (not three, per review feedback):**

**Section 1: Enrollment Status Donut**
- Recharts `PieChart` + `Pie` + `Cell` (same pattern as BillingHealthCard)
- Data: `enrollment.byStatus` → `{ enrolled: 22, pending: 0, withdrawn: 0, graduated: 0, transferred: 0 }`
- Filter out zero-count statuses
- Color scheme:
  ```
  enrolled: '#1D9E75'     // green
  pending: '#EF9F27'      // amber
  withdrawn: '#E24B4A'    // red
  graduated: '#378ADD'    // blue
  transferred: '#7F77DD'  // purple
  ```
- Donut center: total count + "students"
- Legend on right: dot + status + percentage + count
- Custom tooltip matching BillingHealthCard's DonutTooltip

**Section 2: Attendance Health Overview**
- NOT a heatbar (per review: school-wide attendance rate is a single scalar, not a distribution)
- Instead: a **compact attendance gauge** showing:
  - Today's rate as a large colored number (green ≥95%, blue 90-95%, amber 80-90%, red <80%)
  - A 7-day mini sparkline using existing `trend.chartData` (reuse Recharts `AreaChart` with no axes, just the line — ~40px tall)
  - Below: "11 of 22 recorded · 0 absent · 0 late" from `todayAttendanceSummary`
  - Insight text: "15 students below 90% threshold over the past 30 days"

- Empty state: "No attendance data yet" with checkmark icon (matching BillingHealthCard empty state pattern)
- Skeleton states for both sections
- Wrap in `WidgetErrorBoundaryV2`

**Layout restructure in overview.tsx:**

Keep `AttendanceAlertsCard` full-width (matches Finance's full-width `OverdueAlertBanner`).

New layout:
```
Header + Insight Strip
FilterRow
AttendanceAlertsCard (full width — unchanged)
KPI Grid (4 tiles)
2-col: AcademicsHealthCard | AttendanceTrendChart
2-col: EnrollmentByGradeChart (full chart) | AtRiskStudentsCard
2-col: StaffRosterCard | (empty or future card)
```

Remove `EnrollmentSnapshotCard` — its unique data (withdrawals count) moves to the insight strip text.

**Verify:**
- Enrollment donut renders with correct status counts
- Zero-count statuses are filtered out
- Attendance gauge shows today's rate with correct color
- Mini sparkline renders from trend data
- Summary text shows recorded/absent/late counts
- Empty states render correctly
- Card matches BillingHealthCard styling (rounded-xl, padding 18, V2 tokens)
- `WidgetErrorBoundaryV2` wraps the card
- EnrollmentSnapshotCard is removed without breaking anything
- Type-check clean: `npx tsc --noEmit --project apps/academics/tsconfig.json`
- Build succeeds: `pnpm --filter @edforge/academics build`

---

## Dependency Graph

```
Sprint 1 (all independent, can parallelize):
  1.1 Header Buttons + Spacing
  1.2 Insight Strip
  1.3 Avatar Fix

Sprint 2 (depends on Sprint 1 complete):
  2.1 Filter Row + Export

Sprint 3 (depends on Sprint 2 complete):
  3.1 Academics Health Card + Layout Restructure
```

---

## Files Summary

| File | Sprint | Changes |
|------|--------|---------|
| `apps/academics/src/routes/overview.tsx` | 1, 2, 3 | Header buttons, insight strip, spacing, FilterRow integration, layout restructure |
| `apps/academics/src/hooks/useAcademicsOverviewV2.ts` | 2, 3 | Filter state, export handler, enrollmentByStatus surfacing |
| `apps/academics/src/lib/avatar.ts` | 1 | Default avatar size 128 → 64 |
| `apps/academics/src/components/overview-v2/AtRiskStudentsCard.tsx` | 1 | Avatar img width/height fix |
| `apps/academics/src/components/overview-v2/StaffRosterCard.tsx` | 1 | Avatar img width/height fix |
| `apps/academics/src/components/overview-v2/AcademicsFilterRow.tsx` | 2 | New component |
| `apps/academics/src/components/overview-v2/AcademicsHealthCard.tsx` | 3 | New component |
| `apps/academics/src/components/overview-v2/EnrollmentSnapshotCard.tsx` | 3 | Removed from layout (file kept) |

## Verification (End-to-End)

1. `npx tsc --noEmit --project apps/academics/tsconfig.json` — clean
2. `pnpm --filter @edforge/academics build` — successful
3. Visual check at `http://localhost:3000/academics/`:
   - Header has "Enroll Student" + "Take Attendance" buttons
   - Insight strip shows contextual summary
   - Filter row with pills, date range, academic year, grade level, export
   - AcademicsHealthCard with enrollment donut + attendance gauge
   - Avatars render at correct 30-32px size
   - Spacing is consistent (20px between sections)
   - All cards have loading skeletons and error boundaries
