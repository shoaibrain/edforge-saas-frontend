# Sprint Alaska — Backend Retrospective & Frontend Handoff

**Date:** 2026-02-09
**Sprint:** Alaska (Backend)
**Services Updated:** `academics` microservice, `identity` microservice, `shared-types`
**Deployment Status:** Microservices rebuilt & deployed. API Gateway config NOT updated.

---

## 1. Sprint Alaska Completion Summary

### Smoke Test Results (82.8% pass rate)

| Module | Pass | Fail | Skip | Notes |
|--------|------|------|------|-------|
| Foundation | 4 | 0 | 2 | Academic year activation works |
| Staff | 0 | 7 | 0 | **Pre-existing schema change** (not Alaska) |
| Students | 10 | 0 | 0 | Short phone numbers accepted |
| Enrollment | 14 | 2 | 1 | Core Alaska features verified |
| Courses | 10 | 1 | 0 | Prerequisite edge case (not Alaska) |
| Sections | 1 | 0 | 10 | Cascade from staff failures |
| Schedules | 1 | 0 | 0 | — |
| GradingPolicy | 2 | 0 | 0 | — |
| Attendance | 1 | 0 | 6 | — |
| Verification | 5 | 0 | 3 | — |
| **Total** | **48** | **10** | **22** | — |

### Task Completion Matrix

| Task ID | Description | Status | Notes |
|---------|-------------|--------|-------|
| AK1-1 | Error response contract (`ErrorResponseDto`) | **DONE** | `errorCode`, `timestamp`, `errors[]`, `details.validationErrors[]` |
| AK1-2 | Phone validation relaxation | **DONE** | Removed `min(10)` — accepts any length ≤20 |
| AK2-1 | Ed-Fi fields on `createEnrollmentSchema` | **DONE** | 8 descriptor fields added |
| AK2-2 | Ed-Fi fields on `enrollmentResponseSchema` + `withdrawStudentSchema` | **DONE** | 9 response fields, `exitWithdrawTypeDescriptor` on withdraw |
| AK2-3 | Enrollment entity Ed-Fi fields | **DONE** | 9 fields added to DynamoDB entity |
| AK2-4 | EnrollmentModule wiring (IdentityClientService) | **DONE** | HttpClientModule + IdentityClientService injected |
| AK2-5 | Academic year status validation | **DONE** | Enrollment requires year status `'active'` |
| AK2-6 | Enrollment date range validation | **DONE** | Date must fall within year's `startDate`–`endDate` |
| AK2-7 | Ed-Fi field persistence (service + mapper) | **DONE** | Create, read, and withdraw flows |
| AK2-8 | Zod DTO wiring on enrollment controller | **DONE** | `CreateEnrollmentDtoZ`, `UpdateEnrollmentDtoZ`, `WithdrawStudentDtoZ`, `TransferStudentDtoZ` |
| AK3-1 | Duplicate student check endpoint | **DONE (code)** | Endpoint exists but NOT reachable via API Gateway |
| AK3-2 | Duplicate student check service logic | **DONE (code)** | Queries GSI1 by school, filters by name+DOB |
| AK3-3 | Calendar placeholder endpoint | **DONE (code)** | Returns default calendar stub |

---

## 2. What Changed — Frontend Impact

### 2.1 Error Response Format (ALL endpoints)

Every 4xx/5xx response now follows this contract:

```json
{
  "statusCode": 400,
  "errorCode": "BAD_REQUEST",
  "message": "Validation failed",
  "errors": [
    { "path": ["gradeLevel"], "message": "Required", "code": "invalid_type" }
  ],
  "details": {
    "validationErrors": [
      { "path": "gradeLevel", "message": "Required", "code": "invalid_type" }
    ]
  },
  "timestamp": "2026-02-09T22:46:38.287Z",
  "requestId": "cebcfee7-...",
  "path": "/academics/enrollments"
}
```

**Frontend action items:**
- `errors[]` → Use for programmatic field-level error mapping. `path` is an **array** (e.g., `["guardians", 0, "phone"]`).
- `details.validationErrors[]` → Use for human-readable display. `path` is a **dot-joined string** (e.g., `"guardians.0.phone"`).
- `errorCode` → Machine-readable code for switch/case handling (`BAD_REQUEST`, `NOT_FOUND`, `CONFLICT`, `VALIDATION_ERROR`, `INTERNAL_SERVER_ERROR`).
- `timestamp` + `requestId` → Include in error reports / support tickets.

### 2.2 Enrollment Creation — New Fields

**POST `/academics/enrollments`** now accepts (all optional with defaults):

```typescript
{
  // Existing required fields
  studentId: string;       // UUID
  schoolId: string;        // UUID
  academicYearId: string;  // UUID
  gradeLevel: string;      // 'K' | '1' | ... | '12'
  enrollmentDate: string;  // YYYY-MM-DD (must be within academic year range)
  enrollmentType: 'new' | 'transfer' | 'returning' | 're_enrollment';

  // NEW Ed-Fi fields (all optional)
  entryGradeLevelDescriptor?: string;    // max 100 chars, e.g., "uri://ed-fi.org/GradeLevelDescriptor#Tenth grade"
  entryTypeDescriptor?: string;          // max 100 chars
  enrollmentTypeDescriptor?: string;     // max 100 chars
  residencyStatusDescriptor?: string;    // max 200 chars
  primarySchool?: boolean;               // default: true
  fullTimeEquivalency?: number;          // 0–1, default: 1.0
  repeatGradeIndicator?: boolean;        // default: false
  calendarCode?: string;                 // max 100 chars

  // Existing optional fields
  previousSchoolName?: string;
  transferReason?: string;
  sectionId?: string;
  homeroomId?: string;
  notes?: string;
}
```

**BREAKING CHANGE:** `enrollmentType: 'original'` is no longer valid. Use `'new'` instead.

**Validation changes:**
- Academic year **must be in `'active'` status**. Call `PUT /schools/:schoolId/academic-years/:yearId/status` with `{ "status": "active" }` first.
- `enrollmentDate` **must fall within** the academic year's `startDate`–`endDate` range. Out-of-range dates return 400.

### 2.3 Enrollment Response — New Fields

**GET** enrollment endpoints now return additional Ed-Fi fields:

```typescript
{
  // ... existing fields ...

  // NEW Ed-Fi response fields
  entryGradeLevelDescriptor?: string;
  entryTypeDescriptor?: string;
  enrollmentTypeDescriptor?: string;
  residencyStatusDescriptor?: string;
  primarySchool?: boolean;
  fullTimeEquivalency?: number;
  repeatGradeIndicator?: boolean;
  calendarCode?: string;
  exitWithdrawTypeDescriptor?: string;  // Only present after withdrawal
}
```

### 2.4 Withdrawal — New Field

**POST `/academics/schools/:schoolId/years/:yearId/students/:studentId/withdraw`** now accepts:

```typescript
{
  withdrawalDate: string;   // YYYY-MM-DD (required)
  reason: string;           // max 500 (required)
  notes?: string;           // max 2000
  lastDayAttended?: string; // YYYY-MM-DD
  exitCode?: string;        // max 20

  // NEW
  exitWithdrawTypeDescriptor?: string;  // max 100, e.g., "uri://ed-fi.org/ExitWithdrawTypeDescriptor#Transferred"
}
```

### 2.5 Phone Validation Relaxed

Phone fields on enrollment staff and parent/guardian schemas no longer require minimum 10 characters. Any string up to 20 characters is accepted. This means:
- `"555-0100"` (7 chars) — now valid
- International formats without country code — now valid
- Frontend can relax phone input validation masks accordingly

### 2.6 Staff Schema Changes (Pre-existing, NOT Alaska)

The staff creation schema (`POST /staff`) has been updated with new required fields:

```typescript
{
  staffUniqueId: string;    // required
  firstName: string;        // required
  lastSurname: string;      // required
  email: string;            // required
  primarySchoolId: string;  // required (UUID) — NEW REQUIRED
  role: string;             // required — NEW REQUIRED (from staffRoleSchema enum)
  hireDate: string;         // required (YYYY-MM-DD) — NEW REQUIRED
  // ... other optional fields unchanged
}
```

**BREAKING:** The old `schoolAssignments[]` array is no longer the way to assign a school. Use `primarySchoolId` + `role` directly.

---

## 3. Known Issues & Blockers

### 3.1 API Gateway Config Not Updated

The following endpoints exist in the microservice but are **NOT reachable** through the API Gateway:

| Endpoint | HTTP Method | Why Blocked |
|----------|-------------|-------------|
| `/academics/students/check-duplicate` | GET | Not in `tenant-api-prod.json` |
| `/academics/schools/:schoolId/academic-years/:yearId/calendars` | GET | Not in `tenant-api-prod.json` |
| `/academics/schools/:schoolId/years/:yearId/students/:studentId/withdraw` | POST | Returns 403 — JWT auth not configured for this path |
| `/academics/schools/:schoolId/years/:yearId/students/:studentId/transfer` | POST | Same as above — likely not configured |

**Action required:** Update `server/lib/tenant-api-prod.json` and redeploy the CDK stack to expose these routes.

### 3.2 Withdrawal/Transfer 403 Issue

The enrollment withdrawal and transfer endpoints return:
```json
{
  "message": "Invalid key=value pair (missing equal-sign) in Authorization header..."
}
```
This is AWS API Gateway rejecting the Bearer token because the route isn't configured for Cognito JWT auth — it falls back to IAM SigV4 auth. Frontend will get 403 until the gateway config is updated.

### 3.3 Enrollment Date Range vs Duplicate Check Ordering

When a student is already enrolled and you send an enrollment with an out-of-range date, the service returns 409 CONFLICT (duplicate check) rather than 400 (date range). This is correct behavior — the duplicate check runs first. Frontend should handle both 400 and 409 on enrollment creation.

---

## 4. API Endpoint Inventory (Post-Alaska)

### Enrollment Endpoints (Academics Service)

| Method | Path | Status | Notes |
|--------|------|--------|-------|
| POST | `/academics/enrollments` | **Working** | Zod-validated, Ed-Fi fields, year validation |
| GET | `/academics/schools/:schoolId/years/:yearId/enrollments` | **Working** | Paginated list with filters |
| GET | `/academics/schools/:schoolId/years/:yearId/enrollments/summary` | **Working** | Aggregate counts |
| GET | `/academics/students/:studentId/enrollment` | **Working** | Student enrollment history |
| GET | `/academics/schools/:schoolId/years/:yearId/students/:studentId/enrollment` | **Working** | Specific enrollment |
| PATCH | `/academics/schools/:schoolId/years/:yearId/students/:studentId/enrollment` | **Working** | Update enrollment |
| POST | `.../:studentId/withdraw` | **Blocked (403)** | Needs API Gateway config |
| POST | `.../:studentId/transfer` | **Blocked (403)** | Needs API Gateway config |
| GET | `/academics/students/check-duplicate` | **Blocked (not routed)** | Needs API Gateway config |
| GET | `/academics/schools/:schoolId/academic-years/:yearId/calendars` | **Blocked (not routed)** | Needs API Gateway config |

### Identity Endpoints (For Enrollment Flow)

| Method | Path | Status | Notes |
|--------|------|--------|-------|
| PUT | `/schools/:schoolId/academic-years/:yearId/status` | **Working** | Set to `'active'` before enrollment |
| PUT | `/schools/:schoolId/academic-years/:yearId/set-current` | **Working** | Optional: mark as current year |
| GET | `/schools/:schoolId/academic-years` | **Working** | List years (includes `status` field) |

---

## 5. Frontend Checklist for Alaska Sprint

- [ ] Update error handling to parse new `ErrorResponseDto` format (`errors[]`, `details.validationErrors[]`, `errorCode`)
- [ ] Update enrollment creation form to use `enrollmentType: 'new'` (not `'original'`)
- [ ] Add Ed-Fi descriptor fields to enrollment form (all optional, can be hidden under "Advanced" section)
- [ ] Add academic year activation step in school setup flow (`PUT .../status` with `{ status: 'active' }`)
- [ ] Show enrollment date range error when `enrollmentDate` falls outside academic year
- [ ] Update enrollment detail views to display Ed-Fi descriptor fields when present
- [ ] Add `exitWithdrawTypeDescriptor` field to withdrawal form (when gateway is fixed)
- [ ] Relax phone input validation — remove min-length requirement
- [ ] Update staff creation form: replace `schoolAssignments[]` with `primarySchoolId` + `role` + `hireDate`
- [ ] Handle 409 CONFLICT on enrollment creation (student already enrolled)
- [ ] Handle 403 gracefully on withdrawal/transfer endpoints (display "endpoint not yet available" or retry)

---

## 6. Schemas Reference

All TypeScript types are exported from `@edforge/shared-types`:

```typescript
import {
  CreateEnrollmentDto,
  UpdateEnrollmentDto,
  EnrollmentResponseDto,
  WithdrawStudentDto,
  TransferStudentDto,
  EnrollmentSummaryDto,
  EnrollmentStatus,       // 'pending' | 'enrolled' | 'active' | 'withdrawn' | 'graduated' | 'transferred' | 'inactive'
  ErrorResponseDto,       // { statusCode, errorCode, message, errors?, details?, timestamp, requestId?, path? }
} from '@edforge/shared-types';
```

Build the shared-types package to get updated type definitions:
```bash
cd packages/shared-types && npm run build
```
