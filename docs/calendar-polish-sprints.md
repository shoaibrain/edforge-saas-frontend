# Calendar UI/UX Production Polish — Sprint Plan

## Context

Phase 1 FullCalendar integration is complete: FullCalendar replaces MonthlyCalendarGrid, CSS class-based event coloring supports dark mode, drag-select works, BS dual-calendar renders, old grid deleted.

**Current problems:**
- BsDatePicker renders as list instead of grid (blocking UX bug for Nepal users)
- Calendar is visually noisy (repeating "instructional day" / "weekend" text on every cell)
- `calendarDateId` equals `schoolId` — all events share one ID, breaking FC reconciliation
- ~130 `!important` flags in theme CSS (some legitimately needed for FC inline style overrides)
- No locale/timezone/firstDay passed to FullCalendar
- No filtering, print styles, or keyboard accessibility
- Date pickers can overlap when both open simultaneously

**Goal:** Google-grade, enterprise-quality calendar using FullCalendar free tier.

---

## Sprint 1: Foundation Fixes & Visual Noise (Demo: clean, quiet calendar)

### Task 1.1 — Fix event ID uniqueness
**File:** `apps/shell/src/components/calendar/fullcalendar-utils.ts`
- `calendarDateToFCEvent()`: use `cd.date` as event ID instead of `cd.calendarDateId`
- `calendarDateToBgEvent()`: use `bg-${cd.date}`
- **Verify:** No duplicate key warnings; month nav doesn't flash/remount

### Task 1.2 — Suppress repetitive event labels + reduce foreground events
**File:** `apps/shell/src/components/calendar/fullcalendar-utils.ts`
- If `eventType === 'instructional_day'` and no explicit event description → `display: 'background'` only (no foreground chip)
- Weekend dates → skip foreground event entirely, keep background coloring only
- Result: ~5-15 foreground events/month (holidays, breaks, teacher days) instead of ~400
- **Verify:** Weekdays show green bg tint without "instructional day" text; holidays show labeled chips

### Task 1.3 — Polish calendar container & spacing
**File:** `apps/shell/src/styles/fullcalendar-theme.css`
- "More" link: teal color, subtle hover
- Today cell: softer teal highlight with ring instead of heavy background
- Day cell min-height consistency check
- **Verify:** Calendar looks balanced; today visible but not garish

---

## Sprint 2: BsDatePicker Fix (Demo: working date pickers for Nepal users)

### Task 2.1 — Fix BsDatePicker grid rendering via portal
**File:** `packages/ui/src/components/BsDatePicker.tsx`
- Root cause: `absolute` positioning with `w-80` inside flex containers causes collapse
- Fix: use `createPortal` to `document.body`, calculate position from button ref, `position: fixed`, `z-[100]`
- Ensure works inside modals (which are also portaled) — test z-index stacking
- **Verify:** BsDatePicker opens as proper 7-column calendar grid in academic year create modal

### Task 2.2 — Click-outside-to-close for BsDatePicker
**File:** `packages/ui/src/components/BsDatePicker.tsx`
- Add `useEffect` with `mousedown` listener on `document` to close when clicking outside
- Use ref on popup container for containment check
- This also solves simultaneous picker overlap — opening a second click triggers outside-click on the first
- **Verify:** Clicking outside closes picker; only one picker visible at a time

### Task 2.3 — DateInput visual polish
**File:** `packages/ui/src/components/BsDatePicker.tsx`
- Calendar icon, formatted date display, clear button
- Hover/focus states matching EdForge design system (teal ring)
- Disabled state styling
- **Verify:** Date inputs look polished in both Gregorian and BS modes

### Task 2.4 — BS picker year navigation
**File:** `packages/ui/src/components/BsDatePicker.tsx`
- Currently month-by-month only — navigating across years requires 12 clicks
- Add year dropdown or year-skip buttons (« / »)
- **Verify:** Can jump from BS 2082 to 2083 without clicking arrow 12 times

### Task 2.5 — BsDatePicker ARIA labels
**File:** `packages/ui/src/components/BsDatePicker.tsx`
- Day buttons: `aria-label` with full date (e.g., "15 Chaitra 2082")
- Navigation buttons: screen-reader text (not just arrow entities)
- Popup: `role="dialog"`, `aria-modal="true"`
- **Verify:** VoiceOver reads dates meaningfully

---

## Sprint 3: CSS Quality & Color Contrast (Demo: same visual, cleaner code)

### Task 3.1 — Remove `!important` from structural/layout rules
**File:** `apps/shell/src/styles/fullcalendar-theme.css`
- Target: toolbar, day grid, list view structural overrides (~30 occurrences)
- Use higher-specificity selectors (`.fc .fc-daygrid-day` instead of `.fc-daygrid-day`)
- **Note:** `!important` on `.fc-bg-event` background-color and `.fc-list-event-dot` border-color are legitimately needed (FC applies inline styles) — keep those
- **Verify:** Dark mode toggle, layout, selection all work without structural `!important`

### Task 3.2 — Remove `!important` from foreground event colors
**File:** `apps/shell/src/styles/fullcalendar-theme.css`
- Target: `.fc-evt-*` classes, light + dark variants (~30 occurrences)
- Wrap in `.fc .fc-daygrid-event.fc-evt-*` for sufficient specificity
- **Verify:** All 14 event type colors render correctly in light and dark mode

### Task 3.3 — Remove `!important` from background event colors where possible
**File:** `apps/shell/src/styles/fullcalendar-theme.css`
- Target: `.fc-bg-*` classes (~30 occurrences)
- FC applies `background-color` as inline style on bg events — `!important` IS required here
- Document which flags are intentionally kept and why (add CSS comment)
- **Verify:** Background day coloring works in both themes

### Task 3.4 — Color contrast audit (WCAG AA)
**File:** `apps/shell/src/styles/fullcalendar-theme.css`
- Audit all 14 event type text colors against their backgrounds for 4.5:1 contrast ratio
- Check both light and dark mode variants
- Fix any failing combinations
- **Verify:** All event chips pass WCAG AA contrast checker tool

---

## Sprint 4: Locale, Timezone & Week Configuration (Demo: Nepal school in Nepali)

### Task 4.1 — Pass locale to FullCalendar
**File:** `apps/shell/src/components/calendar/SchoolFullCalendar.tsx`
- Add `locale` prop to `SchoolFullCalendarProps`
- Import `@fullcalendar/core/locales/ne` for Nepali (verify it exists in node_modules first; fall back to custom `buttonText`/`dayHeaderFormat` if not)
- Pass `locale` to `<FullCalendar locale={locale} />`
- **Verify:** Nepal school shows Nepali day names and button text; US school shows English

### Task 4.2 — Dynamic firstDay + timezone from school config
**File:** `apps/shell/src/components/calendar/SchoolFullCalendar.tsx`
- Add `firstDay` prop (0=Sunday, 1=Monday, 6=Saturday) sourced from `defaultWeekStartsOn`
- Add `timeZone` prop, pass to FC (cosmetic for all-day events but ensures correct dateClick dates)
- **Verify:** Nepal school starts on Sunday; Monday-start school shows Monday first

### Task 4.3 — Wire locale/timezone/firstDay from school data
**File:** `apps/shell/src/pages/settings/school-calendar.tsx`
- Extract `locale`, `timezone`, `calendarSystem`, `defaultWeekStartsOn` from school query
- Map locale to FC locale code (e.g., `'ne'` for Nepal, `'en'` default)
- Pass all to `<SchoolFullCalendar>`
- **Verify:** End-to-end: school config drives calendar display language and week structure

---

## Sprint 5: Event Filtering & Legend Interactivity (Demo: filter calendar by event type)

### Task 5.1 — Interactive legend with filter toggles
**File:** `apps/shell/src/pages/settings/school-calendar.tsx`
- Replace static legend with clickable filter chips
- State: `Set<string>` of active event types (all active by default)
- Clicking a chip toggles visibility; dimmed = filtered out
- "All" / "None" quick buttons
- Desktop: horizontal row; Mobile: horizontal scroll with fade or 2-row wrap
- **Verify:** Clicking "Holiday" chip toggles holiday visibility

### Task 5.2 — Client-side event filtering
**File:** `apps/shell/src/hooks/useFullCalendarEvents.ts`
- Accept `activeTypes: Set<string>` parameter
- Filter events and bgEvents in `useMemo` before returning
- **Verify:** Unchecking "Instructional" hides green bg; rechecking restores

### Task 5.3 — List view polish with filter support
**File:** `apps/shell/src/styles/fullcalendar-theme.css`
- Style list view items with colored left border matching event type
- Date grouping headers with subtle background
- Filters apply automatically (FC uses same event array)
- **Verify:** List view shows only filtered types; grouping looks clean

### Task 5.4 — Filter state persistence
- Store active filter types in URL search params or sessionStorage
- Survives page navigation within the app
- **Verify:** Toggle filters, navigate away, return — filters preserved

---

## Sprint 6: Edit Drawer & Bulk Operations Polish (Demo: professional edit experience)

### Task 6.1 — Redesign single-date edit drawer
**File:** `apps/shell/src/pages/settings/school-calendar.tsx`
- Header: date prominently with day-of-week, BS equivalent for Nepal
- Form sections: Event Type (dropdown with colored dot), Bell Schedule, Notes
- Toggle: "Instructional Day" switch
- Read-only context: day number in year, instructional day number
- **Verify:** Edit drawer looks polished; all fields save correctly

### Task 6.2 — Bulk selection visual feedback
**Files:** `fullcalendar-theme.css` + `SchoolFullCalendar.tsx`
- Selection count badge floating near calendar ("3 dates selected")
- Drag-select cursor: crosshair during selection
- **Verify:** Count updates in real-time during drag

### Task 6.3 — Bulk edit bar redesign + confirmation
**File:** `apps/shell/src/pages/settings/school-calendar.tsx`
- Slide-up panel: "{n} dates selected" | Event Type | Bell Schedule | Apply | Clear
- Confirmation dialog for bulk changes affecting >10 dates
- **Verify:** Bulk bar appears; apply changes reflected; confirmation shown for large selections

### Task 6.4 — Optimistic updates for single-date edits
**File:** `apps/shell/src/hooks/useCalendar.ts`
- Add `onMutate` callback to `useUpdateCalendarDate`: snapshot current cache, optimistically update
- Add `onError` rollback using snapshot
- Add `onSettled` to invalidate queries
- Use `queryClient.setQueriesData` with predicate matcher (query keys contain dynamic params object)
- **Verify:** Edit reflects instantly; error rolls back; cache consistent after settle

---

## Sprint 7: Accessibility & Print (Demo: accessible, printable calendar)

### Task 7.1 — Keyboard navigation for calendar
**File:** `apps/shell/src/components/calendar/SchoolFullCalendar.tsx`
- Enter/Space on date cell opens edit drawer
- Tab order: toolbar → calendar grid → legend → stats
- Focus visible styles: teal ring matching EdForge design
- **Verify:** Full keyboard-only workflow: navigate, select, edit, close

### Task 7.2 — ARIA labels and screen reader support
**File:** `apps/shell/src/components/calendar/SchoolFullCalendar.tsx`
- `aria-label` on custom event content: "Holiday: Dashain" not just "Dashain"
- Stats bar: `aria-live="polite"` for dynamic count updates
- **Verify:** VoiceOver/NVDA reads events meaningfully

### Task 7.3 — Print stylesheet
**File:** `apps/shell/src/styles/fullcalendar-theme.css`
- `@media print`: hide toolbar buttons, expand to full width
- Force light mode colors
- Show legend below calendar
- Page break settings for multi-month
- **Verify:** Cmd+P produces clean printable calendar

### Task 7.4 — BsDatePicker keyboard navigation
**File:** `packages/ui/src/components/BsDatePicker.tsx`
- Arrow keys to navigate days, Enter to select, Escape to close
- Month/year navigation when focused on header
- **Verify:** Full keyboard-only date selection

---

## Sprint 8: Loading States & Final Polish (Demo: complete production UI)

### Task 8.1 — Skeleton loading for initial calendar load
**File:** `apps/shell/src/components/calendar/SchoolFullCalendar.tsx`
- Replace spinner with skeleton calendar grid (gray pulsing cells in 7-column layout)
- Keep spinner overlay for month-navigation refetch (already exists)
- **Verify:** Initial page load shows skeleton; month nav shows overlay spinner

### Task 8.2 — Error boundary with retry
**File:** `apps/shell/src/components/calendar/SchoolFullCalendar.tsx`
- Graceful fallback: "Unable to load calendar. Check your connection." with retry button
- Wrap in React error boundary
- **Verify:** Network error (throttled to offline) shows fallback; retry works

### Task 8.3 — Generate modal minor enhancement
**File:** `apps/shell/src/pages/settings/school-calendar.tsx`
- Add preview count: "This will generate ~180 instructional days, ~52 weekends"
- Pre-populate school days from school config (Nepal: Sun-Fri, US: Mon-Fri)
- **Verify:** Preview count accurate; Nepal defaults correct

### Task 8.4 — Final integration test checklist
- [ ] Create US school → Generate → verify colors, labels, filtering
- [ ] Create Nepal school → BS dates, Nepali locale, Sunday start
- [ ] Dark mode toggle → all components adapt
- [ ] Drag-select 5 dates → bulk edit → apply → reflected
- [ ] Print → clean output
- [ ] Keyboard-only: navigate, select, edit, close
- [ ] Mobile 375px: stats wrap, calendar scrollable, legend scrollable
- [ ] BsDatePicker: opens as grid, year nav works, click-outside closes
- [ ] `pnpm build:mvp` → zero new TypeScript errors
- [ ] `pnpm lint` → zero new lint warnings

---

## Critical Files

| File | Sprints |
|------|---------|
| `apps/shell/src/components/calendar/fullcalendar-utils.ts` | 1 |
| `apps/shell/src/styles/fullcalendar-theme.css` | 1, 3, 5, 7 |
| `packages/ui/src/components/BsDatePicker.tsx` | 2, 7 |
| `apps/shell/src/components/calendar/SchoolFullCalendar.tsx` | 1, 4, 6, 7, 8 |
| `apps/shell/src/pages/settings/school-calendar.tsx` | 4, 5, 6, 8 |
| `apps/shell/src/hooks/useFullCalendarEvents.ts` | 5 |
| `apps/shell/src/hooks/useCalendar.ts` | 6 |
| `apps/shell/src/services/calendar.service.ts` | (unchanged) |
| `apps/shell/src/components/calendar/SessionManager.tsx` | (unchanged) |
| `packages/date-utils/src/` | (reuse: adToBS, BS_MONTH_NAMES_EN) |

## Risk Assessment

| Task | Risk | Mitigation |
|------|------|------------|
| 3.1-3.3 CSS !important removal | ~130 flags, some legitimately needed; regression risk | Split into 3 sub-tasks; test both themes after each |
| 2.1 BsDatePicker portal | z-index fights with modals; scroll behavior changes | Test specifically inside CreateAcademicYearModal |
| 6.4 Optimistic updates | Cache manipulation with dynamic query keys | Use `setQueriesData` with predicate; snapshot/rollback pattern |
| 4.1 Nepali locale | `@fullcalendar/core/locales/ne` may not exist or be incomplete | Verify in node_modules first; fall back to custom buttonText |
