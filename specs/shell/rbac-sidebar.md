# Shell — RBAC sidebar matrix

**Seed:** `e2e/tests/seed.spec.ts` (per-role via `test.use({ role })`)

The home sidebar is the platform's RBAC contract with the operator: which of
the four module entries (Academics, People, Finance, Settings) each persona
sees, and which home flavor (admin `home`, `home-student`, `home-parent`)
they land on. Expected visibility is COMPUTED from the real ABAC engine
(`packages/abac/src/engine.ts` `can()`) against the nav items' declared
permissions (sidebar-modules.ts), so the spec tracks the permission matrix
automatically instead of hardcoding a table.

### 1. Admin-home roles

For each of TenantAdmin, Principal, VicePrincipal, Teacher, Accountant,
Staff, Counselor, Nurse:

#### 1.x <Role> sees exactly the permitted module entries
**Steps:**
1. Navigate to `/home` as <Role>
2. For each of Academics (view students), People (view staff),
   Finance (view billing), Settings (view settings): assert the sidebar link
   is visible iff `can(user, permission)` allows it

Snapshot of today's matrix (informational — the spec computes it):

| Role          | Academics | People | Finance | Settings |
|---------------|-----------|--------|---------|----------|
| TenantAdmin   | ✓ | ✓ | ✓ | ✓ |
| Principal     | ✓ | ✓ | ✓ | ✓ |
| VicePrincipal | ✓ | ✓ | ✗ | ✓ |
| Teacher       | ✓ | ✓ | ✗ | ✓ |
| Accountant    | ✓ | ✓ | ✓ | ✓ |
| Staff         | ✓ | ✓ | ✗ | ✗ |
| Counselor     | ✓ | ✓ | ✗ | ✗ |
| Nurse         | ✓ | ✓ | ✗ | ✗ |

### 2. Portal roles

#### 2.1 Student home is the student portal
**Steps:**
1. Navigate to `/home` as Student
2. Assert My Grades / My Attendance / My Schedule nav items are visible
3. Assert the admin module links (Academics, People, Finance) are absent

#### 2.2 Parent home is the family portal
**Steps:**
1. Navigate to `/home` as Parent
2. Assert Overview / Grades / Attendance / Schedule / Fee Payments nav items
   are visible
3. Assert the admin module links are absent
