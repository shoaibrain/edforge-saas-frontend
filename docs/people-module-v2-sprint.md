# People Module V2 Sprint Plan

## Overview
Upgrade the People module (Overview, Staff Directory, HR Admin, Add Staff Modal) to the V2 design system. All three pages and the modal now use V2 tokens, inline styles matching the prototype HTML files, and shared UI components from `@edforge/ui`.

## Completed Sprints

### Sprint 1: StaffRoleChip + AccessChip Components
- **StaffRoleChip** (`apps/people/src/components/staff/StaffRoleChip.tsx`)
  - V2 role color mappings: teacher (teal), principal (purple), admin (blue), support (coral)
  - 10px font, 2px 8px padding, 7px border-radius
- **AccessChip** (`apps/people/src/components/staff/AccessChip.tsx`)
  - Active: green tint with green dot, bordered
  - No Access: gray tint with gray dot, bordered
- Both exported from barrel `components/staff/index.ts`
- DiceBear avatar logic: **unchanged** (lorelei style, seed=staffId)

### Sprint 2: People Overview V2
- **File:** `apps/people/src/routes/overview.tsx`
- Replaced `ModuleOverviewPage` with data-driven layout
- Uses `useStaffList` hook for live data (no hardcoded stats)
- V2 page header: coral icon, "People & HR" title, date, secondary + primary buttons
- Context banner with colored metric spans
- 4 KPI tiles via `StatCard` from `@edforge/ui` with `WidgetErrorBoundaryV2`
- Two-column section: Staff roster (live data, DiceBear avatars, role chips, access dots) + Employment breakdown (bar charts)
- Three-column section: Recent activity feed + Staff Directory shortcut + HR Admin shortcut
- Add Staff modal triggered from header button

### Sprint 3: Staff Directory V2
- **Files:** `apps/people/src/routes/staff.tsx`, `apps/people/src/components/staff/StaffTable.tsx`
- V2 page header with split button (Add Staff + Import CSV / Bulk add dropdown)
- Context banner with staff counts
- 4 KPI tiles matching prototype
- Filter strip: quick chips (All/Teachers/Principal/Support) in coral accent, search input, role dropdown, department dropdown, Export CSV
- Table columns restyled:
  - Staff: DiceBear avatar (unchanged) + name + employment type badge + email
  - Role: StaffRoleChip with V2 colors
  - Status: V2 chip with 5px dot
  - Hired: 11px muted text, formatted date
  - Department: 11px muted, "—" when empty
  - System Access: AccessChip component
  - Actions: view/edit/more icon buttons

### Sprint 4: HR Admin V2
- **File:** `apps/people/src/routes/hr/index.tsx`
- V2 page header: purple icon, "HR Administration" title, no action buttons
- Context banner mentioning v2.0 plans
- Full-page centered empty state:
  - 64px icon with v2.0 amber badge
  - Heading + body text
  - "Notify me when available" button with toast
  - Feature preview: 3-column grid (Payroll, Reviews, Professional Dev) at 0.7 opacity
  - Redirect section: "Go to Staff Directory" coral link

### Sprint 5: Add Staff Modal V2
- **File:** `apps/people/src/components/staff/CreateUserModal.tsx`
- Custom modal (not using generic Modal component) for full V2 styling control
- Modal header: coral icon, title, subtitle, close button
- Avatar preview strip: gradient circle from first letter + DiceBear info note
- Form groups with micro-labels: "Identity" and "Access & Role"
- All inputs: V2 dark input styling with focus border
- Role helper text box
- Footer: required fields note + Cancel ghost + Create primary green

## Architecture Notes
- All pages use `data-v2` attribute for V2 token scoping
- Colors use inline styles referencing `var(--v2-*)` tokens with fallbacks
- `StatCard` and `WidgetErrorBoundaryV2` imported from `@edforge/ui`
- DiceBear avatar logic in `lib/avatar.ts` is **completely unchanged**
- Coral accent: `#D85A30` / `rgba(216,90,48,0.10)` — available as `--v2-coral`
- Purple/HR accent: `#7F77DD` / `rgba(127,119,221,0.10)`

## Verification
- TypeScript build passes with zero errors
- All existing functionality preserved (CRUD, pagination, search, filters, export, drawer, modals)
- No changes to API endpoints, service calls, or data shapes
