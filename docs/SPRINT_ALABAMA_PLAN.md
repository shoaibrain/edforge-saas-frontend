# Sprint Alabama — Academics Module Completion Plan

**Goal:** Complete and deliver all features and functionalities in the Academics module. Every placeholder, stub, and missing integration identified in the comprehensive audit is scoped, ticketed, and scheduled for implementation.

**Methodology:** Each sub-sprint results in a demoable, buildable increment. Every ticket is an atomic, committable piece of work with a clear validation criterion.

---

## Module Audit Summary

| Area | Status | Gap |
|------|--------|-----|
| Overview Dashboard | ⚠️ Hardcoded stats | Wire to real API aggregation |
| Student Directory | ✅ Complete | — |
| Student Profile | ✅ Mostly complete | Schedule tab needs sections API wiring, GPA display |
| Attendance | ✅ Complete | Missing: Reports/analytics, date range history |
| Grades & Assessments | ✅ Complete | Missing: Report card view, transcript, grade distribution |
| Scheduling > Sections | ✅ Complete | — |
| Scheduling > Timetables | 🔲 Placeholder | Full implementation needed |
| Scheduling > Classrooms | 🔲 Placeholder | Backend Room API not started |
| Curriculum > Courses | ✅ Complete | — |
| Curriculum > Grade Levels | ✅ Complete | Edit/Export placeholders |
| Curriculum > Standards | 🔲 Placeholder | Deferred — no backend API |
| Teachers/Staff | ⚠️ Uses User fallback | Staff GSI broken on backend |
| Enrollment | ✅ Complete | — |
| Calendar | 🔲 Placeholder | No backend API |
| Export Functionality | 🔲 Placeholder toasts | CSV/PDF export for all major views |
| Student Edit | 🔲 Placeholder toast | Inline edit form needed |
| Guardian CRUD | 🔲 Placeholder toast | Add/edit guardian from profile |
| Legacy Routes | ⚠️ Redirects exist | Need cleanup/consolidation |

---

## Sub-Sprint Alabama-1: Foundation, Data Wiring & Error Infrastructure

**Demo Goal:** Overview dashboard shows real-time data; Student Profile fully aggregated; error boundaries protect all routes.

### AL-1.1: Add Error Boundaries to All Route Modules

**File:** `apps/academics/src/components/common/ErrorBoundary.tsx` (new or enhance existing)
**Description:** Create a reusable `ErrorBoundary` component that catches React render errors. Shows a friendly error message with a "Retry" button and an option to report the issue. Wrap each major route component (`students`, `attendance`, `grades`, `scheduling`, `curriculum`, `enrollment`, `teachers`, `overview`) with the error boundary. This must land first so all subsequent API wiring is protected by error handling.
**Validation:** Introduce a deliberate error in any route component → error boundary catches it → friendly message displays → "Retry" re-renders. Verify every major route is wrapped.

### AL-1.2: Wire Overview Dashboard to Real API Data

**File:** `apps/academics/src/routes/overview.tsx`
**Description:** Replace all hardcoded stat values with data from API calls. Use `useStudents` (total count), `useCourses` (total count), `useSections` (total count), and `useSchoolStaff` (total count) to populate the stats cards. For "Attendance Rate" and "Curriculum Progress" stats that lack a direct aggregation endpoint, display "—" with a tooltip "Requires aggregation data" until a backend endpoint is available. Add loading skeletons for each card.
**Validation:** Open Overview page → stats reflect actual database counts. Add a student → refresh → student count increments. "Attendance Rate" and "Curriculum Progress" show "—" gracefully with tooltip.

### AL-1.3: Wire Student Profile Schedule Tab to Sections API

**File:** `apps/academics/src/components/students/profile/ScheduleTab.tsx`
**Description:** The Schedule tab currently renders data from the profile response's `classrooms` field which contains basic section info. Enhance this by creating a `getStudentSections(studentId, academicYearId)` service function calling `GET /academics/students/:id/sections?academicYearId=`. Create a `useStudentSections` hook. Wire the ScheduleTab to display the student's section enrollments with course name, section number, teacher, room, and schedule (days/times). Fall back to the existing `classrooms` data if the sections endpoint returns empty.
**Validation:** Open student profile → Schedule tab → shows enrolled sections with course name, teacher, and room. If student has no sections, shows meaningful empty state.

### AL-1.4: Wire Student Profile Grades Tab with GPA Display

**File:** `apps/academics/src/components/grades/StudentGradesView.tsx`
**Description:** Ensure the Grades tab in Student Profile uses the `GET /academics/students/:id/grades?academicYearId=&termId=` endpoint which returns grades + GPA object. Display the computed GPA prominently at the top of the grades view (weighted and unweighted). Show grade breakdown by course with letter grade, percentage, and credits.
**Validation:** Open student profile with recorded grades → Grades tab shows courses, letter grades, and cumulative GPA. Student without grades shows "No grades recorded" empty state.

### AL-1.5: Wire Student Drawer Quick Stats (GPA & Attendance)

**File:** `apps/academics/src/components/students/StudentDrawer.tsx`
**Description:** The GPA and Attendance stat cards in the Student Drawer currently show "—". Add lightweight React Query calls to `GET /academics/students/:id/grades?academicYearId=` (for GPA) and `GET /academics/students/:id/attendance/summary` (for attendance rate) that fire when the drawer opens. Use `staleTime: 5 * 60 * 1000` to avoid refetching on repeated opens. Display the GPA value and attendance percentage, or gracefully show "—" if no data exists.
**Validation:** Open student drawer for a student with grades → GPA card shows value. For student with attendance → attendance rate shows. For students with no data → shows "—".

---

## Sub-Sprint Alabama-2: Student Edit & CRUD Completeness

**Demo Goal:** Students can be edited inline from the drawer and profile page. Guardian CRUD is functional.

### AL-2.1: Create Student Edit Form Schema

**File:** `apps/academics/src/schemas/student.edit.schema.ts` (new)
**Description:** Create a Zod validation schema for the student edit form, derived from `UpdateStudentDto` in `@edforge/shared-types`. Include field-level validation messages for all fields: firstName (required, min 1 char), lastName (required), dateOfBirth (valid date, not in future), gender (valid enum), email (valid email format or empty), phone (valid format or empty). Define form field groups: Basic Info, Contact, Demographics, Programs.
**Validation:** Schema compiles without errors. All required fields have validation rules. Invalid data is rejected with appropriate error messages. Write a test file or use a schema playground to verify edge cases (empty strings, future dates, invalid emails).

### AL-2.2: Create Student Edit Form Component

**File:** `apps/academics/src/components/students/StudentEditForm.tsx` (new)
**Description:** Build a multi-section form using React Hook Form + Zod resolver. Sections: Basic Information (firstName, lastName, middleName, preferredName, dateOfBirth, gender), Contact (email, phone, address fields), Demographics (ethnicity, primaryLanguage), Programs (specialPrograms, accommodations as tag inputs). Use the same form patterns as `CourseForm.tsx` — same input styling, section headers, and layout.
**Validation:** Form renders all fields. Enter invalid data → inline validation errors appear per field. Clear required fields → form prevents submission. Enter valid data → form data object is correct shape. Tab through all fields → keyboard navigation works.

### AL-2.3: Add Edit Mode to Student Drawer

**File:** `apps/academics/src/components/students/StudentDrawer.tsx`
**Description:** Add a `mode` state (`view` | `edit`) to the Student Drawer. When "Edit Student" is clicked in the three-dot dropdown, switch to edit mode showing `StudentEditForm` pre-populated with the student's data. Add Save/Cancel buttons in edit mode footer. Use `useUpdateStudent` mutation on save. On success, invalidate the student query, show success toast, and return to view mode.
**Validation:** Click three-dot → Edit Student → form appears with current data → modify a field → Save → drawer returns to view mode with updated data. Cancel → returns to view without changes. Server error → error toast, stays in edit mode.

### AL-2.4: Add Edit Capability to Student Profile Page

**File:** `apps/academics/src/routes/students/$studentId.tsx`
**Description:** Add an "Edit" button to the Student Profile page header. When clicked, open the Student Drawer in edit mode (reuse `StudentEditForm` in a modal overlay). On save, profile page data refreshes automatically via React Query invalidation.
**Validation:** Click Edit on profile page → form opens → save → profile page reflects changes immediately.

### AL-2.5: Add Guardian CRUD from Student Profile

**File:** `apps/academics/src/components/students/profile/FamilyTab.tsx`
**Description:** The Family tab currently shows guardian info with `toast.info('Add guardian coming soon')` and `toast.info('Edit guardian coming soon')`. Implement: Add Guardian form (inline or modal) with fields: firstName, lastName, relationship, email, phone, isPrimary. Use `useUpdateStudent` mutation to update the student's `guardians[]` array. Edit guardian: click a guardian card → inline edit. Delete guardian: confirmation dialog → remove from array.
**Validation:** Click Add Guardian → form appears → fill in → save → guardian appears in list. Click a guardian → edit inline → save → data updated. Delete guardian → confirmation → removed.

---

## Sub-Sprint Alabama-3: Timetable Visual Grid

**Demo Goal:** Timetables tab in Scheduling shows a visual weekly grid of section schedules.

> **Dependency:** AL-4.1 (Room data hook) must complete before AL-3.3 if the room filter should use aggregated room data. Otherwise, AL-3.3 falls back to raw `roomNumber` strings from sections.

### AL-3.1: Create Timetable Data Types

**File:** `apps/academics/src/types/timetable.ts` (new)
**Description:** Define TypeScript types for timetable rendering: `TimeSlot { startTime: string, endTime: string, label: string }`, `DayOfWeek`, `TimetableEntry { sectionId, sectionNumber, courseName, courseCode, teacherName, roomNumber, day, startTime, endTime, subjectArea, color }`. Define constants: `DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']`, `TIME_SLOTS` (8:00–16:00 in 30-min increments). Create a `transformSectionsToEntries(sections)` function that maps section `schedule` data to `TimetableEntry[]`.
**Validation:** Types compile. `transformSectionsToEntries` correctly maps a section with `{ days: ['Mon', 'Wed'], startTime: '09:00', endTime: '09:50' }` to two `TimetableEntry` objects (one per day). Write a unit test or manual console verification.

### AL-3.2: Create Timetable Grid Component (Core)

**File:** `apps/academics/src/components/scheduling/TimetableGrid.tsx` (new)
**Description:** Build a weekly timetable grid with days as columns and time slots as rows. Each section is rendered as a colored block positioned by its schedule. Color-code by subject area using a consistent palette. Clicking a block navigates to the Section Detail page. Handle the case where a section's schedule field is missing or empty (skip rendering).
**Validation:** Grid renders with section data. Blocks are positioned in the correct day column and time row. Click a block → navigates to `/scheduling/{sectionId}`. Sections without schedule data do not appear. Grid scrolls vertically if many time slots.

### AL-3.2b: Handle Timetable Overlap Detection

**File:** `apps/academics/src/components/scheduling/TimetableGrid.tsx`
**Description:** Detect overlapping entries (same day, same time) and handle visually. When two entries overlap, display them side-by-side (split the column width) with a yellow warning indicator. Add a tooltip on overlap showing "Schedule conflict: {course1} and {course2}".
**Validation:** Add two sections with overlapping schedules → both render side-by-side with warning indicator. Hover → tooltip shows conflict info.

### AL-3.3: Create Timetable Filters

**File:** `apps/academics/src/components/scheduling/TimetableFilters.tsx` (new)
**Description:** Filter bar for the timetable: by teacher (dropdown populated from `useSchoolStaff`), by room (dropdown populated from unique `roomNumber` values extracted from sections), by academic year + term. "View As" toggle: Teacher View (shows one teacher's schedule), Room View (shows one room's schedule), All Sections (shows everything). Each view mode filters the entries accordingly.
**Validation:** Select a teacher → grid shows only that teacher's sections. Select a room → grid shows only sections in that room. Switch to "All Sections" → all sections render. Filter dropdowns populate from real data.

### AL-3.4: Wire Timetables Tab in Scheduling Route

**File:** `apps/academics/src/routes/scheduling/index.tsx`
**Description:** Replace the "Timetables" placeholder tab content with `TimetableFilters` and `TimetableGrid` components. Fetch sections data from `useSections` and transform into timetable entries using `transformSectionsToEntries`. Handle loading state (skeleton grid) and empty state (no sections with schedule data — show message "No scheduled sections found. Add schedules to sections to see them here.").
**Validation:** Navigate to Scheduling → Timetables tab → visual grid renders with real section data. If no sections have schedules, empty state message appears.

---

## Sub-Sprint Alabama-4: Classroom/Room Management

**Demo Goal:** Classrooms tab in Scheduling allows browsing rooms and seeing their utilization.

> **Note:** Room CRUD backend API is deferred to Sprint 5. This sub-sprint implements the UI with client-side data derived from sections' `roomNumber` field. See Backend Communication Document for API request.

### AL-4.1: Create Room Data Aggregation Hook

**File:** `apps/academics/src/hooks/useRooms.ts` (new)
**Description:** Create a `useRooms` hook that aggregates room data from sections via `useSections`. Extract unique `roomNumber` values from all sections, count how many sections use each room, list the sections using each room, and compute a utilization metric (sections / slots in a week). Return as `RoomData[]`. Filter out sections with null/empty roomNumber. Return loading state while sections are loading. Return empty array (not undefined) when no rooms found.
**Validation:** Hook returns room data derived from sections. Rooms with no name are excluded. Loading state returns `isLoading: true`. When sections load with 3 unique rooms → returns 3 room entries with correct section counts.

### AL-4.2: Create Classrooms Table Component

**File:** `apps/academics/src/components/scheduling/ClassroomTable.tsx` (new)
**Description:** DataTable showing rooms: Room Number (bold, primary text), Sections Using (count badge), Section Details (truncated list of course names), Utilization indicator (progress bar or color dot). Use the standard `@edforge/ui/DataTable` component pattern matching `SectionTable`. Row click triggers `onViewRoom` callback.
**Validation:** Table renders room data with correct columns. Row click fires callback with room data. Empty rooms show "No data available" message.

### AL-4.3: Create Classroom Drawer Component

**File:** `apps/academics/src/components/scheduling/ClassroomDrawer.tsx` (new)
**Description:** Slide-over drawer (matching `SectionDrawer` / `StudentDrawer` pattern) showing room details: Room number as header, sections using this room listed as cards (each showing course name, teacher, time, term). Three-dot dropdown with "Edit" (placeholder toast) and "Export" (placeholder toast). Include a note at the bottom: "Room management coming soon — currently derived from section data."
**Validation:** Drawer opens with correct room data. Sections list matches the room. Three-dot dropdown renders with placeholder actions. Drawer closes on Escape and backdrop click.

### AL-4.4: Wire Classrooms Tab in Scheduling Route

**File:** `apps/academics/src/routes/scheduling/index.tsx`
**Description:** Replace the "Classrooms" placeholder tab content with `ClassroomTable` and `ClassroomDrawer`. Add stats cards at the top: Rooms in Use (count of unique rooms), Total Sections (count of sections with rooms), Avg Sections per Room. Wire row click to open the classroom drawer.
**Validation:** Navigate to Scheduling → Classrooms tab → table shows rooms from section data. Click a room → drawer opens with section list. Stats cards show correct calculated values.

---

## Sub-Sprint Alabama-5: Attendance & Grade Reports

**Demo Goal:** Attendance and Grade modules have reporting/analytics views with printable outputs.

### AL-5.1: Create Attendance Calendar Heatmap

**File:** `apps/academics/src/components/attendance/AttendanceHeatmap.tsx` (new)
**Description:** A month-view calendar heatmap for a single student's attendance. Each day is a colored cell: green = present, red = absent, yellow = late, gray = excused/no data. Use `useStudentAttendance` hook with date range. Clicking a cell shows the detail (status, notes, section) in a tooltip. Navigation arrows to move between months.
**Validation:** Render for a student with attendance data → cells are colored correctly. Click cell → tooltip shows status. Navigate months → data updates. Month with no data → all cells gray.

### AL-5.2: Create Attendance Reports Tab

**File:** `apps/academics/src/routes/attendance/index.tsx`
**Description:** Add a "Reports" tab to the Attendance page (alongside the existing daily view). The Reports tab shows: school-wide attendance rate for the current day (from `GET /academics/attendance/summary`), a "Top Absent Students" list (derived from student attendance summaries), and section-level attendance comparison (rates across sections). Use existing hooks; no new backend endpoints required for the initial version.
**Validation:** Navigate to Attendance → Reports tab → summary data renders. Top absent students list shows students with lowest attendance rates. Section comparison renders.

### AL-5.3: Create Report Card Component

**File:** `apps/academics/src/components/grades/ReportCard.tsx` (new)
**Description:** A printable report card component for a single student + term. Shows: school header (school name, year), student info (name, ID, grade level), table of courses with grade percentage, letter grade, credits, and teacher name, GPA summary (weighted + unweighted) at bottom, and attendance summary. Styled for both screen display and `@media print` (white background, black text, clean borders for printing).
**Validation:** Render for a student with grades → correct data displays. Browser Print Preview (Ctrl+P) → shows clean, printable layout with no navigation or UI chrome. All grade data is accurate.

### AL-5.4: Create Grade Distribution View

**File:** `apps/academics/src/components/grades/GradeDistribution.tsx` (new)
**Description:** A section-level grade distribution visualization. Show horizontal bar chart of letter grade counts (A, B, C, D, F) for a selected section and term. Display class average percentage, median percentage, and highest/lowest grades. Use native HTML/CSS `<div>` bars with TailwindCSS widths (no chart library). Color code: A=green, B=blue, C=yellow, D=orange, F=red.
**Validation:** Select a section with grades → bar chart renders with grade distribution counts from `useSectionGrades` data. Class average and median are mathematically correct. Empty section → "No grades recorded" message.

### AL-5.5: Wire Report Card into Student Profile

**File:** `apps/academics/src/components/grades/StudentGradesView.tsx`
**Description:** Add a "View Report Card" button to the student grades view. When clicked, render `ReportCard` in a full-width modal. Add a "Print" button inside the modal that triggers `window.print()`. Add term selector to choose which term's report card to view.
**Validation:** Click "View Report Card" → report card renders in modal → click Print → browser print dialog opens with clean layout.

---

## Sub-Sprint Alabama-6: Export Functionality

**Demo Goal:** All major data views support CSV export with proper formatting.

### AL-6.1: Create CSV Export Utility

**File:** `apps/academics/src/utils/export.ts` (new)
**Description:** Create a generic `exportToCsv(filename: string, headers: string[], rows: string[][])` utility. Handles: proper CSV escaping (commas, quotes, newlines in cell values), UTF-8 BOM prefix for Excel compatibility, triggers browser download via Blob URL. Also create typed helpers: `exportStudentsToCsv(students)`, `exportCoursesToCsv(courses)`, `exportAttendanceToCsv(records)`, `exportGradesToCsv(grades)`, `exportSectionsToCsv(sections)` with pre-defined column mappings matching each entity's display fields.
**Validation:** Call `exportStudentsToCsv` with test data containing commas and quotes in names → CSV file downloads → opens correctly in Excel (no broken columns) and Google Sheets. UTF-8 characters display correctly.

### AL-6.2: Wire Export to Student Directory & Drawer

**Files:** `apps/academics/src/routes/students/index.tsx`, `apps/academics/src/components/students/StudentDrawer.tsx`
**Description:** Replace the "Export" placeholder toast in the Student Drawer dropdown with actual CSV export of the single student's data. Add a page-level "Export" button in the Student Directory header actions that exports all currently visible/filtered students as CSV.
**Validation:** Click Export in Student Drawer → single student CSV downloads with correct data. Click page Export → CSV with all visible students downloads. Filter students → export → only filtered students in CSV.

### AL-6.3: Wire Export to Course Catalog & Curriculum

**Files:** `apps/academics/src/routes/curriculum/index.tsx`, `apps/academics/src/components/curriculum/CourseDrawer.tsx`, `apps/academics/src/components/curriculum/GradeLevelDrawer.tsx`
**Description:** Add CSV export for the Courses tab (page-level export of all visible courses). Wire Export button in Course Drawer to export single course details. Wire Export button in Grade Level Drawer to export grade level summary with its courses.
**Validation:** Click Export in Courses tab → CSV with all courses downloads. Course Drawer Export → single course CSV. Grade Level Drawer Export → grade-level summary CSV.

### AL-6.4: Wire Export to Attendance

**File:** `apps/academics/src/routes/attendance/index.tsx`
**Description:** Add an "Export" button to the attendance daily view that exports the current day's attendance records for the selected section as CSV. Columns: Student Name, Student Number, Status, Time Recorded, Notes.
**Validation:** Select section + date → Export → CSV with attendance data downloads. Open in spreadsheet → columns are correct and data matches the UI.

### AL-6.5: Wire Export to Gradebook

**File:** `apps/academics/src/routes/grades/index.tsx`
**Description:** Add an "Export" button to the Gradebook tab that exports the current section's grades as CSV. Layout: Student Name as rows, assignment names as column headers, with earned/possible points in each cell. Include a summary row with class averages.
**Validation:** Select section → Export → CSV with gradebook matrix downloads. Open in spreadsheet → students as rows, assignments as columns.

### AL-6.6: Wire Export to Scheduling (Sections)

**Files:** `apps/academics/src/routes/scheduling/index.tsx`
**Description:** Wire the existing "Export Sections" button in the Scheduling page header dropdown. Export all visible sections as CSV with columns: Section Number, Course Name, Teacher, Room, Enrollment (current/max), Term, Status.
**Validation:** Click Export Sections → CSV downloads with correct section data.

### AL-6.7: Wire Export to Teachers Directory

**File:** `apps/academics/src/routes/teachers/index.tsx`
**Description:** Add an "Export" button to the Teachers/Staff directory that exports the staff list as CSV. Columns: Name, Role, Email, Status, Sections Assigned.
**Validation:** Click Export → CSV with staff data downloads.

---

## Sub-Sprint Alabama-7: Polish, Accessibility & Cleanup

**Demo Goal:** Module is polished, accessible, handles edge cases gracefully, and legacy routes are cleaned up.

### AL-7.1: Add DiceBear Avatars to Student Profile Page

**File:** `apps/academics/src/routes/students/$studentId.tsx`
**Description:** Replace the initials-based avatar in the Student Profile page header with the DiceBear Adventurer avatar (same `getAvatarUrl` helper seeded by `studentId`). Ensure consistency with the Student Table and Student Drawer.
**Validation:** Navigate to any student profile → avatar matches the one shown in the table and drawer.

### AL-7.2a: Add Empty States to Data-Fetching Views

**Files:** Students, Attendance, Grades, Scheduling route components
**Description:** Audit all DataTable and list components in the four primary data-fetching routes for proper empty states. Every table must have a meaningful empty state with an icon, descriptive message, and a CTA when applicable (e.g., "No students found → Add Student"). Check: Students table, Attendance grid, Gradebook grid, Section table.
**Validation:** Remove/filter to zero results on each page → every table shows a proper empty state with appropriate messaging and action button.

### AL-7.2b: Add Empty States to Configuration Views

**Files:** Curriculum, Teachers, Enrollment route components
**Description:** Audit all DataTable and list components in configuration routes. Check: Courses table, Grade Levels table, Teachers table, Enrollment table. Each must have empty states with meaningful messages.
**Validation:** Each configuration view with no data shows appropriate empty state with contextual CTA.

### AL-7.3a: Drawer Focus Management

**Files:** `StudentDrawer.tsx`, `CourseDrawer.tsx`, `SectionDrawer.tsx`, `ClassroomDrawer.tsx`, `GradeLevelDrawer.tsx`, `TeacherDetailDrawer.tsx`
**Description:** Ensure all 6 drawer components trap focus when open. Tab key cycles through interactive elements within the drawer. Escape closes the drawer. Focus returns to the trigger element after closing. Add `aria-modal="true"` and proper `role="dialog"` attributes.
**Validation:** Open each drawer → Tab through elements → focus stays within drawer → Shift+Tab cycles backward → Escape closes → focus returns to triggering element.

### AL-7.3b: Modal & Dropdown Keyboard Navigation

**Files:** `BulkGradeModal.tsx`, `TransferModal.tsx`, `ConfirmationDialog.tsx`, `FinalizationWizard.tsx`, all `ActionsDropdown` components
**Description:** Ensure all modals and dropdown menus are navigable with keyboard. Arrow keys navigate dropdown items. Enter selects. Escape closes. Modals trap focus.
**Validation:** Open each modal/dropdown using keyboard → navigate with arrows → select with Enter → close with Escape. No focus escape from modals.

### AL-7.4: Loading State Consistency Audit

**Files:** All route components
**Description:** Audit all pages for consistent loading states. Every page that fetches data must show skeleton loaders (not spinners) during initial load. Subsequent fetches (pagination, filter changes) should show inline loading indicators without replacing existing content. Use consistent skeleton component sizing matching the actual content dimensions.
**Validation:** Throttle network (Chrome DevTools) → visit each page → skeleton loaders appear → data replaces skeletons smoothly. No layout shift when data loads.

### AL-7.5: Toast Notification Consistency

**Files:** All mutation hooks and components that call mutations
**Description:** Audit all mutation hooks (create, update, delete) for consistent toast notifications. Success: green toast with action description (e.g., "Student updated successfully"). Error: red toast with human-readable error from `parseApiError`. No loading toasts (use button loading state instead). Audit: student CRUD, course CRUD, section CRUD, attendance recording, grade recording, enrollment operations.
**Validation:** Perform create/update/delete on each entity → appropriate toast appears each time. Simulate server error → error toast with readable message.

### AL-7.6: Legacy Route Cleanup

**Files:** `apps/academics/src/routes/classrooms/`, `apps/academics/src/routes/gradebook/`, `apps/academics/src/routes/courses/`, `apps/academics/src/routes/schedules/`, `apps/academics/src/routes/grade-levels/`, `apps/academics/src/routes/exams/`, `apps/academics/src/routes/assessments/`, `apps/academics/src/routes/timetables/`
**Description:** Audit all legacy standalone routes that redirect to consolidated views. Replace any that have hardcoded stats or redundant UI with clean `<Navigate>` redirects. Remove dead code. Ensure no legacy route has broken links or stale data. The `classrooms/index.tsx` has hardcoded room stats that should be removed.
**Validation:** Navigate to each legacy URL → cleanly redirects to the correct consolidated view. No hardcoded data visible. No 404s.

---

## Dependency Map

```
Alabama-1 (Foundation & Data Wiring) ─────────────────────────────┐
    │                                                              │
    ├──→ Alabama-2 (Student Edit) ── depends on AL-1.5 ──────────┤
    │                                                              │
Alabama-3 (Timetables) ──┬── depends on AL-4.1 for room filter ──┤
                          │                                        │
Alabama-4 (Classrooms) ──┘                                        ├──→ Alabama-7 (Polish)
                                                                   │
Alabama-5 (Reports) ──────────────────────────────────────────────┤
                                                                   │
Alabama-6 (Export) ────────────────────────────────────────────────┘
```

- **Alabama-1** must complete first (error boundaries + data wiring protect all subsequent work)
- **Alabama-2** depends on Alabama-1 (student data hooks must be wired)
- **Alabama-3** and **Alabama-4** should be sequenced: AL-4.1 before AL-3.3 (room filter needs room data)
- **Alabama-5** and **Alabama-6** can run in parallel with Alabama-3/4
- **Alabama-7** runs last as a comprehensive sweep

---

## Excluded from Sprint Alabama (Deferred)

| Feature | Reason | When |
|---------|--------|------|
| Standards Management | No backend API. Requires CASE-compliant import infrastructure | Future sprint |
| Calendar Events | No backend API for calendar events | Future sprint |
| Room CRUD (full API) | Backend Room API deferred to Sprint 5 | After backend delivery |
| Staff GSI Fix | Backend infrastructure issue — documented in Backend Communication doc | Backend team ETA needed |
| Student Import (bulk CSV) | Large feature, needs dedicated sprint | Future sprint |
| Parent Portal | Separate application module | Future sprint |
| Notifications/Alerts | Cross-cutting concern needing backend support | Future sprint |
| PDF Export | Requires PDF generation library (e.g., jsPDF). CSV is sufficient for Alabama | Future sprint |
| Student Transcript | Full transcript requires multi-year grade aggregation + credit tracking | Future sprint (after report card) |
| Student Delete/Archive | Handled via withdrawal workflow (soft delete). Hard delete not needed | — |

---

## Ticket Summary

| Sub-Sprint | Tickets | Est. Complexity | Key Deliverable |
|-----------|---------|-----------------|-----------------|
| Alabama-1: Foundation & Data Wiring | 5 tickets | Medium | Live dashboard, wired profiles |
| Alabama-2: Student Edit & CRUD | 5 tickets | Medium-High | Student edit form, guardian CRUD |
| Alabama-3: Timetable Visual Grid | 5 tickets | High | Visual weekly timetable |
| Alabama-4: Classroom Management | 4 tickets | Medium | Room directory & drawer |
| Alabama-5: Reports & Analytics | 5 tickets | High | Report card, grade dist, attendance reports |
| Alabama-6: Export Functionality | 7 tickets | Medium | CSV export across all views |
| Alabama-7: Polish & Cleanup | 8 tickets | Medium | Accessibility, empty states, legacy cleanup |
| **Total** | **39 tickets** | | |

---

## Review Notes

This plan was reviewed by a senior engineering manager with the following improvements incorporated:
- AL-3.2 split into core grid + overlap detection (AL-3.2b)
- AL-7.2 split into data-fetching views (7.2a) and configuration views (7.2b)
- AL-7.3 split into drawer focus (7.3a) and modal/dropdown keyboard nav (7.3b)
- Added missing tickets: AL-2.5 (Guardian CRUD), AL-6.6 (Section export), AL-6.7 (Teacher export), AL-7.6 (Legacy route cleanup)
- Error Boundaries moved from Alabama-7 to Alabama-1 (infrastructure-first)
- DiceBear avatar cosmetic ticket moved from Alabama-1 to Alabama-7
- Timetable/Classroom dependency explicitly documented
- Validation criteria tightened across all tickets
- Transcript and PDF export explicitly deferred with rationale
