# Quick Profile Drawer V2 — Sprint Plan

> **Goal:** Fix the drawer so it never overlaps the shell topbar or sidebar, then apply the V2 visual redesign.
> **Branch:** `feat/quick-profile-drawer-v2`

---

## Phase 1 — Audit Summary

### Current Architecture (BROKEN)

| Component | File | Issue |
|-----------|------|-------|
| `StudentDrawer` | `apps/academics/src/components/students/StudentDrawer.tsx` | `position: fixed; inset: 0; z-50` — overlaps topbar (z-30) and sidebar (z-40) |
| `CourseDrawer` | `apps/academics/src/components/curriculum/CourseDrawer.tsx` | Same `fixed z-50` pattern |
| `GradeLevelDrawer` | `apps/academics/src/components/curriculum/GradeLevelDrawer.tsx` | Same |
| `TeacherDetailDrawer` | `apps/academics/src/components/teachers/TeacherDetailDrawer.tsx` | Same |
| `ClassworkDrawer` | `apps/academics/src/components/classrooms/classwork/ClassworkDrawer.tsx` | Same |
| `StaffDrawer` | `apps/people/src/components/staff/StaffDrawer.tsx` | Same |
| `Drawer` (shared) | `packages/ui/src/components/Drawer.tsx` | Uses @headlessui Dialog with `fixed z-50` — same overlap |

### Shell Layout Structure

```
AppShell.tsx
├── <div className="min-h-screen">
│   ├── <Sidebar />              // fixed left-0 top-0 bottom-0 z-40, width: 72|260px
│   └── <motion.div>             // marginLeft: 72|260px, flex-col min-h-screen
│       ├── <Header />           // sticky top-0 z-30 h-16
│       └── <main id="main-content" className="relative flex-1 overflow-x-clip">
│           └── {children}       // Module pages render here
│               └── <div data-v2 className="p-5 pb-10">  // Students page wrapper
│                   ├── <StudentTable />
│                   └── <StudentDrawer />  // Currently fixed — WRONG
```

### Current StudentDrawer Details

- **State:** `useState` in `students/index.tsx` — `drawerOpen` + `selectedStudent`
- **Trigger:** Row click on `StudentTable` → `onViewStudent` callback
- **Animation:** Framer Motion spring `{ damping: 30, stiffness: 300 }` for `x: '100%' → 0`
- **Backdrop:** `fixed inset-0 bg-black/30 backdrop-blur-sm` — covers entire viewport
- **Escape:** `useEffect` keydown listener on `document`
- **Outside click:** Backdrop `onClick` handler
- **Body scroll:** Locks with `document.body.style.overflow = 'hidden'`
- **Width:** `max-w-2xl` (~672px) — too wide for a quick profile

### Existing Utilities Available

| Utility | Location | Notes |
|---------|----------|-------|
| `useMediaQuery` | `apps/shell/src/components/landing/hooks/useMediaQuery.ts` | Needs move to @edforge/ui |
| `getStudentGradient` | `apps/academics/src/utils/student-gradient.ts` | 10 gradient pairs |
| `getStudentInitials` | Same file | Two-char initials |
| Donut ring SVG | Inline in `StudentTable.tsx` lines 190–218 | Needs extraction |
| V2 design tokens | `apps/shell/src/styles/home-v2-tokens.css` | Full light/dark support |
| Framer Motion | `package.json` — `^11.15.0` | Already available |

---

## Phase 2 — The Architectural Fix

### Problem
Any component using `position: fixed` renders relative to the viewport, placing it above the shell's sidebar (z-40) and header (z-30) when z-index > 40.

### Solution
The drawer renders **inline** within the page component (no Portal, no `createPortal`). Since `<main>` already has `position: relative`, the drawer's `position: absolute` resolves against the content pane.

**Critical:** Do NOT modify `<main>`'s `overflow-x-clip` to `overflow-hidden` — that would break scrolling for all pages. Instead, add `position: relative; overflow: hidden` to the **page-level wrapper** div (`<div data-v2>`).

### Why No Portal?
- `containerRef.current` is `null` on first render — `createPortal` throws
- The drawer is already inside `<main>` via the page component tree
- Threading a ref from shell into micro-frontend modules creates cross-app coupling
- Inline rendering achieves the same scoping with zero complexity

### Z-Index Strategy (content-pane-scoped)

| Element | Z-Index | Reason |
|---------|---------|--------|
| `SchoolTransitionOverlay` | z-10 | Existing — sits inside `<main>` |
| Content-pane click-catcher overlay | z-19 | Above page content, below drawer |
| QuickDrawer panel | z-20 | Above overlay, scoped to content pane |
| Dropdown menus inside drawer | z-30 | Above drawer panel (local scope) |
| **Shell Header** | **z-30 (global fixed)** | **Unaffected — outside `<main>`** |
| **Shell Sidebar** | **z-40 (global fixed)** | **Unaffected — outside `<main>`** |

---

## Phase 3 — Animation Specification

### Opening (slide in from right)
```
transform: translateX(360px) → translateX(0)
Framer Motion: initial={{ x: 360 }} animate={{ x: 0 }}
transition={{ type: 'spring', stiffness: 380, damping: 38 }}
```

### Closing (slide out to right)
```
transform: translateX(0) → translateX(360px)
Framer Motion: exit={{ x: 360 }}
```

**Note:** Framer Motion's single `transition` prop applies to both `animate` and `exit`. To get different timing for exit, use the **variants API**:

```tsx
const drawerVariants = {
  hidden: { x: 360 },
  visible: {
    x: 0,
    transition: { type: 'spring', stiffness: 380, damping: 38 }
  },
  exit: {
    x: 360,
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] }
  }
}

<motion.div
  key="quick-drawer"
  variants={drawerVariants}
  initial="hidden"
  animate="visible"
  exit="exit"
/>
```

### Content pane dimming
- Overlay div: `position: absolute; inset: 0; z-index: 19; background: rgba(0,0,0,0.2)`
- The overlay covers the full content pane; the drawer renders on top of it
- Overlay `onClick` → close drawer
- Animate overlay opacity: `initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}`

### Active row highlight
- When drawer opens for a student, add class to that table row: `bg-[rgba(29,158,117,0.05)] border-l-2 border-l-[#1D9E75]`
- Remove on close

### Reduced motion
- Wrap animations in `useReducedMotion()` check
- When `prefers-reduced-motion: reduce`, use instant `duration: 0` transitions

---

## Phase 4 — Visual Redesign

All styles use V2 CSS variables. No hardcoded hex in component styles. The `data-v2` attribute must wrap the drawer content for light theme selectors to activate.

### Drawer container
```
position: absolute
top: 0; right: 0; bottom: 0
width: 360px
background: var(--v2-bg-surface)
border-left: 1px solid var(--v2-border-default)
display: flex; flex-direction: column
z-index: 20
box-shadow: -12px 0 40px rgba(0,0,0,0.4)
```

### Header — student identity
- Avatar: 44×44px, border-radius: 10px, `getStudentGradient(name)` background with initials
- Name: 15px/600 `var(--v2-text-primary)`, letter-spacing: -0.2px
- Student ID: monospace 10px `var(--v2-text-faint)`
- Active badge: teal pill `rgba(29,158,117,0.12)` background, `var(--v2-brand-primary)` text
- Actions: 26×26px icon buttons, border-radius: 6px, subtle border

### Stat tiles
- 3-column grid, gap: 7px
- Each: `rgba(255,255,255,0.03)` bg, `var(--v2-border-default)` border, border-radius: 8px
- Grade: blue icon (triangle), value in `var(--v2-text-primary)`
- GPA: purple icon (bar chart), "—" in `var(--v2-text-faint)` when absent
- Attendance: **shared AttendanceDonutRing** component (28px), colored by rate threshold

### At-risk banner
- Only renders when `attendanceRate < 80%`
- Red dot + bold text + muted subtitle
- Background: `rgba(226,75,74,0.07)`, border: `rgba(226,75,74,0.15)`

### Section headers
- 9px/600 uppercase, letter-spacing: 0.6px, `var(--v2-text-ghost)`
- Tiny SVG icon 14px, stroke: `var(--v2-text-faint)`

### Demographics
- 2-column grid
- DOB with age sub-value (10px muted)
- Gender, Grade Level ("Grade N"), Enrollment date with type sub-value

### Contact information
- 2-column for email/phone ("—" in `var(--v2-text-faint)` when absent)
- Full-width address row

### Guardian card
- Background: `rgba(255,255,255,0.03)`, border: `var(--v2-border-default)`, border-radius: 8px
- Name + Guardian/Primary chips + email/phone with icons

### Enrolled sections
- Pill chips: 10px/500, `rgba(255,255,255,0.05)` bg, `var(--v2-border-hover)` border
- Only rendered when section data is available

### Footer (sticky bottom)
- Edit student + Export record: 2-column grid, secondary style
- Withdraw student: full-width, red semantic
- View full profile: full-width teal-tinted button with arrow, navigates to `/students/:id`

### Three-dot dropdown
- Absolute-positioned within drawer header
- Background: `var(--v2-bg-elevated)`, border: `var(--v2-border-default)`, border-radius: 9px
- Items: View Full Profile, Edit, Export, divider, Withdraw (red)
- **Must handle Escape independently** — `event.stopPropagation()` to close dropdown before drawer

### Scrollbar
- Body section scrolls with custom 3px scrollbar
- Track: transparent, thumb: `rgba(255,255,255,0.1)`, border-radius: 2px

---

## Phase 5 — Close Behaviors

### Three close triggers
1. **X button** — `onClick={onClose}`
2. **Escape key** — `useEffect` keydown listener, only when `isOpen && !dropdownOpen`
3. **Click dimmed area** — overlay `onClick={onClose}`

### Escape key edge case
The `ActionsDropdown` must add its own Escape handler with `event.stopPropagation()` so Escape closes the dropdown first, not the drawer.

### Navigation close
Clicking sidebar nav items navigates, which unmounts the page. The drawer disappears instantly (no exit animation). This is acceptable — documented as known behavior.

### Cleanup on close
- Remove active row highlight class
- Restore content opacity (overlay unmounts via AnimatePresence)
- No body scroll lock needed (drawer is content-pane-scoped)

---

## Phase 6 — Responsive Behavior

### Breakpoint: `max-width: 768px`
(Not 1024px — at 1024px with sidebar expanded, content pane is 764px, enough for a 360px side drawer.)

### Bottom sheet mode
```
position: absolute
bottom: 0; left: 0; right: 0
height: 70vh
max-height: calc(100% - 64px)  /* Always leave room for header */
border-radius: 14px 14px 0 0
border-top: 1px solid var(--v2-border-default)
```

### Bottom sheet animation
```
initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
Same spring params as side drawer
```

### Drag-to-dismiss
Use Framer Motion `drag="y"` with:
- `dragConstraints={{ top: 0 }}`
- `dragElastic={0.2}`
- `onDragEnd`: if `velocity.y > 300 || offset.y > height * 0.4` → close

---

## Phase 7 — Accessibility

### Focus trap
Use `focus-trap-react` (or implement manually) — Tab must stay within the drawer when open. The drawer is modal within the content pane but the shell chrome (sidebar, header) remains accessible.

### ARIA
```tsx
<div role="dialog" aria-modal="true" aria-labelledby="quick-drawer-title">
```

### Focus restoration
On close, return focus to the element that triggered the drawer (the table row). Store `document.activeElement` on open, restore on close.

### Screen reader
`role="dialog"` triggers announcement on open. `aria-labelledby` points to the student name heading.

### Reduced motion
Use `useReducedMotion()` from Framer Motion. When true, set all transition durations to 0.

---

## Phase 8 — Reusability

### QuickDrawer exported from @edforge/ui

```tsx
// packages/ui/src/components/QuickDrawer.tsx
interface QuickDrawerProps {
  isOpen: boolean
  onClose: () => void
  width?: number           // default 360
  children: ReactNode
  ariaLabelledBy?: string  // for accessibility
}
```

Renders inline (no portal). The parent page must have `position: relative; overflow: hidden` on its wrapper div.

### Sub-components for composition
- `QuickDrawer.Header` — flex row with close button
- `QuickDrawer.Body` — scrollable middle section with custom scrollbar
- `QuickDrawer.Footer` — sticky bottom with border-top

### Migration path for other drawers
Each module drawer (CourseDrawer, StaffDrawer, etc.) can migrate by:
1. Replace `position: fixed; z-50` wrapper → `<QuickDrawer>`
2. Add `relative overflow-hidden` to page wrapper div
3. Remove body scroll lock
4. Remove full-viewport backdrop

**This sprint only migrates StudentDrawer. Other drawers are tracked as follow-up tasks.**

---

## Task Breakdown

### Task 1: Extract AttendanceDonutRing to @edforge/ui
**File:** `packages/ui/src/components/AttendanceDonutRing.tsx`
- Extract SVG donut from `StudentTable.tsx` lines 190–218
- Props: `{ rate: number; size?: number; strokeWidth?: number; className?: string }`
- Color: red < 80%, orange < 90%, green >= 90%
- Export from `packages/ui/src/index.ts`
- Update `StudentTable.tsx` to use the shared component

### Task 2: Move useMediaQuery to @edforge/ui
**From:** `apps/shell/src/components/landing/hooks/useMediaQuery.ts`
**To:** `packages/ui/src/hooks/useMediaQuery.ts`
- Re-export from `packages/ui/src/index.ts`
- Update shell import to use `@edforge/ui`

### Task 3: Create QuickDrawer component in @edforge/ui
**File:** `packages/ui/src/components/QuickDrawer.tsx`
- Inline rendering (no portal)
- `position: absolute; z-index: 20` with overlay at `z-index: 19`
- AnimatePresence + motion.div with variants for enter/exit
- Escape key handler (with `stopPropagation` guard for nested dropdowns)
- Click-catcher overlay for outside-click close
- Focus trap via `focus-trap-react`
- ARIA: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
- Focus restoration on close
- Reduced motion support
- Responsive: side drawer at >= 769px, bottom sheet at <= 768px
- Bottom sheet: drag-to-dismiss gesture
- Sub-components: `QuickDrawer.Header`, `QuickDrawer.Body`, `QuickDrawer.Footer`
- Export from `packages/ui/src/index.ts`

### Task 4a: Structural migration — StudentQuickProfile shell
**File:** `apps/academics/src/components/students/StudentQuickProfile.tsx`
- New component wrapping `<QuickDrawer>`
- Port existing StudentDrawer content as-is (no visual changes yet)
- Remove `position: fixed`, `z-50`, body scroll lock, full-viewport backdrop
- Add `data-v2` attribute to drawer content wrapper
- Update `students/index.tsx`:
  - Add `relative overflow-hidden` to page wrapper div
  - Replace `<StudentDrawer>` with `<StudentQuickProfile>`
  - Wire contentPaneRef if needed
- **Verify:** drawer no longer overlaps topbar/sidebar

### Task 4b: Visual redesign — header, stat tiles, footer
- Header: gradient avatar, monospace ID, active badge, icon buttons
- Stat tiles: 3-column with AttendanceDonutRing
- Footer: Edit/Export grid, Withdraw red, View Full Profile teal
- Three-dot dropdown with Escape stopPropagation
- Custom scrollbar CSS

### Task 4c: New features — at-risk banner, enrolled sections, active row highlight
- At-risk banner (conditional on attendance < 80%)
- Enrolled sections pill chips
- Active row highlight class management on open/close
- Focus restoration to triggering table row

### Task 5: Light theme verification
- Audit all styles for hardcoded hex — replace with V2 tokens
- Verify `:root:not(.dark) [data-v2]` selectors activate inside drawer
- Test both light and dark themes visually

### Task 6: Testing
- QuickDrawer: renders when open, hidden when closed
- Escape key calls onClose (and does not close when dropdown is open)
- Overlay click calls onClose
- Focus trapped within drawer
- Drawer does not overlap header/sidebar (check computed z-index)
- Bottom sheet mode at ≤ 768px
- Reduced motion: no animation

---

## Validation Checklist

- [ ] Shell topbar (breadcrumbs + avatar) fully visible when drawer is open
- [ ] Shell sidebar fully visible and clickable when drawer is open
- [ ] Drawer does not appear above topbar/sidebar under any z-index condition
- [ ] Drawer slides in/out with smooth spring animation
- [ ] Escape closes drawer (but not when dropdown is open)
- [ ] Clicking dimmed page area closes drawer
- [ ] Sidebar nav click navigates and drawer closes via unmount
- [ ] Active student row shows left green accent border
- [ ] AttendanceDonutRing used in both StudentTable and drawer (shared component)
- [ ] All V2 CSS token variables used — zero hardcoded hex in component styles
- [ ] `data-v2` attribute present on drawer content for theme selectors
- [ ] Light theme renders correctly
- [ ] Dark theme renders correctly
- [ ] Bottom sheet mode at ≤ 768px viewport
- [ ] Drag-to-dismiss works on bottom sheet
- [ ] Focus trapped within drawer when open
- [ ] Focus returns to trigger element on close
- [ ] `prefers-reduced-motion` disables animations
- [ ] ARIA attributes: role="dialog", aria-modal="true", aria-labelledby
- [ ] QuickDrawer exported from @edforge/ui
- [ ] Build succeeds for all apps
