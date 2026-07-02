# People — Staff Directory (`/people/staff`)

The staff roster table. Same federated-remote + active-school gating as the
overview. Nav item carries `requiresActiveSchool: true`.

## Load
- `GET /api/staff?limit=20&schoolId=<school>` (+ `search` when the debounced
  search box is non-empty, + `role`/`employmentStatus` filters) →
  `StaffListResponseDto`. Table columns read `firstName`+`lastSurname`, `email`,
  `role`, `employmentStatus`, `hireDate`, `departmentName`, and derive System
  Access from `!!userId`. Row id = `staffId`.

## Cases
1. **Directory table renders the seeded roster** (@smoke). Navigate to
   `/people/staff`; the `Staff Directory` heading + the TanStack table column
   headers (Staff / Role / Status / Hired / Department / System Access) render,
   and the seeded staff (Anita Gurung) appears. No console errors, no module
   error.
2. **Empty state.** With an empty staff list the "No staff members found" empty
   state shows and no seeded name appears.

## Stable chrome
- `heading` "Staff Directory" (`h1.sr-only`, still in the a11y tree).
- Column headers: "Staff", "Role", "Status", "Hired", "Department",
  "System Access".
- Search box `aria-label` "Search staff by name or email".
- Quick-filter chips: "All", "Teachers", "Principal", "Support".
- Empty state: "No staff members found".
