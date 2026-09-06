/**
 * BillingSourceChip — chip for a family-billing (FB) billing source.
 *
 * `standard` = fee-catalog only, `agreement` = agreement-priced, `mixed` =
 * both sources on the same invoice. Mirrors FeeTypeChip's StatusBadge idiom so
 * billing sources read consistently with the rest of the platform's chips.
 * Reused across FB-3.10 (bulk preview + override dialog), FB-5.4 (provenance
 * card) and FB-5.5 (invoices-list filter column).
 */

import { StatusBadge, type StatusTone } from '@edforge/ui'
import { useTranslation } from '@edforge/i18n'

export type BillingSource = 'standard' | 'agreement' | 'mixed'

export interface BillingSourceChipProps {
  source: BillingSource
}

const BILLING_SOURCE_TONE: Record<BillingSource, StatusTone> = {
  standard: 'neutral',
  agreement: 'info',
  mixed: 'warning',
}

export function BillingSourceChip({ source }: BillingSourceChipProps) {
  const { t } = useTranslation('payments')
  return <StatusBadge tone={BILLING_SOURCE_TONE[source]}>{t(`billingSource.${source}`)}</StatusBadge>
}
