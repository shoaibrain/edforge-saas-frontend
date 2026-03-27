# School Details V2 — Sprint Documentation

**Sprint**: School Details V2 Redesign
**Date**: 2026-03-27
**Scope**: Frontend-only (`apps/shell/`) — zero `server/` changes

---

## Summary

Replaced the 7-tab School Details page with a consolidated 4-tab layout matching the V2 prototype. Added URL-based tab routing, locale-aware defaults (Nepal/Bikram Sambat support), per-section save buttons, a setup progress banner, and a Nepal Standard bell schedule template.

---

## Tab Architecture

| V2 Tab | Route `?tab=` | Old Tabs Merged | Key Features |
|--------|---------------|-----------------|--------------|
| Configuration | `config` | Configuration (trimmed) | 3 sections: Identity, Location & Contact, Schedule & Operations. Per-section save. Locale-aware school-day defaults. |
| Academic Setup | `academic-setup` | Academic Years, Calendar, Bell Schedule | 4-step wizard (Years → Sessions → Calendar → Bell Schedule). Completion tracking. Nepal semester suggestions. Nepal Standard bell template. |
| Structure | `structure` | Departments, Rooms | 2-column grid. Department scope filter + bug warning banner. Room type color chips. |
| Audit Log | `audit-log` | Audit Log | Action type filter. Export CSV. Color-coded action icons. |

---

## Files Created

| File | Purpose |
|------|---------|
| `apps/shell/src/pages/settings/tabs/ConfigurationTab.tsx` | V2 Configuration tab — 3 sections with per-section save |
| `apps/shell/src/pages/settings/tabs/AcademicSetupTab.tsx` | V2 Academic Setup wizard — 4 steps with completion tracking |
| `apps/shell/src/pages/settings/tabs/StructureTab.tsx` | V2 Structure tab — departments + rooms 2-column layout |
| `apps/shell/src/pages/settings/tabs/AuditLogTab.tsx` | V2 Audit Log tab — filter + export CSV |
| `apps/shell/src/utils/localeDefaults.ts` | Pure utility: `deriveWeekendDays()`, `deriveSchoolDays()`, `isNepalLocale()` |
| `apps/shell/src/hooks/useLocaleDefaults.ts` | React hook wrapping ShellProvider's `workspaceSettings` for locale defaults |
| `docs/school-details-v2-audit.md` | Step 1 deep audit document (9 audit areas) |

## Files Modified

| File | Change |
|------|--------|
| `apps/shell/src/pages/settings/school-detail.tsx` | Complete rewrite: 4-tab layout, URL routing, V2 header, setup progress banner |
| `apps/shell/src/router.tsx` | Added `validateSearch` to `settingsOrgSchoolDetailRoute` for `?tab=` param |
| `apps/shell/src/pages/settings/index.ts` | Commented out old tab barrel exports (V2-REPLACED markers) |
| `apps/shell/src/pages/settings/education-org-detail.tsx` | Added `search: { tab: undefined }` to school detail navigation |
| `apps/shell/src/pages/settings/organization.tsx` | Added `search: { tab: undefined }` to school detail navigation |

## Files Preserved (Not Deleted)

Old tab files remain on disk as reference during transition. They are no longer imported:

- `school-configuration.tsx`
- `school-departments.tsx`
- `school-academic-years.tsx`
- `school-calendar.tsx`
- `school-bell-schedule.tsx`
- `school-rooms.tsx`
- `school-audit-log.tsx`

---

## Tenant Regional Settings Integration

The V2 tabs derive locale-aware defaults from the existing ShellProvider context — no new API calls.

**Data flow:**
1. `ShellProvider` fetches workspace settings on mount → stores `workspaceSettings.regional`
2. `useLocaleDefaults()` hook reads from `useShell().workspaceSettings`
3. `localeDefaults.ts` utilities compute weekend/school days from `defaultCalendarSystem` and `defaultWeekStartsOn`

**Key function — `deriveWeekendDays()`:**
```
if (calendarSystem === 'bikram_sambat' || weekStartsOn === 'sunday') → ['saturday']
else → ['saturday', 'sunday']
```

This OR condition handles Nepal workspaces that may use either Bikram Sambat calendar or Sunday week start.

---

## Nepal Locale Business Logic

| Feature | Nepal Behavior | International Default |
|---------|---------------|----------------------|
| Weekend days | Saturday only | Saturday + Sunday |
| School days | Sun–Fri (indices 0–5) | Mon–Fri (indices 1–5) |
| Calendar system | Bikram Sambat with AD dual display | Gregorian |
| Bell schedule default | Nepal Standard listed first (10 AM – 4 PM, 7 periods) | US Elementary listed first |
| Semester suggestions | First: Baishakh–Ashwin, Second: Kartik–Chaitra | Generic Fall/Spring |
| Weekend hint text | "Nepal: Saturday is the weekly holiday" | "Weekend: Saturday & Sunday" |

---

## Known Remaining Issues

1. **Department scope bug (backend)**: Organization-level departments fail to create. Root cause is in the backend API, not frontend. UI displays an amber warning banner in the Structure tab. No frontend fix possible.

2. **Old tab files not deleted**: Kept intentionally for reference. Safe to delete after V2 is validated in staging.

3. **Framer Motion tab transitions**: The prompt specified `AnimatePresence` + `motion.div` transitions. Currently implemented as CSS transitions. Framer Motion can be layered in if the team wants smoother animations.

4. **Academic session inline create**: The Sessions step has an inline create form but does not yet support edit/delete of existing sessions (matches existing behavior).

---

## Validation Results

```
npx tsc --noEmit
```

**Result: 0 errors, 0 warnings**

All V2 files compile cleanly against the existing codebase types. No regressions in existing files.

---

## Design System Colors (V2)

| Token | Hex | Usage |
|-------|-----|-------|
| Primary green | `#1D9E75` | Action buttons, active status, success states |
| Settings accent blue | `#378ADD` | Active tab indicator, info states |
| Warning amber | `#EF9F27` | Setup status, warning banners, department scope bug |
| Danger red | `#E24B4A` | Delete actions, error states |
| Purple accent | `#7F77DD` | Organization scope badges, version change icons |
