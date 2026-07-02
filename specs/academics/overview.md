# Academics — Overview (`/academics`)

**Seed:** `e2e/tests/seed.spec.ts` + `mockAcademicsApi` (module remote route).

`/academics` mounts the academics MFE remote and renders `Overview`
(apps/academics/src/routes/overview.tsx): ContextBar (AY chip), 4 StatCards
(Total Enrolled, Active Sections, Today's Attendance, At-Risk), attendance
alerts, trend + enrollment-by-grade charts. Guards: no active school →
`NoSchoolGuard`; AY loaded but none current → `NoAcademicYearGuard`.

### 1. Remote mounts + renders
#### 1.1 Academics overview loads the remote without console errors @smoke
1. Seed TenantAdmin + academics mocks; navigate `/academics`
2. Sidebar navigation visible; the academics module chrome renders (not the
   shell "Loading…" fallback, not `RemoteModuleError`)
3. No application console errors (external-resource noise filtered)

#### 1.2 No-school guard
1. Seed a session with NO active school (empty `edforge-app`) and navigate `/academics`
2. The "select a school" guard renders instead of the dashboard

### 2. Navigation affordances
#### 2.1 Enroll / Take-attendance actions are present
1. On `/academics`, assert the enroll-student and take-attendance action
   buttons are visible (by `aria-label`)
