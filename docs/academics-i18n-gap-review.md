# Academics i18n Gap Review

## Branch Scope

This branch is stacked on PR #248 and localizes the Academics module's shared
table workflow layer without changing academic business logic.

Covered end-to-end:

- Shared DataTable labels for Academics via `useAcademicsI18n`.
- Locale-aware date, date-time, number, and enum display helpers.
- Student directory table.
- Enrollment table.
- Course catalog table.
- Grade-level summary table.
- Section table.
- Section roster table.
- Teacher directory table.
- Exam list table.
- Exam scoring roster table and save bar.
- IEMIS monthly export panel, preview table, BS month labels, generated date,
  and CSV headers.

## Remaining Gaps

The hardcoded-string audit still reports operator-facing copy outside the table
layer. The largest remaining areas are:

- Attendance entry workflow: `AttendanceGrid`, `AttendanceRow`,
  `DailySummary`, `DateSelector`, roster toolbar/status controls, and student
  attendance modal.
- Classroom cards and classwork workflows: card menus, empty states, create
  menus, classwork drawer, and classwork feed.
- Overview/dashboard widgets: shared module overview controls, statistics,
  insight panels, and activity feed widgets.
- Student registration/import flows: CSV import, registration wizard steps,
  duplicate warnings, and drawer actions.
- Grades/report-card workflows beyond the exam scoring roster: gradebook grid,
  grading policy forms, finalization wizard, printable report cards.
- Government reports export and academic calendar setup screens.

## Validation Notes

- Locale key parity is enforced by `packages/i18n/src/locale-parity.test.ts`.
- Interpolation variable parity is enforced by
  `packages/i18n/src/interpolation-parity.test.ts`.
- The i18n audit remains in baseline mode and should become a ratchet after the
  remaining surfaces are localized.
