# Shell — Home Dashboard (Admin Command Center)

**Seed:** `e2e/tests/seed.spec.ts`

`/home` for administrator/educator roles renders `AdminCommandCenter`
(apps/shell/src/components/home/AdminCommandCenter.tsx), fed by
`home.service.ts` (`/academics/dashboard/overview` + fallback endpoints).
Data comes from the deterministic mock layer (`e2e/fixtures/network.ts`):
42 enrolled, 95% attendance, 4 sections.

### 1. Dashboard data

#### 1.1 KPI cards render mocked enrollment data @smoke
**Steps:**
1. Navigate to `/home` as TenantAdmin
2. Verify the "Students enrolled" KPI is visible with value 42

#### 1.2 Dashboard renders without console errors
**Steps:**
1. Collect console errors from page load
2. Navigate to `/home` as TenantAdmin
3. Verify the sidebar navigation is visible
4. Verify no console errors were captured

### 2. Role-flavored home

#### 2.1 Student lands on the student portal home
**Steps:**
1. Navigate to `/home` as Student
2. Verify the "My Grades" nav item is visible (home-student module)

#### 2.2 Parent lands on the family portal home
**Steps:**
1. Navigate to `/home` as Parent
2. Verify the "Fee Payments" nav item is visible (home-parent module)
