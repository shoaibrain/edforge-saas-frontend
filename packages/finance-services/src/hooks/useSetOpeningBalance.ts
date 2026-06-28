/**
 * useSetOpeningBalance — Pilot Onboarding Hardening PD.3.2
 *
 * TanStack mutation hook for setting / revising a student's opening
 * balance (previous dues). Invalidates the matching student-accounts +
 * ledger caches so the operator-facing UI re-fetches the canonical
 * server state immediately on success (including the server-computed
 * `openingBalanceRemaining`).
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { SetOpeningBalanceDto, SetOpeningBalanceResponse } from '@edforge/types'
import { setOpeningBalance } from '../services/student-accounts.service'
import { paymentKeys } from './usePayments'

export interface UseSetOpeningBalanceArgs {
  schoolId: string
  accountId: string
  payload: SetOpeningBalanceDto
}

export function useSetOpeningBalance(schoolId: string) {
  const queryClient = useQueryClient()

  return useMutation<SetOpeningBalanceResponse, Error, { accountId: string; payload: SetOpeningBalanceDto }>({
    mutationFn: ({ accountId, payload }) =>
      setOpeningBalance(schoolId, accountId, payload),
    onSuccess: (_data, { accountId }) => {
      // Account aggregates (balance, openingBalance, openingBalanceRemaining)
      // and the ledger both change on every set/revise — invalidate both.
      queryClient.invalidateQueries({ queryKey: paymentKeys.studentAccounts(schoolId) })
      queryClient.invalidateQueries({ queryKey: paymentKeys.ledger(schoolId, accountId) })
    },
  })
}
