/**
 * people.service — session route-shape guards (Sprint 4 / S4.6).
 *
 * Pins the two surfaces so a URL drift doesn't 403/404 in prod:
 *  - LIST stays on the security surface (admin-readable).
 *  - TERMINATE uses the sessions-module admin surface, which also kills the
 *    target's Cognito refresh tokens (S4.2 teeth).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../lib/api', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
  apiDelete: vi.fn(),
}))

import { apiGet, apiPost } from '../../lib/api'
import { getUserSessions, revokeUserSessions } from '../people.service'

const asMock = (fn: unknown) => fn as ReturnType<typeof vi.fn>

describe('people.service — admin session routes', () => {
  beforeEach(() => vi.clearAllMocks())

  it('revokeUserSessions POSTs the teeth surface /sessions/user/:id/revoke-all', async () => {
    asMock(apiPost).mockResolvedValue({ revokedCount: 3 })
    const res = await revokeUserSessions('user-123')
    expect(apiPost).toHaveBeenCalledWith('/sessions/user/user-123/revoke-all', {})
    expect(res.revokedCount).toBe(3)
  })

  it('getUserSessions reads the security surface list', async () => {
    asMock(apiGet).mockResolvedValue({ sessions: [] })
    await getUserSessions('user-123')
    expect(apiGet).toHaveBeenCalledWith('/users/user-123/security/sessions')
  })
})
