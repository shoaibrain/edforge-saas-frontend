/**
 * Mobile nav derivation tests.
 *
 * The tab-bar matrix mirrors specs/shell/rbac-sidebar.md: expected visibility
 * is COMPUTED through the real ABAC engine (via filterNavGroups → can())
 * against the registry's declared permissions, so the suite tracks the
 * permission matrix instead of hardcoding it — plus pinned assertions for the
 * load-bearing rows (Teacher: no Finance; Staff/Counselor/Nurse: no Settings;
 * Parent: cap-5 with More).
 */

import { describe, it, expect } from 'vitest'
import { can } from '@edforge/abac'
import type { SchoolRole, UserIdentity } from '@edforge/types'
import {
  deriveTabItems,
  deriveAppBarState,
  shouldShowL2Row,
  matchActiveTab,
} from './mobile-nav'
import { filterNavGroups } from './nav-filter'
import {
  getModuleConfig,
  getHomeModuleForSchoolRole,
} from '../config/sidebar-modules'

const SCHOOL_ID = 'school-1'

function mockUser(
  globalRole: 'TenantAdmin' | 'StandardUser',
  assignments: Record<string, SchoolRole> = {}
): UserIdentity {
  return {
    id: 'user-1',
    tenantId: 'tenant-1',
    email: 'test@school.org',
    name: 'Test User',
    globalRole,
    assignments,
  }
}

/** Run the exact production derivation path for a role. */
function tabsForRole(role: SchoolRole | 'TenantAdmin') {
  const user =
    role === 'TenantAdmin'
      ? mockUser('TenantAdmin', { [SCHOOL_ID]: 'Principal' })
      : mockUser('StandardUser', { [SCHOOL_ID]: role })
  const schoolRole = user.assignments[SCHOOL_ID]
  const homeModuleId = getHomeModuleForSchoolRole(schoolRole)
  const filtered = filterNavGroups(
    getModuleConfig(homeModuleId).groups,
    user,
    SCHOOL_ID
  )
  return { user, homeModuleId, ...deriveTabItems(filtered) }
}

const ADMIN_ROLES: SchoolRole[] = [
  'Principal',
  'VicePrincipal',
  'Teacher',
  'Accountant',
  'Staff',
  'Counselor',
  'Nurse',
]

describe('deriveTabItems — RBAC matrix (computed via real can())', () => {
  it.each(ADMIN_ROLES)('%s sees exactly the can()-permitted module tabs', (role) => {
    const { user, tabs, overflow } = tabsForRole(role)
    const homeItems = getModuleConfig('home').groups.flatMap((g) => g.items)

    const expectedIds = homeItems
      .filter((item) =>
        can(user, {
          action: item.permission!.action,
          resource: item.permission!.resource,
          schoolId: SCHOOL_ID,
        })
      )
      .map((i) => i.id)

    expect(tabs.map((t) => t.id)).toEqual(expectedIds)
    expect(overflow).toEqual([]) // admin family never overflows (≤4 modules)
  })

  it('TenantAdmin gets all four module tabs, no More', () => {
    const { tabs, overflow } = tabsForRole('TenantAdmin')
    expect(tabs.map((t) => t.id)).toEqual(['academics', 'people', 'finance', 'settings'])
    expect(overflow).toEqual([])
  })

  it('Teacher has NO finance tab (rbac-sidebar matrix)', () => {
    const { tabs, overflow } = tabsForRole('Teacher')
    const all = [...tabs, ...overflow].map((t) => t.id)
    expect(all).not.toContain('finance')
    expect(all).toContain('academics')
  })

  it.each(['Staff', 'Counselor', 'Nurse'] as SchoolRole[])(
    '%s has NO settings tab (rbac-sidebar matrix)',
    (role) => {
      const { tabs, overflow } = tabsForRole(role)
      expect([...tabs, ...overflow].map((t) => t.id)).not.toContain('settings')
    }
  )

  it('Student derives portal tabs, no More (4 items)', () => {
    const { homeModuleId, tabs, overflow } = tabsForRole('Student')
    expect(homeModuleId).toBe('home-student')
    expect(tabs.map((t) => t.id)).toEqual([
      'my-grades',
      'my-attendance',
      'my-schedule',
      'settings',
    ])
    expect(overflow).toEqual([])
  })

  it('Parent overflows into More: exactly 5 tab slots (Home + 3 + More)', () => {
    const { homeModuleId, tabs, overflow } = tabsForRole('Parent')
    expect(homeModuleId).toBe('home-parent')
    expect(tabs.map((t) => t.id)).toEqual([
      'children-overview',
      'children-grades',
      'children-attendance',
    ])
    expect(overflow.map((t) => t.id)).toEqual(['children-schedule', 'fees', 'settings'])
  })

  it('cap-5 invariant holds for every role', () => {
    for (const role of [...ADMIN_ROLES, 'Student', 'Parent'] as SchoolRole[]) {
      const { tabs, overflow } = tabsForRole(role)
      // Home + tabs (+ More when overflowing) never exceeds 5 slots
      const slots = 1 + tabs.length + (overflow.length > 0 ? 1 : 0)
      expect(slots).toBeLessThanOrEqual(5)
      if (overflow.length > 0) expect(tabs.length).toBe(3)
    }
  })

  it('returns nothing for a null user', () => {
    const filtered = filterNavGroups(getModuleConfig('home').groups, null, SCHOOL_ID)
    expect(deriveTabItems(filtered)).toEqual({ tabs: [], overflow: [] })
  })
})

describe('deriveAppBarState — route table', () => {
  it.each([
    ['/', 'home'],
    ['/home', 'home'],
  ] as const)('%s → home', (path) => {
    expect(deriveAppBarState(path)).toEqual({ kind: 'home' })
  })

  it.each([
    ['/academics', 'academics'],
    ['/finance', 'finance'],
    ['/people', 'people'],
    ['/settings', 'settings'],
    ['/parent-portal', 'parent-portal'],
  ] as const)('%s → module-root %s', (path, moduleId) => {
    expect(deriveAppBarState(path)).toEqual({ kind: 'module-root', moduleId })
  })

  it.each([
    ['/academics/students', '/academics'],
    ['/academics/students/3f2a8c1b-0000-4000-8000-000000000000', '/academics'],
    ['/settings/account', '/settings'],
    ['/finance/invoices', '/finance'],
    ['/parent-portal/grades', '/parent-portal'],
  ] as const)('%s → subpage back to %s', (path, backTo) => {
    expect(deriveAppBarState(path)).toMatchObject({ kind: 'subpage', backTo })
  })

  it('orphan deep routes back out to /home', () => {
    expect(deriveAppBarState('/payments/callback')).toMatchObject({
      kind: 'subpage',
      backTo: '/home',
    })
  })

  it('student-portal subpages back out to /home (no portal index route)', () => {
    expect(deriveAppBarState('/student-portal/grades')).toMatchObject({
      kind: 'subpage',
      backTo: '/home',
    })
  })
})

describe('shouldShowL2Row', () => {
  it('phone: hidden on home and on the role-own portal family', () => {
    expect(shouldShowL2Row('home', 'home', 'phone')).toBe(false)
    expect(shouldShowL2Row('home-parent', 'home-parent', 'phone')).toBe(false)
    expect(shouldShowL2Row('student-portal', 'home-student', 'phone')).toBe(false)
    expect(shouldShowL2Row('parent-portal', 'home-parent', 'phone')).toBe(false)
  })

  it('phone: shown for module routes', () => {
    expect(shouldShowL2Row('academics', 'home', 'phone')).toBe(true)
    expect(shouldShowL2Row('finance', 'home', 'phone')).toBe(true)
    expect(shouldShowL2Row('settings', 'home', 'phone')).toBe(true)
    // admin viewing a portal module they don't own
    expect(shouldShowL2Row('parent-portal', 'home', 'phone')).toBe(true)
  })

  it('tablet: always eligible (no tab bar; home pills = module switcher)', () => {
    expect(shouldShowL2Row('home', 'home', 'tablet')).toBe(true)
    expect(shouldShowL2Row('academics', 'home', 'tablet')).toBe(true)
  })

  it('desktop: never (sidebar owns L2)', () => {
    expect(shouldShowL2Row('academics', 'home', 'desktop')).toBe(false)
  })
})

describe('matchActiveTab — longest-prefix, exactly one winner', () => {
  const ADMIN_HREFS = ['/home', '/academics', '/people', '/finance', '/settings']

  it('matches the module root for nested routes', () => {
    expect(matchActiveTab('/academics/students', ADMIN_HREFS)).toBe('/academics')
    expect(matchActiveTab('/settings/account', ADMIN_HREFS)).toBe('/settings')
  })

  it('treats / as home; home never prefix-matches deeper', () => {
    expect(matchActiveTab('/', ADMIN_HREFS)).toBe('/home')
    expect(matchActiveTab('/home', ADMIN_HREFS)).toBe('/home')
  })

  it('longest prefix wins (parent overview vs grades)', () => {
    const hrefs = ['/parent-portal', '/parent-portal/grades']
    expect(matchActiveTab('/parent-portal/grades', hrefs)).toBe('/parent-portal/grades')
    expect(matchActiveTab('/parent-portal/grades/detail', hrefs)).toBe(
      '/parent-portal/grades'
    )
    expect(matchActiveTab('/parent-portal', hrefs)).toBe('/parent-portal')
  })

  it('no match for routes outside the tab set, and no partial-segment matches', () => {
    expect(matchActiveTab('/analytics', ADMIN_HREFS)).toBeNull()
    expect(matchActiveTab('/peoples-directory', ADMIN_HREFS)).toBeNull()
  })
})
