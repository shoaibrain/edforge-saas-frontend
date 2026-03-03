/**
 * FeeStructureList
 *
 * Admin table of configured fee structures with edit/delete actions.
 */

import type { FeeStructure } from '@edforge/types'
import { formatNPR } from '@edforge/types'
import { Pencil, Trash2, GraduationCap, DollarSign } from 'lucide-react'

interface FeeStructureListProps {
  feeStructures: FeeStructure[]
  isLoading?: boolean
  onEdit: (fee: FeeStructure) => void
  onDelete: (fee: FeeStructure) => void
}

const FEE_TYPE_LABELS: Record<string, string> = {
  tuition: 'Tuition',
  admission: 'Admission',
  exam: 'Exam',
  transport: 'Transport',
  library: 'Library',
  lab: 'Lab',
  hostel: 'Hostel',
  uniform: 'Uniform',
  miscellaneous: 'Miscellaneous',
  custom: 'Custom',
}

const FREQUENCY_LABELS: Record<string, string> = {
  one_time: 'One Time',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  annual: 'Annual',
}

export function FeeStructureList({
  feeStructures,
  isLoading,
  onEdit,
  onDelete,
}: FeeStructureListProps) {
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
          No fee structures configured
        </p>
        <p className="text-xs text-[rgb(var(--text-tertiary))] mt-1">
          Add fee structures to start generating invoices.
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
              Name
            </th>
            <th className="text-left px-4 py-2.5 text-xs font-medium text-[rgb(var(--text-tertiary))]">
              Type
            </th>
            <th className="text-right px-4 py-2.5 text-xs font-medium text-[rgb(var(--text-tertiary))]">
              Amount
            </th>
            <th className="text-left px-4 py-2.5 text-xs font-medium text-[rgb(var(--text-tertiary))]">
              Frequency
            </th>
            <th className="text-left px-4 py-2.5 text-xs font-medium text-[rgb(var(--text-tertiary))]">
              Grade Levels
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
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-500/20 text-slate-500">
                      Inactive
                    </span>
                  )}
                </div>
                {fee.description && (
                  <p className="text-xs text-[rgb(var(--text-tertiary))] mt-0.5">{fee.description}</p>
                )}
              </td>
              <td className="px-4 py-3 text-[rgb(var(--text-secondary))]">
                {FEE_TYPE_LABELS[fee.feeType] ?? fee.feeType}
              </td>
              <td className="px-4 py-3 text-right font-medium text-[rgb(var(--text-primary))]">
                {formatNPR(fee.amount)}
                {fee.taxRate > 0 && (
                  <span className="text-xs text-[rgb(var(--text-tertiary))] ml-1">
                    +{fee.taxRate}% {fee.taxType}
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-[rgb(var(--text-secondary))]">
                {FREQUENCY_LABELS[fee.frequency] ?? fee.frequency}
              </td>
              <td className="px-4 py-3">
                {(fee.gradeLevels ?? []).length === 0 ? (
                  <span className="text-xs text-[rgb(var(--text-tertiary))]">
                    All Grades
                  </span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {(fee.gradeLevels ?? []).map((grade) => (
                      <span
                        key={grade}
                        className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
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
                    aria-label="Edit fee structure"
                  >
                    <Pencil className="w-3.5 h-3.5 text-[rgb(var(--text-tertiary))]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(fee)}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    aria-label="Delete fee structure"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
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
