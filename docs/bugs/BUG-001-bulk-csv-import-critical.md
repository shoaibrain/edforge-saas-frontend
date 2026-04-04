# BUG-001: Bulk CSV Student Import — Multiple Critical Issues

**Priority:** P1 — Critical
**Component:** Academics > Students > CSV Import
**Affects:** Backend (`students.service.ts`), Frontend (`CSVImport.tsx`), Data Integrity
**Reporter:** Claude Code (automated analysis from test evidence)
**Date:** 2026-03-19
**Status:** Open

---

## Summary

The bulk CSV student import pipeline has **6 confirmed bugs** spanning backend status handling, frontend-backend type mismatches, missing validation, and architectural gaps. Bulk-imported students are incorrectly marked `active` with no enrollment record, corrupt the dashboard KPIs, and display broken duplicate match info. These issues make the feature **not production-ready**.

---

## BUG 1 (Critical): Imported Students Set to `active` — Should Be `pending`

**File:** `server/application/microservices/academics/src/students/students.service.ts` (line 142)

**Problem:** All bulk-imported students are hardcoded to `status: 'active'` despite having **no enrollment record** created. The import only creates student records — it never calls `enrollmentService.createEnrollment()`.

**Evidence from API response:**
```json
{
  "firstName": "Aarav",
  "lastName": "Tamang",
  "status": "active",
  "enrollmentDate": "2026-03-19",
  "currentGradeLevel": "1"
}
```

**Impact:**
- Students appear "Active" but cannot be placed in sections, classrooms, or academic year rosters
- Dashboard KPIs are inconsistent — student count inflated but enrolled count is zero
- "TOTAL ENROLLED" KPI shows `—` because dashboard queries enrollment records (which don't exist)
- Filters show these students under "Active" tab, misleading administrators
- Breaks the enrollment workflow assumption: active students should have enrollments

**Expected behavior:** Bulk-imported students should have `status: 'pending'`. From there, the admin enrolls them through the enrollment workflow, which creates proper enrollment records with academic year, grade level descriptors, and Ed-Fi compliance fields.

---

## BUG 2 (Critical): Grade Level Stored as Raw String — No Referential Integrity

**File:** `server/application/microservices/academics/src/students/students.service.ts` (line 1003)

**Problem:** The CSV import stores `currentGradeLevel` as the raw CSV string (e.g., `"3"`, `"5"`). No validation against the school's configured grade range. No Ed-Fi grade level descriptor mapping.

**Why this matters:**
- Enrollment in sections requires grade levels matching the school's configuration
- Ed-Fi compliance requires `entryGradeLevelDescriptor` from proper grade mapping
- `"Grade 3"` vs `"03"` vs `"3"` are treated as different grades — no normalization
- No validation that grade is within school's configured range (e.g., school configured PK-5 but CSV has grade 10)

**Expected behavior:** Validate grade levels against `PK, K, 1-12` constants and the school's grade range during import, or defer grade assignment to the enrollment step.

---

## BUG 3 (High): Duplicate Match Display Shows "undefined undefined"

**Files:**
- Frontend: `apps/academics/src/components/students/CSVImport.tsx` (line 625)
- Backend: `server/application/microservices/academics/src/students/students.service.ts` (lines 963-970)

**Problem:** Frontend-backend type mismatch.

Backend returns:
```typescript
{ studentId: string, name: string, confidence: string }
```

Frontend renders:
```jsx
d.matches.map((m) => `${m.firstName} ${m.lastName}`)
// → "undefined undefined"
```

**Evidence (screenshot):**
```
Row 4: matched undefined undefined (high confidence)
Row 5: matched undefined undefined (medium confidence)
```

**Fix:** Change CSVImport.tsx line 625 to use `m.name`. Update `DuplicateMatch` interface or create `ImportDuplicateMatch` type.

---

## BUG 4 (Medium): Frontend Validation Misses Invalid Date Formats and Gender Values

**File:** `apps/academics/src/components/students/CSVImport.tsx` (lines 100-113)

**Problem:** Frontend validation only checks field **presence**, not format or value correctness.

**Evidence:**
- Row 7 (`birthDate: 15-03-2012`) → passed frontend preview as "Valid" ✓ → failed at backend
- Row 8 (`gender: Male`) → passed frontend preview as "Valid" ✓ → backend silently lowercased to `male`
- Preview showed "16 valid, 4 with errors" instead of expected "14 valid, 6 with errors"
- Backend result: 15 imported + 1 error (only the bad date caught)

**Expected frontend validation:**
- Date format: regex `YYYY-MM-DD`
- Gender: one of `male`, `female`, `other`, `prefer_not_to_say`
- Grade level: one of `PK`, `K`, `1`-`12`

---

## BUG 5 (Medium): Dedup Check Misses Known Duplicates

**Evidence (File 3 — duplicates test):**
- CSV had 3 rows that are exact duplicates of students already in the DB (Aarav Tamang, Srishti Sherpa, Bibek Thapa — same firstName + lastName + birthDate)
- **Actual result:** `9 Imported, 1 Skipped` — only 1 of 3 caught
- Near-duplicate "Sristi" Sherpa (vs existing "Srishti") was imported and flagged in display but not counted as error

**Expected:** 3+ skipped (high-confidence matches against existing DB records).

---

## BUG 6 (Low): `enrollmentDate` Set on Import Without Enrollment

**File:** `server/application/microservices/academics/src/students/students.service.ts`

**Problem:** Import sets `enrollmentDate` to current date for all students, even though no enrollment exists. Students table shows "Mar 18, 2026" under "ENROLLED" column, which is misleading.

**Expected:** `enrollmentDate` should be `null` until actual enrollment is created.

---

## Architectural Root Cause

The bulk import creates a **split-brain state**:

| System | Shows | Reality |
|--------|-------|---------|
| Student record | `status: active`, `enrollmentDate: 2026-03-19` | No enrollment exists |
| Enrollment table | 0 records | Should have 1 per imported student |
| Dashboard "TOTAL ENROLLED" | `—` (zero) | Student count says 20+ |
| Student table | "Active" with dates | Cannot be placed in sections |
| Ed-Fi compliance | Missing | No entry type, grade descriptor, or academic year |

**Correct architecture:**
1. Import creates students with `status: 'pending'`, `enrollmentDate: null`
2. Admin reviews imported students → bulk-enrolls via enrollment workflow
3. Enrollment creation sets `student.status = 'active'` and creates proper records
4. Preserves referential integrity, Ed-Fi compliance, and dashboard accuracy

---

## Files Requiring Changes

| File | Layer | Changes |
|------|-------|---------|
| `server/.../students/students.service.ts` | Backend | `status: 'pending'` for imports; validate grade levels; fix dedup; remove enrollmentDate |
| `apps/.../students/CSVImport.tsx` | Frontend | Fix duplicate display (`m.name`); add date/gender/grade validation |
| `apps/.../services/academics.service.ts` | Frontend | Fix/create `ImportDuplicateMatch` type |

## Test Data

- `apps/academics/test-data/nepal_boarding_valid_30.csv` — 30 valid rows
- `apps/academics/test-data/nepal_boarding_mixed_20.csv` — 14 valid + 6 corrupted
- `apps/academics/test-data/nepal_boarding_duplicates_10.csv` — dedup test with exact + near matches
