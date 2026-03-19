# Students Enrollment V2 Sprint Plan

## Context

The Students list page V2 redesign is complete. This sprint applies V2 design language to three interfaces: the Enrollment page (`/academics/students/enrollment`), the multi-step Registration Wizard, and the Import Students modal. The goal is visual and UX consistency with the V2 Students list page while preserving all existing logic, API integrations, and form validation.

**Reference prototypes:**
- `edforge_enrollment_v2.html` — Enrollment page layout, stepper, form, sidebar
- `edforge_import_modal_v2.html` — Import modal with dropzone, column chips, template card

---

## Task 1: Enrollment Page — Tab Restructure & V2 Header

**File:** `apps/academics/src/routes/enrollment/index.tsx`

### 1a. Tab restructure
- Reverse tab order: `registration` (primary) → `dashboard` (secondary, renamed "Enrollment records")
- Add count badge to "Enrollment records" tab showing `summary?.totalEnrolled`
- Default tab logic: read `?tab=` from `window.location.search` at mount. `?tab=new` → `registration`; `?tab=records` → `dashboard`; no param → `registration` (default, since user navigated from "Enroll student" button). Use `useState` with initial value from URL — no route definition changes needed
- Tab styling: V2 tokens — active tab color `#1D9E75`, border-bottom `2px solid #1D9E75`, inactive `#5a6070`
- Tab count badge: active gets `rgba(29,158,117,0.12)` bg + `#1D9E75` text; inactive gets `rgba(255,255,255,0.06)` bg

### 1b. V2 header
- Wrap entire page in `<div data-v2>`
- Page icon: 32px square, `rgba(29,158,117,0.1)` bg, `border-radius: 8px`, UserPlus icon 16px in `#1D9E75`
- Title: "Enroll student" at `18px/600`, color `var(--v2-text-primary)`, letter-spacing `-0.3px`
- Right side: "Cancel enrollment" ghost button (transparent bg, `1px solid rgba(255,255,255,0.1)`, color `#7a8099`, navigates to `/students` with confirmation if form is dirty) + academic year dropdown (keep existing, restyle with V2 input tokens)

### 1c. Context banner
- Below header, above tabs: `text-[11px]` color `var(--v2-text-hint)`
- Content: "Registering a new student for {schoolName} · Academic year {yearName} · {totalEnrolled} students currently enrolled"
- Use existing `summary` and `activeYearObj` data — no new API calls

**Existing code to reuse:**
- `useResourcePermissions('enrollment')` for ABAC
- `useCurrentAcademicYear(schoolId)` / `useAcademicYears(schoolId)` for year data
- `useEnrollmentSummary(...)` for enrolled count
- Tab animation: keep existing Framer Motion `layoutId` pattern

---

## Task 2: Academic Year Progress Strip

**File:** `apps/academics/src/routes/enrollment/index.tsx` (inline in tab content area)

- Compact strip below tab bar, inside content area
- Style: `background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; padding: 12px 14px`
- Content: Calendar icon + year badge (`rgba(29,158,117,0.1)` bg, `#1D9E75` text, `border-radius: 6px`) + year label + progress bar (existing `YearProgressBar` logic) + right-aligned stats
- Stats: `{totalEnrolled} enrolled · {activeCount} active · {gradeLevelCount} grade levels`
- Data from existing `summary` and `activeYearObj` — no new API calls
- This replaces the current `EnrollmentDashboard` strip in the records tab view

---

## Task 3: Registration Wizard V2 Treatment

**File:** `apps/academics/src/components/students/registration/RegistrationWizard.tsx`

### 3a. Stepper V2
Replace `RegistrationStepper` with V2 prototype design:
- Container: `background: #161b27; border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 14px 20px`
- Step dot: 24px diameter, `font-size: 10px; font-weight: 600`
  - Completed: `bg: #1D9E75`, white checkmark SVG, color white
  - Active: `bg: rgba(29,158,117,0.2); border: 2px solid #1D9E75; color: #1D9E75`
  - Future: `bg: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: #3a4055`
- Connecting line: `height: 1px; bg: rgba(255,255,255,0.06)` → completed: `bg: #1D9E75`
- Step labels: `font-size: 9px; font-weight: 500; margin-top: 4px`
  - Completed: `color: #1D9E75`; Active: `color: #c8ccd8`; Future: `color: #3a4055`
- Remove existing golden/amber gradient styling from active step dot

### 3b. Form card wrapper
Replace current max-w-3xl plain layout with:
- Form card: `background: var(--v2-bg-surface); border: 1px solid var(--v2-border-default); border-radius: 12px; padding: 24px`
- Section title: `13px/600`, color `var(--v2-text-primary)`, letter-spacing `-0.2px`
- Section subtitle: `11px`, color `var(--v2-text-muted)`
- Field group labels: `10px/600 uppercase`, letter-spacing `0.6px`, color `var(--v2-text-ghost)`

### 3c. Continue button — amber → green
**Critical fix.** Two locations in `RegistrationFooter`:
1. Continue button (line ~330-338): Replace `brand-gradient-warm rounded-xl shadow-md shadow-golden-500/20` with `bg-[#1D9E75] rounded-[8px] hover:bg-[#178a66]` + white text
2. Create Student button (line ~316-328): Same change — replace `brand-gradient-warm` with `bg-[#1D9E75]`

### 3d. Back button V2
- Style: `background: transparent; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 8px 16px; font-size: 12px; color: #7a8099`
- Disabled: `opacity: 0.4; cursor: not-allowed`

### 3e. Form actions container
- Separator: `border-top: 1px solid rgba(255,255,255,0.05); margin-top: 20px; padding-top: 16px`
- Flex: space-between alignment

### 3f. Form input V2 styling
**CSS File:** `apps/shell/src/styles/home-v2-tokens.css` (add to existing `[data-v2]` scope)

This affects ALL step components. Rather than modifying each step file, add CSS descendant selectors scoped under `[data-v2]`:
- `input, select, textarea`: `background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 8px 11px; font-size: 12px; color: var(--v2-text-primary); outline: none`
- Focus: `border-color: rgba(29,158,117,0.5)`
- Placeholder: `color: var(--v2-text-ghost)`
- Date inputs: `color-scheme: dark`
- Required asterisk: `color: var(--v2-danger)`

### 3g. Context sidebar (260px)
Add a sidebar to the right of the form content area. Three cards:

**Card 1 — Enrollment Context**
- School name, Academic year, Current enrollment count, Grade levels
- Data from `useEnrollmentSummary` (already imported, no new dependencies)

**Card 2 — EdFi Compliance**
- List of required EdFi fields: Student ID, School ID, Entry Date, Grade Level, Entry Type
- Check/cross icons showing which are filled in the current form data

**Card 3 — Progress**
- Step checklist: green checkmark for completed, teal ring for current, gray circle for future
- Step name + status text

Sidebar hides below `lg` (1024px) breakpoint — use `hidden lg:flex` Tailwind classes.

Card style: `background: #161b27; border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 14px`
Card title: `11px/500` + icon in `#1D9E75`
Card rows: `10px` label in `#4a5068`, `11px/500` value in `#c8ccd8`

**Existing code to reuse:**
- `useWizard()` — `steps`, `currentStep`, `getStepStatus`, `formData`
- `useEnrollmentSummary()` for enrollment context data
- `useCurrentAcademicYear()` for year info
- `useActiveSchoolId()` for school context

---

## Task 4: Import Students Modal V2

**File:** `apps/academics/src/components/students/CSVImport.tsx`

### 4a. Modal container
- Replace `max-w-3xl rounded-2xl` with `max-w-[540px] rounded-[14px]`
- Background: `#161b27` (or `var(--v2-bg-surface)`)
- Border: `1px solid rgba(255,255,255,0.08)`

### 4b. Modal header
- Left: 32px icon square (`rgba(29,158,117,0.1)` bg, upload SVG in `#1D9E75`) + title `14px/600` + subtitle `11px` muted
- Right: Close button — 26px square, `rgba(255,255,255,0.04)` bg, `1px solid rgba(255,255,255,0.07)`, `border-radius: 6px`, X icon 12px
- Border-bottom: `1px solid rgba(255,255,255,0.06)`

### 4c. Dropzone V2
- Border: `1.5px dashed rgba(29,158,117,0.3)` (NOT bright teal)
- Background: `rgba(29,158,117,0.03)`
- Hover: `border-color: rgba(29,158,117,0.5); background: rgba(29,158,117,0.06)`
- Icon: 40px square, `rgba(29,158,117,0.1)` bg, `border-radius: 10px`
- Title: `13px/500` `var(--v2-text-secondary)`
- Subtitle: `11px` muted, "click to browse" in `#1D9E75`
- Remove current `border-2 border-dashed border-[rgb(var(--border-secondary))]` and `p-12`

### 4d. CSV Template card
- `background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 8px; padding: 10px 12px`
- Left: 28px icon square, `rgba(255,255,255,0.06)` bg, `border-radius: 6px`, document icon `#7a8099`
- Center: `12px/500` title + `10px` subtitle muted
- Right: "Download" teal text link with arrow icon

### 4e. Column chips
Replace plain text column spec with styled chips:
- Section labels: `10px/600 uppercase`, letter-spacing `0.5px`, color `#3a4055`
- Required chips: `font-family: monospace; font-size: 10px; font-weight: 500; padding: 2px 7px; border-radius: 5px; background: rgba(239,159,39,0.1); color: #EF9F27; border: 1px solid rgba(239,159,39,0.15)`
  - Columns: firstName, lastName, birthDate, gender, gradeLevel (matches actual CSV parser validation)
- Optional chips: `background: rgba(255,255,255,0.04); color: #5a6070; border: 1px solid rgba(255,255,255,0.07)`
  - Columns: guardianName, guardianPhone, guardianEmail (matches actual CSV_TEMPLATE_HEADERS)

### 4f. Modal footer
- Three-part layout: left info text + right buttons
- Left: "Supports .csv files up to 500 rows" at `10px` `#3a4055` with info icon
- Cancel button: `transparent bg; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 7px 14px; font-size: 12px; color: #7a8099` + X icon
- Upload button: `bg: #1D9E75; border-radius: 8px; padding: 7px 16px; font-size: 12px/500; color: white` — disabled state at `opacity: 0.4` until file selected
- Replace `brand-gradient-warm` on Done button and Import button with `bg-[#1D9E75]`

---

## Task 5: Enrollment Records Tab V2 Styling

**File:** `apps/academics/src/components/enrollment/EnrollmentTable.tsx`

- Status badge: "enrolled" → `background: rgba(29,158,117,0.10); color: #1D9E75; border-radius: 10px; padding: 2px 8px; font-size: 10px`
- Type column: format `re_enrollment` → `Re-enrollment` (replace underscore with hyphen, capitalize)
- Entry Date: format as `MMM DD, YYYY` (e.g., "Feb 13, 2026") using `toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })`
- Exit Date: `—` in `var(--v2-text-ghost)` color

**File:** `apps/academics/src/components/enrollment/EnrollmentDashboard.tsx`
- Apply V2 token colors to year strip: replace `bg-surface-secondary border-border-secondary` with V2 inline styles
- Status badge: use V2 semantic colors

---

## Task 6: Build Validation

- Run `pnpm build` from monorepo root — must pass with 0 errors
- Verify no regressions in Students list page (not modified in this sprint)
- Verify all existing form submission logic intact (no schema/API changes)

---

## Implementation Order

1. **Task 1** — Enrollment page restructure (tab order, V2 header, context banner)
2. **Task 2** — Academic year progress strip
3. **Task 3a-3e** — Wizard stepper + buttons + form actions
4. **Task 3f** — Form input V2 CSS
5. **Task 3g** — Context sidebar
6. **Task 4** — Import modal V2
7. **Task 5** — Enrollment records table V2
8. **Task 6** — Build validation

---

## Files Modified

| File | Changes |
|------|---------|
| `apps/academics/src/routes/enrollment/index.tsx` | Full V2 rewrite: header, tabs, year strip, context banner |
| `apps/academics/src/components/students/registration/RegistrationWizard.tsx` | V2 stepper, buttons (amber→green), form card, sidebar |
| `apps/academics/src/components/students/CSVImport.tsx` | V2 modal: 540px, dropzone, template card, column chips, footer |
| `apps/academics/src/components/enrollment/EnrollmentTable.tsx` | V2 status badges, date format, type column format |
| `apps/academics/src/components/enrollment/EnrollmentDashboard.tsx` | V2 token styling (restyled, not replaced) |
| `apps/shell/src/styles/home-v2-tokens.css` | V2 form input CSS overrides (Task 3f) |
| `apps/academics/src/router.tsx` | No changes needed (tab default via useState + window.location.search) |

---

## Risk Mitigations

- **No schema/API changes** — all modifications are UI-only
- **Form logic preserved** — WizardProvider, step validation, auto-save, submission handlers are untouched
- **ABAC preserved** — permission checks remain in place
- **Tab default change** — uses URL search params, doesn't affect router config
- **Sidebar is additive** — doesn't replace form content, only adds context panel alongside
