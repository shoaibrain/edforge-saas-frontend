// spec: specs/shell/rbac-sidebar.md
// seed: e2e/tests/seed.spec.ts
//
// Expected visibility is COMPUTED from the real ABAC engine so this spec
// tracks packages/abac/src/permissions.ts automatically. The nav→permission
// mapping mirrors the home module config in
// apps/shell/src/config/sidebar-modules.ts (not imported — it pulls in
// lucide-react/JSX; the four entries are stable and asserted here by label).

import { test, expect } from '../../fixtures/test'
import { can } from '../../../packages/abac/src/engine'
import type { Action, Resource } from '../../../packages/abac/src/permissions'
import { E2E_TENANT, ROLE_USERS } from '../../fixtures/role-data.mjs'
import type { E2ERole } from '../../fixtures/role-data.mjs'

const HOME_NAV_ITEMS: Array<{ label: string; action: Action; resource: Resource }> = [
  { label: 'Academics', action: 'view', resource: 'students' },
  { label: 'People', action: 'view', resource: 'staff' },
  { label: 'Finance', action: 'view', resource: 'billing' },
  { label: 'Settings', action: 'view', resource: 'settings' },
]

const ADMIN_HOME_ROLES: E2ERole[] = [
  'TenantAdmin',
  'Principal',
  'VicePrincipal',
  'Teacher',
  'Accountant',
  'Staff',
  'Counselor',
  'Nurse',
]

for (const role of ADMIN_HOME_ROLES) {
  test.describe(`Admin-home sidebar — ${role}`, () => {
    test.use({ role })

    test(`${role} sees exactly the permitted module entries`, async ({ page }) => {
      const user = ROLE_USERS[role]
      await page.goto('/home')
      const nav = page.getByRole('navigation', { name: 'Sidebar navigation' })
      await expect(nav).toBeVisible()

      for (const item of HOME_NAV_ITEMS) {
        const allowed = can(user, {
          action: item.action,
          resource: item.resource,
          schoolId: E2E_TENANT.schoolId,
        })
        const link = nav.getByRole('link', { name: item.label, exact: true })
        if (allowed) {
          await expect(link, `${role} should see ${item.label}`).toBeVisible()
        } else {
          await expect(link, `${role} should NOT see ${item.label}`).toHaveCount(0)
        }
      }
    })
  })
}

test.describe('Portal home — Student', () => {
  test.use({ role: 'Student' })

  test('Student home is the student portal', async ({ page }) => {
    await page.goto('/home')
    const nav = page.getByRole('navigation', { name: 'Sidebar navigation' })
    for (const label of ['My Grades', 'My Attendance', 'My Schedule']) {
      await expect(nav.getByRole('link', { name: label })).toBeVisible()
    }
    for (const label of ['Academics', 'People', 'Finance']) {
      await expect(nav.getByRole('link', { name: label, exact: true })).toHaveCount(0)
    }
  })
})

test.describe('Portal home — Parent', () => {
  test.use({ role: 'Parent' })

  test('Parent home is the family portal', async ({ page }) => {
    await page.goto('/home')
    const nav = page.getByRole('navigation', { name: 'Sidebar navigation' })
    for (const label of ['Overview', 'Grades', 'Attendance', 'Schedule', 'Fee Payments']) {
      await expect(nav.getByRole('link', { name: label, exact: true })).toBeVisible()
    }
    for (const label of ['Academics', 'People', 'Finance']) {
      await expect(nav.getByRole('link', { name: label, exact: true })).toHaveCount(0)
    }
  })
})
