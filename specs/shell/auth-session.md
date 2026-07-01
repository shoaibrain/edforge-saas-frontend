# Shell — Auth & Session

**Seed:** `e2e/tests/seed.spec.ts` (scenarios 1–2 run unauthenticated: plain `@playwright/test`, no seed)

Covers the shell's session boundary: the login surface, the protected-route
guard, and seeded-session access. Real Cognito OAuth is out of scope for
automated runs (external hosted UI); the seam is the cookie-persisted auth
store (`apps/shell/src/stores/auth.store.ts`).

### 1. Login surface

#### 1.1 Login page renders the sign-in form
**Steps:**
1. Navigate to `/login` with no session
2. Verify the "Sign in" heading is visible
3. Verify the Email and Password labeled inputs are visible

### 2. Protected-route guard

#### 2.1 Unauthenticated protected route redirects to /login
**Steps:**
1. Navigate to `/home` with no session
2. Expect a redirect to `/login`

### 3. Seeded session

#### 3.1 Seeded TenantAdmin session lands on the dashboard @smoke
**Steps:**
1. Seed a TenantAdmin session (role fixture default)
2. Navigate to `/home`
3. Verify the sidebar navigation renders (authenticated app shell)
4. Verify no redirect to `/login` occurred
