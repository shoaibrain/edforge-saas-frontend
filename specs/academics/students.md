# Academics — Students (`/academics/students`)

**Seed:** `e2e/tests/seed.spec.ts` + `mockAcademicsApi`.

`StudentsModule` (apps/academics/src/routes/students/index.tsx): ContextBar,
4 StatCards (Total Enrolled, At-Risk, Today's Attendance, Grade Levels),
`StudentTable` with row-selection + bulk bar (message/move/archive). Create
actions gated by `students.create` permission (import IEMIS, government
reports, enroll — by `aria-label`).

### 1. Remote page renders
#### 1.1 Students list loads without console errors @smoke
1. Seed TenantAdmin + academics mocks; navigate `/academics/students`
2. Sidebar visible; the students table renders the seeded roster
   (Aarav Sharma) — or, with `{empty:true}` mocks, the empty state
3. No application console errors

#### 1.2 Create-action affordances present for admin
1. On `/academics/students` as TenantAdmin, assert the enroll-student action
   is visible (by `aria-label`)

### 2. Bulk selection seam (unblocks #237 students-bulk-archive)
#### 2.1 Selecting rows reveals the bulk action bar
1. Seed 3 students; select two row checkboxes
2. The bulk action bar appears with an Archive/Withdraw action
   (deeper archive-modal + DELETE-fanout assertions live in the dedicated
   bulk spec once this fixture lands)
