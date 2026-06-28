/**
 * Student Accounts Service
 *
 * API client for the PUT opening-balance endpoint shipped by
 * Pilot Onboarding Hardening — Sprint PD.1.5
 * (PUT /finance/schools/:schoolId/student-accounts/:accountId/opening-balance).
 *
 * Read-paths (list, get, ledger) continue to live in `invoices.service.ts`
 * for backwards compatibility — the existing call sites import them from
 * there. Splitting only the write here keeps the diff narrow.
 */

import { apiPut } from '@edforge/api-client'
import type { SetOpeningBalanceDto, SetOpeningBalanceResponse } from '@edforge/types'

/**
 * Set or revise a student's opening balance (previous dues carried in from
 * a prior accounting period). Adds the `Idempotency-Key` header so the
 * backend's idempotency middleware can dedupe rapid double-clicks /
 * network retries (24h TTL on the dedupe row).
 *
 * `amount`, `asOf`, and `note` shape mirrors `setOpeningBalanceSchema` in
 * @aibrains/shared-types — the backend Zod pipe is the source of truth;
 * we type-check here for callers' convenience.
 *
 * Returns `{ account, ledgerEntryId, isRevision }`. `isRevision === true`
 * means the operator overwrote a previously-set opening balance (the
 * original ledger row stays; a revision adjustment ledger row is added).
 */
export async function setOpeningBalance(
  schoolId: string,
  accountId: string,
  payload: SetOpeningBalanceDto,
): Promise<SetOpeningBalanceResponse> {
  return apiPut<SetOpeningBalanceResponse, SetOpeningBalanceDto>(
    `/finance/schools/${schoolId}/student-accounts/${accountId}/opening-balance`,
    payload,
    {
      headers: {
        'Idempotency-Key': crypto.randomUUID(),
      },
    },
  )
}
