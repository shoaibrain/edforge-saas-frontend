/**
 * users.service — session write route-shape guards (SR.1 / SR.3 / SR.4).
 *
 * Pins the exact URLs the frontend calls against the deployed backend routes
 * (server/lib/tenant-api-prod.json): a silent URL drift here would 403/404 in
 * prod with no local test failure. `exceptCurrent` is a QUERY param, not a body
 * field — the backend reads `@Query('exceptCurrent')`.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../lib/api', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiPatch: vi.fn(),
  apiDelete: vi.fn(),
}))

import { apiGet, apiPost, apiPatch } from '../../lib/api'
import {
  registerSession,
  touchSession,
  revokeAllSessions,
  getActiveSessions,
  getLoginHistory,
} from '../users.service'

const asMock = (fn: unknown) => fn as ReturnType<typeof vi.fn>

describe('users.service — session write route shapes', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getActiveSessions unwraps the { sessions, total } response into an array', async () => {
    // Backend returns SecuritySessionsListDto, NOT a bare array. Returning the
    // wrapper crashed the sessions list with "x.some is not a function".
    asMock(apiGet).mockResolvedValue({
      sessions: [{ sessionId: 's1', isCurrent: true }],
      total: 1,
      currentSessionId: 's1',
    })
    const res = await getActiveSessions('u1')
    expect(apiGet).toHaveBeenCalledWith('/users/u1/security/sessions')
    expect(Array.isArray(res)).toBe(true)
    expect(res).toHaveLength(1)
  })

  it('getLoginHistory unwraps { entries, nextCursor }, maps deviceInfo, sends limit', async () => {
    // Backend returns LoginHistoryResponseDto with browser/os (no deviceInfo/id).
    asMock(apiGet).mockResolvedValue({
      entries: [
        { timestamp: '2026-07-05T10:00:00Z', status: 'success', ipAddress: '1.2.3.4', browser: 'Chrome', os: 'macOS' },
      ],
      total: 1,
      hasMore: true,
      nextCursor: 'CURSOR1',
    })
    const page = await getLoginHistory('u1', { limit: 10 })
    expect(apiGet).toHaveBeenCalledWith('/users/u1/security/login-history?limit=10')
    expect(page.entries).toHaveLength(1)
    expect(page.entries[0].deviceInfo).toBe('Chrome on macOS')
    expect(page.entries[0].id).toBeTruthy()
    expect(page.nextCursor).toBe('CURSOR1')
  })

  it('getLoginHistory forwards the cursor for pagination', async () => {
    asMock(apiGet).mockResolvedValue({ entries: [], nextCursor: undefined })
    await getLoginHistory('u1', { limit: 10, cursor: 'CURSOR1' })
    expect(apiGet).toHaveBeenCalledWith('/users/u1/security/login-history?limit=10&cursor=CURSOR1')
  })

  it('getActiveSessions returns [] when the response has no sessions field', async () => {
    asMock(apiGet).mockResolvedValue({})
    expect(await getActiveSessions('u1')).toEqual([])
  })

  it('registerSession POSTs /users/:id/security/sessions (SR.1)', async () => {
    asMock(apiPost).mockResolvedValue({ sessionId: 's1', isCurrent: true })
    const res = await registerSession('u1')
    expect(apiPost).toHaveBeenCalledWith('/users/u1/security/sessions', {})
    expect(res.sessionId).toBe('s1')
  })

  it('touchSession PATCHes /users/:id/security/sessions/:sid (SR.3)', async () => {
    asMock(apiPatch).mockResolvedValue({ sessionId: 's1', isCurrent: true })
    await touchSession('u1', 's1')
    expect(apiPatch).toHaveBeenCalledWith('/users/u1/security/sessions/s1', {})
  })

  it('revokeAllSessions defaults to full sign-out everywhere (exceptCurrent=false)', async () => {
    asMock(apiPost).mockResolvedValue({ success: true, revokedCount: 2 })
    await revokeAllSessions('u1')
    expect(apiPost).toHaveBeenCalledWith(
      '/users/u1/security/sessions/revoke-all?exceptCurrent=false',
      {}
    )
  })

  it('revokeAllSessions(userId, true) signs out other devices via the query param', async () => {
    asMock(apiPost).mockResolvedValue({ success: true, revokedCount: 1 })
    await revokeAllSessions('u1', true)
    expect(apiPost).toHaveBeenCalledWith(
      '/users/u1/security/sessions/revoke-all?exceptCurrent=true',
      {}
    )
  })
})
