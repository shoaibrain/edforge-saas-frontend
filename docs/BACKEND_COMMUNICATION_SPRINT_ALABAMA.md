# Backend Engineering — API Requirements for Sprint Alabama

**From:** Frontend Application Team
**To:** Backend Engineering Team
**Date:** February 8, 2026
**Re:** API gaps and new endpoint requests for Academics Module completion

---

## Executive Summary

The Academics frontend module is approximately 85% complete. To deliver the remaining 15%, we need the following backend support. Items are prioritized by frontend delivery dependency.

---

## P0 — Blocking Frontend Work

### 1. Staff GSI Fix (`GET /schools/{schoolId}/staff`)

**Status:** Broken — returns empty array
**Impact:** Teachers/Staff directory shows User fallback data instead of proper Staff records. Teacher names in Section drawers, Timetables, and Gradebook rely on this endpoint.
**Request:** Fix the DynamoDB GSI for `schoolAssignments[].schoolId` so that `GET /schools/{schoolId}/staff` returns staff records assigned to that school.
**Frontend Workaround (current):** Falling back to `GET /users` and normalizing User records into Staff-compatible shape. This loses role, employment status, hire date, and school assignment data.

### 2. Section `primaryTeacherName` Denormalization

**Status:** Missing from `SectionResponseDto`
**Impact:** Frontend must make N+1 calls to `GET /staff/:staffId` for every section to resolve teacher names. This causes visible lag in the Section Table and Timetable Grid.
**Request:** Denormalize `primaryTeacherName` on the Section response (populate at creation time from the Staff record, update when Staff name changes).
**Frontend Workaround (current):** Client-side resolution via `GET /staff/:staffId` with React Query caching.

---

## P1 — Required for Sprint Alabama Features

### 3. Student Sections Endpoint Confirmation

**Endpoint:** `GET /academics/students/:id/sections?academicYearId=`
**Status:** Listed in API status doc as available but not yet consumed by frontend.
**Request:** Confirm this endpoint returns the student's enrolled sections for a given academic year with the following shape:

```json
{
  "items": [
    {
      "sectionId": "uuid",
      "sectionNumber": "001",
      "sectionName": "Algebra I - Period 3",
      "courseId": "uuid",
      "courseName": "Algebra I",
      "courseCode": "MATH-101",
      "primaryTeacherId": "uuid",
      "primaryTeacherName": "Mrs. Smith",
      "roomNumber": "204",
      "schedule": { "days": ["Mon", "Wed", "Fri"], "startTime": "09:00", "endTime": "09:50" },
      "termId": "uuid",
      "termName": "Fall 2025",
      "enrollmentDate": "2025-08-15"
    }
  ]
}
```

**Needed for:** Student Profile Schedule tab (AL-1.2), Timetable Grid (AL-3.4).

### 4. Student GPA in Grades Response

**Endpoint:** `GET /academics/students/:id/grades?academicYearId=&termId=`
**Status:** Documented as returning `grades array + GPA object`.
**Request:** Confirm the GPA object shape:

```json
{
  "grades": [...],
  "gpa": {
    "unweighted": 3.5,
    "weighted": 3.7,
    "totalCredits": 12,
    "totalCreditsEarned": 12
  }
}
```

**Needed for:** Student Drawer quick stats (AL-1.5), Report Card (AL-5.3), Student Profile Grades tab (AL-1.3).

### 5. Attendance Summary by Date Range

**Endpoint:** `GET /academics/attendance/summary?schoolId=&startDate=&endDate=`
**Status:** Current endpoint only supports single `date` parameter.
**Request:** Add `startDate` and `endDate` query parameters to support date range queries for the attendance reports view. Return daily summaries for each date in the range:

```json
{
  "summaries": [
    { "date": "2026-01-06", "totalStudents": 250, "present": 240, "absent": 5, "late": 3, "excused": 2 },
    { "date": "2026-01-07", "totalStudents": 250, "present": 238, "absent": 7, "late": 3, "excused": 2 }
  ]
}
```

**Needed for:** Attendance Reports tab (AL-5.2).

---

## P2 — Future Sprint (Room CRUD)

### 6. Room/Classroom CRUD API

**Status:** Deferred to Sprint 5 per original plan.
**Request:** When ready, implement:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /academics/rooms` | POST | Create room with `schoolId`, `roomNumber`, `building`, `capacity`, `roomType` |
| `GET /academics/rooms?schoolId=` | GET | List rooms for a school (paginated) |
| `GET /academics/rooms/:id?schoolId=` | GET | Get single room |
| `PATCH /academics/rooms/:id?schoolId=` | PATCH | Update room |
| `DELETE /academics/rooms/:id?schoolId=` | DELETE | Soft delete room |

**Expected `RoomResponseDto`:**
```json
{
  "roomId": "uuid",
  "schoolId": "uuid",
  "roomNumber": "204",
  "building": "Main Building",
  "floor": "2",
  "capacity": 30,
  "roomType": "classroom",
  "features": ["projector", "whiteboard"],
  "isActive": true,
  "createdAt": "...",
  "updatedAt": "..."
}
```

**Frontend Status:** Alabama-4 (Classrooms tab) will be implemented using section-derived room data as a temporary measure. Once the Room API is available, we'll replace the client-side aggregation with real API calls.

---

## P2 — Data Quality

### 7. Staff Search Pagination Wrapper

**Endpoint:** `GET /staff/search/:term`
**Status:** Returns raw array instead of `{ items, hasMore }` envelope.
**Request:** Wrap the response in the standard pagination format. Currently the frontend handles both shapes, but consistency would simplify the code.

### 8. Error Response Standardization

**Status:** Some validation failures return 500 instead of 400 (e.g., missing required student fields).
**Request:** Ensure all validation errors return 400 with the standard error shape:
```json
{
  "statusCode": 400,
  "errorCode": "BAD_REQUEST",
  "message": "Human-readable description",
  "details": [{ "field": "firstName", "message": "First name is required" }]
}
```

**Impact:** Frontend `parseApiError` can display field-level errors to users.

---

## Timeline Request

| Item | Priority | Frontend Blocked? |
|------|----------|-------------------|
| Staff GSI fix | P0 | Partially (using workaround) |
| Section `primaryTeacherName` | P0 | Partially (using N+1 workaround) |
| Student sections endpoint confirmation | P1 | Yes, for Schedule tab |
| Student GPA shape confirmation | P1 | Yes, for GPA display |
| Attendance date range summary | P1 | Yes, for Reports tab |
| Room CRUD API | P2 | No (using section-derived data) |
| Staff search pagination | P2 | No (handling both shapes) |
| Error standardization | P2 | No (generic error handling works) |

Please provide ETAs for P0 and P1 items so we can sequence the frontend work accordingly.

---

## Questions

1. Is there a plan to link User records to Staff records (Option A: auto-create Staff from User, or Option B: query Users as Staff)? The current disconnect means teachers who are Users can't be properly assigned to sections with full Ed-Fi metadata.

2. Can the `GET /academics/sections` endpoint support a `schedule` field filter (e.g., `?hasSschedule=true`) so we can filter to only sections with time/day data for the timetable view?

3. Is there a bulk finalization endpoint planned (e.g., `POST /academics/grades/finalize/bulk` with an array of gradeIds)? Currently we call `PATCH /academics/grades/:gradeId/finalize` one at a time which is slow for end-of-term processing.
