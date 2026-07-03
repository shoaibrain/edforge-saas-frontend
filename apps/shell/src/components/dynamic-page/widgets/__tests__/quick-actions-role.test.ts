import { describe, it, expect, vi } from 'vitest'

vi.mock('@edforge/i18n', () => ({
  useTranslation: () => ({ t: (k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? k }),
}))
vi.mock('@tanstack/react-router', () => ({
  Link: () => null,
}))

import { getQuickActionsForRole } from '../QuickActionsWidget'

describe('getQuickActionsForRole', () => {
  it('fails closed for an unresolved role', () => {
    expect(getQuickActionsForRole(null)).toEqual([])
  })

  it('returns role-specific sets for known categories', () => {
    const admin = getQuickActionsForRole('administrator')
    const educator = getQuickActionsForRole('educator')
    const student = getQuickActionsForRole('student')
    const parent = getQuickActionsForRole('parent')

    expect(admin.length).toBeGreaterThan(0)
    expect(admin.some((a) => a.id === 'add-student')).toBe(true)
    expect(educator.length).toBeGreaterThan(0)
    expect(student.length).toBeGreaterThan(0)
    expect(parent.length).toBeGreaterThan(0)
    // privileged admin action never leaks into other sets
    expect(student.some((a) => a.id === 'add-student')).toBe(false)
    expect(parent.some((a) => a.id === 'add-student')).toBe(false)
  })
})
