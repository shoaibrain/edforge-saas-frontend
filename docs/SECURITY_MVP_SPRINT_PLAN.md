# Security & Self-Password Reset — MVP Sprint Plan

> **Scope**: Fix critical auth bugs, remove developer mode, redesign login page, polish security settings.
> **Branch**: `self-password-reset`
> **Optimized for**: MVP production deployment

---

## Prerequisites & Backend Dependencies

Before starting implementation, the following must be confirmed:

| # | Dependency | Owner | Status |
|---|-----------|-------|--------|
| D1 | **Verify backend response code for wrong password** — Does `POST /users/:id/security/change-password` return `401` or `400` when current password is wrong? The identity service logs show `401 UNAUTHORIZED`. If it returns 401, the frontend `skipAuthRedirect` fix is required. Ideally, backend should return `400 Bad Request` (it's a validation error, not an auth error). | Backend | Needs verification |
| D2 | **Backend `GET /users/:id/security` must return accurate `passwordLastChanged`** — Currently returns `null`, causing "Never changed" even after password was reset via Cognito. The backend SecurityService must read the password change timestamp from Cognito user attributes or the database. | Backend | Needs fix |
| D3 | **Backend APIs must be stable** — After Sprint 2 removes mock fallbacks, the frontend depends entirely on these endpoints: `GET /tenants/:id`, `GET /tenants/:id/schools`, `GET /schools/:id/academic-years/current`, `GET /users/me`. If these are flaky, authenticated users will see loading/error states instead of data. | Backend/Infra | Must be stable before Sprint 2 merge |
| D4 | **Cognito Hosted UI forgot-password deep link** — Verify that `https://{domain}/forgotPassword?client_id={id}&redirect_uri={uri}` works for the configured user pool. This is a standard Cognito Managed Login feature but needs testing. | Infra | Needs verification |

---

## Known Risks & Technical Debt (Out of Scope)

| Risk | Description | Mitigation |
|------|-------------|-----------|
| **401 interceptor race condition** | Multiple concurrent 401 responses can race — e.g., password change returns 401 (caught by `skipAuthRedirect`) while a background query also returns 401 (real token expiry). The `isRedirecting` boolean flag with `setTimeout(2000)` reset is brittle. | Document for future: implement token refresh attempt before clearing auth. |
| **Cookie vs localStorage cleanup mismatch** | `api.ts:105` calls `localStorage.removeItem('edforge-auth')` but auth store persists to **cookies** (auth.store.ts:330-333). The localStorage cleanup is a no-op. On page reload after 401, cookie-persisted state is restored, potentially causing a redirect loop. | Fixed in Sprint 1 (Task 1.5). |
| **Duplicate 401 interceptors** | `apps/academics/src/lib/api.ts` and `apps/people/src/lib/api.ts` have identical 401 interceptors. The `skipAuthRedirect` pattern must be applied there too, or extracted to a shared package. | Track as follow-up: extract to `@edforge/api-client` shared package. |
| **ShellContextValue is a cross-module contract** | The `ShellContextValue` interface is consumed by federated modules via `useShell()`. Removing or changing the `login` field could break module builds. | Audit all consumers in Sprint 2 before removing. |

---

## Sprint 1: Critical Auth Infrastructure Fixes

**Goal**: Password change works end-to-end without kicking the user out. Error messages are displayed correctly. Auth state cleanup is consistent.

**Demo**: User navigates to Settings > Security > clicks "Change" > enters wrong current password > sees inline error "Current password is incorrect" > stays logged in. Then enters correct password > sees success toast > overview updates to "Changed today".

### Tasks

#### 1.1 — Extend typed API helpers to accept Axios request config

**Files**: `apps/shell/src/lib/api.ts`

**Work**:
- Add an optional `config?: AxiosRequestConfig` parameter to `apiPost`, `apiGet`, `apiPatch`, `apiPut`, `apiDelete`
- Forward the config to the underlying `api.post(url, body, config)`, `api.get(url, { ...config, params })`, etc.
- Define a TypeScript interface for the `meta` property:
  ```typescript
  interface ApiRequestMeta {
    skipAuthRedirect?: boolean
    gracefulDegradation?: boolean // already used by 403 handler
  }
  ```
- Replace the existing `(error.config as any)?.meta` cast in the 403 handler with the typed version

**Validation**:
- `pnpm tsc --noEmit` passes
- Existing API calls continue to work (no breaking changes — parameter is optional)

---

#### 1.2 — Add `skipAuthRedirect` check to 401 interceptor

**Files**: `apps/shell/src/lib/api.ts`

**Work**:
- In the 401 response interceptor (line 85), add a check before clearing auth:
  ```typescript
  const meta = error.config?.meta as ApiRequestMeta | undefined
  if (meta?.skipAuthRedirect) {
    return Promise.reject(error)
  }
  ```
- This check must happen **before** any side effects (setState, signOut, redirect)

**Validation**:
- Manual test: Make a request with `skipAuthRedirect: true` that returns 401 → promise rejects, auth store is untouched, no redirect
- Manual test: Make a regular request that returns 401 → existing behavior (clear auth, redirect to login)

---

#### 1.3 — Apply `skipAuthRedirect` to change-password API call

**Files**: `apps/shell/src/services/users.service.ts`

**Work**:
- Update `changePassword()` to pass the meta flag:
  ```typescript
  export async function changePassword(userId: string, data: ChangePasswordDto) {
    return apiPost(`/users/${userId}/security/change-password`, data, {
      meta: { skipAuthRedirect: true },
    })
  }
  ```

**Validation**:
- Call `changePassword` with wrong password against running backend → returns rejected promise with error details, user stays authenticated
- Call `changePassword` with correct password → returns success

---

#### 1.4 — Improve error handling and display in PasswordChangeModal

**Files**: `apps/shell/src/pages/settings/security.tsx`

**Work**:
- Add a `formError` state to the modal for inline error display
- Update mutation `onError` to extract the backend message from `AxiosError`:
  ```typescript
  onError: (err) => {
    const message = axios.isAxiosError(err) && err.response?.data?.message
      ? err.response.data.message
      : 'Failed to change password'
    setFormError(message)
  }
  ```
- Display inline error banner below the modal heading (red background, error icon)
- Clear error when user modifies any field (via `watch` callback or `onChange`)
- On success: show toast "Password changed successfully", close modal, refetch security overview

**Validation**:
- Wrong current password → inline red error "Current password is incorrect" inside modal, user stays logged in
- Correct password change → success toast, modal closes, overview card updates
- Network error → shows "Failed to change password" message

---

#### 1.5 — Fix cookie vs localStorage cleanup mismatch in 401 interceptor

**Files**: `apps/shell/src/lib/api.ts`

**Work**:
- Line 105 calls `localStorage.removeItem('edforge-auth')` but the auth store persists to cookies
- Replace with cookie cleanup:
  ```typescript
  document.cookie = 'edforge-auth=; path=/; max-age=0'
  ```
- Or call `useAuthStore.persist.clearStorage()` if the Zustand persist middleware exposes it

**Validation**:
- After 401-triggered logout, refresh the page → user is NOT restored from stale cookie data
- User must re-authenticate via Cognito

---

### Sprint 1 Completion Criteria
- [ ] `pnpm build` succeeds
- [ ] Password change with wrong password → inline error, no logout
- [ ] Password change with correct password → success toast, overview updates
- [ ] Regular 401 (expired token) → still clears auth and redirects to login
- [ ] Page refresh after 401 → does not restore stale session

---

## Sprint 2: Developer Mode & Mock Data Removal

**Goal**: Remove all development-only mock users, demo mode, and fallback mock data from the production codebase. Replace mock fallbacks with proper error handling.

**Demo**: App starts with only Cognito auth path. Login page has no "Developer Mode" entry point. No mock data leaks into production. When backend APIs are unavailable, the app shows a clear "Unable to load workspace" error instead of fake data.

### Tasks

#### 2.1 — Remove MOCK_USERS, MOCK_SCHOOLS, and loginAsMock from auth store

**Files**: `apps/shell/src/stores/auth.store.ts`

**Work** (single atomic commit — these are interdependent):
- Delete `MOCK_USERS` Record (lines 55-129)
- Delete `MOCK_SCHOOLS` export (lines 132-136)
- Remove `loginAsMock` from `AuthStore` interface (line 43)
- Delete the `// Dev mode - will be removed in production` comment (line 42)
- Delete the `// MOCK DATA` section header comments (lines 50-53)
- Delete `loginAsMock` implementation (lines 281-300)
- Delete `getPrimaryRole` helper function (lines 388-391)
- Delete `mockUserOptions` export (lines 394-410)

**Validation**:
- `pnpm tsc --noEmit` passes (expect errors in downstream files — those are fixed in subsequent tasks)
- `grep -r "MOCK_USERS\|MOCK_SCHOOLS\|loginAsMock\|mockUserOptions\|getPrimaryRole" apps/shell/src/stores/auth.store.ts` returns 0 results

---

#### 2.2 — Remove Developer Mode UI from LoginPage

**Files**: `apps/shell/src/components/layout/LoginPage.tsx`

**Work**:
- Delete `DEMO_USERS` array (lines 28-66)
- Remove `loginAsMock` from `useAuthStore` destructuring (line 69)
- Delete `isDevMode` state (line 72)
- Delete `selectedUser` state (line 73)
- Delete `handleDevModeLogin` function (lines 119-124)
- Delete the "Or" divider block (lines 204-214) — orphaned after dev mode removal
- Delete dev mode toggle button (lines 216-223)
- Delete entire dev mode card section (lines 225-289)
- Clean footer to remove conditional — only keep "Secure authentication powered by AWS Cognito" (line 302)
- Remove `AnimatePresence` wrapper since there's now only one state (no mode switching)
- **Clean up unused imports**: Remove `Shield`, `GraduationCap`, `DollarSign`, `Book`, `UserCircle`, `Code2` from lucide-react imports (lines 14-20). Only keep `LogIn`, `Loader2`, `AlertCircle`.
- Remove `useState` for `isDevMode` and `selectedUser` (only keep `isLoading` and `error`)

**Validation**:
- Login page renders with only the "Sign In with EdForge" button
- No "Developer Mode" text, "Or" divider, or demo user grid visible
- `pnpm tsc --noEmit` passes
- `grep -r "devMode\|isDevMode\|DEMO_USERS\|handleDevModeLogin\|Code2" apps/shell/src/components/layout/LoginPage.tsx` returns 0 results

---

#### 2.3 — Remove mock data and loginAsMock from shell-context

**Files**: `apps/shell/src/lib/shell-context.tsx`

**Work**:
- Delete `MOCK_TENANT` constant (lines 66-78)
- Delete `MOCK_SCHOOLS` constant (lines 80-105)
- Delete `MOCK_SCHOOL_YEAR` constant (lines 107-117)
- Delete the "MOCK DATA" section header comments (lines 62-64)
- Remove `loginAsMock` selector (line 133)
- Remove `login: (userId: string) => loginAsMock(userId)` from `shellValue` (line 292)
- Remove `loginAsMock` from `useMemo` dependency array (line 313)

**Validation**:
- `pnpm tsc --noEmit` passes (expect errors in ShellContextValue — fixed in 2.4)
- `grep -r "MOCK_TENANT\|MOCK_SCHOOLS\|MOCK_SCHOOL_YEAR\|loginAsMock" apps/shell/src/lib/shell-context.tsx` returns 0 results

---

#### 2.4 — Update ShellContextValue interface and replace mock fallbacks

**Files**: `apps/shell/src/lib/shell-context.tsx`

**Work**:
- **Audit all `useShell()` consumers**: Run `grep -r "useShell\|useTenant\|useActiveSchool\|useSchoolYear" apps/ --include="*.tsx" --include="*.ts"` to find all files that consume the shell context. Check if any use the `login` field.
- Remove `login: (userId: string) => void` from `ShellContextValue` interface (line 30) — or if any consumer uses it, provide a Cognito-based replacement
- Replace mock fallback lines:
  ```typescript
  // BEFORE
  const effectiveTenant = tenant ?? (isAuthenticated ? MOCK_TENANT : null)
  const effectiveSchools = schools ?? (isAuthenticated ? MOCK_SCHOOLS : [])
  const effectiveSchoolYear = schoolYear ?? (isAuthenticated ? MOCK_SCHOOL_YEAR : null)

  // AFTER
  const effectiveTenant = tenant ?? null
  const effectiveSchools = schools ?? []
  const effectiveSchoolYear = schoolYear ?? null
  ```
- **Null-safety audit**: Grep for all downstream accesses of `tenant`, `effectiveTenant`, `availableSchools`, and `activeSchoolYear` via context hooks. Verify each handles `null` without crashing. Key files to check:
  - `HomePage.tsx` — does it access `tenant.features`?
  - `AppShell.tsx` — does it access `tenant.name`?
  - All sidebar components — do they access `availableSchools`?
  - Any component using `useTenant()`, `useActiveSchool()`, `useSchoolYear()`
- Add null guards where needed (optional chaining, fallback values)

**Validation**:
- `pnpm tsc --noEmit` passes
- App handles API unavailability gracefully — shows loading/empty states, does not crash
- Manual test: Start app with backend down, login via Cognito → app shows loading state or error, not white screen

---

#### 2.5 — Remove AuthDebugPage, route, and sidebar entry

**Files**:
- `apps/shell/src/router.tsx`
- `apps/shell/src/config/sidebar-modules.ts`
- `apps/shell/src/pages/AuthDebugPage.tsx`

**Work**:
- Remove `AuthDebugPage` import from router.tsx (line 42)
- Remove `authDebugRoute2` route definition (lines 599-603)
- Remove `authDebugRoute2` from the route tree (line 874)
- Remove the entire `DEVELOPER` sidebar section from sidebar-modules.ts (lines 490-503)
- Clean up unused `Bug` import from lucide-react in sidebar-modules.ts
- Delete the `AuthDebugPage.tsx` component file

**Validation**:
- `/auth-debug` route returns 404 (NotFound component)
- Sidebar has no "DEVELOPER" section or "Auth Debug" entry
- `pnpm build` succeeds

---

#### 2.6 — Clean up remaining dev-mode references across codebase

**Files**:
- `apps/shell/src/main.tsx`
- `packages/types/src/auth.ts`

**Work**:
- Update `main.tsx` (line 24): Change the `else` branch to log a warning about missing Amplify configuration, not a "use mock users" suggestion:
  ```typescript
  } else {
    console.warn('[EdForge] Amplify configuration missing — authentication will not work')
  }
  ```
- Remove `mockUserId?: string` field from `LoginCredentials` interface in `packages/types/src/auth.ts` (line 93)
- Run a full codebase grep to verify no remaining dev-mode references in production code (excluding test files, node_modules, and build output):
  ```bash
  grep -r "mockUser\|loginAsMock\|MOCK_USERS\|MOCK_TENANT\|MOCK_SCHOOLS\|MOCK_SCHOOL_YEAR\|devMode\|demo.user" \
    --include="*.ts" --include="*.tsx" \
    apps/ packages/ \
    | grep -v node_modules | grep -v dist | grep -v ".test." | grep -v ".spec."
  ```

**Validation**:
- Grep returns 0 production-code results (test files like `engine.test.ts` with `mockUser()` helper are acceptable)
- `pnpm tsc --noEmit` passes across all packages

---

#### 2.7 — Full build and smoke test

**Files**: None (verification only)

**Work**:
- Run `pnpm build` — must succeed with zero errors
- Run `pnpm tsc --noEmit` — must pass for all packages
- Manual smoke test:
  1. Navigate to `/` — see landing page
  2. Click "Sign In" — navigate to `/login`
  3. Login page shows only "Sign In with EdForge" button (no dev mode)
  4. Sign in via Cognito → redirected to `/home`
  5. Navigate to all settings pages — no crashes
  6. Navigate to `/auth-debug` — see 404 page
  7. Check sidebar — no "Developer" section

**Validation**:
- Clean build
- All 7 smoke test steps pass

---

### Sprint 2 Completion Criteria
- [ ] Zero mock/demo references in production code
- [ ] Login page: single Cognito auth path only
- [ ] No AuthDebugPage or Developer sidebar section
- [ ] App gracefully handles missing API data (null tenant, empty schools)
- [ ] `pnpm build` succeeds
- [ ] Full smoke test passes

---

## Sprint 3: Login Page Redesign

**Goal**: Enterprise-grade, accessible login page with polished branding and clear UX flow.

**Demo**: Professional login page with EdForge branding, prominent sign-in button, "Forgot Password?" link, responsive design on mobile/tablet/desktop.

### Tasks

#### 3.1 — Redesign login card with solid background and improved layout

**Files**: `apps/shell/src/components/layout/LoginPage.tsx`

**Work**:
- Replace `<Card glass>` with a solid, well-themed card:
  - Opaque white background in light theme, dark surface in dark theme
  - Subtle border and shadow (not glass/blur effect which looks basic)
  - Larger border-radius (2xl or 3xl) for modern feel
- Improve typography hierarchy:
  - Larger "Welcome Back" heading (text-2xl or text-3xl, font-bold)
  - Subtitle with proper contrast against card background
- Increase card padding (p-8 or p-10 instead of p-6)
- Make the "Sign In with EdForge" button more prominent:
  - Full-width, larger size
  - EdForge brand teal color with hover state
  - Clear icon + text
- Ensure the card looks good against the gradient background on both themes

**Validation**:
- Visual review: card is readable, text has strong contrast, button is prominent
- Test with both light and dark themes applied

---

#### 3.2 — Add EdForge brand mark to login page

**Files**: `apps/shell/src/components/layout/LoginPage.tsx`

**Work**:
- Add EdForge logo or icon above the "Welcome Back" text
  - Can be an SVG logo component, or a styled icon from the existing design system
  - If no logo SVG exists, use a styled text mark with the EdForge icon
- Proper sizing: not overwhelming, proportional to the card (32-48px)
- Centered alignment above the heading

**Validation**:
- Logo renders correctly on mobile (375px), tablet (768px), desktop (1440px)
- Logo does not distort or clip on any viewport

---

#### 3.3 — Add "Forgot Password?" link

**Files**:
- `apps/shell/src/components/layout/LoginPage.tsx`
- `packages/auth/src/service.ts` (or `config.ts`)

**Work**:
- Add a `getForgotPasswordUrl()` helper function to the `@edforge/auth` package:
  ```typescript
  export function getForgotPasswordUrl(): string | null {
    const config = getAuthConfig()
    if (!config) return null
    const redirectUri = encodeURIComponent(config.redirectSignIn)
    return `https://${config.domain}/forgotPassword?client_id=${config.userPoolClientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid+email+profile`
  }
  ```
- In `LoginPage.tsx`, add a "Forgot your password?" text link below the sign-in button
- On click, navigate to the Cognito forgot-password URL using `window.location.href`
- Style as a subtle text link (teal color, underline on hover)
- If `getForgotPasswordUrl()` returns null (no Cognito config), hide the link

**Validation**:
- Clicking the link navigates to the Cognito forgot-password page
- The Cognito page accepts the parameters and shows the reset form
- After completing password reset, user is redirected back to the app
- Link is not shown when Cognito is not configured

---

#### 3.4 — Improve loading and error states

**Files**: `apps/shell/src/components/layout/LoginPage.tsx`

**Work**:
- Improve the loading state during Cognito redirect:
  - Show a pulsing EdForge icon or subtle spinner
  - Display "Redirecting to sign in..." text
- Improve error display:
  - Keep the existing error banner but make it more prominent
  - Add a "Try Again" button that clears the error and resets state
- Handle edge case: authenticated user manually navigates to `/login` → redirect to `/home` (already exists via `useEffect`, verify it works)
- Handle edge case: OAuth error callback (already exists, verify error message display)

**Validation**:
- Loading state shows during Cognito redirect (before browser navigates away)
- OAuth error → clear error message with retry option
- Authenticated user on `/login` → redirected to `/home`

---

#### 3.5 — Responsive design and accessibility

**Files**: `apps/shell/src/components/layout/LoginPage.tsx`

**Work**:
- Test login page on:
  - Mobile: 375px width
  - Tablet: 768px width
  - Desktop: 1440px width
- Ensure card does not overflow on small screens
- Add `aria-label` to the sign-in button
- Ensure proper heading levels (`h1` for page, `h2` for card title)
- Verify focus states are visible for keyboard navigation (tab through all interactive elements)
- Ensure color contrast meets WCAG AA (4.5:1 for body text, 3:1 for large text)

**Validation**:
- Card renders correctly at all three viewport sizes
- Keyboard-only navigation works (tab → sign-in button → forgot password link)
- No accessibility warnings from browser dev tools audit

---

#### 3.6 — Clean up footer and final polish

**Files**: `apps/shell/src/components/layout/LoginPage.tsx`

**Work**:
- Remove the conditional footer text (dev mode conditional was removed in Sprint 2)
- Keep "Secure authentication powered by AWS Cognito" or update to a more branded footer
- Ensure consistent bottom spacing
- Final visual review of the entire page

**Validation**:
- Footer displays correct, non-conditional text
- Visual sign-off on the complete login page

---

### Sprint 3 Completion Criteria
- [ ] Login page matches enterprise design expectations
- [ ] EdForge branding is visible and professional
- [ ] "Forgot Password?" link works end-to-end
- [ ] Responsive on mobile, tablet, desktop
- [ ] Keyboard navigation and accessibility are functional
- [ ] `pnpm build` succeeds

---

## Sprint 4: Security Settings Polish & Integration Verification

**Goal**: Security settings page accurately reflects account security state, provides reliable password management, and clearly communicates deferred features.

**Demo**: User changes password from Settings > Security → overview immediately shows "Changed today". Error states handled gracefully. "Two-Factor Auth" and "Sessions & Activity" tabs display polished "Coming Soon" messaging.

### Tasks

#### 4.1 — Verify and fix security overview API integration

**Files**: `apps/shell/src/pages/settings/security.tsx`

**Work**:
- Test the full flow: change password → refetch security overview → verify `passwordLastChanged` updates
- If backend returns `null` for `passwordLastChanged` after a password change:
  - File a backend ticket (see Dependency D2)
  - As a frontend workaround, after successful password change, optimistically update the local query cache:
    ```typescript
    queryClient.setQueryData(['security', user?.id], (old: SecurityOverview) => ({
      ...old,
      passwordLastChanged: new Date().toISOString(),
    }))
    ```
- Ensure the `staleTime: 60 * 1000` on the security query allows timely updates

**Validation**:
- After password change, security overview shows "Changed today" (not "Never changed")
- If backend is slow to update, optimistic update provides immediate feedback

---

#### 4.2 — Add password requirements checklist in modal (enhancement)

**Files**: `apps/shell/src/pages/settings/security.tsx`

**Work**:
- Below the "New Password" field, add a live requirements checklist:
  - At least 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character
- Each item shows a check (green) or cross (muted) icon based on current input
- This supplements the existing `PasswordStrengthIndicator` (which shows a bar)
- Real-time updates via the `watch('newPassword')` value

**Validation**:
- Each requirement updates in real-time as user types
- All requirements green → password meets Cognito policy
- Submit button can still be clicked regardless (Zod validation is the gate)

---

#### 4.3 — Polish "Coming Soon" panels for deferred features

**Files**: `apps/shell/src/pages/settings/security.tsx`

**Work**:
- Review the Two-Factor Auth `ComingSoonPanel`:
  - Remove the disabled "Set Up Two-Factor Auth" button — it creates confusion (looks broken)
  - Keep the feature description and checklist
  - Ensure "Coming in a future update" text is clear
- Review the Sessions & Activity `ComingSoonPanel`:
  - Same treatment — no disabled action button
  - Clear description of what will be available
- Ensure both panels have consistent styling and spacing

**Validation**:
- Visual review: panels look intentional (planned features), not broken
- No disabled/grayed-out buttons that confuse users

---

#### 4.4 — Handle edge case: session expiry while on security page

**Files**: `apps/shell/src/pages/settings/security.tsx`

**Work**:
- If the `useQuery` for security overview returns an error (network or 401), show a clear error state instead of a blank page
- The `SecurityOverviewCard` already handles `undefined` overview (shows retry button) — verify this works
- If the password change modal is open when session expires, close it gracefully
- Ensure the page does not crash if `user` becomes `null` mid-render (auth store cleared)

**Validation**:
- Security overview query fails → shows "Unable to load" with retry button (already implemented)
- User remains on a non-crashed page in all error scenarios

---

#### 4.5 — Final integration test

**Files**: None (verification only)

**Work**:
- Full end-to-end test of the security settings page:
  1. Navigate to Settings > Security
  2. Verify Security Overview loads with correct data
  3. Click "Change" → enter wrong current password → see inline error → stay logged in
  4. Enter correct password change → see success toast → overview updates
  5. Click "Two-Factor Auth" tab → see polished "Coming Soon" panel
  6. Click "Sessions & Activity" tab → see polished "Coming Soon" panel
  7. Verify no console errors throughout
- Test the "Forgot Password?" flow from the login page:
  1. Navigate to `/login`
  2. Click "Forgot your password?"
  3. Complete Cognito password reset flow
  4. Verify redirect back to app works
  5. Login with new password → success

**Validation**:
- All 12 test steps pass without errors
- No console.error messages
- `pnpm build` succeeds

---

### Sprint 4 Completion Criteria
- [ ] Security overview shows accurate, real-time data
- [ ] Password change error handling is seamless (no logout on wrong password)
- [ ] Deferred features look professional, not broken
- [ ] Edge cases (session expiry, network errors) handled gracefully
- [ ] Full end-to-end flows verified

---

## File Inventory — Complete Change Map

| File | Sprint | Changes |
|------|--------|---------|
| `apps/shell/src/lib/api.ts` | S1 | Add config param to helpers, `skipAuthRedirect` check, fix cookie cleanup |
| `apps/shell/src/services/users.service.ts` | S1 | Pass `skipAuthRedirect` meta to `changePassword` |
| `apps/shell/src/pages/settings/security.tsx` | S1, S4 | Inline error display, success UX, requirements checklist, coming soon polish |
| `apps/shell/src/stores/auth.store.ts` | S2 | Remove MOCK_USERS, MOCK_SCHOOLS, loginAsMock, mockUserOptions |
| `apps/shell/src/components/layout/LoginPage.tsx` | S2, S3 | Remove dev mode (S2), redesign card/branding/forgot password (S3) |
| `apps/shell/src/lib/shell-context.tsx` | S2 | Remove mocks, fallbacks, loginAsMock, update interface |
| `apps/shell/src/router.tsx` | S2 | Remove AuthDebugPage route |
| `apps/shell/src/config/sidebar-modules.ts` | S2 | Remove DEVELOPER sidebar section |
| `apps/shell/src/pages/AuthDebugPage.tsx` | S2 | Delete file |
| `apps/shell/src/main.tsx` | S2 | Update console message |
| `packages/types/src/auth.ts` | S2 | Remove mockUserId field |
| `packages/auth/src/service.ts` | S3 | Add `getForgotPasswordUrl()` helper |

---

## Definition of Done (All Sprints)

- [ ] `pnpm build` succeeds with zero errors
- [ ] `pnpm tsc --noEmit` passes for all packages
- [ ] No mock/demo user code in production source
- [ ] Login page is enterprise-grade with single Cognito auth path
- [ ] Password change works end-to-end with proper error handling
- [ ] Security overview shows accurate account state
- [ ] Deferred features (2FA, Sessions) are clearly communicated
- [ ] No console errors during normal user flows
- [ ] Responsive on mobile, tablet, desktop
