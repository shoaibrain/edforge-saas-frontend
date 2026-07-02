# Academics — Curriculum (`/academics/curriculum`)

**Seed:** `e2e/tests/seed.spec.ts` + `mockAcademicsApi`.

`CurriculumModule` (apps/academics/src/routes/curriculum/index.tsx) —
**locally-tabbed** (plain buttons, not ARIA tabs): Courses / Grade Levels /
Standards. 4 StatCards (Total Courses, Subject Areas, Electives, Specialized).
Courses tab: `CourseFilters` + `CourseTable` + `CourseDrawer`. Add-course
button gated by `courses.create`.

### 1. Remote renders
#### 1.1 Curriculum loads with its tab set @smoke
1. Seed TenantAdmin + academics mocks; navigate `/academics/curriculum`
2. Sidebar visible; the Courses / Grade Levels / Standards tab buttons render;
   the seeded course (Mathematics) appears in the course table
3. No application console errors

#### 1.2 Tab switch renders grade-levels + standards content
1. Click Grade Levels → grade-levels content renders
2. Click Standards → standards (empty-state) content renders

### 2. Add-course affordance
#### 2.1 Add-course button present for admin
1. On `/academics/curriculum` as TenantAdmin, assert the add-course button is
   visible (by text/`aria-label`)
