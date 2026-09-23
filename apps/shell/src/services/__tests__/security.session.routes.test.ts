/**
 * Route-shape guard for the session / login-history methods of
 * users.service.ts (Identity & Access epic, Sprint 1 · S1.3).
 *
 * Per the CLAUDE.md / memory rule "pin frontend service URLs with guard
 * tests": these four URLs are the contract with the identity SecurityController
 * (`/users/:id/security/...`, registered in server/lib/tenant-api-prod.json).
 * If a refactor invents a path, this fails immediately rather than surfacing as
 * a 403/404 in prod.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../lib/api', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiPatch: vi.fn(),
  apiDelete: vi.fn(),
}))

import { apiGet, apiPost, apiDelete } from '../../lib/api'
import {
  getActiveSessions,
  revokeSession,
  revokeAllSessions,
  getLoginHistory,
} from '../users.service'

const asMock = (fn: unknown) => fn as unknown as ReturnType<typeof vi.fn>

describe('users.service — session / login-history route shapes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    asMock(apiGet).mockResolvedValue([])
    asMock(apiPost).mockResolvedValue({ success: true, revokedCount: 0 })
    asMock(apiDelete).mockResolvedValue({ success: true })
  })

  it('getActiveSessions GETs /users/:id/security/sessions', async () => {
    await getActiveSessions('user-1')
    expect(apiGet).toHaveBeenCalledTimes(1)
    expect(asMock(apiGet).mock.calls[0][0]).toBe('/users/user-1/security/sessions')
  })

  it('revokeSession DELETEs /users/:id/security/sessions/:sessionId', async () => {
    await revokeSession('user-1', 'sess-9')
    expect(apiDelete).toHaveBeenCalledTimes(1)
    expect(asMock(apiDelete).mock.calls[0][0]).toBe(
      '/users/user-1/security/sessions/sess-9',
    )
  })

  it('revokeAllSessions POSTs /users/:id/security/sessions/revoke-all', async () => {
    await revokeAllSessions('user-1')
    expect(apiPost).toHaveBeenCalledTimes(1)
    expect(asMock(apiPost).mock.calls[0][0]).toBe(
      '/users/user-1/security/sessions/revoke-all',
    )
  })

  it('getLoginHistory GETs /users/:id/security/login-history with an explicit limit', async () => {
    await getLoginHistory('user-1', 20)
    expect(apiGet).toHaveBeenCalledTimes(1)
    expect(asMock(apiGet).mock.calls[0][0]).toBe(
      '/users/user-1/security/login-history?limit=20',
    )
  })

  it('getLoginHistory defaults the limit to 10', async () => {
    await getLoginHistory('user-1')
    expect(asMock(apiGet).mock.calls[0][0]).toBe(
      '/users/user-1/security/login-history?limit=10',
    )
  })

  it('treats ids as raw path segments (no encoding of UUIDs)', async () => {
    const uid = '21aea5da-511f-4dfa-a6f2-6971f63a719f'
    await getActiveSessions(uid)
    expect(asMock(apiGet).mock.calls[0][0]).toBe(`/users/${uid}/security/sessions`)
  })
})
