# People — Staff Creation Wizard (`/people/staff/new`)

The 5-step staff creation wizard (`StaffWizard`, built on `@edforge/wizard`):
`personal → contact → employment → assignment → review`. `activeStep`
(`currentStep`) is React state (0-indexed), no URL param. Same remote +
active-school gating.

## Load
- **No API call on initial render.** `GET /api/schools` fires only when the user
  reaches the Assignment step (already covered by the shell `/schools` mock).
  Submit on the Review step fires ONE of:
  - `POST /api/staff/with-user` when "Create user account" is toggled on
    (toast "Staff member and user account created successfully"), or
  - `POST /api/staff` otherwise (toast "Staff member created successfully"),
  - then `POST /api/staff/:id/assignments` per additional assignment.

## Cases
1. **Wizard mounts on step 1** (@smoke). Navigate to `/people/staff/new`; the
   page header "Add Staff Member" + the "Personal Info" step + the
   "Wizard progress" stepper render, with the "Continue" primary action and the
   required "First Name" field. No console errors, no module error.

## Follow-up (not in this PR)
Full create drive (fill all 5 steps → assert the exact `POST /staff` |
`/staff/with-user` body + assignment fan-out via `captureStaffWrites`). Deferred
because each step gates "Continue" on step-specific required fields (firstName /
lastName / staffId, then contact, employment, assignment) — a reliable drive
needs per-step field mapping. `captureStaffWrites` (e2e/fixtures/people.ts) is
already in place to record the fan-out when that spec is written.

## Stable chrome
- `heading` "Add Staff Member" (page header).
- Step title "Personal Info"; field label "First Name".
- `navigation` `aria-label` "Wizard progress".
- Buttons: "Continue" (steps 1–4), "Back" (steps 2–5), "Create Staff Member"
  (final). Nav labels are hardcoded English from `@edforge/wizard`.
