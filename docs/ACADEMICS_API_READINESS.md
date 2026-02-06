# EdForge Academics Service - Frontend Integration Guide

**Service:** Academics Microservice
**Version:** 2.0 (Sprint 1 + Sprint 2 Complete)
**Last Updated:** February 5, 2026

---

## Quick Reference

| Domain | Status | Key Views |
|--------|--------|-----------|
| **Students** | Production Ready | Directory, Profile, Registration |
| **Enrollment** | Production Ready | Annual enrollment, Withdraw, Transfer |
| **Courses** | Production Ready | Course Catalog (Curriculum page) |
| **Sections** | Production Ready | Class sections, Rosters, Schedules |
| **Grades** | Production Ready | Gradebook, Report Cards, GPA |
| **Grading Policies** | Production Ready | School grading configuration |
| **Attendance** | Production Ready | Daily attendance, Summaries |

---

## Business Domains

### 1. Student Information System (SIS)

The core of EdForge academics - managing student records, demographics, guardians, and academic lifecycle.

**Key Capabilities:**
- Complete student demographic management
- Guardian/family information with portal access flags
- Medical information and accommodations tracking (IEP, 504 plans)
- Student profile view with aggregated enrollment, attendance, and academic data
- Status lifecycle: `active` -> `graduated`/`transferred`/`withdrawn`

**Frontend Views:**
- Student directory/roster (Overview -> Students)
- Student detail/profile page
- Student registration form
- Guardian management

### 2. Enrollment Management

Tracks student enrollment status for each academic year, including grade level progression, homeroom assignments, and enrollment history.

**Key Capabilities:**
- Annual enrollment records per school/year
- Enrollment status tracking (enrolled, pending, withdrawn, graduated, transferred)
- Withdrawal and transfer workflows with reason codes
- Grade level enrollment summaries
- Enrollment history across years

**Frontend Views:**
- Enrollment management dashboard
- New student enrollment wizard
- Withdrawal/transfer forms
- Enrollment reports by grade level

### 3. Course Catalog (Sprint 1)

The master catalog of courses offered by each school, including subject areas, credits, prerequisites, and standards alignment.

**Key Capabilities:**
- Course CRUD with Ed-Fi aligned fields
- Subject area classification (mathematics, science, etc.)
- Credit types (academic, honors, AP, IB)
- Prerequisites and corequisites
- Learning standards alignment
- Soft-delete with `isActive` flag

**Frontend Views:**
- Course catalog browser (Curriculum -> Courses tab)
- Course creation/edit form
- Course detail page with standards mapping

### 4. Class Sections (Sprint 1)

Specific offerings of courses with teacher assignments, enrollment caps, and student rosters.

**Key Capabilities:**
- Section creation linked to courses
- Primary teacher and co-teacher assignments
- Enrollment capacity management with real-time count
- Student enrollment/drop from sections
- Section roster view

**Frontend Views:**
- Section management (Scheduling page)
- Section roster view
- Student schedule view
- Teacher schedule view

### 5. Grading & Assessments (Sprint 2)

Comprehensive grading system with configurable policies, assignment-level recording, and automatic grade calculation.

**Key Capabilities:**
- School-level grading policies (scales, category weights, rounding rules)
- Assignment grade recording (single and bulk)
- Automatic grade calculation based on policy
- Category-based grade breakdown
- Grade finalization workflow
- GPA calculation (weighted and unweighted)

**Frontend Views:**
- Teacher gradebook (Grades & Assessments)
- Grade entry forms (single and bulk)
- Student grade report / report card
- GPA summary

### 6. Attendance Tracking

Daily attendance recording and reporting for compliance and student monitoring.

**Key Capabilities:**
- Single and bulk attendance recording
- Status types: present, absent, late, excused, half_day, remote
- Daily attendance summaries per school
- Student attendance history and summary
- Attendance rate calculations

**Frontend Views:**
- Daily attendance entry (Attendance page)
- Attendance dashboard (school-wide)
- Student attendance history

---

## API Reference by Domain

### Students API

| Method | Endpoint | Description | Frontend Use Case |
|--------|----------|-------------|-------------------|
| `POST` | `/academics/students` | Create student | Student registration form |
| `GET` | `/academics/students?schoolId=` | List students | Student directory with filters |
| `GET` | `/academics/students/:id` | Get student | Student detail panel |
| `GET` | `/academics/students/:id/profile` | Get full profile | **Student profile page** (single call for all data) |
| `PATCH` | `/academics/students/:id` | Update student | Edit student form |
| `DELETE` | `/academics/students/:id` | Soft delete | Deactivate student |
| `GET` | `/academics/students/:id/enrollments` | Enrollment history | Academic history tab |
| `GET` | `/academics/students/:id/sections?academicYearId=` | Current sections | Student schedule view |
| `GET` | `/academics/students/:id/grades?academicYearId=&termId=` | Grades + GPA | **Report card view** |
| `GET` | `/academics/students/:id/attendance?startDate=&endDate=` | Attendance records | Attendance history tab |
| `GET` | `/academics/students/:id/attendance/summary?schoolId=&academicYearId=` | Attendance summary | Dashboard widget |

### Enrollment API

| Method | Endpoint | Description | Frontend Use Case |
|--------|----------|-------------|-------------------|
| `POST` | `/academics/enrollments` | Create enrollment | Enrollment wizard |
| `GET` | `/academics/schools/:schoolId/years/:yearId/enrollments` | List enrollments | Enrollment roster |
| `GET` | `/academics/schools/:schoolId/years/:yearId/enrollments/summary` | Summary stats | Dashboard cards |
| `GET` | `/academics/students/:studentId/enrollment` | Student history | Profile enrollment tab |
| `GET` | `/academics/schools/:schoolId/years/:yearId/students/:studentId/enrollment` | Specific enrollment | Enrollment detail |
| `PATCH` | `/academics/schools/:schoolId/years/:yearId/students/:studentId/enrollment` | Update | Edit enrollment |
| `POST` | `.../withdraw` | Withdraw student | Withdrawal modal |
| `POST` | `.../transfer` | Transfer student | Transfer modal |

### Courses API

| Method | Endpoint | Description | Frontend Use Case |
|--------|----------|-------------|-------------------|
| `POST` | `/academics/courses` | Create course | Add course form |
| `GET` | `/academics/courses?schoolId=&search=&subjectArea=` | List/search courses | Course catalog table |
| `GET` | `/academics/courses/:id?schoolId=` | Get course | Course detail drawer |
| `PATCH` | `/academics/courses/:id?schoolId=` | Update course | Edit course form |
| `DELETE` | `/academics/courses/:id?schoolId=` | Soft delete | Deactivate action |

### Sections API

| Method | Endpoint | Description | Frontend Use Case |
|--------|----------|-------------|-------------------|
| `POST` | `/academics/sections` | Create section | Section wizard |
| `GET` | `/academics/sections?schoolId=&courseId=&teacherId=` | List sections | Section browser |
| `GET` | `/academics/sections/:id?schoolId=` | Get section | Section detail |
| `PATCH` | `/academics/sections/:id?schoolId=` | Update | Edit section |
| `DELETE` | `/academics/sections/:id?schoolId=` | Soft delete | Deactivate |
| `POST` | `/academics/sections/:id/students?schoolId=` | Enroll student | Add to roster button |
| `GET` | `/academics/sections/:id/students?schoolId=` | Get roster | Class roster list |
| `DELETE` | `/academics/sections/:id/students/:studentId?schoolId=` | Drop student | Remove from roster |

### Grading Policies API

| Method | Endpoint | Description | Frontend Use Case |
|--------|----------|-------------|-------------------|
| `POST` | `/academics/grading-policies` | Create policy | Policy setup wizard |
| `GET` | `/academics/grading-policies?schoolId=` | List policies | Policy management table |
| `GET` | `/academics/grading-policies/:id?schoolId=` | Get policy | Policy detail |
| `PATCH` | `/academics/grading-policies/:id?schoolId=` | Update | Edit policy |

### Grades API

| Method | Endpoint | Description | Frontend Use Case |
|--------|----------|-------------|-------------------|
| `POST` | `/academics/grades/record` | Record single grade | Grade input cell |
| `POST` | `/academics/grades/record/bulk` | Bulk record | Assignment column entry |
| `GET` | `/academics/grades?studentId=&courseId=&termId=` | Get grade | Grade lookup |
| `GET` | `/academics/grades/section/:sectionId?schoolId=&termId=` | Section grades | **Teacher gradebook** |
| `PATCH` | `/academics/grades/:gradeId/finalize` | Finalize | End-of-term action |

### Attendance API

| Method | Endpoint | Description | Frontend Use Case |
|--------|----------|-------------|-------------------|
| `POST` | `/academics/attendance` | Record single | Individual entry |
| `POST` | `/academics/attendance/bulk` | Bulk record | **Classroom attendance form** |
| `GET` | `/academics/attendance?schoolId=&date=` | Get by date | Daily attendance view |
| `GET` | `/academics/attendance/summary?schoolId=&date=` | Daily summary | Dashboard widget |
| `GET` | `/academics/attendance/student/:studentId?startDate=&endDate=` | Student history | Student attendance tab |
| `GET` | `/academics/attendance/student/:studentId/summary` | Student summary | Profile attendance widget |
| `PATCH` | `/academics/attendance/:date/:studentId` | Update | Correction |

---

## Frontend Integration Patterns

### 1. Student Profile Page (Aggregated View)

Use the `/profile` endpoint to get all student data in one call:

```typescript
// GET /academics/students/:id/profile
interface StudentProfileResponse {
  // Core student data
  studentId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  studentNumber: string;
  currentGradeLevel: string;
  status: 'active' | 'inactive' | 'graduated' | 'transferred' | 'withdrawn';

  // Contact & family
  contactInfo?: { email?: string; phone?: string; address?: Address };
  guardians?: Guardian[];
  emergencyContacts?: EmergencyContact[];

  // Medical & accommodations
  medicalInfo?: MedicalInfo;
  specialPrograms?: string[];
  accommodations?: string[];

  // Aggregated data (no extra API calls needed!)
  currentEnrollment?: {
    enrollmentId: string;
    academicYearId: string;
    academicYearName?: string;
    gradeLevel: string;
    enrollmentDate: string;
    status: string;
    homeroomId?: string;
    homeroomName?: string;
  };

  enrollmentHistory?: EnrollmentRecord[];

  attendanceSummary?: {
    totalDays: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    attendanceRate: number;  // 0-100
  };
}
```

### 2. Teacher Gradebook View

Load section grades, then handle grade entry:

```typescript
// 1. Load gradebook data
const sectionGrades = await api.get(
  `/academics/grades/section/${sectionId}?schoolId=${schoolId}&termId=${termId}`
);

// Response contains all students' grades with assignment breakdowns
interface GradeResponse {
  gradeId: string;
  studentId: string;
  numericGrade?: number;     // Overall calculated grade
  letterGrade?: string;
  gpaPoints?: number;
  categoryGrades?: CategoryGrade[];
  assignments?: AssignmentGrade[];
  isFinal: boolean;
}

// 2. Record a new assignment (bulk for whole class)
const result = await api.post('/academics/grades/record/bulk', {
  schoolId,
  sectionId,
  courseId,
  termId,
  academicYearId,
  teacherId,
  assignment: {
    assignmentName: 'Chapter 1 Quiz',
    assignmentType: 'quiz',          // homework, quiz, test, project, etc.
    categoryId: 'quizzes',           // Must match grading policy category
    possiblePoints: 20
  },
  grades: roster.students.map(s => ({
    studentId: s.studentId,
    earnedPoints: getInputValue(s.studentId)  // From your form
  }))
});

// Handle partial failures
console.log(`Recorded: ${result.recorded}`);
result.errors.forEach(e => console.warn(`Failed for ${e.studentId}: ${e.error}`));
```

### 3. Bulk Attendance Entry

Daily classroom attendance with bulk API:

```typescript
// POST /academics/attendance/bulk
await api.post('/academics/attendance/bulk', {
  schoolId,
  date: '2026-02-05',               // Today's date
  academicYearId,
  periodId: 'homeroom',             // Optional: specific period
  recordedBy: currentUserId,
  records: students.map(s => ({
    studentId: s.studentId,
    status: getAttendanceStatus(s.studentId),  // present, absent, late, etc.
    notes: getNotes(s.studentId)
  }))
});

// Response
interface BulkAttendanceResponse {
  recorded: number;
  errors: { studentId: string; error: string }[];
}
```

### 4. Dashboard Statistics Cards

Use summary endpoints for the overview dashboard:

```typescript
// Enrollment stats card
const enrollment = await api.get(
  `/academics/schools/${schoolId}/years/${yearId}/enrollments/summary`
);
// { totalEnrolled: 1247, byGradeLevel: { '9': 320, '10': 310, ... }, byStatus: {...} }

// Attendance stats card (today)
const attendance = await api.get(
  `/academics/attendance/summary?schoolId=${schoolId}&date=${today}`
);
// { totalStudents: 1247, present: 1168, absent: 35, late: 44, attendanceRate: 94.2 }
```

### 5. Pagination Pattern

All list endpoints return paginated results:

```typescript
interface PaginatedResponse<T> {
  items: T[];
  lastEvaluatedKey?: string;  // Cursor for next page
  hasMore: boolean;
}

// Infinite scroll / load more implementation
async function loadMore<T>(
  endpoint: string,
  params: Record<string, string>,
  cursor?: string
): Promise<{ items: T[]; nextCursor?: string; hasMore: boolean }> {
  const searchParams = new URLSearchParams({ ...params, limit: '50' });
  if (cursor) searchParams.set('cursor', cursor);

  const { data } = await api.get(`${endpoint}?${searchParams}`);
  return {
    items: data.items,
    nextCursor: data.lastEvaluatedKey,
    hasMore: data.hasMore
  };
}
```

---

## Error Handling

All errors follow consistent format:

```typescript
interface ApiError {
  statusCode: number;
  errorCode: 'BAD_REQUEST' | 'NOT_FOUND' | 'CONFLICT' | 'FORBIDDEN' | 'INTERNAL_ERROR';
  message: string;           // User-displayable message
  timestamp: string;
  requestId: string;         // For support
  path: string;
}

// Common error patterns
switch (error.response?.data?.errorCode) {
  case 'CONFLICT':
    // Duplicate resource (course code, section number, enrollment, etc.)
    showToast(`${entityName} already exists`);
    break;
  case 'NOT_FOUND':
    // Resource doesn't exist
    showToast(`${entityName} not found`);
    break;
  case 'BAD_REQUEST':
    // Validation error - message contains details
    showValidationError(error.response.data.message);
    break;
}
```

**Common Validation Errors:**
- Grading policy weights not summing to 100%: `"Category weights must sum to 100% (currently 80%)"`
- Grade scale overlap: `"Grade scale overlap: B (95) overlaps with A (90)"`
- Earned > possible on grade: `"Earned points (110) cannot exceed possible points (100)"`
- Recording on finalized grade: `"Grade for student X in course Y term Z is already finalized"`

---

## Key Data Types Reference

### Student Status Lifecycle
```
active --> graduated    (completed school)
active --> transferred  (moved to another school)
active --> withdrawn    (left school)
active --> inactive     (soft deleted)
```

### Enrollment Status Lifecycle
```
pending --> enrolled    (confirmed)
enrolled --> withdrawn  (withdrawal workflow)
enrolled --> transferred (transfer workflow)
enrolled --> graduated  (year complete)
```

### Grade Lifecycle
```
(no grade) --> recording assignments --> calculated
calculated --> finalized (locked, cannot modify)
```

### Assignment Types
`homework` | `quiz` | `test` | `project` | `essay` | `lab` | `participation` | `final_exam` | `midterm` | `other`

### Attendance Statuses
`present` | `absent` | `late` | `excused` | `half_day` | `early_departure` | `remote`

---

## Validation Rules Summary

| Entity | Field | Rule |
|--------|-------|------|
| Student | firstName, lastName | 2-50 chars |
| Student | schoolId | Must exist (validated against Identity) |
| Student | guardians | Max 10, at least 1 if provided |
| Course | courseCode | 2-20 chars, unique per school |
| Course | credits | 0-12 |
| Section | sectionNumber | Unique per course |
| Section | maxEnrollment | 1-500 |
| Grading Policy | categoryWeights | **Must sum to 100%** |
| Grading Policy | gradingScale | Ranges must not overlap |
| Grade | earnedPoints | <= possiblePoints (unless isExtraCredit) |
| Grade | finalized | Cannot record new assignments |

---

## Related Documentation

- [Data Models](./academics/DATA_MODELS.md) - Complete TypeScript interfaces
- [Entity Relationships](./academics/ENTITY_RELATIONSHIPS.md) - Database schema
- Working Examples: `scripts/smoke-tests/academics-full-flow.ts`
