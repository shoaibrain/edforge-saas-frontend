/**
 * FeeStructureList
 *
 * Admin table of configured fee structures with edit/delete actions.
 */

import type { FeeStructure } from '@edforge/types'
import { useCurrency } from '@edforge/types/use-currency'
import { useTranslation } from '@edforge/i18n'
import { useSettings } from '../../lib/shell-context'
import { Pencil, Trash2, GraduationCap, DollarSign } from 'lucide-react'

interface FeeStructureListProps {
  feeStructures: FeeStructure[]
  isLoading?: boolean
  onEdit: (fee: FeeStructure) => void
  onDelete: (fee: FeeStructure) => void
}

export function FeeStructureList({
  feeStructures,
  isLoading,
  onEdit,
  onDelete,
}: FeeStructureListProps) {
  const { t } = useTranslation('payments')
  const settings = useSettings()
  const { format } = useCurrency(settings)

  const safeList = Array.isArray(feeStructures) ? feeStructures : []

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-[rgb(var(--bg-tertiary))] animate-pulse" />
        ))}
      </div>
    )
  }

  if (safeList.length === 0) {
    return (
      <div className="text-center py-12">
        <DollarSign className="w-10 h-10 mx-auto mb-3 text-[rgb(var(--text-tertiary))] opacity-40" />
        <p className="text-sm font-medium text-[rgb(var(--text-secondary))]">
          {t('feeStructure.noFeeStructures')}
        </p>
        <p className="text-xs text-[rgb(var(--text-tertiary))] mt-1">
          {t('feeStructure.noFeeStructuresDescription')}
        </p>
      </div>
    )
  }

  return (
    <div className="border border-[rgb(var(--border-primary))] rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[rgb(var(--bg-secondary))]">
            <th className="text-left px-4 py-2.5 text-xs font-medium text-[rgb(var(--text-tertiary))]">
              {t('feeStructure.name')}
            </th>
            <th className="text-left px-4 py-2.5 text-xs font-medium text-[rgb(var(--text-tertiary))]">
              {t('feeStructure.type')}
            </th>
            <th className="text-right px-4 py-2.5 text-xs font-medium text-[rgb(var(--text-tertiary))]">
              {t('feeStructure.amount')}
            </th>
            <th className="text-left px-4 py-2.5 text-xs font-medium text-[rgb(var(--text-tertiary))]">
              {t('feeStructure.frequency')}
            </th>
            <th className="text-left px-4 py-2.5 text-xs font-medium text-[rgb(var(--text-tertiary))]">
              {t('feeStructure.gradeLevels')}
            </th>
            <th className="w-20" />
          </tr>
        </thead>
        <tbody>
          {safeList.map((fee) => (
            <tr
              key={fee.id}
              className="border-t border-[rgb(var(--border-primary))] hover:bg-[rgb(var(--bg-tertiary))] transition-colors"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[rgb(var(--text-primary))]">{fee.name}</span>
                  {!fee.isActive && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-[rgb(var(--surface-tertiary))]  text-[rgb(var(--text-tertiary))]">
                      Inactive
                    </span>
                  )}
                </div>
                {fee.description && (
                  <p className="text-xs text-[rgb(var(--text-tertiary))] mt-0.5">{fee.description}</p>
                )}
              </td>
              <td className="px-4 py-3 text-[rgb(var(--text-secondary))]">
                {t(`feeStructure.types.${fee.feeType}`, { defaultValue: fee.feeType })}
              </td>
              <td className="px-4 py-3 text-right font-medium text-[rgb(var(--text-primary))]">
                {format(fee.amount)}
                {fee.taxRate > 0 && (
                  <span className="text-xs text-[rgb(var(--text-tertiary))] ml-1">
                    +{fee.taxRate}% {fee.taxType}
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-[rgb(var(--text-secondary))]">
                {t(`feeStructure.frequencies.${fee.frequency}`, { defaultValue: fee.frequency })}
              </td>
              <td className="px-4 py-3">
                {(fee.gradeLevels ?? []).length === 0 ? (
                  <span className="text-xs text-[rgb(var(--text-tertiary))]">
                    {t('feeStructure.allGrades')}
                  </span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {(fee.gradeLevels ?? []).map((grade) => (
                      <span
                        key={grade}
                        className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-[rgb(var(--state-info-bg)/0.18)] text-[rgb(var(--state-info-fg))] dark:bg-[rgb(var(--state-info-bg)/0.18)]0/10 "
                      >
                        <GraduationCap className="w-2.5 h-2.5 mr-0.5" />
                        {grade}
                      </span>
                    ))}
                  </div>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onEdit(fee)}
                    className="p-1.5 rounded-lg hover:bg-[rgb(var(--bg-tertiary))] transition-colors"
                    aria-label={t('feeStructure.editFee')}
                  >
                    <Pencil className="w-3.5 h-3.5 text-[rgb(var(--text-tertiary))]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(fee)}
                    className="p-1.5 rounded-lg hover:bg-[rgb(var(--state-danger-bg)/0.18)] dark:hover:bg-[rgb(var(--state-danger-bg)/0.18)]0/10 transition-colors"
                    aria-label={t('feeStructure.deleteFee')}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-[rgb(var(--state-danger-fg))]" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
