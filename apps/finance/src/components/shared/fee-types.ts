/**
 * Fee-type vocabulary — the single frontend source for the backend
 * `feeTypeEnum` (shared-types finance/common.ts). Rendered as Select options
 * in FeeStructureForm and as the covered-fee-type picker in the agreement
 * wizard; labels resolve through the `feeStructure.types.*` i18n keys.
 */

import type { FeeType } from '@edforge/types'

export const FEE_TYPES: FeeType[] = [
  'tuition',
  'admission',
  'exam',
  'transport',
  'library',
  'lab',
  'hostel',
  'uniform',
  'miscellaneous',
  'custom',
]

type TranslateFn = (key: string, options?: Record<string, unknown>) => string

export function feeTypeLabel(t: TranslateFn, feeType: string): string {
  return t(`feeStructure.types.${feeType}`, { defaultValue: feeType })
}
