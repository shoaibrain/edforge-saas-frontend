import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Route-shape guard for Sprint B.6 — the gradeLevel query param must
 * be forwarded VERBATIM by both the invoices and the payments list
 * services. Backend (Sprint B.1/B.2) routes via GSI14 when this param
 * is present; an accidental rename/drop on the service layer would
 * silently regress the operator-facing filter chip to the always-on
 * code path.
 */

vi.mock('@edforge/api-client', () => ({
  apiGet: vi.fn(() => Promise.resolve({ items: [], hasMore: false })),
  apiPost: vi.fn(() => Promise.resolve({})),
}))

import { apiGet } from '@edforge/api-client'
import { getInvoices } from '../services/invoices.service'
import { getSchoolPayments } from '../services/payments.service'

const mockApiGet = vi.mocked(apiGet)

const SCHOOL = 'sch-1'

describe('grade filter route shapes (Sprint B.6)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getInvoices forwards gradeLevel query param verbatim', async () => {
    await getInvoices(SCHOOL, { gradeLevel: '4', status: 'issued' })
    expect(mockApiGet).toHaveBeenCalledWith(`/finance/schools/${SCHOOL}/invoices`, {
      gradeLevel: '4',
      status: 'issued',
    })
  })

  it('getInvoices omits gradeLevel when undefined (still hits same path)', async () => {
    await getInvoices(SCHOOL, { status: 'issued' })
    const params = mockApiGet.mock.calls[0][1] as Record<string, unknown>
    expect(params).not.toHaveProperty('gradeLevel')
    expect(params).toMatchObject({ status: 'issued' })
  })

  it('getSchoolPayments forwards gradeLevel query param verbatim', async () => {
    await getSchoolPayments(SCHOOL, { gradeLevel: '5', gateway: 'cash' })
    expect(mockApiGet).toHaveBeenCalledWith(`/finance/schools/${SCHOOL}/payments`, {
      gradeLevel: '5',
      gateway: 'cash',
    })
  })

  it('getSchoolPayments omits gradeLevel when undefined', async () => {
    await getSchoolPayments(SCHOOL, { status: 'completed' })
    const params = mockApiGet.mock.calls[0][1] as Record<string, unknown>
    expect(params).not.toHaveProperty('gradeLevel')
    expect(params).toMatchObject({ status: 'completed' })
  })

  // Sprint B-tail (PR-equivalent of issue #343 follow-on) — the literal
  // `__UNRESOLVED__` sentinel is the discriminator the backend's
  // `listBySchoolAndGrade` honors as "rows whose gradeLevel snapshot is
  // unresolved" (those are sparse on GSI14 and invisible to the regular
  // grade chips). The frontend `useSchoolGradeOptions({includeUnknownOption})`
  // injects this exact string into the chip dropdown — these two tests
  // pin the verbatim forwarding so a service-layer rename/escape can't
  // silently break the operator-facing Unknown chip.
  it('getInvoices forwards the __UNRESOLVED__ gradeLevel literal verbatim (Unknown chip)', async () => {
    await getInvoices(SCHOOL, { gradeLevel: '__UNRESOLVED__' })
    expect(mockApiGet).toHaveBeenCalledWith(`/finance/schools/${SCHOOL}/invoices`, {
      gradeLevel: '__UNRESOLVED__',
    })
  })

  it('getSchoolPayments forwards the __UNRESOLVED__ gradeLevel literal verbatim (Unknown chip)', async () => {
    await getSchoolPayments(SCHOOL, { gradeLevel: '__UNRESOLVED__' })
    expect(mockApiGet).toHaveBeenCalledWith(`/finance/schools/${SCHOOL}/payments`, {
      gradeLevel: '__UNRESOLVED__',
    })
  })
})
