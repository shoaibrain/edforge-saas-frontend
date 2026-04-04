import { can, canAccess, getPermissions } from './engine'
import { ROLE_PERMISSIONS } from './permissions'
import type { SchoolRole, UserIdentity } from '@edforge/types'

/**
 * Tests for the ABAC engine core functions.
 *
 * Verifies that the permission evaluation logic correctly handles:
 * - TenantAdmin bypass
 * - School-role-based permission checks
 * - Resource access checks
 * - Edge cases (no role, no school, unknown resources)
 */

// Helper to create a mock user matching UserIdentity interface
function mockUser(
  globalRole: 'TenantAdmin' | 'StandardUser',
  assignments: Record<string, SchoolRole> = {},
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

describe('ABAC Engine', () => {
  // ==========================================================================
  // can()
  // ==========================================================================

  describe('can()', () => {
    it('should allow TenantAdmin for any action/resource', () => {
      const user = mockUser('TenantAdmin')
      expect(can(user, { action: 'delete', resource: 'students' })).toBe(true)
      expect(can(user, { action: 'manage', resource: 'billing' })).toBe(true)
    })

    it('should allow Principal to view grades at their school', () => {
      const user = mockUser('StandardUser', { 'school-1': 'Principal' })
      expect(
        can(user, { action: 'view', resource: 'grades', schoolId: 'school-1' }),
      ).toBe(true)
    })

    it('should deny Teacher from deleting students', () => {
      const user = mockUser('StandardUser', { 'school-1': 'Teacher' })
      expect(
        can(user, { action: 'delete', resource: 'students', schoolId: 'school-1' }),
      ).toBe(false)
    })

    it('should allow Teacher to edit grades', () => {
      const user = mockUser('StandardUser', { 'school-1': 'Teacher' })
      expect(
        can(user, { action: 'edit', resource: 'grades', schoolId: 'school-1' }),
      ).toBe(true)
    })

    it('should deny when user has no role at the specified school', () => {
      const user = mockUser('StandardUser', { 'school-1': 'Teacher' })
      expect(
        can(user, { action: 'view', resource: 'grades', schoolId: 'school-2' }),
      ).toBe(false)
    })

    it('should check all assignments when no schoolId is provided', () => {
      const user = mockUser('StandardUser', { 'school-1': 'Principal' })
      // Without schoolId, the engine checks across all school assignments
      expect(can(user, { action: 'view', resource: 'grades' })).toBe(true)
    })

    it('should deny when user has no assignments and no schoolId', () => {
      const user = mockUser('StandardUser', {})
      expect(can(user, { action: 'view', resource: 'grades' })).toBe(false)
    })

    it('should deny Student from creating grades', () => {
      const user = mockUser('StandardUser', { 'school-1': 'Student' })
      expect(
        can(user, { action: 'create', resource: 'grades', schoolId: 'school-1' }),
      ).toBe(false)
    })

    it('should allow Parent to view parent-portal:grades', () => {
      const user = mockUser('StandardUser', { 'school-1': 'Parent' })
      expect(
        can(user, { action: 'view', resource: 'parent-portal:grades', schoolId: 'school-1' }),
      ).toBe(true)
    })

    it('should deny for unknown resource', () => {
      const user = mockUser('StandardUser', { 'school-1': 'Principal' })
      expect(
        can(user, { action: 'view', resource: 'nonexistent-resource' as any, schoolId: 'school-1' }),
      ).toBe(false)
    })
  })

  // ==========================================================================
  // canAccess()
  // ==========================================================================

  describe('canAccess()', () => {
    it('should return true when user can view a resource', () => {
      const user = mockUser('StandardUser', { 'school-1': 'Teacher' })
      expect(canAccess(user, 'attendance', 'school-1')).toBe(true)
    })

    it('should return false for resource user has no access to', () => {
      const user = mockUser('StandardUser', { 'school-1': 'Student' })
      expect(canAccess(user, 'billing', 'school-1')).toBe(false)
    })

    it('should return true for TenantAdmin without schoolId', () => {
      const user = mockUser('TenantAdmin')
      expect(canAccess(user, 'billing')).toBe(true)
    })

    it('should return false for user with no assignments', () => {
      const user = mockUser('StandardUser', {})
      expect(canAccess(user, 'grades', 'school-1')).toBe(false)
    })
  })

  // ==========================================================================
  // getPermissions()
  // ==========================================================================

  describe('getPermissions()', () => {
    it('should return all actions for TenantAdmin', () => {
      const user = mockUser('TenantAdmin')
      const perms = getPermissions(user, 'students')
      expect(perms).toEqual(
        expect.arrayContaining(['view', 'create', 'edit', 'delete', 'manage']),
      )
    })

    it('should return correct actions for Teacher on grades', () => {
      const user = mockUser('StandardUser', { 'school-1': 'Teacher' })
      const perms = getPermissions(user, 'grades', 'school-1')
      expect(perms).toEqual(expect.arrayContaining(['view', 'create', 'edit']))
      expect(perms).not.toContain('delete')
      expect(perms).not.toContain('approve')
    })

    it('should return empty array for unknown resource', () => {
      const user = mockUser('StandardUser', { 'school-1': 'Teacher' })
      const perms = getPermissions(user, 'nonexistent' as any, 'school-1')
      expect(perms).toEqual([])
    })

    it('should return empty array when user has no role at school', () => {
      const user = mockUser('StandardUser', {})
      const perms = getPermissions(user, 'grades', 'school-1')
      expect(perms).toEqual([])
    })
  })

  // ==========================================================================
  // ROLE_PERMISSIONS consistency
  // ==========================================================================

  describe('ROLE_PERMISSIONS consistency', () => {
    const roles: SchoolRole[] = ['Principal', 'Teacher', 'Accountant', 'Staff', 'Student', 'Parent']

    it.each(roles)('%s role should have dashboard:view', (role) => {
      const perms = ROLE_PERMISSIONS[role]
      expect(perms.dashboard).toContain('view')
    })

    it('Principal should have more resources than Teacher', () => {
      const principalCount = Object.keys(ROLE_PERMISSIONS.Principal).length
      const teacherCount = Object.keys(ROLE_PERMISSIONS.Teacher).length
      expect(principalCount).toBeGreaterThan(teacherCount)
    })

    it('Teacher should have grades:edit but not grades:delete', () => {
      expect(ROLE_PERMISSIONS.Teacher.grades).toContain('edit')
      expect(ROLE_PERMISSIONS.Teacher.grades).not.toContain('delete')
    })

    it('Accountant should have billing:manage', () => {
      expect(ROLE_PERMISSIONS.Accountant.billing).toContain('manage')
    })

    it('Student should not have staff access', () => {
      expect(ROLE_PERMISSIONS.Student.staff).toBeUndefined()
    })
  })
})
