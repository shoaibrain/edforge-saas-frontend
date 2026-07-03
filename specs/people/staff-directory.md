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
2. **Unified toolbar.** Search (identified by placeholder), the role preset
   tabs, and the Export CSV button render in one toolbar row.
3. **Selection bar.** Checking rows morphs the toolbar in place into the
   ⑨ Selection Context Bar (`role="toolbar"`, name "Selection actions") with
   "N selected" + "Export selected" / "Delete selected"; the search field is
   replaced, not stacked.
4. **Bulk delete** (staff-bulk-delete.spec.ts). Delete selected → the
   BulkDeleteStaffModal confirms with the count, fans out one
   `DELETE /api/staff/:id` per record, and surfaces one aggregate toast
   ("Deleted N staff members" / "Deleted X; Y failed"); selection clears.
5. **Empty state.** With an empty staff list the "No staff members found" empty
   state shows and no seeded name appears.

## Stable chrome
- `heading` "Staff Directory" (`h1.sr-only`, still in the a11y tree).
- ⑧ Attention pill (`data-testid="attention-pill"`) in the pagebar header;
  header actions "Quick add" + "Add Staff Member".
- Column headers: "Staff", "Role", "Status", "Hired", "Department",
  "System Access".
- Search box identified by placeholder "Search by name or email..." (the
  unified ToolbarSearch has no separate aria-label).
- Role presets are toolbar tabs: "All", "Teachers", "Principal", "Support".
- Selection bar: `role="toolbar"` "Selection actions"; row checkboxes are
  "Select row" / "Select all rows".
- Empty state: "No staff members found".
