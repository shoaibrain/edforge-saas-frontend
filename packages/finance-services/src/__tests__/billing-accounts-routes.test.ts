import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Route-shape guard for billing accounts (Sprint PD.3.6).
 *
 * Pins frontend write paths against the exact backend route, matching the
 * three-way handoff contract documented in CLAUDE.md (Nest controller +
 * API Gateway spec + nginx). PD.1.5 ships the only write here:
 *   PUT /finance/schools/:schoolId/student-accounts/:accountId/opening-balance
 *
 * The Idempotency-Key header is part of the contract — the backend's
 * idempotency middleware (PD.0.2 / middleware) replays the original
 * response when the same key is seen within 24h. Without it the
 * back-to-back double-click semantics that the middleware exists to
 * protect against would not kick in.
 */

vi.mock('@edforge/api-client', () => ({
  apiPut: vi.fn(() => Promise.resolve({})),
}))

import { apiPut } from '@edforge/api-client'
import { setOpeningBalance } from '../services/student-accounts.service'

const mockApiPut = vi.mocked(apiPut)

const SCHOOL = 'sch-1'
const ACCOUNT = 'acc-1'

describe('student-accounts.service route shapes (PD)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('setOpeningBalance → PUT /finance/schools/:schoolId/student-accounts/:accountId/opening-balance with body + Idempotency-Key header', async () => {
    const payload = { amount: 5000, asOf: '2026-04-12', note: 'BS 2082 carry-forward' }

    await setOpeningBalance(SCHOOL, ACCOUNT, payload)

    expect(mockApiPut).toHaveBeenCalledTimes(1)
    const [url, body, config] = mockApiPut.mock.calls[0]

    expect(url).toBe(
      `/finance/schools/${SCHOOL}/student-accounts/${ACCOUNT}/opening-balance`,
    )
    expect(body).toEqual(payload)
    expect(config?.headers).toBeDefined()
    expect(typeof (config?.headers as Record<string, string>)['Idempotency-Key']).toBe('string')
    expect((config?.headers as Record<string, string>)['Idempotency-Key']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    )
  })

  it('setOpeningBalance → omits note field when caller leaves it undefined', async () => {
    await setOpeningBalance(SCHOOL, ACCOUNT, { amount: 7000, asOf: '2026-05-01' })

    expect(mockApiPut).toHaveBeenCalledTimes(1)
    expect(mockApiPut.mock.calls[0][1]).toEqual({ amount: 7000, asOf: '2026-05-01' })
  })

  it('setOpeningBalance → mints a fresh Idempotency-Key per call (never re-uses)', async () => {
    await setOpeningBalance(SCHOOL, ACCOUNT, { amount: 1000, asOf: '2026-04-01' })
    await setOpeningBalance(SCHOOL, ACCOUNT, { amount: 2000, asOf: '2026-04-02' })

    const keys = mockApiPut.mock.calls.map(
      c => (c[2]?.headers as Record<string, string>)?.['Idempotency-Key'],
    )
    expect(keys[0]).toBeDefined()
    expect(keys[1]).toBeDefined()
    expect(keys[0]).not.toBe(keys[1])
  })
})
