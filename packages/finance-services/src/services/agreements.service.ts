/**
 * Agreements Service (family-billing)
 *
 * API client for family-billing agreements. All routes are school-scoped
 * under /finance/schools/:schoolId/agreements and gated by billing:manage.
 *
 * Route shapes are pinned by agreements-service-routes.test.ts — a wrong
 * path here silently 403s (API GW falls through to IAM auth). Keep the URLs
 * byte-identical to the backend controller + API Gateway spec.
 */

import { apiGet, apiPost } from '@edforge/api-client'
import type {
  Agreement,
  AgreementVersion,
  AgreementStatus,
  CreateAgreementDto,
  ActivateAgreementDto,
  CancelAgreementDto,
} from '@edforge/types'
import type { FinancePaginatedResponse } from '../types/pagination'
import { normalizeFinanceListResponse } from '../utils/normalize-finance-list-response'

export interface AgreementListParams {
  status?: AgreementStatus
  limit?: number
  cursor?: string
}

// ============================================================================
// QUERIES
// ============================================================================

export async function getAgreements(
  schoolId: string,
  params?: AgreementListParams,
): Promise<FinancePaginatedResponse<Agreement>> {
  const response = await apiGet<FinancePaginatedResponse<Agreement> | Agreement[]>(
    `/finance/schools/${schoolId}/agreements`,
    params as Record<string, unknown>,
  )
  return normalizeFinanceListResponse(response)
}

export async function getAgreement(
  schoolId: string,
  agreementId: string,
): Promise<Agreement> {
  return apiGet<Agreement>(
    `/finance/schools/${schoolId}/agreements/${agreementId}`,
  )
}

export async function getAgreementVersions(
  schoolId: string,
  agreementId: string,
): Promise<AgreementVersion[]> {
  // The backend wraps the version chain as `{ items: [...] }`
  // (agreements.controller getVersionHistory), NOT a bare array. Unwrap to the
  // array the UI iterates; tolerate a bare array too in case the contract shifts.
  const res = await apiGet<{ items: AgreementVersion[] } | AgreementVersion[]>(
    `/finance/schools/${schoolId}/agreements/${agreementId}/versions`,
  )
  return Array.isArray(res) ? res : (res?.items ?? [])
}

// ============================================================================
// MUTATIONS
// ============================================================================

export async function createAgreement(
  schoolId: string,
  data: CreateAgreementDto,
): Promise<Agreement> {
  return apiPost<Agreement, CreateAgreementDto>(
    `/finance/schools/${schoolId}/agreements`,
    data,
  )
}

/**
 * Activate a draft agreement version. May 409 with
 * `CONFLICTING_OPEN_INVOICES` (resolvable via
 * `acknowledgeOpenInvoices: true`) or `AGREEMENT_OVERLAP` (unresolvable —
 * an active agreement already covers overlapping students/fee types).
 */
export async function activateAgreement(
  schoolId: string,
  agreementId: string,
  data: ActivateAgreementDto,
): Promise<Agreement> {
  return apiPost<Agreement, ActivateAgreementDto>(
    `/finance/schools/${schoolId}/agreements/${agreementId}/activate`,
    data,
  )
}

export async function cancelAgreement(
  schoolId: string,
  agreementId: string,
  data: CancelAgreementDto,
): Promise<Agreement> {
  return apiPost<Agreement, CancelAgreementDto>(
    `/finance/schools/${schoolId}/agreements/${agreementId}/cancel`,
    data,
  )
}

export const agreementsService = {
  getAgreements,
  getAgreement,
  getAgreementVersions,
  createAgreement,
  activateAgreement,
  cancelAgreement,
}
