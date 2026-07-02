# Academics — Classrooms (`/academics/classrooms`)

**Seed:** `e2e/tests/seed.spec.ts` + `mockAcademicsApi`.

`ClassroomsModule` (apps/academics/src/routes/classrooms/index.tsx) is
**tabbed** with real ARIA tabs: `role="tablist"` + `role="tab"` (ids
`overview`, `gradebook`, `policies`, `attendance`; URL-synced `?tab=`). Overview
tab: 4 StatCards + section grid/list + `BulkSectionStatusModal`. The attendance
tab hosts `AttendanceModule` (covered in depth by `attendance.spec.ts`).

### 1. Tabbed remote renders
#### 1.1 Classrooms loads with its four tabs @smoke
1. Seed TenantAdmin + academics mocks; navigate `/academics/classrooms`
2. Sidebar visible; the tablist renders tabs Overview / Gradebook / Policies /
   Attendance (by `role="tab"` name)
3. No application console errors

#### 1.2 Tab switch updates the active panel
1. Click the Gradebook tab; assert `?tab=gradebook` and the gradebook panel
   (`role="tabpanel"`) is shown
2. Click Policies; assert the grading-policy list panel shows

### 2. Section bulk seam (unblocks #237 sections-bulk-status)
#### 2.1 Overview list-view selection reveals bulk status actions
1. On the Overview tab in list view, select section rows
2. The bulk bar exposes Activate/Deactivate (deeper modal + PATCH assertions
   live in the dedicated bulk spec once seeded)
