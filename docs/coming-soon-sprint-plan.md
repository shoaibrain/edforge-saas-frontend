# EdForge "Coming Soon" Feature Annotations — Sprint Plan

> **Goal:** Mark all features not shipping in the initial EdForge EMIS production deployment with professional, consistent "Coming Soon" annotations that clearly communicate feature availability to pilot school users.

---

## Design Decisions

### Why not feature flags?
The codebase has `TenantFeatures` and `SchoolFeatures` for runtime toggles. For V1 production, hardcoded Coming Soon was chosen for simplicity — these features have no backend implementation yet. When each feature ships, search `COMING_SOON:` comments across the codebase to find all suppression points (e.g., `grep -r "COMING_SOON:"`).

### Avatar gets `ComingSoonBadge`, not `ComingSoonBanner`
The avatar section uses `ComingSoonBadge` (inline chip) because only the upload sub-feature is disabled — the rest of the account page (name, email, address) remains fully functional. Other pages use the full `ComingSoonBanner` because the entire tab/page content is unavailable.

### SVG ID collision prevention
The `ComingSoonIllustration` component uses React's `useId()` to generate unique SVG gradient IDs, preventing rendering bugs when multiple banners coexist on the same page.

---

## Sprint 1: Coming Soon Component System (Foundation)

**Sprint Goal:** Create a reusable, enterprise-grade "Coming Soon" component library in `@edforge/ui` with professional SVG illustrations.

**Demo:** Visual inspection in dev server — render all four SVG variants on a test page.

### Tickets

#### 1.1 — Create `ComingSoonBadge`, `ComingSoonBanner`, and `ComingSoonOverlay` components
- **File:** `packages/ui/src/components/ComingSoon.tsx`
- **Description:** Three components:
  - `ComingSoonBadge`: Small inline chip with animated pulse dot. Supports `sm`/`md` sizes and custom `label` text (for i18n).
  - `ComingSoonBanner`: Full-width banner with embedded SVG illustration (4 variants: `default`/rocket, `security`/shield, `communication`/chat, `admin`/briefcase). Accepts title, description, features list, action slot, and `compact` mode.
  - `ComingSoonOverlay`: Wraps content at 40% opacity with non-interactive overlay and centered badge.
  - SVG uses `useId()` for unique gradient IDs (no ID collisions).
- **Acceptance:**
  - All three components render in light/dark modes
  - Four SVG variants render correctly
  - `ComingSoonBadge` supports custom `label` prop
  - `useId()` generates unique SVG IDs per instance
  - No unused SVG definitions (no orphaned `<filter>` or `<clipPath>`)
- **Validation:** Visual inspection of all variants; `tsc --noEmit` passes.

#### 1.2 — Export components from `@edforge/ui` index
- **File:** `packages/ui/src/index.ts`
- **Description:** Add exports for all three components and their TypeScript prop types.
- **Acceptance:** All importable from `@edforge/ui`; no build errors downstream.
- **Validation:** `tsc --noEmit` on the UI package.

---

## Sprint 2: Settings Module Annotations

**Sprint Goal:** Annotate unreleased features in the Settings area with consistent Coming Soon states.

**Demo:** Navigate Settings > Account, Security, and Security Policies pages to show annotations.

### Tickets

#### 2.1 — Account Page: Avatar upload "Coming Soon"
- **File:** `apps/shell/src/pages/settings/account.tsx`
- **Description:** Replace interactive avatar upload (drag-drop, file picker, state, handlers) with static avatar display + `ComingSoonBadge`. Disable Upload/Remove buttons. Remove dead code: `useState` for `avatarUploading`, `useRef`, drag-drop handlers, `Camera` import, `handleAvatarUpload`, `handleAvatarRemove`. Add `COMING_SOON: avatar-upload` comment.
- **Acceptance:**
  - Avatar image displays statically (no click/drag handlers)
  - Upload/Remove buttons disabled
  - `ComingSoonBadge` + helper text visible
  - No dead state/handlers/imports
  - Personal info form (name, email, phone, address) fully functional
  - `COMING_SOON:` comment present for grep discoverability
- **Validation:** Navigate to `/settings/account`; confirm badge visible; form submit works.

#### 2.2 — Security Page: Replace MFA & Sessions tabs with `ComingSoonBanner`
- **File:** `apps/shell/src/pages/settings/security.tsx`
- **Description:** Replace both the MFA and Sessions tab content from inline `ComingSoonPanel` to shared `ComingSoonBanner` (variant: `security`). Delete the local `ComingSoonPanel` component definition and `ComingSoonPanelProps` interface. Remove unused imports: `Monitor`, `Shield`, `LucideIcon`. Add `COMING_SOON:` comments.
- **Acceptance:**
  - MFA tab shows `ComingSoonBanner` with security illustration
  - Sessions tab shows `ComingSoonBanner` with security illustration
  - Password tab fully functional (no changes)
  - No `ComingSoonPanel` or unused imports remain
  - `COMING_SOON:` comments present
- **Validation:** Navigate to `/settings/security`; click all three tabs; `tsc --noEmit` passes.

#### 2.3 — Security Policies: Audit Log "Coming Soon"
- **File:** `apps/shell/src/pages/settings/rbac-security.tsx`
- **Description:** Replace Audit Log tab content (static event cards) with `ComingSoonBanner` (variant: `security`). Remove unused `Activity` import. Add `COMING_SOON:` comment.
- **Acceptance:**
  - Audit Log tab shows `ComingSoonBanner`
  - Feature list: permission denials, role assignments, user lifecycle, auth events
  - Roles & Permissions and User Assignments tabs unaffected
  - No unused imports
- **Validation:** Navigate to `/settings/security-policies`; click Audit Log tab.

---

## Sprint 3: Academics Module Annotations

**Sprint Goal:** Annotate the Classroom Stream tab as Coming Soon while keeping navigation quick actions functional.

**Demo:** Open a classroom detail page, show Stream tab Coming Soon, click quick actions to verify navigation.

### Tickets

#### 3.1 — Classroom Stream: Replace feed with "Coming Soon"
- **File:** `apps/academics/src/components/classrooms/stream/StreamFeed.tsx`
- **Description:** Replace `PostComposer` and feed rendering with `ComingSoonBanner` (variant: `communication`). Keep quick action buttons (Take Attendance, Open Gradebook, Classwork, View Roster) above the banner. Remove unused imports (`MessageSquare`, `useStreamPosts`, `PostComposer`, `StreamPostCard`).
- **Acceptance:**
  - Stream tab shows `ComingSoonBanner` with communication illustration
  - Quick action buttons navigate to attendance, gradebook, classwork, people tabs
  - Feature list: announcements, materials, discussions
  - Stream tab still appears in tab bar (not hidden)
  - No regression in People, Classwork, or Progress tabs
  - `PostComposer.tsx` and `StreamPostCard.tsx` source files remain for re-enablement
- **Validation:** Navigate to classroom detail; confirm banner; click each quick action; verify all four tabs work.

---

## Sprint 4: People Module Annotations

**Sprint Goal:** Replace the HR page with a clean, concise Coming Soon page.

**Demo:** Navigate to People > HR and show the simplified Coming Soon page.

### Tickets

#### 4.1 — HR Page: Replace with full-page "Coming Soon"
- **File:** `apps/people/src/routes/hr/index.tsx`
- **Description:** Replace entire HR module (3 tabs, stat cards, fake data, sub-components) with page header + `ComingSoonBanner` (variant: `admin`). Keep `BriefcaseBusiness` icon in header. Description directs users to Staff section. Remove all unused imports and sub-components.
- **Acceptance:**
  - Page header with icon + "Human Resources" title
  - No tabs, no stat cards, no fake data
  - `ComingSoonBanner` centered with admin illustration
  - Description mentions Staff section as available alternative
  - HR sidebar link still navigates correctly
- **Validation:** Navigate to `/people/hr`; confirm clean page; verify sidebar link works.

---

## Sprint 5: Consistency Audit & Ad-hoc Cleanup

**Sprint Goal:** Find and replace all remaining ad-hoc "coming soon" text across the codebase with the shared components.

**Demo:** Navigate through analytics, messages, and special-programs modules to show consistent banners.

### Tickets

#### 5.1 — Audit all ad-hoc "coming soon" strings
- **Files:** All MFE apps
- **Description:** Search for `coming soon`, `Coming soon`, `COMING SOON` text across the codebase. Known locations:
  - `apps/analytics/src/router.tsx` — enrollment, attendance, academic, financial, custom dashboards
  - `apps/messages/src/router.tsx` — calendar, notifications, settings
  - `apps/special-programs/src/router.tsx` — IEPs, meetings, goals, 504, accommodations, etc.
  - `apps/shell/src/pages/settings/preferences.tsx` — notification preferences
  - `apps/shell/src/pages/SettingsPage.tsx` — search placeholder
  - Various `toast.info('... coming soon')` calls in drawers
- **Acceptance:** Document all occurrences with file, line number, and recommended component to use.
- **Validation:** `grep -ri "coming soon" apps/` returns only standardized `ComingSoonBanner`/`ComingSoonBadge` usages or documented exceptions.

#### 5.2 — Replace ad-hoc Coming Soon text with shared components
- **Files:** Files identified in 5.1
- **Description:** Replace inline "coming soon" strings with `ComingSoonBanner` or `ComingSoonBadge` as appropriate. Toast messages for button actions (e.g., "Edit functionality coming soon") should use `ComingSoonBadge` label text format.
- **Acceptance:** All Coming Soon UI is visually consistent across the platform.
- **Validation:** Visual inspection of each replaced location.

---

## Sprint 6: QA Checklist

**Sprint Goal:** Final quality gate before production deployment.

### Automated checks
- [ ] `tsc --noEmit` passes for all modified packages
- [ ] ESLint reports no unused imports in modified files
- [ ] `grep -r "COMING_SOON:"` returns all suppressed features (verify completeness)

### Accessibility (WCAG 2.1 AA)
- [ ] All SVGs have `aria-hidden="true"`
- [ ] Badge text meets 4.5:1 contrast ratio in light/dark
- [ ] Disabled buttons have `disabled` attribute
- [ ] Screen reader announces badge text

### Responsive design (320px / 768px / 1280px)
- [ ] No horizontal overflow on mobile
- [ ] SVG illustrations scale proportionally
- [ ] Quick action buttons wrap on mobile
- [ ] Feature lists remain readable

### Cross-browser (Chrome 120+, Firefox 120+, Safari 17+)
- [ ] SVG rendering consistent
- [ ] Pulse animation works
- [ ] Dark mode renders correctly

### Dark mode
- [ ] Badge readable in both modes
- [ ] SVG illustrations maintain visual integrity
- [ ] No hardcoded light-mode colors

---

## Summary

| Sprint | Focus | Key Deliverable |
|--------|-------|-----------------|
| 1 | Foundation | Reusable Coming Soon components in `@edforge/ui` |
| 2 | Settings | Avatar, 2FA, Sessions, Audit Log annotated |
| 3 | Academics | Classroom Stream tab annotated |
| 4 | People | HR page simplified to Coming Soon |
| 5 | Consistency | All ad-hoc "coming soon" text replaced |
| 6 | QA | Accessibility, responsive, cross-browser verified |

### Files Changed (Sprints 1–4)

| File | Change |
|------|--------|
| `packages/ui/src/components/ComingSoon.tsx` | **NEW** — ComingSoonBadge, ComingSoonBanner, ComingSoonOverlay |
| `packages/ui/src/index.ts` | Added Coming Soon exports |
| `apps/shell/src/pages/settings/account.tsx` | Avatar upload disabled + badge; dead code removed |
| `apps/shell/src/pages/settings/security.tsx` | MFA & Sessions use shared ComingSoonBanner; inline ComingSoonPanel deleted |
| `apps/shell/src/pages/settings/rbac-security.tsx` | Audit Log tab uses ComingSoonBanner |
| `apps/academics/src/components/classrooms/stream/StreamFeed.tsx` | Feed replaced with ComingSoonBanner; quick actions preserved |
| `apps/people/src/routes/hr/index.tsx` | Full page replaced with simple Coming Soon |

### Re-enablement Guide

When a feature ships, search for its `COMING_SOON:` tag:

```bash
grep -r "COMING_SOON:" apps/ packages/
```

Tags currently in use:
- `COMING_SOON: avatar-upload` — `apps/shell/src/pages/settings/account.tsx`
- `COMING_SOON: mfa` — `apps/shell/src/pages/settings/security.tsx`
- `COMING_SOON: sessions` — `apps/shell/src/pages/settings/security.tsx`
- `COMING_SOON: audit-log` — `apps/shell/src/pages/settings/rbac-security.tsx`

For each tag, the comment describes what to restore. The `PostComposer.tsx` and `StreamPostCard.tsx` source files remain in the repo for Stream re-enablement. The original HR sub-components can be found in git history.

### Future Improvements (Not in scope for V1)
- **Feature flags:** Extend `TenantFeatures` with per-feature toggles for gradual rollout without code changes
- **i18n:** Make Coming Soon strings translatable via `@edforge/i18n`
- **Notify Me:** Add optional `onNotifyMe` callback to `ComingSoonBanner` for pilot user feedback
