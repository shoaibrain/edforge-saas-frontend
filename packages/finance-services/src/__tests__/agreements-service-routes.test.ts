import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Route-shape guard for the family-billing agreements service.
 *
 * Every assertion pins a frontend service call to the EXACT path registered
 * on the backend agreements controller + API Gateway spec. A wrong path here
 * produces 403 SigV4 at runtime (API GW falls through to IAM auth when no
 * route matches) — this is the PR#93-class failure this file prevents.
 *
 * If a URL changes here, change the backend route + API GW spec in the same
 * PR (the three-way route handoff), or this test should fail.
 */

vi.mock('@edforge/api-client', () => ({
  apiGet: vi.fn(() => Promise.resolve({ items: [], hasMore: false })),
  apiPost: vi.fn(() => Promise.resolve({})),
}))

import { apiGet, apiPost } from '@edforge/api-client'
import {
  getAgreements,
  getAgreement,
  getAgreementVersions,
  createAgreement,
  activateAgreement,
  cancelAgreement,
} from '../services/agreements.service'

const mockApiGet = vi.mocked(apiGet)
const mockApiPost = vi.mocked(apiPost)

const SCHOOL = 'sch-1'
const AGREEMENT = 'agr-1'

describe('agreements.service route shapes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getAgreements → GET /finance/schools/:schoolId/agreements (no filter)', async () => {
    await getAgreements(SCHOOL)
    expect(mockApiGet).toHaveBeenCalledWith(
      `/finance/schools/${SCHOOL}/agreements`,
      undefined,
    )
  })

  it('getAgreements → forwards ?status filter as query params', async () => {
    await getAgreements(SCHOOL, { status: 'active' })
    expect(mockApiGet).toHaveBeenCalledWith(
      `/finance/schools/${SCHOOL}/agreements`,
      { status: 'active' },
    )
  })

  it('getAgreement → GET /finance/schools/:schoolId/agreements/:id', async () => {
    mockApiGet.mockResolvedValueOnce({})
    await getAgreement(SCHOOL, AGREEMENT)
    expect(mockApiGet).toHaveBeenCalledWith(
      `/finance/schools/${SCHOOL}/agreements/${AGREEMENT}`,
    )
  })

  it('getAgreementVersions → GET .../agreements/:id/versions', async () => {
    mockApiGet.mockResolvedValueOnce({ items: [] })
    await getAgreementVersions(SCHOOL, AGREEMENT)
    expect(mockApiGet).toHaveBeenCalledWith(
      `/finance/schools/${SCHOOL}/agreements/${AGREEMENT}/versions`,
    )
  })

  // Regression: the backend wraps versions as `{ items: [...] }`. The service
  // MUST unwrap to a bare array — else the detail page's `[...versions]` throws
  // "t is not iterable" (the wrapped-list-DTO trap).
  it('getAgreementVersions unwraps the backend { items } envelope to a bare array', async () => {
    const v1 = { version: 1 } as unknown
    const v2 = { version: 2 } as unknown
    mockApiGet.mockResolvedValueOnce({ items: [v1, v2] })
    const result = await getAgreementVersions(SCHOOL, AGREEMENT)
    expect(Array.isArray(result)).toBe(true)
    expect(result).toEqual([v1, v2])
  })

  it('getAgreementVersions tolerates a bare-array response', async () => {
    const v1 = { version: 1 } as unknown
    mockApiGet.mockResolvedValueOnce([v1])
    const result = await getAgreementVersions(SCHOOL, AGREEMENT)
    expect(result).toEqual([v1])
  })

  it('createAgreement → POST /finance/schools/:schoolId/agreements with body', async () => {
    const body = {
      title: 'Sharma siblings',
      payer: { name: 'Ram Sharma' },
      studentIds: ['stu-1', 'stu-2'],
      agreementType: 'fixed_total' as const,
      terms: {
        agreementType: 'fixed_total' as const,
        totalAmount: 20000,
        allocation: [
          { studentId: 'stu-1', amount: 10000 },
          { studentId: 'stu-2', amount: 10000 },
        ],
      },
      coveredFeeTypes: ['tuition'],
      billingFrequency: 'monthly',
      effectiveFrom: '2026-04-01',
      effectiveTo: '2027-03-31',
    }
    await createAgreement(SCHOOL, body)
    expect(mockApiPost).toHaveBeenCalledWith(
      `/finance/schools/${SCHOOL}/agreements`,
      body,
    )
  })

  it('activateAgreement → POST .../agreements/:id/activate with {version, acknowledgeOpenInvoices?}', async () => {
    mockApiPost.mockResolvedValueOnce({})
    await activateAgreement(SCHOOL, AGREEMENT, {
      version: 1,
      acknowledgeOpenInvoices: true,
    })
    expect(mockApiPost).toHaveBeenCalledWith(
      `/finance/schools/${SCHOOL}/agreements/${AGREEMENT}/activate`,
      { version: 1, acknowledgeOpenInvoices: true },
    )
  })

  it('cancelAgreement → POST .../agreements/:id/cancel with {version, reason?}', async () => {
    mockApiPost.mockResolvedValueOnce({})
    await cancelAgreement(SCHOOL, AGREEMENT, {
      version: 2,
      reason: 'Family withdrew',
    })
    expect(mockApiPost).toHaveBeenCalledWith(
      `/finance/schools/${SCHOOL}/agreements/${AGREEMENT}/cancel`,
      { version: 2, reason: 'Family withdrew' },
    )
  })
})
