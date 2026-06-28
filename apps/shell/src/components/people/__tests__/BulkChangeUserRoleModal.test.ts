import { describe, it, expect } from 'vitest'
import type { UserResponseDto } from '@/services/users.service'
import type { GlobalRole } from '@edforge/types'
import { eligibleForRoleChange } from '../BulkChangeUserRoleModal'

function makeUser(id: string, role: GlobalRole): UserResponseDto {
  return {
    userId: id,
    firstName: 'F',
    lastName: id.toUpperCase(),
    email: `${id}@example.com`,
    globalRole: role,
    status: 'active',
    mfaEnabled: false,
  } as UserResponseDto
}

describe('eligibleForRoleChange', () => {
  it('excludes the current user (self-demote guard)', () => {
    // `other` is StandardUser today; target = TenantAdmin so `other` is eligible.
    const users = [makeUser('me', 'TenantAdmin'), makeUser('other', 'StandardUser')]
    const { eligible, skipped } = eligibleForRoleChange(users, 'me', 'TenantAdmin')
    expect(eligible.map((u) => u.userId)).toEqual(['other'])
    expect(skipped.map((s) => s.user.userId)).toEqual(['me'])
    expect(skipped[0].reason).toMatch(/cannot change your own role/)
  })

  it('excludes users already in the target role', () => {
    const users = [
      makeUser('a', 'StandardUser'),
      makeUser('b', 'TenantAdmin'),
      makeUser('c', 'TenantAdmin'),
    ]
    const { eligible, skipped } = eligibleForRoleChange(users, 'unused', 'TenantAdmin')
    expect(eligible.map((u) => u.userId)).toEqual(['a'])
    expect(skipped.map((s) => s.user.userId).sort()).toEqual(['b', 'c'])
    expect(skipped.every((s) => s.reason.includes('already'))).toBe(true)
  })

  it('combines both skip reasons in one pass', () => {
    const users = [
      makeUser('me', 'TenantAdmin'),
      makeUser('other-admin', 'TenantAdmin'),
      makeUser('moveable', 'StandardUser'),
    ]
    const { eligible, skipped } = eligibleForRoleChange(users, 'me', 'TenantAdmin')
    expect(eligible.map((u) => u.userId)).toEqual(['moveable'])
    expect(skipped).toHaveLength(2)
  })

  it('empty input → empty output', () => {
    expect(eligibleForRoleChange([], 'me', 'TenantAdmin')).toEqual({
      eligible: [],
      skipped: [],
    })
  })
})
