/**
 * FeeTypeChip — chip for fee-type display in Fee Structures.
 *
 * Renders the design-system StatusBadge with a fee-type → semantic-tone map so
 * fee categories read consistently with the rest of the platform's chips.
 */

import { StatusBadge, type StatusTone } from '@edforge/ui'
import { useTranslation } from '@edforge/i18n'

export interface FeeTypeChipProps {
  type: string
}

const FEE_TYPE_TONE: Record<string, StatusTone> = {
  tuition: 'success',
  admission: 'info',
  transport: 'warning',
  exam: 'danger',
  lab: 'info',
}

export function FeeTypeChip({ type }: FeeTypeChipProps) {
  const { t } = useTranslation('payments')
  const normalized = type.toLowerCase()
  const tone = FEE_TYPE_TONE[normalized] ?? 'neutral'
  const fallback = type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  const label = t(`feeStructure.types.${normalized}`, { defaultValue: fallback })

  return <StatusBadge tone={tone}>{label}</StatusBadge>
}
