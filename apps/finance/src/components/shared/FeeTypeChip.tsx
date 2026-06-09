/**
 * FeeTypeChip — chip for fee-type display in Fee Structures.
 *
 * Renders the design-system StatusBadge with a fee-type → semantic-tone map so
 * fee categories read consistently with the rest of the platform's chips.
 */

import { StatusBadge, type StatusTone } from '@edforge/ui'

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

const FEE_TYPE_LABELS: Record<string, string> = {
  admission: 'Admission',
  lab: 'Lab',
  transport: 'Transport',
  tuition: 'Tuition',
  exam: 'Exam',
  library: 'Library',
  hostel: 'Hostel',
  uniform: 'Uniform',
  miscellaneous: 'Misc.',
  custom: 'Custom',
}

export function FeeTypeChip({ type }: FeeTypeChipProps) {
  const normalized = type.toLowerCase()
  const tone = FEE_TYPE_TONE[normalized] ?? 'neutral'
  const label =
    FEE_TYPE_LABELS[normalized] ??
    type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  return <StatusBadge tone={tone}>{label}</StatusBadge>
}
