# Sprint Alaska: Student Enrollment Process Improvement

> **Scope**: Frontend application (`edforge-saas-frontend`)
> **Branch**: `stud-sch-enroll`
> **Ed-Fi Alignment**: [StudentSchoolAssociation v5](https://docs.ed-fi.org/partners/certification/available-certifications/sis-v5/test-scenarios/student-school-association-scenarios/), [School Calendar Domain v6](https://docs.ed-fi.org/reference/data-exchange/data-standard/model-reference/school-calendar-domain/)

---

## Executive Summary

The EdForge student enrollment process has critical bugs (400 validation error on student creation), missing Ed-Fi data fields, and UX gaps that prevent reliable student-school enrollment. Sprint Alaska addresses these across four incremental sprints, each producing a demo-able, testable improvement.

---

## Current State Analysis

### Root Cause: 400 Validation Error on Student Creation

The `POST /academics/students` call fails with `ZodValidationException: Validation failed` due to **three schema mismatches**:

1. **Address field naming**: Frontend form schema (`student.form.ts`) uses `postalCode`; shared-types `addressSchema` (`common.ts`) uses `zipCode`. The `buildStudentPayload` in `RegistrationWizard.tsx` (line 412) casts `data.contactInfo` directly to `CreateStudentDto['contactInfo']` without any field mapping, sending `postalCode` to a backend that expects `zipCode`.

2. **Extra fields in payload**: The form data includes `contactInfo.address.street` (from the UI address component) which is not defined in `addressSchema`. Zod strict parsing rejects unknown keys.

3. **Phone validation gap**: Frontend form allows any string up to 20 chars for phone; shared-types `guardianSchema` requires `z.string().min(10).max(20)` — guardian phone numbers shorter than 10 chars fail backend validation silently.

### Additional Issues

| Issue | Severity | Impact |
|-------|----------|--------|
| Academic Year field is free-text input (should be UUID dropdown) | Critical | Enrollment creation fails — `academicYearId` must be UUID |
| `buildEnrollmentPayload` uses `crypto.randomUUID()` as fallback for missing year | Critical | Creates orphaned enrollments with fake year IDs |
| Backend error response doesn't surface Zod field-level errors | High | Users see "Validation failed" with no guidance on what to fix |
| Service-layer types (`WithdrawStudentParams`, `TransferStudentParams`) diverge from shared-types | High | Frontend/backend contract drift |
| Missing Ed-Fi enrollment descriptors (`entryTypeDescriptor`, `residencyStatusDescriptor`, etc.) | High | Not Ed-Fi compliant for state reporting |
| No Calendar association on enrollment (Ed-Fi requirement) | High | Missing mandatory Ed-Fi data |
| Enrollment step is marked optional in wizard | Medium | Students can be created without enrollment records |
| `re_enrollment` type missing from UI options | Medium | Schema supports it but form doesn't offer it |
| Review Step shows raw `academicYearId` UUID instead of year name | Low | Poor UX |

---

## Backend Communication Summary

> **For backend engineers starting their own Alaska sprint.** The frontend changes below assume the following backend behaviors. Items marked with [REQUIRED] must be in place for the frontend sprint to succeed.

### [REQUIRED] Error Response Contract

Frontend will parse Zod validation errors from this shape:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errorCode": "BAD_REQUEST",
  "errors": [
    { "path": ["contactInfo", "address", "zipCode"], "message": "Required" },
    { "path": ["guardians", 0, "phone"], "message": "String must contain at least 10 characters" }
  ]
}
```

If the backend currently only returns `{ message: "Validation failed" }` without the `errors` array, **please add the nestjs-zod error details to the response body**.

### [REQUIRED] Address Schema Alignment

Both frontend and backend will standardize on `zipCode` (already in `addressSchema` in `common.ts`). The field `postalCode` will not be used. The `street` field will not be accepted — only `street1` and `street2`.

### [REQUIRED] Academic Year Status Validation

Backend should validate that `createEnrollmentSchema.academicYearId` references an `active` academic year. Return 400 with message: `"Academic year must be in 'active' status for enrollment"` if the year is in `planning`/`completed`/`archived` status.

### [REQUIRED] Enrollment Date Range Validation

Backend should validate that `enrollmentDate` falls within the academic year's `startDate` and `endDate`. Return 400 with descriptive error if out of range.

### New Enrollment Schema Fields (Sprint Alaska-2)

`createEnrollmentSchema` will include new optional fields:

```typescript
// Ed-Fi StudentSchoolAssociation aligned fields
entryGradeLevelDescriptor: z.string().max(100).optional(),
entryTypeDescriptor: z.string().max(100).optional(),
enrollmentTypeDescriptor: z.string().max(100).optional(),
residencyStatusDescriptor: z.string().max(200).optional(),
primarySchool: z.boolean().default(true),
fullTimeEquivalency: z.number().min(0).max(1).default(1.0),
repeatGradeIndicator: z.boolean().default(false),
calendarCode: z.string().max(100).optional(),
```

Backend should accept and persist these. Internal storage uses EdForge-native values (e.g., "First Grade", "Next year school"). Ed-Fi URI descriptor mapping (e.g., `uri://ed-fi.org/EntryTypeDescriptor#Next year school`) happens in the Ed-Fi sync/mapper layer, not in the enrollment CRUD.

### Withdrawal Schema Update

`withdrawStudentSchema` will include:

```typescript
exitWithdrawTypeDescriptor: z.string().max(100).optional(),
```

### [NICE-TO-HAVE] Duplicate Student Check Endpoint

```
GET /academics/students/check-duplicate?firstName=X&lastName=Y&dateOfBirth=YYYY-MM-DD
Response: { exists: boolean, matches: StudentResponseDto[] }
```

### [NICE-TO-HAVE] Calendar Endpoint

```
GET /schools/:schoolId/academic-years/:yearId/calendars
Response: CalendarResponseDto[]
```

---

## Sprint Alaska-1: Foundation — Schema Alignment & Error Handling

> **Goal**: Fix the blocking 400 error, establish reliable schema alignment, and make the enrollment form functional end-to-end.
>
> **Demo**: Student creation form submits successfully. Academic year is selected from a dropdown of real years. Validation errors display specific field issues.

### AK-1.1: Standardize address field naming across frontend form and shared-types

**Files**: `apps/academics/src/schemas/student.form.ts`, `types/packages/shared-types/src/schemas/common.ts`

**Work**:
- In `student.form.ts`, rename `postalCode` to `zipCode` in the address schema objects (lines 107, 117)
- Update `defaultStudentFormData` address objects to use `zipCode` instead of `postalCode` (lines 235, 243)
- Verify `addressSchema` in `common.ts` already uses `zipCode` (it does — line 115)

**Validation**:
- Unit test: Create a mock form address object, run through `addressSchema.parse()`, assert success
- Manual: Fill out address in Contact step, check payload in Network tab uses `zipCode`

**Depends on**: Nothing

---

### AK-1.2: Add address field mapping and cleanup in `buildStudentPayload`

**Files**: `apps/academics/src/components/students/registration/RegistrationWizard.tsx`

**Work**:
- Replace the direct cast on line 412 (`contactInfo: data.contactInfo as CreateStudentDto['contactInfo']`) with an explicit mapping function
- Strip unknown fields (`street`) from address objects
- Map `postalCode` -> `zipCode` as a safety net (in case UI components still emit `postalCode`)
- Strip empty string values from optional fields before sending

**Validation**:
- Unit test: `buildStudentPayload` output passes `createStudentSchema.parse()` from shared-types
- Manual: Submit form, confirm no extraneous fields in Network payload

**Depends on**: AK-1.1

---

### AK-1.3: Fix phone validation to match backend requirements

**Files**: `apps/academics/src/schemas/student.form.ts`, relevant form step components

**Work**:
- Update guardian phone field in `guardiansStepSchema` to require min 10 chars when provided
- Update contact phone in `contactInfoStepSchema` to require min 10 chars when provided
- Add `re_enrollment` to `ENROLLMENT_TYPE_OPTIONS` array (line 56-60) to match shared-types `enrollmentTypeSchema`
- Add helper text to phone fields: "Minimum 10 digits"

**Validation**:
- Manual: Enter a 7-digit phone in guardian form, see validation error
- Confirm: guardian phone of 10+ digits passes both frontend and backend validation

**Depends on**: Nothing

---

### AK-1.4: Improve error handling to surface Zod validation details

**Files**: `apps/academics/src/services/academics.service.ts`

**Work**:
- Update `ApiErrorResponse` interface to include `errors?: Array<{ path: string[]; message: string }>`
- Update `parseApiError` 400 handler to:
  - Extract field-level errors from `data.errors` array
  - Build `fieldErrors` map from `path` -> `message`
  - Compose a user-friendly summary message listing the specific failing fields
- Update error toast to show specific field names, e.g., "Validation failed: Guardian phone must be at least 10 characters"

**Validation**:
- Unit test: Mock axios error with nestjs-zod error shape, assert `parseApiError` returns correct `fieldErrors` map
- Manual: Submit form with intentional validation error, confirm toast shows field-specific message

**Depends on**: Nothing (backend must return `errors` array — see Backend Communication)

---

### AK-1.5: Replace Academic Year free-text input with dropdown selector

**Files**: `apps/academics/src/components/students/registration/steps/EnrollmentStep.tsx`

**Work**:
- Import `useAcademicYears` from `hooks/useSchool`
- Import `useActiveSchoolId` from `stores/app.store`
- Replace `TextField` for `enrollment.academicYearId` with a `SelectField`
- Populate options from `useAcademicYears(schoolId)` — display `year.name`, store `year.yearId`
- Handle loading state (skeleton/spinner in select)
- Handle error state (retry prompt)
- Handle empty state ("No academic years configured — please set up in School Settings")

**Validation**:
- Manual: Open enrollment step, see academic years dropdown populated with real years
- Manual: Select a year, confirm `yearId` (UUID) is stored in form data
- Manual: With no academic years, see helpful empty state message

**Depends on**: Nothing (uses existing `useAcademicYears` hook)

---

### AK-1.6: Filter academic year dropdown to eligible years and add status badge

**Files**: `apps/academics/src/components/students/registration/steps/EnrollmentStep.tsx`

**Work**:
- Filter academic years to show only `active` and `planning` status
- Add status badge next to each option: green for Active, amber for Planning
- If only one active year, auto-select it
- Show warning tooltip on Planning years: "This year is not yet active"

**Validation**:
- Manual: Dropdown only shows active/planning years, not completed/archived
- Manual: Status badges are visible and correctly colored
- Manual: Single active year auto-selects

**Depends on**: AK-1.5

---

### AK-1.7: Remove `crypto.randomUUID()` fallback in enrollment payload builder

**Files**: `apps/academics/src/components/students/registration/RegistrationWizard.tsx`

**Work**:
- Remove `crypto.randomUUID()` fallback on line 445
- If `enrollment.academicYearId` is empty/undefined, return `null` from `buildEnrollmentPayload` (don't create enrollment)
- Show validation error on the enrollment step if date is provided but year is not

**Validation**:
- Manual: Submit enrollment without selecting academic year — enrollment not created, no fake UUID
- Manual: Submit with academic year selected — enrollment created with real year ID

**Depends on**: AK-1.5, AK-1.6

---

### AK-1.8: Align service-layer withdraw/transfer types with shared-types

**Files**: `apps/academics/src/services/academics.service.ts`

**Work**:
- Remove local `WithdrawStudentParams` interface (line 682-687)
- Remove local `TransferStudentParams` interface (line 689-694)
- Import and use `WithdrawStudentDto` and `TransferStudentDto` from `@edforge/shared-types`
- Update `withdrawStudent` and `transferStudent` function signatures
- Reconcile field name differences (`transferDate` -> `effectiveDate`, `destinationSchool` -> `newSchoolId`)
- Update `WithdrawalModal` and `TransferModal` to use the correct field names

**Validation**:
- TypeScript compilation succeeds with no type errors
- Manual: Withdraw a student — API call uses correct field names
- Manual: Transfer a student — API call uses correct field names

**Depends on**: Nothing

---

### AK-1.9: Update `enrollmentStepSchema` to require `academicYearId` as UUID

**Files**: `apps/academics/src/schemas/student.form.ts`

**Work**:
- Change `academicYearId: z.string().optional().or(z.literal(''))` to `academicYearId: z.string().uuid('Please select an academic year').optional().or(z.literal(''))`
- This ensures if a value is provided, it must be a valid UUID (not free text)
- When enrollment step becomes required (AK-2.8), this will become `.uuid().min(1)`

**Validation**:
- Manual: Typing arbitrary text in (old) field would fail validation; selecting from dropdown provides UUID

**Depends on**: AK-1.5

---

**Sprint Alaska-1 Deliverables Checklist**:
- [ ] Student creation form submits without 400 error
- [ ] Academic year is a dropdown with real year options
- [ ] Validation errors show specific field names
- [ ] Phone fields enforce min-length
- [ ] No `crypto.randomUUID()` fallback
- [ ] Withdraw/transfer types aligned with shared-types
- [ ] `re_enrollment` option available in enrollment type

---

## Sprint Alaska-2: Ed-Fi Enrollment Data Model Alignment

> **Goal**: Add Ed-Fi aligned fields to the enrollment data model (schemas, form UI, API payload), and make enrollment a required step.
>
> **Demo**: Enrollment form captures all data required for Ed-Fi StudentSchoolAssociation compliance. Enrollment is now a required step with smart defaults. Withdrawal includes exit type descriptor.

### AK-2.1: Add Ed-Fi enrollment descriptor fields to shared-types schema

**Files**: `types/packages/shared-types/src/schemas/enrollment/enrollment.schema.ts`

**Work**:
- Add to `createEnrollmentSchema`:
  ```typescript
  entryGradeLevelDescriptor: z.string().max(100).optional(),
  entryTypeDescriptor: z.string().max(100).optional(),
  enrollmentTypeDescriptor: z.string().max(100).optional(),
  residencyStatusDescriptor: z.string().max(200).optional(),
  primarySchool: z.boolean().default(true),
  fullTimeEquivalency: z.number().min(0).max(1).default(1.0),
  repeatGradeIndicator: z.boolean().default(false),
  calendarCode: z.string().max(100).optional(),
  ```
- Add corresponding fields to `enrollmentResponseSchema`
- Add `exitWithdrawTypeDescriptor: z.string().max(100).optional()` to `withdrawStudentSchema`

**Design Decision — `entryGradeLevelDescriptor` vs `gradeLevel`**:
- `gradeLevel` remains the EdForge-internal grade value (e.g., "5", "K", "PK")
- `entryGradeLevelDescriptor` is the Ed-Fi display label (e.g., "Fifth grade", "Kindergarten")
- The Ed-Fi URI form (e.g., `uri://ed-fi.org/GradeLevelDescriptor#Fifth grade`) is computed only in the Ed-Fi mapper layer, not stored in enrollment records

**Validation**:
- Unit test: Schema parses successfully with new fields
- Unit test: Schema parses successfully without new fields (they're optional)
- TypeScript: `CreateEnrollmentDto` type includes new fields

**Depends on**: Nothing

---

### AK-2.2: Create Ed-Fi descriptor constants for enrollment

**Files**: New file `apps/academics/src/schemas/edfi-descriptors.ts`

**Work**:
- Create typed constant arrays for Ed-Fi enrollment descriptors:
  ```typescript
  export const ENTRY_TYPE_OPTIONS = [
    { value: 'Next year school', label: 'Next Year School' },
    { value: 'Transfer from a public school in the same LEA', label: 'Transfer (Same District)' },
    { value: 'Transfer from a public school in a different LEA', label: 'Transfer (Different District)' },
    { value: 'Transfer from a private school', label: 'Transfer (Private School)' },
    { value: 'Re-entry from same school', label: 'Re-entry' },
    { value: 'Original entry', label: 'Original Entry' },
  ]
  
  export const RESIDENCY_STATUS_OPTIONS = [
    { value: 'Resident of admin unit and target school area', label: 'Resident — Admin Unit & School Area' },
    { value: 'Resident of admin unit but not target school area', label: 'Resident — Admin Unit Only' },
    { value: 'Not a resident', label: 'Not a Resident' },
  ]
  
  export const EXIT_WITHDRAW_TYPE_OPTIONS = [
    { value: 'Transferred', label: 'Transferred' },
    { value: 'Graduated', label: 'Graduated' },
    { value: 'Expelled', label: 'Expelled' },
    { value: 'Withdrawn due to illness', label: 'Illness' },
    { value: 'Moved out of state', label: 'Moved Out of State' },
    { value: 'Withdrawn', label: 'Withdrawn (Other)' },
  ]
  
  // Grade level descriptor mapping from internal -> Ed-Fi label
  export const GRADE_LEVEL_DESCRIPTORS: Record<string, string> = {
    'PK': 'Pre-Kindergarten', 'K': 'Kindergarten',
    '1': 'First grade', '2': 'Second grade', /* ... */
  }
  ```
- Export from index

**Strategy**: Store human-readable values (e.g., "Next year school") in enrollment records. The Ed-Fi URI form (`uri://ed-fi.org/EntryTypeDescriptor#Next year school`) is computed only in the Ed-Fi sync mapper layer.

**Validation**:
- TypeScript compilation succeeds
- Constants are importable from the schemas directory

**Depends on**: Nothing

---

### AK-2.3: Add Ed-Fi descriptor fields to EnrollmentStep UI (entry type & residency)

**Files**: `apps/academics/src/components/students/registration/steps/EnrollmentStep.tsx`

**Work**:
- Add "Entry Details" section with:
  - Entry Type selector (`enrollment.entryTypeDescriptor`) — uses `ENTRY_TYPE_OPTIONS`
  - Residency Status selector (`enrollment.residencyStatusDescriptor`) — uses `RESIDENCY_STATUS_OPTIONS`
- Auto-derive `entryGradeLevelDescriptor` from `currentGradeLevel` using `GRADE_LEVEL_DESCRIPTORS` mapping (no separate UI field needed — computed on submit)
- Layout: Insert after "Enrollment Details" section, before "Transfer Information"

**Validation**:
- Manual: Entry Type and Residency Status selectors appear in enrollment form
- Manual: Selected values are captured in form data
- Manual: Form still validates and submits correctly

**Depends on**: AK-2.2

---

### AK-2.4: Add Ed-Fi boolean/numeric fields to EnrollmentStep UI

**Files**: `apps/academics/src/components/students/registration/steps/EnrollmentStep.tsx`, `apps/academics/src/schemas/student.form.ts`

**Work**:
- Add "Enrollment Configuration" section with:
  - Primary School toggle (`enrollment.primarySchool`) — defaults `true`
  - Full-Time Equivalency field (`enrollment.fullTimeEquivalency`) — number input, defaults `1.0`, range 0-1
  - Repeat Grade Indicator toggle (`enrollment.repeatGradeIndicator`) — defaults `false`
  - Conditionally show `entryGradeLevelReasonDescriptor` if repeat grade is `true`
- Update `enrollmentStepSchema` in `student.form.ts` with new fields and defaults
- Update `defaultStudentFormData.enrollment` with new default values

**Validation**:
- Manual: New fields appear in enrollment form with correct defaults
- Manual: Toggling repeat grade shows/hides the reason field
- Manual: Defaults are pre-filled (primarySchool=true, FTE=1.0, repeatGrade=false)

**Depends on**: AK-2.2

---

### AK-2.5: Update `buildEnrollmentPayload` to include Ed-Fi fields

**Files**: `apps/academics/src/components/students/registration/RegistrationWizard.tsx`

**Work**:
- Update `buildEnrollmentPayload` to map new fields from enrollment form data:
  - `entryTypeDescriptor`, `residencyStatusDescriptor`, `primarySchool`, `fullTimeEquivalency`, `repeatGradeIndicator`
  - Compute `entryGradeLevelDescriptor` from `data.currentGradeLevel` using `GRADE_LEVEL_DESCRIPTORS`
  - Compute `enrollmentTypeDescriptor` from `enrollment.enrollmentType` (e.g., "new" -> "Current")
- Set defaults for fields not explicitly set by user

**Validation**:
- Unit test: `buildEnrollmentPayload` output includes all new Ed-Fi fields
- Manual: Check Network tab payload includes Ed-Fi descriptor fields

**Depends on**: AK-2.1, AK-2.3, AK-2.4

---

### AK-2.6: Update ReviewStep to display Ed-Fi enrollment fields and resolved year name

**Files**: `apps/academics/src/components/students/registration/steps/ReviewStep.tsx`

**Work**:
- Display entry type, residency status, primary school, FTE, repeat grade indicator in Enrollment section
- Resolve `academicYearId` to year name:
  - Accept academic years data as prop or use context/hook
  - Look up `yearId` -> `name` and display the name
- Display human-readable labels for all descriptor fields (not raw values)
- Show "--" for unset optional fields

**Validation**:
- Manual: Review step shows all enrollment fields with correct labels
- Manual: Academic Year shows name (e.g., "2026-2027") not UUID
- Manual: Unset optional fields show dashes

**Depends on**: AK-2.3, AK-2.4

---

### AK-2.7: Add exit withdraw type descriptor to WithdrawalModal

**Files**: `apps/academics/src/components/enrollment/WithdrawalModal.tsx`

**Work**:
- Add `exitWithdrawTypeDescriptor` select field using `EXIT_WITHDRAW_TYPE_OPTIONS`
- Position above the "Reason" textarea
- Update the withdrawal mutation to send the new field

**Validation**:
- Manual: Withdrawal modal shows Exit Type dropdown
- Manual: Selected exit type is included in API payload

**Depends on**: AK-2.1, AK-2.2

---

### AK-2.8: Make enrollment step required with smart defaults

**Files**: `apps/academics/src/components/students/registration/RegistrationWizard.tsx`, `apps/academics/src/schemas/student.form.ts`

**Work**:
- Change `isOptional: true` to `isOptional: false` for the enrollment step (line 101)
- Remove `.optional()` from `enrollmentStepSchema.enrollment` (line 200)
- Make `academicYearId` required: `z.string().uuid('Please select an academic year')`
- Make `enrollmentDate` required (already is)
- Auto-fill: enrollment type "new", date today, auto-select active year if only one exists
- If no active academic year exists, show blocking message: "No active academic year. Please configure one in School Settings before enrolling students."

**Validation**:
- Manual: Cannot skip enrollment step
- Manual: Must select academic year before submitting
- Manual: With no active year, shows blocking message with link to settings

**Depends on**: AK-1.5, AK-1.6, AK-2.3, AK-2.4

---

**Sprint Alaska-2 Deliverables Checklist**:
- [ ] Enrollment schema includes all Ed-Fi StudentSchoolAssociation fields
- [ ] Entry Type and Residency Status selectors in form
- [ ] Primary School, FTE, Repeat Grade fields with defaults
- [ ] Enrollment is required (not optional)
- [ ] Review step shows resolved year name, not UUID
- [ ] Withdrawal modal includes Exit Type descriptor
- [ ] Ed-Fi descriptor constants centralized in one file

---

## Sprint Alaska-3: Academic Year & Calendar Integration

> **Goal**: Enforce proper academic year lifecycle during enrollment and integrate calendar association per Ed-Fi Calendar Domain guidance.
>
> **Demo**: Enrollment date is constrained to academic year range. Academic year status is validated. Calendar association captured. Dashboard shows year context with actionable setup guidance.
>
> **Demo Prerequisite**: Ensure the demo school has at least one active academic year with calendars configured.

### AK-3.1: Validate academic year status before enrollment submission

**Files**: `apps/academics/src/components/students/registration/steps/EnrollmentStep.tsx`

**Work**:
- When academic year is selected, check its `status` field
- If `planning`: Show amber warning banner: "This academic year is in Planning status. Enrollment will be set to Pending until the year is activated."
- If `completed` or `archived`: Disable selection (these are already filtered out in AK-1.6, but add a safety check)
- If `active`: Show green confirmation: "Active academic year — enrollment will be immediately active"

**Validation**:
- Manual: Select a planning-status year, see warning banner
- Manual: Select an active year, see green confirmation
- Manual: Completed/archived years not selectable

**Depends on**: AK-1.5, AK-1.6

---

### AK-3.2: Constrain and auto-default enrollment date from selected academic year

**Files**: `apps/academics/src/components/students/registration/steps/EnrollmentStep.tsx`

**Work**:
- When an academic year is selected:
  - Set `min` and `max` attributes on the enrollment date picker to the year's `startDate` and `endDate`
  - Auto-populate enrollment date to the year's `startDate` (user can override)
  - Show helper text: "Must be within [startDate] - [endDate]"
- If enrollment date is outside range when year changes, reset it to year's start date with toast notification

**Validation**:
- Manual: Select a year, date picker constraints update
- Manual: Date auto-populates to year start date
- Manual: Cannot select a date outside the year range
- Manual: Helper text shows the valid range

**Depends on**: AK-1.5

---

### AK-3.3: Add Calendar association to enrollment form

**Files**: `apps/academics/src/components/students/registration/steps/EnrollmentStep.tsx`, `apps/academics/src/services/school.service.ts`, `apps/academics/src/hooks/useSchool.ts`

**Work**:
- Add `getCalendars(schoolId, yearId)` to school service (if backend endpoint exists)
- Add `useCalendars(schoolId, yearId)` hook
- In EnrollmentStep, add Calendar selector (`enrollment.calendarCode`):
  - Appears after Academic Year selector
  - Populated from `useCalendars` for the selected year
  - If only one calendar, auto-select it
  - If no calendars available, show info message: "No calendars configured for this academic year"
- Per Ed-Fi: "A student must have an association with a Calendar and the association should not be deleted, only updated"

**Validation**:
- Manual: Calendar dropdown appears when calendars exist
- Manual: Single calendar auto-selects
- Manual: Empty state shows informational message
- If backend endpoint doesn't exist yet, show a placeholder with "Calendar association coming soon"

**Depends on**: AK-1.5 (academic year dropdown must exist)

---

### AK-3.4: Enhance enrollment dashboard with academic year context

**Files**: `apps/academics/src/components/enrollment/EnrollmentDashboard.tsx`, `apps/academics/src/routes/enrollment/index.tsx`

**Work**:
- Show active academic year name and date range prominently at top of dashboard
- Add year status badge (Planning = amber, Active = green, Completed = blue)
- When no active year exists, replace dashboard stats with a setup prompt:
  - "No active academic year for this school"
  - "Set up an academic year in School Settings to begin enrolling students"
  - Link/button to school settings academic year tab
- Show year date range progress bar (how far into the year we are)

**Validation**:
- Manual: Dashboard shows active year name, dates, status badge
- Manual: With no active year, setup prompt appears
- Manual: Setup prompt links to correct settings page

**Depends on**: Nothing (uses existing `useCurrentAcademicYear` hook)

---

### AK-3.5: Resolve academic year name in all enrollment display components

**Files**: `apps/academics/src/components/enrollment/EnrollmentTable.tsx`, `apps/academics/src/components/students/profile/EnrollmentTab.tsx`

**Work**:
- Create a shared utility `useResolveAcademicYearName(yearId)` or use the year name from the response DTO
- In `EnrollmentTable`: Replace raw `academicYearId` with `academicYearName`
- In `EnrollmentTab`: Ensure `academicYearName` displays properly (it already uses this field from the DTO — verify it's populated)
- In `EnrollmentDashboard`: Ensure year name shows from the selected year object

**Validation**:
- Manual: No raw UUIDs visible in any enrollment-related UI
- Manual: Year name shows correctly in enrollment table, student profile enrollment tab, and dashboard

**Depends on**: Nothing

---

**Sprint Alaska-3 Deliverables Checklist**:
- [ ] Academic year status validated with visual feedback
- [ ] Enrollment date constrained to year range with auto-default
- [ ] Calendar association field in enrollment form (or placeholder if backend not ready)
- [ ] Dashboard shows year context with setup guidance
- [ ] No raw UUIDs in any enrollment UI

---

## Sprint Alaska-4: Enrollment UX Polish & Data Integrity

> **Goal**: Improve enrollment usability with duplicate detection, draft persistence, error recovery, and audit trail.
>
> **Demo**: Duplicate student detection prevents errors. Draft form data survives browser close. Partial submission has clear recovery path. Full audit trail visible on enrollment records.

### AK-4.1: Add duplicate student detection before creation

**Files**: New hook `apps/academics/src/hooks/useDuplicateCheck.ts`, `apps/academics/src/services/academics.service.ts`, `apps/academics/src/components/students/registration/RegistrationWizard.tsx`

**Work**:
- Add `checkDuplicateStudent(params: { firstName, lastName, dateOfBirth })` to academics service
  - If backend endpoint doesn't exist yet, implement client-side check using existing student list query
- Create `useDuplicateCheck()` hook wrapping the service call
- Before calling `createStudent` in `handleSubmit`:
  - Run duplicate check
  - If match found, show confirmation dialog:
    - "A student named [Name] with the same date of birth already exists"
    - Show existing student info
    - Options: "View Existing Student" (navigates to their profile) | "Create Anyway" (proceeds)
  - If no match, proceed normally

**Validation**:
- Manual: Create student with same name+DOB as existing — warning dialog appears
- Manual: "View Existing" navigates to the student profile
- Manual: "Create Anyway" proceeds with creation
- Manual: Unique student creates without interruption

**Depends on**: Nothing

---

### AK-4.2: Add enrollment summary confirmation in Review Step

**Files**: `apps/academics/src/components/students/registration/steps/ReviewStep.tsx`

**Work**:
- Add a prominent "What will happen" card at the top of the Review Step:
  ```
  When you click "Create Student":
  ✓ A student record will be created for [First Last]
  ✓ [First] will be enrolled in [Academic Year Name] at [School Name]
  ✓ Grade Level: [Grade X] | Enrollment Type: [New Student]
  ✓ Enrollment Date: [Date]
  ```
- If enrollment data is incomplete, show what's missing:
  ```
  ⚠ No enrollment data — student will be created without enrollment
  ```
- Highlight any missing recommended fields (guardians, medical info)

**Validation**:
- Manual: Review step shows clear summary of what will happen
- Manual: Missing data is flagged
- Manual: Summary data matches actual form inputs

**Depends on**: AK-2.6

---

### AK-4.3: Improve enrollment error recovery on partial success

**Files**: `apps/academics/src/components/students/registration/RegistrationWizard.tsx`

**Work**:
- If student creation succeeds but enrollment fails:
  - Don't navigate away — stay on the Review step
  - Show success + failure status:
    - Green: "Student record created successfully"
    - Red: "Enrollment failed: [specific error]"
  - Show two action buttons:
    - "Retry Enrollment" — re-attempts enrollment with the created student ID
    - "Go to Student Profile" — navigates to the student (enrollment can be added later)
  - Disable "Create Student" button (student already exists)
- Add enrollment retry logic in the mutation

**Validation**:
- Manual: Simulate enrollment failure (e.g., bad year ID) — recovery UI appears
- Manual: "Retry Enrollment" re-sends enrollment request
- Manual: "Go to Student Profile" navigates correctly
- Manual: Successful enrollment navigates to profile as before

**Depends on**: Nothing

---

### AK-4.4: Add form data persistence (draft save)

**Files**: `apps/academics/src/components/students/registration/RegistrationWizard.tsx`

**Work**:
- On each wizard step change, save current form data to `localStorage` with key `edforge:enrollment-draft:{schoolId}`
- On component mount:
  - Check for existing draft
  - If found, show restore dialog: "You have an unfinished enrollment form. Would you like to continue where you left off?"
  - "Restore" — populates form with saved data
  - "Start Fresh" — clears draft, starts with defaults
- Clear draft on successful submission
- Clear draft on explicit "Discard" from cancel dialog
- Add a subtle "Draft saved" indicator in the footer

**Validation**:
- Manual: Fill out 3 steps, close browser, reopen enrollment page — restore dialog appears
- Manual: "Restore" repopulates all filled data
- Manual: "Start Fresh" starts with empty form
- Manual: Successful creation clears the draft

**Depends on**: Nothing

---

### AK-4.5: Add enrollment audit trail display

**Files**: `apps/academics/src/components/students/profile/EnrollmentTab.tsx`

**Work**:
- Show `createdAt`, `createdBy`, `updatedAt`, `updatedBy` on enrollment records
- Format dates as relative time for recent (e.g., "2 hours ago") and absolute for older
- Show status change history if available from the enrollment response
- Display as a subtle metadata row below each enrollment record

**Validation**:
- Manual: Enrollment record in student profile shows created/updated timestamps
- Manual: Timestamps use readable format

**Depends on**: Nothing (uses existing fields from `enrollmentResponseSchema`)

---

### AK-4.6: Create Ed-Fi enrollment mapper for data export

**Files**: New file `apps/edfi/src/mappers/enrollment.mapper.ts`

**Work**:
- Create mapper function `toStudentSchoolAssociation(enrollment: EnrollmentResponseDto): StudentSchoolAssociationResource`
- Map EdForge fields to Ed-Fi resource shape:
  - `schoolReference.schoolId` from `schoolId`
  - `studentReference.studentUniqueId` from `studentId`
  - `entryDate` from `enrollmentDate`
  - `entryGradeLevelDescriptor` with `uri://ed-fi.org/GradeLevelDescriptor#` prefix
  - `entryTypeDescriptor` with `uri://ed-fi.org/EntryTypeDescriptor#` prefix
  - `enrollmentTypeDescriptor` with `uri://ed-fi.org/EnrollmentTypeDescriptor#` prefix
  - `exitWithdrawDate` from `withdrawalDate`
  - `exitWithdrawTypeDescriptor` with URI prefix
  - `residencyStatusDescriptor` with URI prefix
  - `primarySchool`, `fullTimeEquivalency`, `repeatGradeIndicator` direct mapping
  - `calendarReference.calendarCode` from `calendarCode`
- Add reverse mapper `fromStudentSchoolAssociation` for future import support

**Validation**:
- Unit test: Map a sample enrollment to StudentSchoolAssociation format, assert all fields correct
- Unit test: Ed-Fi descriptor URIs are properly formatted

**Depends on**: AK-2.1 (schema with Ed-Fi fields)

---

**Sprint Alaska-4 Deliverables Checklist**:
- [ ] Duplicate student detection with warning dialog
- [ ] Enrollment summary confirmation in Review step
- [ ] Error recovery UI for partial success (student created, enrollment failed)
- [ ] Draft save/restore with localStorage persistence
- [ ] Audit trail (created/updated metadata) on enrollment records
- [ ] Ed-Fi StudentSchoolAssociation mapper for data export

---

## Appendix A: File Impact Map

| File | Sprints | Changes |
|------|---------|---------|
| `apps/academics/src/schemas/student.form.ts` | 1, 2 | Address field rename, phone validation, enrollment fields, defaults |
| `apps/academics/src/components/students/registration/steps/EnrollmentStep.tsx` | 1, 2, 3 | Academic year dropdown, Ed-Fi fields, calendar, date constraints |
| `apps/academics/src/components/students/registration/RegistrationWizard.tsx` | 1, 2, 4 | Payload builder, enrollment required, error recovery, draft save |
| `apps/academics/src/components/students/registration/steps/ReviewStep.tsx` | 2, 4 | Ed-Fi fields display, year name resolution, summary confirmation |
| `apps/academics/src/services/academics.service.ts` | 1 | Error handling, type alignment |
| `apps/academics/src/services/school.service.ts` | 3 | Calendar endpoint |
| `apps/academics/src/components/enrollment/EnrollmentDashboard.tsx` | 3 | Year context display |
| `apps/academics/src/components/enrollment/WithdrawalModal.tsx` | 2 | Exit type descriptor |
| `types/packages/shared-types/src/schemas/enrollment/enrollment.schema.ts` | 2 | Ed-Fi fields, withdrawal schema |
| `types/packages/shared-types/src/schemas/common.ts` | 1 | Address schema verification |
| New: `apps/academics/src/schemas/edfi-descriptors.ts` | 2 | Ed-Fi descriptor constants |
| New: `apps/academics/src/hooks/useDuplicateCheck.ts` | 4 | Duplicate detection hook |
| New: `apps/edfi/src/mappers/enrollment.mapper.ts` | 4 | Ed-Fi data mapper |

## Appendix B: Ed-Fi StudentSchoolAssociation Field Coverage

| Ed-Fi Field | EdForge Field | Sprint | Status |
|-------------|---------------|--------|--------|
| `schoolReference.schoolId` | `schoolId` | — | Already exists |
| `studentReference.studentUniqueId` | `studentId` | — | Already exists |
| `entryDate` | `enrollmentDate` | — | Already exists |
| `entryGradeLevelDescriptor` | Computed from `gradeLevel` | Alaska-2 | New |
| `entryTypeDescriptor` | `entryTypeDescriptor` | Alaska-2 | New |
| `enrollmentTypeDescriptor` | `enrollmentTypeDescriptor` | Alaska-2 | New |
| `exitWithdrawDate` | `withdrawalDate` | — | Already exists |
| `exitWithdrawTypeDescriptor` | `exitWithdrawTypeDescriptor` | Alaska-2 | New |
| `residencyStatusDescriptor` | `residencyStatusDescriptor` | Alaska-2 | New |
| `primarySchool` | `primarySchool` | Alaska-2 | New |
| `fullTimeEquivalency` | `fullTimeEquivalency` | Alaska-2 | New |
| `repeatGradeIndicator` | `repeatGradeIndicator` | Alaska-2 | New |
| `calendarReference.calendarCode` | `calendarCode` | Alaska-3 | New |
| `graduationPlanReference` | Not yet planned | Future | Backlog |
| `schoolChoice` | Not yet planned | Future | Backlog |
| `schoolChoiceBasisDescriptor` | Not yet planned | Future | Backlog |
| `employedWhileEnrolled` | Not yet planned | Future | Backlog |
| `nextYearGradeLevelDescriptor` | Not yet planned | Future | Backlog |
| `nextYearSchoolReference` | Not yet planned | Future | Backlog |

## Appendix C: Ed-Fi Descriptor Storage Strategy

**Internal (EdForge DB)**: Store human-readable labels

```json
{
  "entryTypeDescriptor": "Next year school",
  "residencyStatusDescriptor": "Resident of admin unit and school area",
  "entryGradeLevelDescriptor": "First grade"
}
```

**Ed-Fi API (Mapper Layer)**: Prefix with Ed-Fi namespace URI

```json
{
  "entryTypeDescriptor": "uri://ed-fi.org/EntryTypeDescriptor#Next year school",
  "residencyStatusDescriptor": "uri://ed-fi.org/ResidencyStatusDescriptor#Resident of admin unit and school area",
  "entryGradeLevelDescriptor": "uri://ed-fi.org/GradeLevelDescriptor#First grade"
}
```

This separation keeps the enrollment CRUD clean while ensuring Ed-Fi compliance in the sync layer.
