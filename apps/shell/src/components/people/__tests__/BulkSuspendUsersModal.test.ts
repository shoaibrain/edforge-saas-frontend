import { describe, it, expect } from 'vitest'
import type { UserResponseDto } from '@/services/users.service'
import { eligibleForSuspend } from '../BulkSuspendUsersModal'

function makeUser(id: string, status: UserResponseDto['status']): UserResponseDto {
  return {
    userId: id,
    firstName: 'F',
    lastName: id.toUpperCase(),
    email: `${id}@example.com`,
    globalRole: 'StandardUser',
    status,
    mfaEnabled: false,
  } as UserResponseDto
}

describe('eligibleForSuspend', () => {
  it('excludes the current user (cannot suspend self)', () => {
    const users = [makeUser('me', 'active'), makeUser('other', 'active')]
    const { eligible, skipped } = eligibleForSuspend(users, 'me')
    expect(eligible.map((u) => u.userId)).toEqual(['other'])
    expect(skipped.map((s) => s.user.userId)).toEqual(['me'])
    expect(skipped[0].reason).toMatch(/cannot suspend yourself/)
  })

  it('excludes users already suspended', () => {
    const users = [
      makeUser('a', 'active'),
      makeUser('b', 'suspended'),
      makeUser('c', 'inactive'),
    ]
    const { eligible, skipped } = eligibleForSuspend(users, 'unused')
    expect(eligible.map((u) => u.userId).sort()).toEqual(['a', 'c'])
    expect(skipped.map((s) => s.user.userId)).toEqual(['b'])
    expect(skipped[0].reason).toBe('already suspended')
  })

  it('combines self + already-suspended skip reasons', () => {
    const users = [
      makeUser('me', 'active'),
      makeUser('already', 'suspended'),
      makeUser('go', 'active'),
    ]
    const { eligible, skipped } = eligibleForSuspend(users, 'me')
    expect(eligible.map((u) => u.userId)).toEqual(['go'])
    expect(skipped).toHaveLength(2)
  })

  it('empty input → empty output', () => {
    expect(eligibleForSuspend([], 'me')).toEqual({ eligible: [], skipped: [] })
  })
})
