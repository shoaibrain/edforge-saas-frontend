# Academics — Exams (`/academics/exams`)

**Seed:** `e2e/tests/seed.spec.ts` + `mockAcademicsApi`.

`ExamsModule` (apps/academics/src/routes/exams/index.tsx): `ExamSummary`
buckets, filter chip, `ExamTable` (row-selection, bulk change-status →
`BulkExamStatusDrawer`), `ExamDrawer`. No current AY → empty state
(`examModule.noActiveYear.title`). Create button gated by
`create/assessments`; disabled unless terms + `examPattern` exist (the mock
provides both).

### 1. Remote renders
#### 1.1 Exams loads without console errors @smoke
1. Seed TenantAdmin + academics mocks (current AY + exam-pattern present);
   navigate `/academics/exams`
2. Sidebar visible; the exams module chrome renders (summary buckets / table
   or its empty state — NOT the no-active-year gate, since AY is mocked)
3. No application console errors

#### 1.2 Create-exam affordance present + enabled
1. On `/academics/exams` as TenantAdmin, the create-exam button is visible and
   enabled (terms + examPattern satisfied by the mock)

### 2. No-active-year gate
#### 2.1 Missing current AY shows the gate
1. With the current-AY endpoint returning 404/none, `/academics/exams` shows
   the no-active-year empty state instead of the table
