# EdForge Academics Module - Sprint Plan

**Document Version:** 1.1
**Created:** February 5, 2026
**Last Updated:** February 5, 2026
**Module:** Academics Frontend Implementation
**Total Sprints:** 9 (Split Sprint 7 into 7A/7B)

---

## Executive Summary

This document outlines the complete implementation plan for the EdForge Academics module frontend. Each sprint produces a demoable, deployable increment. Tasks are atomic, independently committable, and include validation criteria.

### Tech Stack
- **Framework:** React 18+ with TypeScript
- **Routing:** TanStack Router (already configured)
- **State Management:** Zustand (existing pattern)
- **Forms:** React Hook Form + Zod (schemas exist)
- **UI:** TailwindCSS + existing design system
- **API:** REST (endpoints documented in ACADEMICS_API_READINESS.md)

### Definition of Done (DoD)
Each task must satisfy:
1. Code compiles with no TypeScript errors
2. Component renders without runtime errors
3. Unit tests pass (where applicable)
4. Visual review matches design intent
5. API integration works with mock/real data
6. Accessibility: keyboard navigable, screen reader friendly

---

## UI/UX Design System Alignment

All UI components and page layouts in the Academics module **must** follow these guidelines to maintain a uniform, professional EdForge design across all modules. The reference implementation is the Staff Detail page at `apps/people/src/routes/staff/detail.tsx`.

### Tabbed Interfaces

- All tabbed interfaces must use **framer-motion** for animated transitions.
- Tab underline indicator: Use `motion.div` with `layoutId` for the sliding effect. The indicator is `h-[2px] bg-teal-500 rounded-t-full` with spring transition `{ type: 'spring', stiffness: 500, damping: 30 }`.
- Tab content transitions: Wrap content in `AnimatePresence mode="wait"` with `motion.div` keyed on the active tab. Content enters with `{ opacity: 0, y: 10 }` → `{ opacity: 1, y: 0 }`, exits with `{ opacity: 0, y: -10 }`, duration `0.25s`, ease `easeOut`.
- Each tab button includes an **icon** (from `lucide-react`) next to the label. Active icon uses `text-teal-500`, inactive uses `opacity-70`.
- Tab text: Active = `text-[rgb(var(--text-primary))]`, Inactive = `text-[rgb(var(--text-tertiary))]`.
- Tab container: `flex items-center space-x-1 overflow-x-auto no-scrollbar border-b border-[rgb(var(--border-primary))]`.

### Avatars

- **Students** use DiceBear `avataaars` style. Utility: `getStudentAvatar(name)` in `apps/academics/src/lib/avatar.ts`.
- **Staff** use DiceBear `lorelei` style. Utility: `getStaffAvatar(identifier)` in app-level `lib/avatar.ts`.
- **Schools/Orgs** use DiceBear `bottts` style.
- Avatar seed is the entity's `fullName` or email for consistent generation.
- Avatar shape: `rounded-xl` (matching the `shape="rounded"` prop on the `Avatar` component).
- Status indicator dot: Positioned `absolute -bottom-1 -right-1`, size `w-4 h-4 rounded-full`, with `border-2 border-[rgb(var(--surface-primary))]`. Colors: `active` → `bg-emerald-500`, `inactive` → `bg-gray-400`, `pending` → `bg-amber-500`.

### Color System & Theming

- Always use CSS variable tokens for colors: `rgb(var(--text-primary))`, `rgb(var(--surface-secondary))`, `rgb(var(--border-primary))`, etc.
- Accent/highlight color: `teal-500` for active indicators, links, and interactive elements.
- Status colors follow a consistent palette: emerald (active/success), amber (warning/pending), red (error/withdrawn), blue (info/graduated), slate (inactive/neutral).
- **All styles must support both light and dark themes.** Use `dark:` prefix for dark-mode overrides. Avoid hardcoded hex colors that break in one mode. Test all UI in both light and dark modes to ensure text contrast and readability.

### Header & Actions Pattern

- Profile/detail page headers: Compact layout with avatar (left), name + metadata row (center), actions (right).
- Metadata row uses dot dividers (`w-1 h-1 rounded-full bg-[rgb(var(--text-tertiary))]`) between items.
- **No standalone action buttons** in headers. Use a three-dot menu (`MoreHorizontal` icon) dropdown for secondary actions (Edit, etc.).
- Do NOT implement non-MVP features like Print, Export PDF, or Email Summary unless explicitly requested.

### Empty States

- Use icon (from `lucide-react`) + primary message + helper text pattern.
- Icon: `w-10 h-10 text-text-tertiary` centered above text.
- Primary message: `text-text-secondary font-medium`.
- Helper text: `text-sm text-text-tertiary mt-1`.
- Gracefully handle `null`, `undefined`, empty arrays `[]`, and empty objects `{}` in all components. Display `—` (em-dash) for missing scalar values, not "undefined" or "null".

### Layout & Spacing

- Page containers: `max-w-[1400px] mx-auto px-6 py-6`.
- Content minimum height: `min-h-[500px]` for tab content areas to prevent layout shifts.
- Section headers in tab content: Use `text-sm font-semibold` with a colored icon, followed by a grid layout for data fields.
- Data grids: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5`.

---

## Sprint 1: Foundation & Student Directory (Core SIS)

**Sprint Goal:** Users can view and search the student directory with real data.

**Demo:** Navigate to `/academics/students`, see paginated student list, search by name, filter by grade level.

### Ticket 1.0: Shared Component Audit & Infrastructure
**Type:** Infrastructure
**Priority:** CRITICAL - Must complete first
**Description:** Verify existence of base UI components required for module.

**Acceptance Criteria:**
- [ ] Confirm DataTable component exists in `packages/ui` or shell
- [ ] Confirm Modal/Dialog component exists or create
- [ ] Confirm Toast notification system exists or create
- [ ] Confirm ConfirmationDialog component exists or create
- [ ] Create `apps/academics/src/components/common/` directory
- [ ] Document component APIs for team reference

**Validation:**
```typescript
// Import test - should compile
import { DataTable } from '@edforge/ui';
import { Modal } from '@edforge/ui';
```

**Files:**
- `packages/ui/src/components/DataTable.tsx` (verify/update)
- `packages/ui/src/components/Modal.tsx` (verify/create)
- `apps/academics/src/components/common/ConfirmationDialog.tsx` (new)
- `apps/academics/src/components/common/index.ts` (new)

---

### Ticket 1.1: API Client Setup for Academics Service
**Type:** Infrastructure
**Description:** Create typed API client functions for the Academics service using existing `lib/api.ts` patterns.

**Acceptance Criteria:**
- [ ] Create `apps/academics/src/services/academics.service.ts`
- [ ] Implement `getStudents(filters: StudentFilterDto): Promise<PaginatedResponse<StudentResponseDto>>`
- [ ] Implement `getStudent(studentId: string): Promise<StudentResponseDto>`
- [ ] Implement `getStudentProfile(studentId: string): Promise<StudentProfileResponseDto>`
- [ ] Implement `updateStudent(studentId: string, data: UpdateStudentDto): Promise<StudentResponseDto>`
- [ ] Implement `deleteStudent(studentId: string): Promise<void>` (soft delete)
- [ ] Add proper error handling with typed error responses
- [ ] Add request/response logging in development mode

**Validation:**
```typescript
// Test in browser console or vitest
const result = await academicsService.getStudents({ schoolId: 'xxx', limit: 10 });
console.assert(Array.isArray(result.items), 'Items should be an array');
console.assert(typeof result.hasMore === 'boolean', 'hasMore should be boolean');
```

**Files:**
- `apps/academics/src/services/academics.service.ts` (new)
- `apps/academics/src/services/index.ts` (new)

---

### Ticket 1.2: Student List State Management
**Type:** State Management
**Description:** Create Zustand store for student list state including pagination, filters, and selection.

**Acceptance Criteria:**
- [ ] Create `apps/academics/src/stores/students.store.ts`
- [ ] State includes: `students[]`, `isLoading`, `error`, `filters`, `pagination`, `selectedStudentIds`
- [ ] Actions: `fetchStudents`, `setFilters`, `resetFilters`, `selectStudent`, `clearSelection`
- [ ] Pagination cursor-based (per API spec)
- [ ] Filters persist across navigation

**Validation:**
```typescript
// Zustand devtools or test file
const store = useStudentsStore.getState();
store.fetchStudents({ schoolId: 'xxx' });
// After fetch: store.students.length > 0, store.isLoading === false
```

**Files:**
- `apps/academics/src/stores/students.store.ts` (new)
- `apps/academics/src/stores/index.ts` (new)

---

### Ticket 1.3: Pagination Controls Component
**Type:** UI Component
**Description:** Create reusable pagination component for cursor-based pagination.

**Acceptance Criteria:**
- [ ] Create `apps/academics/src/components/common/Pagination.tsx`
- [ ] "Load More" button for infinite scroll pattern
- [ ] Shows current count vs. total (if available)
- [ ] Disabled state when no more items
- [ ] Loading spinner during fetch

**Validation:**
- Click "Load More": next page fetches, appends to list
- No more items: button disabled or hidden

**Files:**
- `apps/academics/src/components/common/Pagination.tsx` (new)

---

### Ticket 1.4: Student Table Component
**Type:** UI Component
**Description:** Implement DataTable for student roster with sortable columns and row actions.

**Acceptance Criteria:**
- [ ] Create `apps/academics/src/components/students/StudentTable.tsx`
- [ ] Columns: Student Name, Student Number, Grade Level, Status, Enrollment Date
- [ ] Row click navigates to student profile
- [ ] Row actions menu: View Profile, Edit, Withdraw
- [ ] Support for empty state, loading skeleton, error state
- [ ] Responsive: collapses gracefully on mobile
- [ ] Integrates with Pagination component

**Validation:**
- Visual: Table renders with mock data, columns align, actions work
- Accessibility: Table has proper ARIA labels, rows are keyboard navigable

**Files:**
- `apps/academics/src/components/students/StudentTable.tsx` (new)
- `apps/academics/src/components/students/StudentTableRow.tsx` (new)
- `apps/academics/src/components/students/index.ts` (new)

---

### Ticket 1.5: Student Search & Filter Bar
**Type:** UI Component
**Description:** Implement search input and filter dropdown for student directory.

**Acceptance Criteria:**
- [ ] Create `apps/academics/src/components/students/StudentFilters.tsx`
- [ ] Search input with debounced API call (300ms)
- [ ] Grade level filter (multi-select dropdown)
- [ ] Status filter (active, inactive, transferred, withdrawn, graduated)
- [ ] Clear filters button
- [ ] Filter counts badge on active filters

**Validation:**
- Type in search: debounce works, API called after 300ms
- Select filters: store updates, table re-fetches

**Files:**
- `apps/academics/src/components/students/StudentFilters.tsx` (new)
- `apps/academics/src/hooks/useDebounce.ts` (new if not exists)

---

### Ticket 1.6: Integrate Student Directory Page
**Type:** Page Integration
**Description:** Wire up components in the existing `/academics/students` route.

**Acceptance Criteria:**
- [ ] Update `apps/academics/src/routes/students/index.tsx`
- [ ] Replace placeholder with StudentTable + StudentFilters
- [ ] Quick stats cards show real data from API summary endpoint
- [ ] Loading state shows skeleton
- [ ] Error state shows retry option
- [ ] Add Student button opens creation modal (placeholder for now)

**Validation:**
- Navigate to `/academics/students`
- See student table with real/mock data
- Search and filter work
- Stats cards update

**Files:**
- `apps/academics/src/routes/students/index.tsx` (update)

---

### Ticket 1.7: Sprint 1 Component Tests
**Type:** Testing
**Description:** Add unit tests for Sprint 1 components.

**Acceptance Criteria:**
- [ ] Test StudentTable renders correctly with data
- [ ] Test StudentFilters updates store on change
- [ ] Test Pagination "Load More" behavior
- [ ] Test error and empty states

**Files:**
- `apps/academics/src/components/students/__tests__/StudentTable.test.tsx` (new)
- `apps/academics/src/components/students/__tests__/StudentFilters.test.tsx` (new)

---

## Sprint 2: Student Profile & Detail View

**Sprint Goal:** Users can view complete student profile with all aggregated data and edit student information.

**Demo:** Click student row → see full profile with demographics, enrollment history, attendance summary, current classes → edit student info.

### Ticket 2.1: Student Profile Route Setup
**Type:** Routing
**Description:** Create dynamic route for individual student profile.

**Acceptance Criteria:**
- [ ] Create route `/academics/students/:studentId`
- [ ] Route params typed with Zod validation
- [ ] Redirect to 404 on invalid UUID
- [ ] Breadcrumb updates: Academics > Students > [Student Name]

**Validation:**
- Navigate to `/academics/students/[valid-uuid]`: page loads
- Navigate to `/academics/students/invalid`: 404 shows

**Files:**
- `apps/academics/src/routes/students/$studentId.tsx` (new)
- `apps/academics/src/router.tsx` (update)

---

### Ticket 2.2: Student Profile API Integration
**Type:** API Integration
**Description:** Implement API call for `/students/:id/profile` endpoint.

**Acceptance Criteria:**
- [ ] Add `getStudentProfile(studentId)` to academics service
- [ ] Response matches `StudentProfileResponseDto` type
- [ ] Handles 404 gracefully
- [ ] Caches response in store (invalidate on mutation)

**Validation:**
```typescript
const profile = await academicsService.getStudentProfile('xxx');
console.assert(profile.studentId, 'Should have studentId');
console.assert(profile.currentEnrollment !== undefined, 'Should have enrollment');
```

**Files:**
- `apps/academics/src/services/academics.service.ts` (update)

---

### Ticket 2.3: Student Profile Header Component
**Type:** UI Component
**Description:** Profile header with student photo, name, key identifiers, and status.

**Acceptance Criteria:**
- [ ] Create `apps/academics/src/components/students/profile/ProfileHeader.tsx`
- [ ] Avatar with initials fallback
- [ ] Name, Student Number, Grade Level, Status badge
- [ ] Quick action buttons: Edit, Print, More (dropdown)
- [ ] Status badge color-coded (active=green, inactive=gray, etc.)

**Validation:**
- Visual: Header matches design mockup
- Actions: Edit button opens edit modal

**Files:**
- `apps/academics/src/components/students/profile/ProfileHeader.tsx` (new)
- `apps/academics/src/components/students/profile/index.ts` (new)

---

### Ticket 2.4: Student Demographics Card
**Type:** UI Component
**Description:** Card showing student personal and contact information.

**Acceptance Criteria:**
- [ ] Create `apps/academics/src/components/students/profile/DemographicsCard.tsx`
- [ ] Fields: DOB, Gender, Ethnicity, Primary Language, Contact Info
- [ ] Address display with proper formatting
- [ ] Edit button for each section (permissions-gated)
- [ ] Handles missing data gracefully (shows "Not provided")

**Validation:**
- Visual: Card renders all fields, missing fields show placeholder
- Edit: Button visible for authorized users

**Files:**
- `apps/academics/src/components/students/profile/DemographicsCard.tsx` (new)

---

### Ticket 2.5: Guardians & Emergency Contacts Card
**Type:** UI Component
**Description:** Card showing guardians and emergency contacts with portal access indicators.

**Acceptance Criteria:**
- [ ] Create `apps/academics/src/components/students/profile/GuardiansCard.tsx`
- [ ] List guardians with relationship, contact info, permissions
- [ ] Primary guardian highlighted
- [ ] Portal access badge
- [ ] Pickup authorization indicator
- [ ] Emergency contacts section with priority order
- [ ] Add guardian button

**Validation:**
- Visual: Guardians listed in order, primary first
- Icons: Portal access, pickup auth indicators visible

**Files:**
- `apps/academics/src/components/students/profile/GuardiansCard.tsx` (new)

---

### Ticket 2.6: Enrollment History Card
**Type:** UI Component
**Description:** Card showing enrollment history across academic years.

**Acceptance Criteria:**
- [ ] Create `apps/academics/src/components/students/profile/EnrollmentCard.tsx`
- [ ] Current enrollment highlighted at top
- [ ] Historical enrollments in reverse chronological order
- [ ] Shows: Year, Grade, School, Status, Dates
- [ ] Link to full enrollment detail

**Validation:**
- Visual: Timeline or list of enrollments
- Current enrollment distinguished visually

**Files:**
- `apps/academics/src/components/students/profile/EnrollmentCard.tsx` (new)

---

### Ticket 2.7: Attendance Summary Widget
**Type:** UI Component
**Description:** Widget showing attendance summary with rate and breakdown.

**Acceptance Criteria:**
- [ ] Create `apps/academics/src/components/students/profile/AttendanceWidget.tsx`
- [ ] Circular progress showing attendance rate
- [ ] Breakdown: Present, Absent, Late, Excused counts
- [ ] Color coding (green >95%, yellow 90-95%, red <90%)
- [ ] Link to full attendance history

**Validation:**
- Visual: Progress ring renders, colors correct
- Link: Navigates to attendance detail

**Files:**
- `apps/academics/src/components/students/profile/AttendanceWidget.tsx` (new)

---

### Ticket 2.8: Current Schedule Card
**Type:** UI Component
**Description:** Card showing student's current class schedule.

**Acceptance Criteria:**
- [ ] Create `apps/academics/src/components/students/profile/ScheduleCard.tsx`
- [ ] API: Uses `/students/:id/sections?academicYearId=`
- [ ] List format: Period, Course Name, Teacher, Room
- [ ] Link to full schedule view

**Validation:**
- Visual: Schedule displays current sections
- Empty state: "No classes scheduled"

**Files:**
- `apps/academics/src/components/students/profile/ScheduleCard.tsx` (new)

---

### Ticket 2.9: Assemble Student Profile Page
**Type:** Page Assembly
**Description:** Compose all profile components into the profile page layout.

**Acceptance Criteria:**
- [ ] Update `apps/academics/src/routes/students/$studentId.tsx`
- [ ] Two-column layout on desktop, single column on mobile
- [ ] Left: Header, Demographics, Guardians
- [ ] Right: Enrollment, Attendance, Schedule
- [ ] Loading skeleton for entire page
- [ ] Error boundary with retry

**Validation:**
- Navigate to student profile: all cards render
- Resize window: layout responds correctly
- API error: error state shows with retry

**Files:**
- `apps/academics/src/routes/students/$studentId.tsx` (update)

---

### Ticket 2.10: Student Edit Form & Modal
**Type:** Feature
**Priority:** CRITICAL
**Description:** Enable editing of existing student records.

**Acceptance Criteria:**
- [ ] Create `apps/academics/src/components/students/StudentEditModal.tsx`
- [ ] Reuse form sections from registration (PersonalInfoSection, ContactInfoSection, etc.)
- [ ] Pre-populate form with existing student data
- [ ] Wire "Edit" button in profile header to open modal
- [ ] Handle partial updates (PATCH semantics)
- [ ] Show success toast on save
- [ ] Refresh profile after save

**Validation:**
- Click Edit: modal opens with current data
- Save: API called, modal closes, profile updates
- Error: shows validation errors

**Files:**
- `apps/academics/src/components/students/StudentEditModal.tsx` (new)
- `apps/academics/src/components/students/StudentEditForm.tsx` (new)

---

### Ticket 2.11: Sprint 2 Component Tests
**Type:** Testing
**Description:** Add unit tests for Sprint 2 components.

**Acceptance Criteria:**
- [ ] Test ProfileHeader renders correctly
- [ ] Test GuardiansCard handles empty/full data
- [ ] Test EnrollmentCard timeline rendering
- [ ] Test StudentEditModal form validation

**Files:**
- `apps/academics/src/components/students/profile/__tests__/*.test.tsx` (new)

---

## Sprint 3: Student Creation & Enrollment

**Sprint Goal:** Users can register new students and manage enrollment.

**Demo:** Click "Add Student" → complete registration wizard → student appears in directory with enrollment.

### Ticket 3.1: Student Form Schema Validation
**Type:** Schema/Validation
**Description:** Ensure Zod schemas match form requirements with proper error messages.

**Acceptance Criteria:**
- [ ] Review `types/packages/shared-types/src/schemas/academics/student.schema.ts`
- [ ] Add custom error messages for validation rules
- [ ] Create `CreateStudentFormSchema` with frontend-specific defaults
- [ ] Test validation with edge cases

**Validation:**
```typescript
const result = createStudentSchema.safeParse(invalidData);
console.assert(!result.success, 'Should fail validation');
console.assert(result.error.issues[0].message !== undefined, 'Should have message');
```

**Files:**
- `types/packages/shared-types/src/schemas/academics/student.schema.ts` (update if needed)
- `apps/academics/src/schemas/student.form.ts` (new, frontend-specific)

---

### Ticket 3.2: Student Registration Wizard Container
**Type:** UI Component
**Description:** Multi-step wizard for student registration using wizard package.

**Acceptance Criteria:**
- [ ] Create `apps/academics/src/components/students/registration/RegistrationWizard.tsx`
- [ ] Uses `@edforge/wizard` package
- [ ] Steps: Personal Info → Contact Info → Guardians → Medical → Enrollment → Review
- [ ] Progress indicator at top
- [ ] Step validation before proceeding
- [ ] Save draft functionality

**Validation:**
- Navigate steps: forward only when valid
- Back button: returns to previous step
- Progress: updates correctly

**Files:**
- `apps/academics/src/components/students/registration/RegistrationWizard.tsx` (new)
- `apps/academics/src/components/students/registration/index.ts` (new)

---

### Ticket 3.3: Personal Information Step
**Type:** Form Step
**Description:** First step collecting basic student information.

**Acceptance Criteria:**
- [ ] Create `apps/academics/src/components/students/registration/steps/PersonalInfoStep.tsx`
- [ ] Fields: First Name*, Last Name*, Middle Name, Preferred Name, Suffix
- [ ] Fields: Date of Birth*, Gender*, Current Grade Level*
- [ ] Uses form fields from `@edforge/forms`
- [ ] Real-time validation feedback

**Validation:**
- Required fields: shows error on blur if empty
- Date picker: validates age is reasonable (4-22 years)
- Gender: dropdown with all options

**Files:**
- `apps/academics/src/components/students/registration/steps/PersonalInfoStep.tsx` (new)

---

### Ticket 3.4: Contact Information Step
**Type:** Form Step
**Description:** Step collecting student contact and address information.

**Acceptance Criteria:**
- [ ] Create `apps/academics/src/components/students/registration/steps/ContactInfoStep.tsx`
- [ ] Fields: Email, Phone, Phone Type
- [ ] Address section: Street 1, Street 2, City, State, Postal Code
- [ ] Mailing address toggle (use same or different)
- [ ] Phone validation with formatting

**Validation:**
- Email: validates format
- Phone: formats as (XXX) XXX-XXXX
- Address: state dropdown with US states

**Files:**
- `apps/academics/src/components/students/registration/steps/ContactInfoStep.tsx` (new)

---

### Ticket 3.5: Guardian Information Step
**Type:** Form Step
**Description:** Step for adding guardians with portal access configuration.

**Acceptance Criteria:**
- [ ] Create `apps/academics/src/components/students/registration/steps/GuardiansStep.tsx`
- [ ] Add/remove guardians (1-10)
- [ ] Guardian fields: First Name, Last Name, Relationship, Phone, Email
- [ ] Checkboxes: Is Primary, Has Portal Access, Can Pickup
- [ ] At least one guardian required
- [ ] Reorder guardians via drag-drop or buttons

**Validation:**
- Add guardian: form appears
- Remove: confirms before removing if only one left
- Primary: only one can be primary

**Files:**
- `apps/academics/src/components/students/registration/steps/GuardiansStep.tsx` (new)
- `apps/academics/src/components/students/registration/GuardianForm.tsx` (new)

---

### Ticket 3.6: Medical Information Step
**Type:** Form Step
**Description:** Step for medical info, accommodations, and special programs.

**Acceptance Criteria:**
- [ ] Create `apps/academics/src/components/students/registration/steps/MedicalStep.tsx`
- [ ] Tag inputs: Allergies, Medications, Conditions, Dietary Restrictions
- [ ] Checkboxes: Has IEP, Has 504 Plan
- [ ] Physician contact fields
- [ ] Insurance information (optional)
- [ ] Special programs multi-select

**Validation:**
- Tag input: allows adding/removing items
- All fields optional

**Files:**
- `apps/academics/src/components/students/registration/steps/MedicalStep.tsx` (new)
- `apps/academics/src/components/common/TagInput.tsx` (new)

---

### Ticket 3.7: Initial Enrollment Step
**Type:** Form Step
**Description:** Step to create initial enrollment record.

**Acceptance Criteria:**
- [ ] Create `apps/academics/src/components/students/registration/steps/EnrollmentStep.tsx`
- [ ] Academic Year selector (current/upcoming)
- [ ] Enrollment Date picker (defaults to today)
- [ ] Enrollment Type: New, Transfer, Returning
- [ ] Previous School (if transfer)
- [ ] Homeroom assignment (optional)

**Validation:**
- Academic year: loads from API
- Enrollment date: cannot be future
- Transfer: previous school required

**Files:**
- `apps/academics/src/components/students/registration/steps/EnrollmentStep.tsx` (new)

---

### Ticket 3.8: Review & Submit Step
**Type:** Form Step
**Description:** Final review step with all entered information.

**Acceptance Criteria:**
- [ ] Create `apps/academics/src/components/students/registration/steps/ReviewStep.tsx`
- [ ] Read-only summary of all steps
- [ ] Edit buttons for each section (returns to that step)
- [ ] Submit button creates student via API
- [ ] Success state with link to new student profile
- [ ] Error handling with specific field errors

**Validation:**
- Submit: calls API, shows loading state
- Success: shows confirmation, navigates to profile
- Error: shows error message, allows retry

**Files:**
- `apps/academics/src/components/students/registration/steps/ReviewStep.tsx` (new)

---

### Ticket 3.9: Student Creation API Integration
**Type:** API Integration
**Description:** Implement student creation API call.

**Acceptance Criteria:**
- [ ] Add `createStudent(data: CreateStudentDto): Promise<StudentResponseDto>` to service
- [ ] Handle validation errors from API (400)
- [ ] Handle conflict errors (409 - duplicate student number)
- [ ] Optimistic UI update in store

**Validation:**
```typescript
const newStudent = await academicsService.createStudent(validData);
console.assert(newStudent.studentId, 'Should return new student');
```

**Files:**
- `apps/academics/src/services/academics.service.ts` (update)

---

### Ticket 3.10: Add Student Modal Integration
**Type:** Modal/Page
**Description:** Wire up Add Student button to open registration wizard.

**Acceptance Criteria:**
- [ ] Modal or slide-over panel for wizard
- [ ] Accessible: focus trap, escape to close
- [ ] Confirm before closing if form has data
- [ ] After success: close modal, refresh list, show toast

**Validation:**
- Click "Add Student": wizard opens
- Complete wizard: student created, list updates
- Cancel with data: confirmation dialog

**Files:**
- `apps/academics/src/routes/students/index.tsx` (update)
- `apps/academics/src/components/students/registration/RegistrationModal.tsx` (new)

---

### Ticket 3.11: Sprint 3 Tests
**Type:** Testing
**Description:** Test registration wizard functionality.

**Acceptance Criteria:**
- [ ] Test step navigation
- [ ] Test form validation per step
- [ ] Test submission flow
- [ ] Test draft save functionality

**Files:**
- `apps/academics/src/components/students/registration/__tests__/*.test.tsx` (new)

---

## Sprint 4: Course Catalog & Curriculum Management

**Sprint Goal:** Users can manage course catalog with full CRUD operations.

**Demo:** Navigate to Curriculum → view courses → create new course → edit course → deactivate course.

### Ticket 4.1: Course Service API Client
**Type:** API Integration
**Description:** Implement course CRUD API functions.

**Acceptance Criteria:**
- [ ] Add to `apps/academics/src/services/academics.service.ts`:
  - `getCourses(filters: CourseFilterDto): Promise<PaginatedResponse<CourseResponseDto>>`
  - `getCourse(courseId: string): Promise<CourseResponseDto>`
  - `createCourse(data: CreateCourseDto): Promise<CourseResponseDto>`
  - `updateCourse(courseId: string, data: UpdateCourseDto): Promise<CourseResponseDto>`
  - `deleteCourse(courseId: string): Promise<void>` (soft delete)

**Validation:**
```typescript
const courses = await academicsService.getCourses({ schoolId: 'xxx' });
console.assert(Array.isArray(courses.items), 'Should return items array');
```

**Files:**
- `apps/academics/src/services/academics.service.ts` (update)

---

### Ticket 4.2: Courses Store
**Type:** State Management
**Description:** Create Zustand store for course catalog state.

**Acceptance Criteria:**
- [ ] Create `apps/academics/src/stores/courses.store.ts`
- [ ] State: `courses[]`, `selectedCourse`, `isLoading`, `filters`, `error`
- [ ] Actions: `fetchCourses`, `selectCourse`, `createCourse`, `updateCourse`, `deleteCourse`
- [ ] Filter by subject area, department, course type

**Validation:**
- Store initializes, fetch works, filters apply

**Files:**
- `apps/academics/src/stores/courses.store.ts` (new)

---

### Ticket 4.3: Course Catalog Table
**Type:** UI Component
**Description:** DataTable for course listing with filters.

**Acceptance Criteria:**
- [ ] Create `apps/academics/src/components/curriculum/CourseTable.tsx`
- [ ] Columns: Course Code, Name, Subject Area, Credits, Grade Levels, Status
- [ ] Row actions: View, Edit, Deactivate/Activate
- [ ] Sorting on Course Code, Name, Subject Area
- [ ] Expand row to show description and prerequisites

**Validation:**
- Visual: Table renders, sorting works
- Actions: Row actions trigger correct handlers

**Files:**
- `apps/academics/src/components/curriculum/CourseTable.tsx` (new)
- `apps/academics/src/components/curriculum/index.ts` (new)

---

### Ticket 4.4: Course Filters Component
**Type:** UI Component
**Description:** Filter controls for course catalog.

**Acceptance Criteria:**
- [ ] Create `apps/academics/src/components/curriculum/CourseFilters.tsx`
- [ ] Search by course code or name
- [ ] Subject area filter (dropdown from enum)
- [ ] Course type filter (required, elective, enrichment, remedial)
- [ ] Credit type filter (academic, honors, AP, IB)
- [ ] Active/Inactive toggle

**Validation:**
- Filters update store, table re-renders

**Files:**
- `apps/academics/src/components/curriculum/CourseFilters.tsx` (new)

---

### Ticket 4.5: Course Form Component
**Type:** Form Component
**Description:** Reusable form for course create/edit.

**Acceptance Criteria:**
- [ ] Create `apps/academics/src/components/curriculum/CourseForm.tsx`
- [ ] Uses `createCourseSchema` for validation
- [ ] All fields from `CreateCourseDto`
- [ ] Grade levels as multi-select chips
- [ ] Prerequisites as course search/select
- [ ] Standards alignment section (future-ready, optional)
- [ ] Textbooks/materials section

**Validation:**
- Create mode: all fields empty
- Edit mode: fields populated from existing course
- Submit: validates, calls appropriate API

**Files:**
- `apps/academics/src/components/curriculum/CourseForm.tsx` (new)

---

### Ticket 4.6: Course Create/Edit Modal
**Type:** Modal Component
**Description:** Modal wrapper for course form.

**Acceptance Criteria:**
- [ ] Create `apps/academics/src/components/curriculum/CourseModal.tsx`
- [ ] Supports create and edit modes
- [ ] Loading state during save
- [ ] Error display on validation failures
- [ ] Success toast and list refresh on save

**Validation:**
- Open in create mode: empty form
- Open in edit mode: populated form
- Save: API called, modal closes, list updates

**Files:**
- `apps/academics/src/components/curriculum/CourseModal.tsx` (new)

---

### Ticket 4.7: Course Detail Drawer
**Type:** UI Component
**Description:** Slide-over drawer showing full course details.

**Acceptance Criteria:**
- [ ] Create `apps/academics/src/components/curriculum/CourseDetailDrawer.tsx`
- [ ] Shows all course fields in read-only view
- [ ] Edit button opens edit modal
- [ ] Related sections list (if any)
- [ ] Standards alignment display
- [ ] Textbooks/materials list

**Validation:**
- Click course row: drawer opens
- Edit button: opens edit modal
- Close: drawer closes, returns to list

**Files:**
- `apps/academics/src/components/curriculum/CourseDetailDrawer.tsx` (new)

---

### Ticket 4.8: Grade Levels Tab Implementation
**Type:** UI Component
**Description:** Implement Grade Levels tab in Curriculum page.

**Acceptance Criteria:**
- [ ] Create `apps/academics/src/components/curriculum/GradeLevelsTab.tsx`
- [ ] Display all grade levels (PreK through 12)
- [ ] Show student count per grade level
- [ ] Show course requirements per level (read-only from backend config)
- [ ] Link to filtered student directory by grade
- [ ] Note: Full grade level management is in Identity service (read-only here)

**Validation:**
- Visual: Grade levels display with counts
- Links: Navigate to filtered student list

**Files:**
- `apps/academics/src/components/curriculum/GradeLevelsTab.tsx` (new)

---

### Ticket 4.9: Curriculum Page Integration
**Type:** Page Integration
**Description:** Update curriculum route with course management.

**Acceptance Criteria:**
- [ ] Update `apps/academics/src/routes/curriculum/index.tsx`
- [ ] Tab structure: Courses | Grade Levels | Standards (placeholder)
- [ ] Courses tab shows CourseTable with filters
- [ ] Add Course button opens CourseModal
- [ ] Stats cards: Total Courses, Active, by Subject breakdown

**Validation:**
- Navigate to `/academics/curriculum`: page loads
- Tab switching works
- CRUD operations work

**Files:**
- `apps/academics/src/routes/curriculum/index.tsx` (update)

---

### Ticket 4.10: Sprint 4 Tests
**Type:** Testing
**Description:** Test course management functionality.

**Acceptance Criteria:**
- [ ] Test CourseTable rendering and actions
- [ ] Test CourseForm validation
- [ ] Test CourseModal create/edit modes

**Files:**
- `apps/academics/src/components/curriculum/__tests__/*.test.tsx` (new)

---

## Sprint 5: Class Sections & Scheduling

**Sprint Goal:** Users can create class sections and manage student rosters.

**Demo:** Create section for course → assign teacher → enroll students → view roster.

### Ticket 5.1: Section Service API Client
**Type:** API Integration
**Description:** Implement section CRUD and roster management API functions.

**Acceptance Criteria:**
- [ ] Add section endpoints:
  - `getSections(filters): Promise<PaginatedResponse<SectionResponseDto>>`
  - `getSection(sectionId): Promise<SectionResponseDto>`
  - `createSection(data): Promise<SectionResponseDto>`
  - `updateSection(sectionId, data): Promise<SectionResponseDto>`
  - `deleteSection(sectionId): Promise<void>`
- [ ] Add roster endpoints:
  - `getSectionRoster(sectionId): Promise<SectionRosterResponseDto>`
  - `enrollStudentInSection(sectionId, studentId): Promise<void>`
  - `removeStudentFromSection(sectionId, studentId): Promise<void>`

**Validation:**
```typescript
const sections = await academicsService.getSections({ schoolId: 'xxx', courseId: 'yyy' });
const roster = await academicsService.getSectionRoster('section-id');
```

**Files:**
- `apps/academics/src/services/academics.service.ts` (update)

---

### Ticket 5.2: Sections Store
**Type:** State Management
**Description:** Create store for section and roster management.

**Acceptance Criteria:**
- [ ] Create `apps/academics/src/stores/sections.store.ts`
- [ ] State: `sections[]`, `selectedSection`, `roster`, `isLoading`
- [ ] Actions: CRUD operations, roster management
- [ ] Derived: enrollment count, available spots

**Files:**
- `apps/academics/src/stores/sections.store.ts` (new)

---

### Ticket 5.3: Section Table Component
**Type:** UI Component
**Description:** DataTable for section listing.

**Acceptance Criteria:**
- [ ] Create `apps/academics/src/components/scheduling/SectionTable.tsx`
- [ ] Columns: Section #, Course, Teacher, Room, Enrollment (current/max), Term
- [ ] Visual capacity indicator (progress bar or color)
- [ ] Row actions: View Roster, Edit, Delete
- [ ] Group by course option

**Validation:**
- Visual: Table renders, capacity shows
- Actions: trigger correct handlers

**Files:**
- `apps/academics/src/components/scheduling/SectionTable.tsx` (new)
- `apps/academics/src/components/scheduling/index.ts` (new)

---

### Ticket 5.4: Section Create Form
**Type:** Form Component
**Description:** Form for creating new section.

**Acceptance Criteria:**
- [ ] Create `apps/academics/src/components/scheduling/SectionForm.tsx`
- [ ] Course selector (required)
- [ ] Section number (auto-suggest next available)
- [ ] Teacher selector (staff lookup)
- [ ] Room selector (optional)
- [ ] Max enrollment (default from course)
- [ ] Academic year and term selectors

**Validation:**
- Course selected: updates available section numbers
- Teacher lookup: searchable dropdown

**Files:**
- `apps/academics/src/components/scheduling/SectionForm.tsx` (new)

---

### Ticket 5.5: Section Create Modal
**Type:** Modal Component
**Description:** Modal for section creation.

**Acceptance Criteria:**
- [ ] Create `apps/academics/src/components/scheduling/SectionModal.tsx`
- [ ] Create and edit modes
- [ ] Validates capacity constraints
- [ ] Shows conflict warnings (teacher double-booked, etc.)

**Files:**
- `apps/academics/src/components/scheduling/SectionModal.tsx` (new)

---

### Ticket 5.6: Section Roster View
**Type:** UI Component
**Description:** View and manage students in a section.

**Acceptance Criteria:**
- [ ] Create `apps/academics/src/components/scheduling/SectionRoster.tsx`
- [ ] List enrolled students with grade level, enrollment date
- [ ] Add student button opens student selector
- [ ] Remove student with confirmation
- [ ] Capacity indicator at top
- [ ] Empty state: "No students enrolled"

**Validation:**
- Add student: search, select, student added
- Remove: confirmation, student removed
- Capacity: updates on add/remove

**Files:**
- `apps/academics/src/components/scheduling/SectionRoster.tsx` (new)

---

### Ticket 5.7: Student Selector Modal
**Type:** Modal Component
**Description:** Searchable modal for selecting students to enroll.

**Acceptance Criteria:**
- [ ] Create `apps/academics/src/components/common/StudentSelector.tsx`
- [ ] Search by name or student number
- [ ] Filter by grade level
- [ ] Shows students not already in section
- [ ] Multi-select with checkboxes
- [ ] Selected students list at bottom
- [ ] Bulk enroll button

**Validation:**
- Search works, filters work
- Already enrolled students excluded
- Bulk enroll creates all enrollments

**Files:**
- `apps/academics/src/components/common/StudentSelector.tsx` (new)

---

### Ticket 5.8: Section Detail Page
**Type:** Page Component
**Description:** Dedicated page for section with roster management.

**Acceptance Criteria:**
- [ ] Create route `/academics/scheduling/:sectionId`
- [ ] Header with section info, course name, teacher
- [ ] Roster component as main content
- [ ] Side panel with section details
- [ ] Quick actions: Add Students, Edit Section, Print Roster

**Validation:**
- Navigate to section: page loads
- All components render
- Actions work

**Files:**
- `apps/academics/src/routes/scheduling/$sectionId.tsx` (new)
- `apps/academics/src/router.tsx` (update)

---

### Ticket 5.9: Scheduling Page Integration
**Type:** Page Integration
**Description:** Update scheduling route with section management.

**Acceptance Criteria:**
- [ ] Update `apps/academics/src/routes/scheduling/index.tsx`
- [ ] View toggle: List | Calendar (calendar is placeholder)
- [ ] SectionTable with filters
- [ ] Add Section button
- [ ] Stats: Total Sections, By Course, Capacity utilization

**Files:**
- `apps/academics/src/routes/scheduling/index.tsx` (update)

---

### Ticket 5.10: Classroom/Room Management
**Type:** Feature
**Description:** Basic room management for section scheduling.

**Acceptance Criteria:**
- [ ] Add room endpoints to academics service:
  - `getRooms(schoolId): Promise<ClassroomResponseDto[]>`
  - `createRoom(data): Promise<ClassroomResponseDto>`
  - `updateRoom(roomId, data): Promise<ClassroomResponseDto>`
  - `deleteRoom(roomId): Promise<void>`
- [ ] Create `apps/academics/src/components/scheduling/RoomManager.tsx`
- [ ] Room list panel in Scheduling page
- [ ] Room selector in SectionForm uses real data
- [ ] Show room capacity and utilization

**Validation:**
- Room CRUD works
- SectionForm room selector populated

**Files:**
- `apps/academics/src/services/academics.service.ts` (update)
- `apps/academics/src/components/scheduling/RoomManager.tsx` (new)
- `apps/academics/src/components/scheduling/RoomForm.tsx` (new)

---

### Ticket 5.11: Sprint 5 Tests
**Type:** Testing
**Description:** Test section and roster functionality.

**Acceptance Criteria:**
- [ ] Test SectionTable rendering
- [ ] Test SectionRoster add/remove
- [ ] Test StudentSelector search and selection

**Files:**
- `apps/academics/src/components/scheduling/__tests__/*.test.tsx` (new)

---

## Sprint 6: Attendance Management

**Sprint Goal:** Users can record and view daily attendance.

**Demo:** Navigate to Attendance → select date → record attendance for class → view summary.

### Ticket 6.1: Attendance Service API Client
**Type:** API Integration
**Description:** Implement attendance API functions.

**Acceptance Criteria:**
- [ ] Add endpoints:
  - `recordAttendance(data: CreateAttendanceDto): Promise<AttendanceResponseDto>`
  - `recordBulkAttendance(data: BulkAttendanceDto): Promise<BulkAttendanceResponse>`
  - `getAttendanceByDate(schoolId, date): Promise<AttendanceResponseDto[]>`
  - `getDailyAttendanceSummary(schoolId, date): Promise<DailyAttendanceSummaryDto>`
  - `getStudentAttendance(studentId, params): Promise<AttendanceResponseDto[]>`
  - `getStudentAttendanceSummary(studentId, params): Promise<StudentAttendanceSummaryDto>`
  - `updateAttendance(date, studentId, status): Promise<AttendanceResponseDto>`

**Validation:**
```typescript
const summary = await academicsService.getDailyAttendanceSummary('xxx', '2026-02-05');
console.assert(summary.attendanceRate >= 0, 'Should have rate');
```

**Files:**
- `apps/academics/src/services/academics.service.ts` (update)

---

### Ticket 6.2: Attendance Store
**Type:** State Management
**Description:** Create store for attendance state.

**Acceptance Criteria:**
- [ ] Create `apps/academics/src/stores/attendance.store.ts`
- [ ] State: `records[]`, `summary`, `selectedDate`, `selectedSection`, `isLoading`
- [ ] Actions: `fetchByDate`, `recordSingle`, `recordBulk`, `updateRecord`
- [ ] Computed: by-status counts, attendance rate

**Files:**
- `apps/academics/src/stores/attendance.store.ts` (new)

---

### Ticket 6.3: Date Selector Component
**Type:** UI Component
**Description:** Calendar-style date picker for attendance.

**Acceptance Criteria:**
- [ ] Create `apps/academics/src/components/attendance/DateSelector.tsx`
- [ ] Calendar view with today highlighted
- [ ] Navigate by month
- [ ] Disable future dates
- [ ] Show indicator for dates with attendance recorded
- [ ] Today shortcut button

**Validation:**
- Select date: updates store
- Future dates: disabled
- Today button: selects current date

**Files:**
- `apps/academics/src/components/attendance/DateSelector.tsx` (new)
- `apps/academics/src/components/attendance/index.ts` (new)

---

### Ticket 6.4: Attendance Entry Grid
**Type:** UI Component
**Description:** Grid for bulk attendance entry by section.

**Acceptance Criteria:**
- [ ] Create `apps/academics/src/components/attendance/AttendanceGrid.tsx`
- [ ] Section selector at top
- [ ] Student list with status buttons for each
- [ ] Status options: Present, Absent, Late, Excused, Remote
- [ ] Notes field per student (expandable)
- [ ] Keyboard shortcuts (P/A/L/E/R)
- [ ] Auto-save or explicit save button

**Validation:**
- Click status: toggles status, visual update
- Keyboard: P marks present, etc.
- Save: calls bulk API

**Files:**
- `apps/academics/src/components/attendance/AttendanceGrid.tsx` (new)
- `apps/academics/src/components/attendance/AttendanceRow.tsx` (new)

---

### Ticket 6.5: Attendance Status Badge
**Type:** UI Component
**Description:** Reusable badge for attendance status display.

**Acceptance Criteria:**
- [ ] Create `apps/academics/src/components/attendance/StatusBadge.tsx`
- [ ] Color coding: Present=green, Absent=red, Late=yellow, Excused=blue, Remote=purple
- [ ] Icon + text variants
- [ ] Compact and full variants

**Files:**
- `apps/academics/src/components/attendance/StatusBadge.tsx` (new)

---

### Ticket 6.6: Daily Summary Dashboard
**Type:** UI Component
**Description:** Dashboard showing daily attendance metrics.

**Acceptance Criteria:**
- [ ] Create `apps/academics/src/components/attendance/DailySummary.tsx`
- [ ] Large attendance rate percentage
- [ ] Breakdown bars: Present, Absent, Late, Excused
- [ ] Comparison to previous day
- [ ] List of absent students (quick reference)

**Validation:**
- Visual: Rate displays prominently
- Breakdown: bars proportional to counts

**Files:**
- `apps/academics/src/components/attendance/DailySummary.tsx` (new)

---

### Ticket 6.7: Student Attendance History
**Type:** UI Component
**Description:** Component showing individual student's attendance history.

**Acceptance Criteria:**
- [ ] Create `apps/academics/src/components/attendance/StudentAttendanceHistory.tsx`
- [ ] Calendar heatmap view
- [ ] List view with date, status, notes
- [ ] Filter by status, date range
- [ ] Export option (CSV)

**Validation:**
- Visual: Calendar shows colored dots by status
- Filter: updates displayed records

**Files:**
- `apps/academics/src/components/attendance/StudentAttendanceHistory.tsx` (new)

---

### Ticket 6.8: Attendance Page Integration
**Type:** Page Integration
**Description:** Update attendance route with full functionality.

**Acceptance Criteria:**
- [ ] Update `apps/academics/src/routes/attendance/index.tsx`
- [ ] Two-column layout: Date selector + Summary on left, Entry grid on right
- [ ] Section filter at top
- [ ] Print attendance sheet action
- [ ] Export to CSV action

**Validation:**
- Navigate to attendance: page loads
- Select date: loads attendance for that date
- Record attendance: saves correctly

**Files:**
- `apps/academics/src/routes/attendance/index.tsx` (update)

---

### Ticket 6.9: Sprint 6 Tests
**Type:** Testing
**Description:** Test attendance functionality.

**Acceptance Criteria:**
- [ ] Test AttendanceGrid status toggles
- [ ] Test bulk save functionality
- [ ] Test DailySummary calculations

**Files:**
- `apps/academics/src/components/attendance/__tests__/*.test.tsx` (new)

---

## Sprint 7A: Grading Infrastructure

**Sprint Goal:** Set up grading policy management and grade recording infrastructure.

**Demo:** View/create grading policies → add assignments → record individual grades.

### Ticket 7A.1: Grading Policy Schema Creation
**Type:** Schema
**Priority:** CRITICAL
**Description:** Create missing Zod schema for grading policies.

**Acceptance Criteria:**
- [ ] Create `types/packages/shared-types/src/schemas/academics/grading-policy.schema.ts`
- [ ] Include: `createGradingPolicySchema`, `updateGradingPolicySchema`, `gradingPolicyResponseSchema`
- [ ] Include nested schemas: `gradingScaleEntrySchema`, `categoryWeightSchema`
- [ ] Add validation: weights must sum to 100%
- [ ] Export from `types/packages/shared-types/src/schemas/academics/index.ts`

**Validation:**
```typescript
const result = createGradingPolicySchema.safeParse({ categoryWeights: [{weight: 50}] });
// Should fail: weights don't sum to 100%
```

**Files:**
- `types/packages/shared-types/src/schemas/academics/grading-policy.schema.ts` (new)
- `types/packages/shared-types/src/schemas/academics/index.ts` (update)

---

### Ticket 7A.2: Grading Service API Client
**Type:** API Integration
**Description:** Implement grading API functions.

**Acceptance Criteria:**
- [ ] Add grading policy endpoints:
  - `getGradingPolicies(schoolId): Promise<GradingPolicyResponseDto[]>`
  - `getGradingPolicy(policyId): Promise<GradingPolicyResponseDto>`
  - `createGradingPolicy(data): Promise<GradingPolicyResponseDto>`
  - `updateGradingPolicy(policyId, data): Promise<GradingPolicyResponseDto>`
  - `deleteGradingPolicy(policyId): Promise<void>`
- [ ] Add grade endpoints:
  - `recordGrade(data: RecordAssignmentGradeDto): Promise<void>`
  - `recordBulkGrades(data: BulkRecordGradeDto): Promise<BulkRecordGradeResponse>`
  - `getSectionGrades(sectionId, params): Promise<GradeResponseDto[]>`
  - `getStudentGrades(studentId, params): Promise<GradeResponseDto[]>`
  - `finalizeGrade(gradeId): Promise<void>`

**Validation:**
```typescript
const grades = await academicsService.getSectionGrades('section-id', { termId: 'xxx' });
```

**Files:**
- `apps/academics/src/services/academics.service.ts` (update)

---

### Ticket 7A.3: Grades Store
**Type:** State Management
**Description:** Create store for gradebook state.

**Acceptance Criteria:**
- [ ] Create `apps/academics/src/stores/grades.store.ts`
- [ ] State: `grades[]`, `assignments[]`, `selectedSection`, `selectedTerm`, `gradingPolicy`
- [ ] Actions: fetch, record, bulk record, finalize
- [ ] Computed: averages, category breakdowns

**Files:**
- `apps/academics/src/stores/grades.store.ts` (new)

---

### Ticket 7A.4: Grading Policy Management UI
**Type:** Feature
**Priority:** CRITICAL
**Description:** Allow school admins to configure grading policies.

**Acceptance Criteria:**
- [ ] Create `apps/academics/src/components/grades/GradingPolicyList.tsx`
- [ ] List of policies with default indicator
- [ ] Create `apps/academics/src/components/grades/GradingPolicyForm.tsx`
- [ ] Category weight editor with 100% validation (real-time feedback)
- [ ] Grade scale editor with overlap validation
- [ ] Default policy toggle (only one can be default)
- [ ] Accessible from Grades page settings

**Validation:**
- Create policy: saves successfully
- Weights validation: shows error if not 100%
- Scale validation: shows error on overlap

**Files:**
- `apps/academics/src/components/grades/GradingPolicyList.tsx` (new)
- `apps/academics/src/components/grades/GradingPolicyForm.tsx` (new)
- `apps/academics/src/components/grades/CategoryWeightEditor.tsx` (new)
- `apps/academics/src/components/grades/GradeScaleEditor.tsx` (new)
- `apps/academics/src/components/grades/index.ts` (new)

---

### Ticket 7A.5: Add Assignment Form
**Type:** Form Component
**Description:** Form for creating new assignment in gradebook.

**Acceptance Criteria:**
- [ ] Create `apps/academics/src/components/grades/AddAssignmentForm.tsx`
- [ ] Uses `createAssignmentSchema` for validation
- [ ] Quick add mode: Name, Category, Points, Due Date
- [ ] Full mode: all assignment fields
- [ ] Category selector based on grading policy

**Validation:**
- Quick add: creates assignment, adds column
- Full mode: shows all fields

**Files:**
- `apps/academics/src/components/grades/AddAssignmentForm.tsx` (new)

---

### Ticket 7A.6: Assignment Column Header
**Type:** UI Component
**Description:** Interactive header for assignment columns.

**Acceptance Criteria:**
- [ ] Create `apps/academics/src/components/grades/AssignmentHeader.tsx`
- [ ] Shows assignment name, date, points possible
- [ ] Dropdown menu: Edit, Delete, View Details
- [ ] Category badge
- [ ] Sort by this assignment option

**Files:**
- `apps/academics/src/components/grades/AssignmentHeader.tsx` (new)

---

### Ticket 7A.7: Sprint 7A Tests
**Type:** Testing
**Description:** Test grading policy and assignment functionality.

**Acceptance Criteria:**
- [ ] Test GradingPolicyForm validation
- [ ] Test CategoryWeightEditor 100% sum validation
- [ ] Test GradeScaleEditor overlap detection

**Files:**
- `apps/academics/src/components/grades/__tests__/GradingPolicyForm.test.tsx` (new)

---

## Sprint 7B: Gradebook UI & Report Cards

**Sprint Goal:** Teachers can record grades and students can view report cards.

**Demo:** Open gradebook → enter grades → view calculated averages → generate report card.

### Ticket 7B.1: Gradebook Grid Component
**Type:** UI Component
**Priority:** HIGH
**Description:** Spreadsheet-like grid for grade entry.

**Acceptance Criteria:**
- [ ] Create `apps/academics/src/components/grades/GradebookGrid.tsx`
- [ ] Rows: Students
- [ ] Columns: Assignments + Category Averages + Overall Average
- [ ] Inline editing of grade cells
- [ ] Color coding based on grade (A=green, F=red)
- [ ] Frozen first column (student name)
- [ ] Keyboard navigation between cells
- [ ] Auto-save on cell blur

**Validation:**
- Edit cell: value updates, saves to API
- Keyboard: Tab moves to next cell
- Averages: calculate correctly

**Files:**
- `apps/academics/src/components/grades/GradebookGrid.tsx` (new)
- `apps/academics/src/components/grades/GradeCell.tsx` (new)

---

### Ticket 7B.2: Bulk Grade Entry Modal
**Type:** Modal Component
**Description:** Modal for entering grades for entire class on one assignment.

**Acceptance Criteria:**
- [ ] Create `apps/academics/src/components/grades/BulkGradeModal.tsx`
- [ ] Select or create assignment
- [ ] Student list with grade input per row
- [ ] Missing/Excused checkboxes
- [ ] Comment field per student
- [ ] Save all button

**Validation:**
- Enter grades: all values saved with one API call
- Partial save: handles errors per student

**Files:**
- `apps/academics/src/components/grades/BulkGradeModal.tsx` (new)

---

### Ticket 7B.3: Grade Summary Card
**Type:** UI Component
**Description:** Card showing overall grade and category breakdown.

**Acceptance Criteria:**
- [ ] Create `apps/academics/src/components/grades/GradeSummary.tsx`
- [ ] Overall percentage and letter grade
- [ ] Category breakdown with weights
- [ ] Progress bars per category
- [ ] GPA points display

**Validation:**
- Visual: Matches grading policy weights
- Updates: Recalculates on grade changes

**Files:**
- `apps/academics/src/components/grades/GradeSummary.tsx` (new)

---

### Ticket 7B.4: Report Card Component
**Type:** UI Component
**Description:** Printable report card view for students.

**Acceptance Criteria:**
- [ ] Create `apps/academics/src/components/grades/ReportCard.tsx`
- [ ] Student header with photo, name, grade level
- [ ] Course list with grades (numeric, letter, GPA points)
- [ ] Term GPA and cumulative GPA
- [ ] Attendance summary
- [ ] Teacher comments section
- [ ] Print-optimized CSS

**Validation:**
- Visual: Professional report card layout
- Print: Renders correctly on print

**Files:**
- `apps/academics/src/components/grades/ReportCard.tsx` (new)
- `apps/academics/src/components/grades/report-card.css` (new)

---

### Ticket 7B.5: Grades & Assessments Page
**Type:** Page Integration
**Description:** Update grades route with gradebook functionality.

**Acceptance Criteria:**
- [ ] Update `apps/academics/src/routes/grades/index.tsx`
- [ ] Section selector
- [ ] Term selector
- [ ] GradebookGrid as main content
- [ ] Add Assignment button
- [ ] Bulk grade entry button
- [ ] Export grades button
- [ ] Settings (grading policy) button

**Validation:**
- Select section: loads gradebook
- Select term: filters to term
- All operations work

**Files:**
- `apps/academics/src/routes/grades/index.tsx` (update)

---

### Ticket 7B.6: Student Grades View
**Type:** Page Component
**Description:** Student-facing view of their grades.

**Acceptance Criteria:**
- [ ] Route: `/academics/students/:studentId/grades`
- [ ] List of courses with current grades
- [ ] Expand to see assignments
- [ ] GPA summary at top
- [ ] Download report card button

**Validation:**
- Navigate: page loads with student's grades
- Expand course: shows assignments

**Files:**
- `apps/academics/src/routes/students/$studentId/grades.tsx` (new)
- `apps/academics/src/router.tsx` (update)

---

### Ticket 7B.7: Assignment Edit/Delete
**Type:** Feature
**Description:** Allow editing and deleting assignments after creation.

**Acceptance Criteria:**
- [ ] Create `apps/academics/src/components/grades/EditAssignmentModal.tsx`
- [ ] Edit assignment from AssignmentHeader dropdown
- [ ] Delete assignment with confirmation
- [ ] Recalculate grades after edit/delete
- [ ] Audit trail for grade changes (logged)

**Validation:**
- Edit: changes saved, grades recalculated
- Delete: assignment removed, grades recalculated

**Files:**
- `apps/academics/src/components/grades/EditAssignmentModal.tsx` (new)

---

### Ticket 7B.8: Sprint 7B Tests
**Type:** Testing
**Description:** Test gradebook and report card functionality.

**Acceptance Criteria:**
- [ ] Test GradebookGrid rendering and editing
- [ ] Test grade calculation logic
- [ ] Test ReportCard print layout

**Files:**
- `apps/academics/src/components/grades/__tests__/GradebookGrid.test.tsx` (new)
- `apps/academics/src/components/grades/__tests__/ReportCard.test.tsx` (new)

---

## Sprint 8: Enrollment Workflows & Finalization

**Sprint Goal:** Complete enrollment lifecycle with withdrawal and transfer workflows.

**Demo:** Enroll new student → view enrollment → withdraw student → transfer student.

### Ticket 8.1: Enrollment Service API Client
**Type:** API Integration
**Description:** Implement enrollment management API functions.

**Acceptance Criteria:**
- [ ] Add endpoints:
  - `createEnrollment(data: CreateEnrollmentDto): Promise<EnrollmentResponseDto>`
  - `getEnrollments(schoolId, yearId): Promise<EnrollmentResponseDto[]>`
  - `getEnrollmentSummary(schoolId, yearId): Promise<EnrollmentSummaryDto>`
  - `getStudentEnrollment(studentId, schoolId, yearId): Promise<EnrollmentResponseDto>`
  - `updateEnrollment(params, data): Promise<EnrollmentResponseDto>`
  - `withdrawStudent(params, data: WithdrawStudentDto): Promise<void>`
  - `transferStudent(params, data: TransferStudentDto): Promise<void>`

**Files:**
- `apps/academics/src/services/academics.service.ts` (update)

---

### Ticket 8.2: Enrollment Store
**Type:** State Management
**Description:** Create store for enrollment management.

**Acceptance Criteria:**
- [ ] Create `apps/academics/src/stores/enrollment.store.ts`
- [ ] State: `enrollments[]`, `summary`, `filters`, `isLoading`
- [ ] Actions: fetch, create, update, withdraw, transfer
- [ ] Computed: by-grade counts, by-status counts

**Files:**
- `apps/academics/src/stores/enrollment.store.ts` (new)

---

### Ticket 8.3: Enrollment Dashboard
**Type:** UI Component
**Description:** Dashboard showing enrollment metrics.

**Acceptance Criteria:**
- [ ] Create `apps/academics/src/components/enrollment/EnrollmentDashboard.tsx`
- [ ] Total enrolled count with trend
- [ ] By grade level breakdown (bar chart)
- [ ] By status breakdown (pie chart)
- [ ] Recent enrollments list

**Validation:**
- Visual: Charts render with data
- Data: Matches API summary

**Files:**
- `apps/academics/src/components/enrollment/EnrollmentDashboard.tsx` (new)
- `apps/academics/src/components/enrollment/index.ts` (new)

---

### Ticket 8.4: Enrollment Table
**Type:** UI Component
**Description:** Table listing all enrollments with actions.

**Acceptance Criteria:**
- [ ] Create `apps/academics/src/components/enrollment/EnrollmentTable.tsx`
- [ ] Columns: Student Name, Grade Level, Status, Enrollment Date, Homeroom
- [ ] Filter by grade level, status
- [ ] Row actions: View, Edit, Withdraw, Transfer
- [ ] Bulk select for batch operations

**Files:**
- `apps/academics/src/components/enrollment/EnrollmentTable.tsx` (new)

---

### Ticket 8.5: Withdrawal Modal
**Type:** Modal Component
**Description:** Modal for withdrawing a student.

**Acceptance Criteria:**
- [ ] Create `apps/academics/src/components/enrollment/WithdrawalModal.tsx`
- [ ] Withdrawal date picker
- [ ] Reason selector (moved, transferred, homeschool, etc.)
- [ ] Destination school (if transfer)
- [ ] Notes field
- [ ] Confirmation step with warnings
- [ ] Success updates student and enrollment status

**Validation:**
- Complete withdrawal: student status → withdrawn
- Enrollment status → withdrawn

**Files:**
- `apps/academics/src/components/enrollment/WithdrawalModal.tsx` (new)

---

### Ticket 8.6: Transfer Modal
**Type:** Modal Component
**Description:** Modal for transferring student to another school.

**Acceptance Criteria:**
- [ ] Create `apps/academics/src/components/enrollment/TransferModal.tsx`
- [ ] Transfer date picker
- [ ] Destination school selector (from same tenant)
- [ ] Reason field
- [ ] Notes field
- [ ] Creates new enrollment at destination
- [ ] Marks source enrollment as transferred

**Validation:**
- Complete transfer: creates enrollment at new school
- Source enrollment: status → transferred

**Files:**
- `apps/academics/src/components/enrollment/TransferModal.tsx` (new)

---

### Ticket 8.7: Enrollment Detail Drawer
**Type:** UI Component
**Description:** Drawer showing full enrollment details.

**Acceptance Criteria:**
- [ ] Create `apps/academics/src/components/enrollment/EnrollmentDrawer.tsx`
- [ ] Student info summary
- [ ] Enrollment dates and status
- [ ] Homeroom assignment (editable)
- [ ] Notes section
- [ ] Action buttons: Edit, Withdraw, Transfer

**Files:**
- `apps/academics/src/components/enrollment/EnrollmentDrawer.tsx` (new)

---

### Ticket 8.8: Enrollment Page Integration
**Type:** Page Integration
**Description:** Update enrollment route with full functionality.

**Acceptance Criteria:**
- [ ] Update `apps/academics/src/routes/enrollment/index.tsx`
- [ ] EnrollmentDashboard at top
- [ ] EnrollmentTable below
- [ ] Year/Term selector
- [ ] Add Student to Year button
- [ ] Export enrollment report

**Validation:**
- Navigate: page loads with current year enrollments
- All operations work

**Files:**
- `apps/academics/src/routes/enrollment/index.tsx` (update)

---

### Ticket 8.9: Grade Finalization Workflow
**Type:** Feature
**Description:** Workflow for finalizing term grades.

**Acceptance Criteria:**
- [ ] Create `apps/academics/src/components/grades/FinalizationWizard.tsx`
- [ ] Select term to finalize
- [ ] Show missing grades report
- [ ] Review all grades before finalizing
- [ ] Bulk finalize action
- [ ] Cannot edit finalized grades (UI enforced)

**Validation:**
- Finalize: grades locked
- Attempt edit: shows locked message

**Files:**
- `apps/academics/src/components/grades/FinalizationWizard.tsx` (new)

---

### Ticket 8.10: Sprint 8 Tests
**Type:** Testing
**Description:** Test enrollment workflows.

**Acceptance Criteria:**
- [ ] Test WithdrawalModal flow
- [ ] Test TransferModal flow
- [ ] Test FinalizationWizard

**Files:**
- `apps/academics/src/components/enrollment/__tests__/*.test.tsx` (new)

---

## Sprint 9: Polish, Integration & E2E Testing

**Sprint Goal:** Complete integration testing and address remaining UI polish.

**Demo:** Full end-to-end workflows work flawlessly.

### Ticket 9.1: End-to-End Workflow Testing
**Type:** Testing/QA
**Description:** End-to-end workflow testing.

**Acceptance Criteria:**
- [ ] Complete flow: Register student → Enroll → Add to sections → Record attendance → Record grades → View report card
- [ ] Withdrawal flow works
- [ ] Transfer flow works
- [ ] Data consistency across all views
- [ ] Error handling in all workflows

**Validation:**
- All workflows complete without errors
- Data persists correctly

**Files:**
- Testing documentation

---

### Ticket 9.2: Accessibility Audit
**Type:** QA
**Description:** Complete accessibility review.

**Acceptance Criteria:**
- [ ] Run axe-core on all pages
- [ ] Fix any critical/serious issues
- [ ] Keyboard navigation works everywhere
- [ ] Screen reader testing
- [ ] Color contrast verified

**Files:**
- Accessibility report
- Bug fixes as needed

---

### Ticket 9.3: Teachers Directory (Basic)
**Type:** Feature
**Description:** Basic implementation of teachers route.

**Acceptance Criteria:**
- [ ] Update `apps/academics/src/routes/teachers/index.tsx`
- [ ] List teachers from Identity service (read-only)
- [ ] Show assigned sections count
- [ ] Link to teacher schedule view (shows their sections)
- [ ] Note: Full teacher management is in People module

**Validation:**
- Navigate to `/academics/teachers`: list loads
- Click teacher: shows their sections

**Files:**
- `apps/academics/src/routes/teachers/index.tsx` (update)
- `apps/academics/src/components/teachers/TeacherList.tsx` (new)

---

### Ticket 9.4: Clean Up Legacy Routes
**Type:** Maintenance
**Description:** Remove or redirect deprecated routes.

**Acceptance Criteria:**
- [ ] Review all routes in router.tsx
- [ ] Remove unused route stubs or add proper redirects
- [ ] Update sidebar navigation if needed
- [ ] Ensure consistent navigation

**Files:**
- `apps/academics/src/router.tsx` (update)

---

### Ticket 9.5: Performance Optimization
**Type:** Optimization
**Description:** Ensure optimal performance.

**Acceptance Criteria:**
- [ ] Review component memoization
- [ ] Implement virtualization for large lists (gradebook, student lists)
- [ ] Optimize API calls (batching, caching)
- [ ] Lazy load routes

**Files:**
- Various component files

---

### Ticket 9.6: Documentation
**Type:** Documentation
**Description:** Document the module for developers.

**Acceptance Criteria:**
- [ ] Update DEVELOPER.md with academics module section
- [ ] Document API client usage
- [ ] Document store patterns
- [ ] Document testing approach

**Files:**
- `docs/ACADEMICS_DEVELOPER.md` (new)

---

## Appendix A: Cross-Cutting Concerns

### A.1: Loading & Error States
All pages must implement:
- Skeleton loading states during data fetch
- Error boundary with retry option
- Empty states with helpful messages

### A.2: Optimistic Updates
Where appropriate (status toggles, inline edits):
- Update UI immediately
- Roll back on API error
- Show error toast

### A.3: Accessibility Requirements
- WCAG 2.1 AA compliance
- Keyboard navigation for all interactions
- Screen reader announcements for dynamic content
- Focus management in modals/drawers

### A.4: Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Tables collapse to cards on mobile

---

## Appendix B: Testing Strategy

### Unit Tests (Per Sprint)
- Component isolation tests with React Testing Library
- Store logic tests with mock API
- Schema validation tests

### Integration Tests
- Page-level tests with MSW for API mocking
- Navigation flow tests
- Form submission tests

### E2E Tests (Sprint 9)
- Playwright for critical paths
- Student registration flow
- Grade recording flow

---

## Appendix C: File Structure

```
apps/academics/src/
├── components/
│   ├── attendance/
│   │   ├── AttendanceGrid.tsx
│   │   ├── AttendanceRow.tsx
│   │   ├── DateSelector.tsx
│   │   ├── DailySummary.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── StudentAttendanceHistory.tsx
│   │   └── index.ts
│   ├── common/
│   │   ├── ConfirmationDialog.tsx
│   │   ├── Pagination.tsx
│   │   ├── StudentSelector.tsx
│   │   ├── TagInput.tsx
│   │   └── index.ts
│   ├── curriculum/
│   │   ├── CourseDetailDrawer.tsx
│   │   ├── CourseFilters.tsx
│   │   ├── CourseForm.tsx
│   │   ├── CourseModal.tsx
│   │   ├── CourseTable.tsx
│   │   ├── GradeLevelsTab.tsx
│   │   └── index.ts
│   ├── enrollment/
│   │   ├── EnrollmentDashboard.tsx
│   │   ├── EnrollmentDrawer.tsx
│   │   ├── EnrollmentTable.tsx
│   │   ├── TransferModal.tsx
│   │   ├── WithdrawalModal.tsx
│   │   └── index.ts
│   ├── grades/
│   │   ├── AddAssignmentForm.tsx
│   │   ├── AssignmentHeader.tsx
│   │   ├── BulkGradeModal.tsx
│   │   ├── CategoryWeightEditor.tsx
│   │   ├── EditAssignmentModal.tsx
│   │   ├── FinalizationWizard.tsx
│   │   ├── GradeCell.tsx
│   │   ├── GradeSummary.tsx
│   │   ├── GradeScaleEditor.tsx
│   │   ├── GradebookGrid.tsx
│   │   ├── GradingPolicyForm.tsx
│   │   ├── GradingPolicyList.tsx
│   │   ├── ReportCard.tsx
│   │   ├── report-card.css
│   │   └── index.ts
│   ├── scheduling/
│   │   ├── RoomForm.tsx
│   │   ├── RoomManager.tsx
│   │   ├── SectionForm.tsx
│   │   ├── SectionModal.tsx
│   │   ├── SectionRoster.tsx
│   │   ├── SectionTable.tsx
│   │   └── index.ts
│   ├── students/
│   │   ├── StudentEditForm.tsx
│   │   ├── StudentEditModal.tsx
│   │   ├── StudentFilters.tsx
│   │   ├── StudentTable.tsx
│   │   ├── StudentTableRow.tsx
│   │   ├── profile/
│   │   │   ├── AttendanceWidget.tsx
│   │   │   ├── DemographicsCard.tsx
│   │   │   ├── EnrollmentCard.tsx
│   │   │   ├── GuardiansCard.tsx
│   │   │   ├── ProfileHeader.tsx
│   │   │   ├── ScheduleCard.tsx
│   │   │   └── index.ts
│   │   ├── registration/
│   │   │   ├── GuardianForm.tsx
│   │   │   ├── RegistrationModal.tsx
│   │   │   ├── RegistrationWizard.tsx
│   │   │   ├── steps/
│   │   │   │   ├── ContactInfoStep.tsx
│   │   │   │   ├── EnrollmentStep.tsx
│   │   │   │   ├── GuardiansStep.tsx
│   │   │   │   ├── MedicalStep.tsx
│   │   │   │   ├── PersonalInfoStep.tsx
│   │   │   │   └── ReviewStep.tsx
│   │   │   └── index.ts
│   │   └── index.ts
│   └── teachers/
│       ├── TeacherList.tsx
│       └── index.ts
├── hooks/
│   ├── useDebounce.ts
│   └── index.ts
├── routes/
│   ├── attendance/
│   │   └── index.tsx
│   ├── curriculum/
│   │   └── index.tsx
│   ├── enrollment/
│   │   └── index.tsx
│   ├── grades/
│   │   └── index.tsx
│   ├── scheduling/
│   │   ├── index.tsx
│   │   └── $sectionId.tsx
│   ├── students/
│   │   ├── index.tsx
│   │   ├── $studentId.tsx
│   │   └── $studentId/
│   │       └── grades.tsx
│   ├── teachers/
│   │   └── index.tsx
│   └── overview.tsx
├── schemas/
│   └── student.form.ts
├── services/
│   ├── academics.service.ts
│   └── index.ts
├── stores/
│   ├── attendance.store.ts
│   ├── courses.store.ts
│   ├── enrollment.store.ts
│   ├── grades.store.ts
│   ├── sections.store.ts
│   ├── students.store.ts
│   └── index.ts
└── router.tsx
```

---

## Appendix D: Schema Files to Create

| Schema | Path | Priority |
|--------|------|----------|
| `grading-policy.schema.ts` | `types/packages/shared-types/src/schemas/academics/` | CRITICAL |
| `section-enrollment.schema.ts` | `types/packages/shared-types/src/schemas/academics/` | Medium |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-05 | AI | Initial sprint plan |
| 1.1 | 2026-02-05 | AI | Added review improvements: Split Sprint 7, added missing tickets (Student Edit, Grading Policy UI, Classroom Management, Assignment Edit/Delete), added testing tickets per sprint, added Shared Component Audit, reordered Sprint 1 tickets, added missing schema ticket |
