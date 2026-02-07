# EdForge Backend → Frontend Integration Status Report

**From:** Backend Engineering Team
**To:** Frontend Application Team
**Date:** February 7, 2026
**Re:** API Readiness for Client Application Development (Sprint 1–3)

---

## Executive Summary

We have reviewed the Frontend Team's entity model document (`FRONT_END_APP_TEAM_DOCUMENT.md`) in full. Below is a concise status report of every API domain, confirmed behavior from automated smoke tests, known gaps, and integration guidance. The backend covers **two NestJS microservices**: Identity (port 3010) and Academics (port 3011), both behind a shared API Gateway.

**Bottom line:** Sprint 1 and Sprint 2 domains are **production-ready** for frontend integration. Sprint 3 (Staff integration + API contract alignment) has partial gaps documented below.

---

## 1. API Readiness Matrix

| Domain | Sprint | Status | Notes |
|--------|--------|--------|-------|
| **Schools** | — | ✅ Ready | Full CRUD, gradeRange, timezone, locale |
| **Academic Years** | — | ✅ Ready | CRUD + grading periods (semesters/quarters) |
| **Staff** | SP3 | ⚠️ Partial | CRUD works; `GET /staff?schoolId=` returns empty (GSI issue); search works |
| **Students** | SP1 | ✅ Ready | Full CRUD + profile + enrollment/attendance/grades aggregation |
| **Annual Enrollment** | SP1 | ✅ Ready | Create, list, summary, withdraw, transfer workflows |
| **Courses** | SP1+SP3 | ✅ Ready | Full CRUD; AP/honors/dual_enrollment/vocational types supported |
| **Sections** | SP1+SP3 | ✅ Ready | Full CRUD; `courseCode`/`courseName` denormalized; `primaryTeacherName` NOT yet denormalized |
| **Section Enrollment** | SP1+SP4 | ✅ Ready | Enroll/drop with atomic capacity enforcement + duplicate prevention |
| **Grading Policies** | SP2 | ✅ Ready | CRUD; A–F scale, category weights (must sum to 100%), rounding rules |
| **Grades** | SP2 | ✅ Ready | Single + bulk recording, section gradebook, finalization, GPA calculation |
| **Attendance** | SP2 | ✅ Ready | Single + bulk recording, daily summary, student history + summary, update |
| **Rooms** | SP5 | 🔲 Not Started | Use text input for room field; Room CRUD deferred to Sprint 5 |

---

## 2. Confirmed API Contracts (Test-Verified)

All endpoints below have been exercised by automated smoke tests and return the documented response shapes.

### 2.1 Pagination Format — Confirmed

**Every list endpoint** returns the consistent envelope:

```json
{
  "items": [],
  "hasMore": false,
  "lastEvaluatedKey": "optional-cursor-string"
}
```

**Verified on:** `/academics/students`, `/academics/courses`, `/academics/sections`, `/academics/enrollments`, `/schools`, `/schools/{id}/academic-years`

**One exception:** `GET /staff/search/{term}` currently returns a **raw array** instead of the pagination envelope. A wrapper will be added in an upcoming patch.

### 2.2 Students API — Production Ready

| Endpoint | Verified | Response Shape |
|----------|----------|----------------|
| `POST /academics/students` | ✅ 201 | `StudentResponseDto` with auto-generated `studentNumber` |
| `GET /academics/students?schoolId=&limit=` | ✅ 200 | Paginated `{ items, hasMore }` |
| `GET /academics/students/:id` | ✅ 200 | Full `StudentResponseDto` |
| `GET /academics/students/:id/profile` | ✅ 200 | **Aggregated** profile with enrollment, attendance summary |
| `PATCH /academics/students/:id` | ✅ 200 | Updated student |
| `DELETE /academics/students/:id` | ✅ 204 | Soft delete |
| `GET /academics/students/:id/sections?academicYearId=` | ✅ 200 | Student's section schedule |
| `GET /academics/students/:id/grades?academicYearId=&termId=` | ✅ 200 | Grades array + GPA object |
| `GET /academics/students/:id/enrollments` | ✅ 200 | Enrollment history |
| `GET /academics/students/:id/attendance/summary` | ✅ 200 | Attendance rate + counts |

**Key:** The `/profile` endpoint is the **single-call solution** for the Student Profile page. It aggregates core demographics, current enrollment, and attendance summary in one response.

### 2.3 Annual Enrollment API — Production Ready

| Endpoint | Verified | Notes |
|----------|----------|-------|
| `POST /academics/enrollments` | ✅ 201 | Body: `{ studentId, schoolId, academicYearId, gradeLevel, enrollmentDate, enrollmentType, status }` |
| `GET /academics/schools/:schoolId/years/:yearId/enrollments` | ✅ 200 | Paginated, filters: `gradeLevel`, `status` |
| `GET /academics/schools/:schoolId/years/:yearId/enrollments/summary` | ✅ 200 | `{ totalEnrolled, byGradeLevel, byStatus }` |
| `POST .../withdraw` | ✅ | Withdrawal with reason code |
| `POST .../transfer` | ✅ | Transfer with destination school |

### 2.4 Courses API — Production Ready

| Endpoint | Verified | Notes |
|----------|----------|-------|
| `POST /academics/courses` | ✅ 201 | Full Ed-Fi fields including `subjectArea`, `courseType`, `creditType`, `prerequisites` |
| `GET /academics/courses?schoolId=` | ✅ 200 | Paginated; filters: `subjectArea`, `courseType`, `search` |
| `GET /academics/courses/:id?schoolId=` | ✅ 200 | Includes `prerequisites[]` |
| `PATCH /academics/courses/:id?schoolId=` | ✅ 200 | Partial update; self-referencing prerequisite is rejected (400) |
| `DELETE /academics/courses/:id?schoolId=` | ✅ 204 | Soft delete (sets `isActive=false`) |

**Ed-Fi courseType enum — confirmed accepted values:**
`required` | `elective` | `honors` | `ap` | `ib` | `dual_enrollment` | `remedial` | `vocational`

**Ed-Fi creditType enum — confirmed accepted values:**
`academic` | `elective` | `honors` | `ap` | `ib` | `dual_enrollment`

### 2.5 Sections API — Production Ready (with one gap)

| Endpoint | Verified | Notes |
|----------|----------|-------|
| `POST /academics/sections` | ✅ 201 | Validates `primaryTeacherId` via Identity service; initializes `currentEnrollment: 0` |
| `GET /academics/sections?schoolId=` | ✅ 200 | Paginated; filters: `courseId`, `teacherId`, `academicYearId` |
| `GET /academics/sections/:id?schoolId=` | ✅ 200 | Full section with denormalized fields |
| `PATCH /academics/sections/:id?schoolId=` | ✅ 200 | Partial update |
| `DELETE /academics/sections/:id?schoolId=` | ✅ 204/400 | **400 if students enrolled** (protection implemented) |

**Denormalized fields on section response:**

| Field | Status | Notes |
|-------|--------|-------|
| `courseCode` | ✅ Present | Denormalized at creation time |
| `courseName` | ✅ Present | Denormalized at creation time |
| `primaryTeacherName` | ⚠️ Missing | **Not yet denormalized** — will be added in upcoming deployment |
| `roomNumber` | 🔲 Deferred | Room entity not implemented yet (Sprint 5) |

**Workaround for `primaryTeacherName`:** Frontend should resolve teacher name by calling `GET /staff/:staffId` using the `primaryTeacherId` from the section response, and cache it client-side.

### 2.6 Section Enrollment (Roster) — Production Ready

| Endpoint | Verified | Notes |
|----------|----------|-------|
| `POST /academics/sections/:id/students?schoolId=` | ✅ 201 | Body: `{ studentId }` |
| `GET /academics/sections/:id/students?schoolId=` | ✅ 200 | Section roster |
| `DELETE /academics/sections/:id/students/:studentId?schoolId=` | ✅ 204 | Drops student, decrements counter |

**Business rules — confirmed working:**
- ✅ **Capacity enforcement:** Enrollment rejected with 400 when `currentEnrollment >= maxEnrollment`
- ✅ **Duplicate prevention:** Re-enrolling same student returns 409 (`"Student X is already enrolled in section Y"`)
- ✅ **Atomic counter:** `currentEnrollment` accurately tracks enrollments and drops
- ✅ **Delete protection:** Cannot delete section while students are enrolled (returns 400)

### 2.7 Grading Policies — Production Ready

| Endpoint | Verified | Notes |
|----------|----------|-------|
| `POST /academics/grading-policies` | ✅ 201 | Scale + category weights + rounding rule |
| `GET /academics/grading-policies?schoolId=` | ✅ 200 | List all school policies |
| `GET /academics/grading-policies/:id?schoolId=` | ✅ 200 | Single policy detail |
| `PATCH /academics/grading-policies/:id?schoolId=` | ✅ 200 | Update |

**Validation rules:**
- Category weights **must sum to 100%** — server rejects otherwise
- Grade scale ranges must not overlap
- Standard rounding rules: `standard` | `up` | `down`

**Category IDs used in grading:** `tests`, `quizzes`, `homework`, `participation`, `projects` (must match between policy and grade recording)

### 2.8 Grades — Production Ready

| Endpoint | Verified | Notes |
|----------|----------|-------|
| `POST /academics/grades/record` | ✅ 201 | Single assignment grade with auto-calculation |
| `POST /academics/grades/record/bulk` | ✅ 200 | Bulk: `{ grades: [{ studentId, earnedPoints }], assignment: {...} }` |
| `GET /academics/grades?studentId=&courseId=&termId=` | ✅ 200 | Student's grade for a course/term |
| `GET /academics/grades/section/:sectionId?schoolId=&termId=` | ✅ 200 | **Teacher gradebook** — all students' grades |
| `PATCH /academics/grades/:gradeId/finalize` | ✅ 200 | Lock grade; `isFinal=true` |

**Grade recording body:**
```json
{
  "studentId": "uuid",
  "courseId": "uuid",
  "sectionId": "uuid",
  "schoolId": "uuid",
  "termId": "string",
  "academicYearId": "uuid",
  "teacherId": "uuid",
  "assignment": {
    "assignmentName": "Chapter 1 Quiz",
    "assignmentType": "quiz",
    "categoryId": "quizzes",
    "possiblePoints": 20
  },
  "earnedPoints": 18
}
```

**Grade composite key:** `gradeId = studentId:courseId:termId` (used for finalization endpoint)

**GPA calculation:** Available via `GET /academics/students/:id/grades?academicYearId=&termId=`. Returns weighted GPA (AP/Honors on 5.0 scale).

### 2.9 Attendance — Production Ready

| Endpoint | Verified | Notes |
|----------|----------|-------|
| `POST /academics/attendance` | ✅ 201 | Single record |
| `POST /academics/attendance/bulk` | ✅ 200 | Classroom-wide; returns `{ recorded, errors }` |
| `GET /academics/attendance/summary?schoolId=&date=` | ✅ 200 | Daily school summary |
| `GET /academics/attendance/student/:id?startDate=&endDate=` | ✅ 200 | Student history |
| `GET /academics/attendance/student/:id/summary` | ✅ 200 | Rate + counts |
| `PATCH /academics/attendance/:date/:studentId` | ✅ 200 | Correct a record |

**Attendance statuses:** `present` | `absent` | `late` | `excused` | `half_day` | `early_departure` | `remote`

### 2.10 Staff API — Partial (Known Gaps)

| Endpoint | Status | Notes |
|----------|--------|-------|
| `POST /staff` | ✅ 201 | Creates staff with `schoolAssignments[]` |
| `GET /staff/:staffId` | ✅ 200 | Full staff detail |
| `GET /staff/search/:term` | ✅ 200 | Name search works — returns results (raw array, not paginated) |
| `PATCH /staff/:staffId` | ✅ 200 | Update |
| `DELETE /staff/:staffId` | ✅ 204 | Soft delete |
| `GET /staff?schoolId=` | ⚠️ Returns empty | **Known issue:** GSI does not index `schoolAssignments[].schoolId` |
| `GET /schools/:schoolId/staff` | ⚠️ Returns empty | Same root cause as above |
| `GET /staff/by-email?email=` | ⚠️ 404 for valid staff | Email lookup not indexing correctly |

**Workaround for `GET /schools/{schoolId}/staff`:**
Until the GSI fix is deployed, the frontend should:
1. Use `GET /staff/search/{term}` for teacher autocomplete in forms
2. For staff listing, use `GET /staff` (returns all tenant staff) and filter client-side by school

---

## 3. Error Response Format — Standardized

All error responses follow this shape:

```json
{
  "statusCode": 400,
  "errorCode": "BAD_REQUEST",
  "message": "Human-readable description",
  "timestamp": "2026-02-06T22:46:22.673Z",
  "requestId": "uuid",
  "path": "/academics/courses/..."
}
```

**Error codes:** `BAD_REQUEST` (400), `NOT_FOUND` (404), `CONFLICT` (409), `FORBIDDEN` (403), `INTERNAL_SERVER_ERROR` (500)

**Known issue:** Some validation failures return 500 instead of 400 (e.g., missing required student fields). This is being fixed in SP4-9 (error handling standardization).

---

## 4. Known Gaps & Planned Fixes

| Gap | Impact | Fix Timeline | Workaround |
|-----|--------|-------------|------------|
| `primaryTeacherName` not denormalized on sections | Frontend must resolve teacher name separately | SP3-4 (next deployment) | Call `GET /staff/:staffId` with `primaryTeacherId` |
| `GET /staff?schoolId=` returns empty | Cannot list staff by school | SP3-1 (GSI fix pending) | Use `GET /staff/search/{term}` or `GET /staff` |
| `GET /staff/search/:term` returns raw array | Inconsistent pagination format | SP3-6 patch | Handle both array and `{ items }` envelope |
| Co-teacher validation not enforced | `coTeacherIds` with invalid UUIDs accepted | SP4-4 | Frontend should validate before submit |
| Academic year validation on section creation | Fake `academicYearId` accepted | SP4-5 | Use valid year IDs from `GET /schools/{id}/academic-years` |
| Course name propagation to sections | Updating course name doesn't update section `courseName` | SP4-7 | Re-fetch section after course update |
| Enum validation not strict on courses | Invalid `courseType`/`subjectArea` accepted | SP4-10 | Frontend should enforce enum values from Zod schemas |
| Missing student fields → 500 (not 400) | Poor error UX on incomplete forms | SP4-9 | Frontend form validation should prevent this |

---

## 5. Recommended Frontend Integration Order

Based on API readiness and dependency chain:

### Phase 1 — Core Views (Ready Now)
1. **School selector** — `GET /schools`
2. **Academic year selector** — `GET /schools/{id}/academic-years`
3. **Student directory** — `GET /academics/students?schoolId=`
4. **Student registration form** — `POST /academics/students`
5. **Course catalog** — `GET /academics/courses?schoolId=`
6. **Course creation form** — `POST /academics/courses`

### Phase 2 — Enrollment & Scheduling (Ready Now)
7. **Annual enrollment wizard** — `POST /academics/enrollments`
8. **Section management** — `GET/POST /academics/sections`
9. **Section roster (enroll/drop)** — `POST/DELETE /academics/sections/{id}/students`
10. **Student schedule view** — `GET /academics/students/{id}/sections`

### Phase 3 — Grading & Attendance (Ready Now)
11. **Grading policy setup** — `POST /academics/grading-policies`
12. **Teacher gradebook** — `GET /academics/grades/section/{id}`, `POST /academics/grades/record/bulk`
13. **Daily attendance form** — `POST /academics/attendance/bulk`
14. **Attendance dashboard** — `GET /academics/attendance/summary`

### Phase 4 — Aggregated Views (Ready Now)
15. **Student profile page** — `GET /academics/students/{id}/profile`
16. **Report card view** — `GET /academics/students/{id}/grades`
17. **Enrollment summary dashboard** — `GET .../enrollments/summary`

### Phase 5 — Staff Management (Partial — Use Workarounds)
18. **Teacher autocomplete** — `GET /staff/search/{term}` (works)
19. **Staff directory** — `GET /staff` + client-side filter (until GSI fix)

---

## 6. Architecture Quick Reference

```
Client (edforge.app)
    │
    ▼
API Gateway (REST, JWT auth via Cognito)
    │
    ├── /schools, /staff, /schools/{id}/staff   →  Identity Service (3010)
    │   └── DynamoDB: identity-table-{tier}
    │
    └── /academics/*                            →  Academics Service (3011)
        └── DynamoDB: school-table-{tier}
```

**Authentication:** All endpoints require `Authorization: Bearer <cognito-id-token>`. The JWT contains `custom:tenantId` and `custom:userRole` (TenantAdmin | TenantUser) used for tenant isolation.

**Tenant isolation:** DynamoDB partition key starts with `TENANT#{tenantId}` — data is physically isolated per tenant. The token vending machine + ABAC policies enforce this at the infrastructure level.

**Soft deletes:** All DELETE endpoints set `isActive=false`. Soft-deleted records remain queryable by ID but are excluded from list results by default.

---

## 7. Shared Types (Zod Schemas)

The `@edforge/shared-types` package contains all Zod schemas used for request validation. Frontend can import these for client-side form validation to match server-side rules exactly.

```
packages/shared-types/src/schemas/
├── academics/
│   ├── course.schema.ts       # CreateCourseDtoZ, UpdateCourseDtoZ
│   ├── assignment.schema.ts   # Assignment types
│   ├── attendance.schema.ts   # Attendance statuses
│   ├── classroom.schema.ts    # Room (deferred)
│   └── grade.schema.ts        # Grade recording DTOs
├── identity/
│   ├── staff.schema.ts        # StaffResponseDto shape
│   └── ...
└── common.d.ts                # Shared enums, validators
```

---

## Questions?

If any endpoint behaves differently than documented here, file an issue with:
- The exact HTTP request (method, path, headers, body)
- The response status and body
- The `requestId` from the error response (for CloudWatch log correlation)
