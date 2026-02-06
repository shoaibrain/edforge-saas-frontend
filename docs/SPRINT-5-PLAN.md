# Sprint 5: UI Polish — Breadcrumb, Avatar Consistency, Greeting Fix, Security Redesign

---

## Problem Statement

1. **Breadcrumb redundancy**: The Home icon (`<Home>`) in the breadcrumb is redundant — the "Home" text label already identifies the item. The icon adds visual clutter.
2. **Avatar inconsistency**: The `Avatar` component in `@edforge/ui` generates DiceBear `initials` style (text-based SR initials), while all app-level avatar utilities (`shell/src/lib/avatar.ts`, `people/src/lib/avatar.ts`) use `lorelei` style (illustrated faces). The Header user menu and Settings overview card show the wrong avatar style. Additionally, the UI package and app-level `getUserAvatar` functions generate different URL parameters for the same seed, causing mismatched avatars between components.
3. **Greeting uses wrong name**: `HomePage.tsx:43` does `user?.name?.split(' ')[0]` where `user.name` comes from Cognito's `name` claim. When the claim is empty, `mapCognitoToUserIdentity` falls back to `payload.email.split('@')[0]`, producing "shoaib.rain" instead of the backend's `displayName: "Shoaib"`. Multiple other locations also display `user.name` without `displayName` fallback.
4. **Security page is flat and sparse**: A single scrollable page with three `SettingsSection` blocks (Password active, MFA placeholder, Sessions placeholder). No tabbed navigation, no security overview summary, uses deprecated `SettingsAlert` instead of Sonner toasts.

---

## Sprint 5 Tickets

---

### 5.1 Remove Home icon from breadcrumb

**File:** `apps/shell/src/components/layout/Breadcrumbs.tsx`

**Problem:** Lines 331-333 render a `<Home>` lucide icon next to the "Home" text for the first breadcrumb item. This is visually redundant since the label already reads "Home".

**Changes:**
1. Remove lines 331-333 (the `{index === 0 && (<Home ... />)}` block)
2. Remove `Home` from the lucide-react import at line 19 (if unused elsewhere in this file)

**Acceptance criteria:**
- Breadcrumb renders as `Home > Settings > Workspace` (text only, no icon)
- Home item is still a clickable `<Link>` to `/home`
- No visual regression on other pages
- `Home` icon import removed if unused

**Validation:**
- Navigate to `/settings/workspace` — verify breadcrumb shows "Home > Settings > Workspace" without icon
- Navigate to `/people/staff` — verify "Home > People & HR > Staff Directory" without icon
- Navigate to `/home` — verify no breadcrumbs render (existing behavior preserved)
- Run `tsc --noEmit` on shell app — zero errors

---

### 5.2 Consolidate Avatar `getUserAvatar` to use `lorelei` style with consistent URL generation

**Files:**
- `packages/ui/src/utils.ts` — rewrite `getUserAvatar` to use `URLSearchParams` and `lorelei` style
- `packages/ui/src/components/Avatar.tsx` — no changes needed (consumes `getUserAvatar`)

**Problem:** Two `getUserAvatar` functions exist with different implementations:

1. **UI package** (`packages/ui/src/utils.ts:18`): Uses `initials` style, string concatenation for URL, teal background colors:
   ```ts
   export function getUserAvatar(name: string, style: string = 'initials'): string {
     const seed = encodeURIComponent(name)
     return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=0a9396,005f73,94d2bd&textColor=ffffff`
   }
   ```

2. **App-level** (`apps/shell/src/lib/avatar.ts:59-68`): Uses `lorelei` style, `URLSearchParams`, pastel backgrounds, `radius=50`, `size=128`:
   ```ts
   export function getUserAvatar(nameOrEmail: string, options?) {
     return getAvatarUrl({ seed: nameOrEmail, style: 'lorelei', ...options })
   }
   ```

The `<Avatar>` component (used by Header, Settings overview) calls the UI package version → renders text initials. App-level code (SettingsPage, SettingsPlaceholder, account page) calls the shell version → renders `lorelei` faces. Same user, two different avatars.

**Changes:**
1. In `packages/ui/src/utils.ts`, rewrite `getUserAvatar` to match the app-level convention exactly:
   ```ts
   export function getUserAvatar(name: string, style: string = 'lorelei'): string {
     const params = new URLSearchParams({
       seed: name,
       size: '128',
       radius: '50',
     })
     const bgColors = ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf']
     bgColors.forEach((color) => params.append('backgroundColor', color))
     return `https://api.dicebear.com/7.x/${style}/svg?${params.toString()}`
   }
   ```
2. No changes to `Avatar.tsx` — it already calls `getUserAvatar(name)` at line 52

**Result:** Every `<Avatar name={...} />` without an explicit `src` now renders the same `lorelei` illustrated avatar with identical URL parameters as the app-level utility, so the same seed produces the same face everywhere.

**Acceptance criteria:**
- Header user menu avatar shows `lorelei` style DiceBear (illustrated face), not initials
- Header dropdown expanded avatar (`size="lg"`) also shows `lorelei`
- Settings overview page avatar matches header avatar exactly (same URL for same seed)
- All `<Avatar>` usages without explicit `src` render `lorelei`
- Messages app avatars also show `lorelei` style (verify no visual regression)

**Validation:**
- Open app → verify top-right avatar is an illustrated face, not "SR" initials
- Click avatar → dropdown shows larger illustrated face with user info
- Navigate to `/settings` → overview avatar matches header exactly
- Open DevTools → compare `<img src>` in Header avatar vs Settings avatar — URLs should be identical for same user
- Run `tsc --noEmit` on all apps — zero errors

---

### 5.3 Use `displayName` for home greeting and all user-facing name displays

**Files:**
- `packages/types/src/auth.ts` — add `displayName` field to `UserIdentity`
- `packages/auth/src/types.ts` — add OIDC claims to `CognitoIdTokenPayload`
- `packages/auth/src/user-mapper.ts` — populate `displayName` from Cognito claims
- `apps/shell/src/stores/auth.store.ts` — update mock users with `displayName`
- `apps/shell/src/pages/HomePage.tsx` — use `displayName` for greeting
- `apps/shell/src/components/layout/Header.tsx` — use `displayName` in dropdown (3 locations)
- `apps/shell/src/pages/SettingsPage.tsx` — use `displayName` in settings overview
- `apps/shell/src/components/layout/pages/SettingsPlaceholder.tsx` — use `displayName` in placeholder
- `apps/shell/src/components/layout/pages/HomePage.tsx` — use `displayName` in alternative home page

**Problem:** The greeting reads "Good morning, shoaib.rain" because:
1. `UserIdentity` has only `name: string` (no `displayName`)
2. `mapCognitoToUserIdentity` sets `name: payload.name ?? payload.email.split('@')[0]`
3. When Cognito's `name` claim is empty/not set, it falls back to email prefix
4. `HomePage.tsx:43` does `user?.name?.split(' ')[0]` — gets "shoaib.rain"

The backend API returns `displayName: "Shoaib"` which is the user's preferred display name. Multiple other components also display `user.name` directly:
- `Header.tsx:43,62,64` — avatar and dropdown display
- `SettingsPage.tsx:47,53` — settings overview avatar and name
- `SettingsPlaceholder.tsx:234,235,241` — settings placeholder avatar and name
- `components/layout/pages/HomePage.tsx:215` — alternative home page greeting

**Changes:**

**Step 1: Add OIDC claims to `CognitoIdTokenPayload`** (`packages/auth/src/types.ts`)
Add optional standard OIDC claims that Cognito may return:
```ts
// Add after line 27 (picture field):
/** User's preferred username */
preferred_username?: string
/** User's nickname */
nickname?: string
/** User's given (first) name */
given_name?: string
/** User's family (last) name */
family_name?: string
```

**Step 2: Add `displayName` to `UserIdentity`** (`packages/types/src/auth.ts`)
```ts
export interface UserIdentity {
  id: string
  email: string
  name: string
  displayName?: string  // ← ADD: User's preferred display name
  globalRole: GlobalRole
  tenantId: string
  assignments: Record<string, SchoolRole>
  childrenIds?: string[]
  avatarUrl?: string
}
```

**Step 3: Populate from Cognito** (`packages/auth/src/user-mapper.ts`)
In both `mapCognitoToUserIdentity` and `mapCognitoToPartialUserIdentity`:
```ts
displayName: payload.given_name || payload.nickname || payload.preferred_username || undefined,
```
Note: `given_name` is prioritized because the backend's `displayName` field typically contains the first/given name.

**Step 4: Update mock users** (`apps/shell/src/stores/auth.store.ts`)
Add `displayName` to each mock user:
```ts
'tenant-admin': { ..., displayName: 'Sarah' },
'principal': { ..., displayName: 'James' },
'teacher': { ..., displayName: 'Emily' },
'accountant': { ..., displayName: 'Michael' },
'student': { ..., displayName: 'Alex' },
'parent': { ..., displayName: 'Robert' },
```

**Step 5: Update all consumer locations**

| File | Line(s) | Current | Change to |
|------|---------|---------|-----------|
| `HomePage.tsx` | 43 | `user?.name?.split(' ')[0]` | `user?.displayName \|\| user?.name?.split(' ')[0]` |
| `Header.tsx` | 43 | `name={user.name}` | `name={user.name}` (avatar seed stays as full name) |
| `Header.tsx` | 62 | `name={user.name}` | `name={user.name}` (avatar seed stays as full name) |
| `Header.tsx` | 64 | `{user.name}` | `{user.displayName \|\| user.name}` |
| `SettingsPage.tsx` | 53 | `userName={user?.name}` | `userName={user?.displayName \|\| user?.name}` |
| `SettingsPlaceholder.tsx` | 241 | `{user?.name \|\| 'User'}` | `{user?.displayName \|\| user?.name \|\| 'User'}` |
| `pages/HomePage.tsx` (alt) | 215 | `user?.name?.split(' ')[0]` | `user?.displayName \|\| user?.name?.split(' ')[0]` |

**Note on Avatar seeds:** Avatar `name` props should continue using `user.name` (full name) as the DiceBear seed — NOT `displayName`. Changing the seed would change everyone's avatar. Only the text displayed to the user changes.

**Acceptance criteria:**
- Home page greeting shows "Good morning, Shoaib" (from displayName), not "Good morning, shoaib.rain"
- Header dropdown shows "Shoaib" (displayName) as primary name
- Settings overview shows "Shoaib"
- Falls back gracefully to `name.split(' ')[0]` when `displayName` is undefined
- Mock users in dev mode show correct displayName
- Avatar images are NOT changed (seeds remain `user.name`)
- No type errors across all packages

**Validation:**
- Login as real user → verify greeting shows displayName from API
- Login as mock user → verify greeting shows mock displayName
- Run `tsc --noEmit` on types, auth, shell packages — zero errors
- Check Header dropdown shows displayName
- Verify avatars are unchanged (same illustrated face as before)

---

### 5.4 Security page: Migrate `SettingsAlert` to Sonner toasts

**File:** `apps/shell/src/pages/settings/security.tsx`

**Problem:** Security page uses `SettingsAlert` for success/error feedback (lines 715-731) and inline `SettingsAlert` in `PasswordChangeModal` (line 242-247). Sprint 4 migrated all other settings pages to Sonner toasts, but security was out of scope.

**Changes:**
1. Add `import { toast } from 'sonner'`
2. Remove `SettingsAlert` from SettingsShared import
3. Remove `successMessage`/`errorMessage` state variables (lines 625-626)
4. Replace `handlePasswordSuccess` (lines 669-673):
   ```ts
   const handlePasswordSuccess = () => {
     toast.success('Password changed successfully')
     refetchOverview()
   }
   ```
5. Remove the `<AnimatePresence>` alert block (lines 715-731)
6. In `PasswordChangeModal`, add `onError` to the mutation:
   ```ts
   onError: (err) => {
     toast.error(err instanceof Error ? err.message : 'Failed to change password')
   }
   ```
   Remove the inline `<SettingsAlert type="error" ...>` block (lines 242-247)
7. Remove unused `errorMessage` references
8. Remove `AnimatePresence` import if no longer used in the main component (still used in `PasswordChangeModal`)

**Note:** `SettingsAlert` remains in `SettingsShared.tsx` — it is still used by `schools.tsx`, `school-academic-years.tsx`, and `security-post-mvp.tsx` (after ticket 5.8). Do NOT remove the component.

**Acceptance criteria:**
- Password change success → Sonner toast at bottom-right
- Password change failure → Sonner error toast
- No inline `SettingsAlert` in security page
- No `successMessage`/`errorMessage` state variables

**Validation:**
- Change password successfully → verify toast appears
- Submit with wrong current password → verify error toast
- Run `tsc --noEmit` — zero errors

---

### 5.5 Security page: Add security overview summary card

**File:** `apps/shell/src/pages/settings/security.tsx`

**Problem:** The security page has no at-a-glance summary. The `SecurityOverview` data from the API includes `securityScore`, `mfaEnabled`, `passwordLastChanged`, `activeSessions`, and `recommendations` — but only recommendations are displayed (as a warning box).

**Design:** Add a compact summary card below the header showing key security metrics:

```
┌─────────────────────────────────────────────────────┐
│  Security Overview                                   │
│                                                      │
│  ● Password     Changed 3 days ago                  │
│  ○ Two-Factor   Not enabled                         │
│  ● Sessions     1 active session                    │
│                                                      │
│  ⚠ Recommendations:                                 │
│    • Enable two-factor authentication               │
│    • Change your password regularly                  │
└─────────────────────────────────────────────────────┘
```

**Changes:**
1. Create a `SecurityOverviewCard` component within security.tsx
2. Display three status items with green dot / amber dot indicators:
   - Password: "Changed X days ago" or "Never changed" (green if < 90 days, amber otherwise)
   - Two-Factor: "Enabled" (green) / "Not enabled" (amber)
   - Sessions: "X active sessions" (informational, always neutral)
3. Below the status items, show recommendations (if any) as a subtle bulleted list with amber accent
4. Remove the standalone recommendations warning box (lines 734-751) — fold into the overview card
5. Handle error state: if `securityOverview` is null/undefined, show a subtle "Unable to load security overview" message with retry button

**Acceptance criteria:**
- Security overview card renders below header
- Shows password age, MFA status, session count
- Color-coded indicators (green for good, amber for attention needed)
- Recommendations integrated into the card
- Graceful fallback when `securityOverview` is null (error state with retry)
- Dark mode renders correctly

**Validation:**
- Navigate to `/settings/security` — verify overview card displays
- Verify password age calculation matches `getPasswordLastChanged()`
- Verify MFA shows "Not enabled" (Post-MVP)
- Verify dark mode styling
- Run `tsc --noEmit` — zero errors

---

### 5.6 Security page: Implement tabbed interface

**File:** `apps/shell/src/pages/settings/security.tsx`

**Problem:** All security sections are stacked vertically in one scrollable list. Password, MFA, and Sessions sections are visually separated only by `SettingsSection` headers. The "Coming Soon" placeholders take up vertical space and make the page feel sparse.

**Design rationale:** A tabbed interface groups related functionality into focused views. While currently only the Password tab is fully functional, this layout:
- Reduces visual noise by hiding placeholder content
- Provides clear information hierarchy
- Sets up the structure for when MFA and Sessions are implemented
- Is an intentional divergence from other settings pages — security has three distinct domains (credentials, 2FA, sessions) unlike preferences or notifications which are all active toggles

**Design:** Horizontal tab bar with scrollable overflow on mobile:

```
  [ Password ]  [ Two-Factor Auth ]  [ Sessions & Activity ]
  ─────────────────────────────────────────────────────────
```

- **Password tab** (default): Password change section with last-changed info and "Change Password" button
- **Two-Factor Auth tab**: MFA info and coming soon state
- **Sessions & Activity tab**: Sessions/login history coming soon state

**Implementation approach:**
1. Add local state: `const [activeTab, setActiveTab] = useState<'password' | 'mfa' | 'sessions'>('password')`
2. Create a `SecurityTabs` component with animated underline indicator using `motion.div` with `layoutId="security-tab-underline"`
3. Move each section's content into its tab panel
4. Use `AnimatePresence` with `motion.div` for tab content transitions (fade)
5. Remove `SettingsSection` wrappers inside tabs (redundant with tab context)

**Tab styling:**
- Container: `flex gap-6 border-b border-[rgb(var(--border-primary))]`
- Each tab button: `text-sm font-medium py-3 px-1 relative`
- Inactive: `text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))]`
- Active: `text-teal-600 dark:text-cyan-400`
- Active underline: `motion.div` with `layoutId`, `className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-500"`
- **Mobile behavior**: Horizontal scroll with `overflow-x-auto` and `-webkit-overflow-scrolling: touch`. Three tabs fit on most mobile screens, but scrolling handles edge cases.

**Acceptance criteria:**
- Three tabs render horizontally below the overview card
- Password tab is active by default
- Tab switching animates content (fade transition)
- Active tab has teal underline with smooth layoutId motion
- Password tab retains full Change Password functionality (modal + toast)
- MFA and Sessions tabs show polished coming soon states (see 5.7)
- No content layout shift on tab switch
- Tabs scroll horizontally on narrow viewports

**Validation:**
- Navigate to `/settings/security` — verify tab bar renders
- Click each tab — verify content switches with animation
- Change password from Password tab — verify modal and toast work
- Verify dark mode styling on all tabs
- Resize to 375px width — verify tabs scroll or fit
- Run `tsc --noEmit` — zero errors

---

### 5.7 Security page: Polish "Coming Soon" states for MFA and Sessions tabs

**File:** `apps/shell/src/pages/settings/security.tsx`

**Problem:** Current "Coming Soon" placeholders are minimal (icon + two lines of text). For a professional UX, these should communicate value and set expectations.

**Design for MFA tab:**
```
┌─────────────────────────────────────────────────────┐
│                    [Shield icon]                     │
│           Two-Factor Authentication                  │
│                                                      │
│   Add an extra layer of security to your account.   │
│   When enabled, you'll need your password plus a    │
│   verification code from your authenticator app     │
│   each time you sign in.                            │
│                                                      │
│   ✓ Supports Google Authenticator, Authy, etc.     │
│   ✓ Backup codes for account recovery              │
│   ✓ Required for sensitive operations              │
│                                                      │
│   [ Set Up Two-Factor Auth ]  (disabled, grayed)   │
│                                                      │
│   Coming in a future update                         │
└─────────────────────────────────────────────────────┘
```

**Design for Sessions tab:**
```
┌─────────────────────────────────────────────────────┐
│                   [Monitor icon]                     │
│              Session Management                      │
│                                                      │
│   View and manage all devices where you're          │
│   currently signed in. Revoke access to any         │
│   session you don't recognize.                      │
│                                                      │
│   ✓ See all active sessions and devices            │
│   ✓ Revoke individual or all sessions              │
│   ✓ View recent login history                      │
│                                                      │
│   Coming in a future update                         │
└─────────────────────────────────────────────────────┘
```

**Changes:**
1. Create `ComingSoonPanel` reusable component within security.tsx:
   ```ts
   interface ComingSoonPanelProps {
     icon: LucideIcon
     title: string
     description: string
     features: string[]
     actionLabel?: string
   }
   ```
2. Use for both MFA and Sessions tabs
3. Centered layout with icon (in tinted circle), title, description paragraph, feature checklist with teal check icons, optional disabled action button, and "Coming in a future update" note
4. Feature checklist items use `Check` icon in teal with `text-sm` text

**Acceptance criteria:**
- MFA tab shows descriptive coming soon panel with feature list
- Sessions tab shows descriptive coming soon panel with feature list
- Disabled action button (grayed out, cursor-not-allowed) — only shown if `actionLabel` is provided
- "Coming in a future update" text at bottom in tertiary color
- Consistent styling between the two panels
- Dark mode correct

**Validation:**
- Switch to MFA tab — verify panel renders with correct content
- Switch to Sessions tab — verify panel renders
- Verify disabled button cannot be clicked
- Verify dark mode
- Run `tsc --noEmit` — zero errors

---

### 5.8 Security page: Clean up disabled Post-MVP code

**File:** `apps/shell/src/pages/settings/security.tsx`

**Problem:** The file contains ~350 lines of disabled code:
- `_MfaSetupModal` (lines 278-498) — prefixed with `_`, `@ts-expect-error`, `eslint-disable`
- `_SessionCard` (lines 513-572) — same
- `_LoginHistoryItem` (lines 585-611) — same
- Commented-out query/mutation blocks (lines 640-667)
- `getDeviceIcon` helper (lines 65-76) — `eslint-disable` for unused

This dead code adds 350+ lines of noise and will cause drift as the codebase evolves.

**Changes:**
1. Move `_MfaSetupModal`, `_SessionCard`, `_LoginHistoryItem`, and `getDeviceIcon` to a new file: `apps/shell/src/pages/settings/security-post-mvp.tsx`
   - Export them as named exports for future use
   - Remove `_` prefix, `@ts-expect-error`, and `eslint-disable` comments
   - Add a file header comment: "Post-MVP security components. Import back into security.tsx when backend support is ready."
   - Move necessary imports (`Eye`, `EyeOff`, `QrCode`, `Copy`, `Check`, `Monitor`, `Smartphone`, `Tablet`, `Globe`, `LogOut`, `MapPin`, `Clock`, `XCircle`, `CheckCircle2`, `Shield`) to the new file
   - Move `PasswordStrengthIndicator` to the new file as well (it's used by `MfaSetupModal`'s sibling `PasswordChangeModal` — wait, no, it's used by the current `PasswordChangeModal`. Keep it in security.tsx.)
2. Remove the commented-out query/mutation blocks from security.tsx
3. Clean up imports in security.tsx — remove any that are no longer used after extraction
4. Remove unused schema imports (`mfaVerificationSchema`, `MfaVerificationFormValues`) if only used by extracted components

**Acceptance criteria:**
- security.tsx reduced to ~200-300 lines (from 830)
- Post-MVP code preserved in security-post-mvp.tsx with clean exports
- No `@ts-expect-error` or `eslint-disable` in security.tsx
- No commented-out code blocks
- All imports in security.tsx are used
- security-post-mvp.tsx compiles without errors

**Validation:**
- Run `tsc --noEmit` — zero errors in both files
- Verify security page renders correctly
- Verify password change still works
- Grep for `@ts-expect-error` in security.tsx — zero results

---

### 5.9 Final build verification and visual QA

**Files:** All modified files

**Changes:** None — this is a verification-only ticket.

**Checklist:**
- [ ] `tsc --noEmit` passes for shell, people, types, auth, ui packages
- [ ] Breadcrumb: no Home icon, text-only "Home" link
- [ ] Avatar: lorelei style in Header dropdown, Settings overview, everywhere `<Avatar>` is used without `src`
- [ ] Avatar URLs identical between Header and Settings overview for same user (check in DevTools)
- [ ] Greeting: displays `displayName` (or graceful fallback)
- [ ] Header dropdown name shows `displayName` (or graceful fallback)
- [ ] Settings overview name shows `displayName`
- [ ] Security page: overview card, tabbed interface, Sonner toasts, no inline alerts
- [ ] Security tabs: Password (functional), MFA (coming soon), Sessions (coming soon)
- [ ] Dark mode correct on all changed pages
- [ ] No layout shifts or overflow at 1280px, 1024px, 768px viewports
- [ ] Mobile: tabs scroll on narrow screens
- [ ] No console errors or warnings
- [ ] Messages app: avatars render correctly (lorelei style, no regression)

**Validation:** Manual testing at all three viewport widths in both light and dark mode.

---

## Dependency Graph

```
5.1 Breadcrumb icon removal     — independent
5.2 Avatar style consolidation  — independent
5.3 displayName for greeting    — independent

5.4 Security: Sonner migration  — independent
5.5 Security: Overview card     — independent (can parallelize with 5.4)
5.6 Security: Tabbed interface  — depends on 5.5 (overview card placed above tabs)
5.7 Security: Coming Soon panels — depends on 5.6 (tab content areas)
5.8 Security: Code cleanup      — depends on 5.4, 5.6, 5.7 (know final used imports)

5.9 Final verification          — depends on all above
```

**Parallelization:**
- Phase A (parallel): 5.1, 5.2, 5.3, 5.4, 5.5
- Phase B (sequential): 5.6 → 5.7 → 5.8
- Phase C: 5.9

---

## Key Files Reference

| File | Ticket | Change |
|------|--------|--------|
| `apps/shell/src/components/layout/Breadcrumbs.tsx` | 5.1 | Remove Home icon |
| `packages/ui/src/utils.ts` | 5.2 | Rewrite `getUserAvatar` to use `lorelei` + `URLSearchParams` |
| `packages/types/src/auth.ts` | 5.3 | Add `displayName?` to `UserIdentity` |
| `packages/auth/src/types.ts` | 5.3 | Add OIDC claims to `CognitoIdTokenPayload` |
| `packages/auth/src/user-mapper.ts` | 5.3 | Populate `displayName` from Cognito claims |
| `apps/shell/src/stores/auth.store.ts` | 5.3 | Add `displayName` to mock users |
| `apps/shell/src/pages/HomePage.tsx` | 5.3 | Use `displayName` for greeting |
| `apps/shell/src/components/layout/Header.tsx` | 5.3 | Use `displayName` in dropdown |
| `apps/shell/src/pages/SettingsPage.tsx` | 5.3 | Use `displayName` in settings overview |
| `apps/shell/src/components/layout/pages/SettingsPlaceholder.tsx` | 5.3 | Use `displayName` in placeholder |
| `apps/shell/src/components/layout/pages/HomePage.tsx` | 5.3 | Use `displayName` in alt home page |
| `apps/shell/src/pages/settings/security.tsx` | 5.4-5.8 | Full redesign |
| `apps/shell/src/pages/settings/security-post-mvp.tsx` | 5.8 | New file for disabled components |

## Technical Notes

- **DiceBear API version**: All code uses `7.x`. Keep consistent.
- **Avatar seed consistency**: The `lorelei` style generates a unique illustrated face from the seed string. Avatar `name` props must continue using `user.name` (full name) as seed — NOT `displayName`. Changing seeds would change everyone's avatar.
- **Dual `getUserAvatar` coexistence**: After ticket 5.2, both the UI package and app-level `getUserAvatar` produce `lorelei` style with identical URL parameters. The app-level function adds more features (per-role styles like `avataaars` for students, `bottts` for schools) and is used for those specialized cases. The UI package function is the general-purpose default. No consolidation beyond parameter alignment is needed — they serve different scopes.
- **Cognito claims for displayName**: Standard OIDC claims include `preferred_username`, `nickname`, and `given_name`. The `CognitoIdTokenPayload` type must be updated to include these optional fields before the mapper can reference them. Check which claim your Cognito user pool is configured to return. `given_name` maps closest to the backend's `displayName`.
- **Tab animation**: Use `framer-motion`'s `layoutId` for the underline indicator. This creates a smooth sliding effect as the underline moves between tabs.
- **SettingsAlert remaining consumers**: After 5.4 and 5.8, `SettingsAlert` is still used by `schools.tsx`, `school-academic-years.tsx`, and `security-post-mvp.tsx`. The component stays in `SettingsShared.tsx`. Do NOT remove it.
- **Tab state is not URL-persisted**: Using `useState` for tab selection means bookmarks and shared links always land on Password tab. This is acceptable for now. If deep-linking to MFA/Sessions is ever needed, migrate to URL search params (`?tab=mfa`).

## Review Findings Incorporated

This plan was reviewed by a senior frontend architect. The following findings from the review have been addressed:

1. **`CognitoIdTokenPayload` type gap** — Added `packages/auth/src/types.ts` to ticket 5.3 Step 1 to include `preferred_username`, `nickname`, `given_name`, `family_name` OIDC claims. Without this, the mapper changes would cause TS errors.

2. **Missing consumer locations for `displayName`** — Added `SettingsPage.tsx`, `SettingsPlaceholder.tsx`, and alternative `HomePage.tsx` to ticket 5.3 Step 5 with a complete table of all locations that display `user.name`.

3. **Avatar URL parameter mismatch** — Ticket 5.2 now specifies rewriting the UI package `getUserAvatar` to use `URLSearchParams` with identical parameters to the app-level function, ensuring the same seed produces the same DiceBear URL everywhere.

4. **`SettingsAlert` consumers note corrected** — Technical note now accurately lists `schools.tsx`, `school-academic-years.tsx`, and `security-post-mvp.tsx` as remaining consumers.

5. **Dependency graph optimized** — 5.5 (overview card) no longer depends on 5.4 (Sonner migration). They can be parallelized in Phase A.

6. **Mobile tab behavior specified** — Ticket 5.6 now specifies `overflow-x-auto` horizontal scrolling for tabs on narrow viewports.

7. **Error state for security overview** — Ticket 5.5 now includes error state handling when `securityOverview` is null.

8. **Avatar seed preservation noted** — Ticket 5.3 explicitly notes that avatar `name` props must NOT be changed to `displayName` to avoid changing everyone's avatar appearance.
