/**
 * FeeStructureList
 *
 * Admin table of configured fee structures with per-row edit/delete
 * actions. Backed by the shared `TanstackDataTable` (sort / search /
 * column visibility / density / CSV export / persistence). The finance
 * MFE has its own copy under `apps/finance/src/components/configuration`
 * for the /finance/configuration/fee-structures surface; this one is
 * for shell's /settings/fee-structures.
 */

import { useMemo } from 'react'
import type { FeeStructure } from '@edforge/types'
import { useCurrency } from '@edforge/types/use-currency'
import { useTranslation } from '@edforge/i18n'
import {
  TanstackDataTable,
  type ColumnDef,
} from '@edforge/ui'
import { useSettings } from '../../lib/shell-context'
import { DollarSign, GraduationCap, Pencil, Trash2 } from 'lucide-react'

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

  const safeList: FeeStructure[] = Array.isArray(feeStructures) ? feeStructures : []

  const columns: ColumnDef<FeeStructure, unknown>[] = useMemo(
    () => [
      {
        id: 'name',
        accessorKey: 'name',
        header: t('feeStructure.name'),
        cell: ({ row }) => {
          const fee = row.original
          return (
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-[rgb(var(--text-primary))] truncate">{fee.name}</span>
                {!fee.isActive && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-[rgb(var(--background-tertiary))] text-[rgb(var(--text-tertiary))]">
                    Inactive
                  </span>
                )}
              </div>
              {fee.description && (
                <p className="text-xs text-[rgb(var(--text-tertiary))] mt-0.5 truncate">{fee.description}</p>
              )}
            </div>
          )
        },
      },
      {
        id: 'feeType',
        accessorKey: 'feeType',
        header: t('feeStructure.type'),
        cell: ({ row }) => (
          <span className="text-sm text-[rgb(var(--text-secondary))]">
            {t(`feeStructure.types.${row.original.feeType}`, { defaultValue: row.original.feeType })}
          </span>
        ),
      },
      {
        id: 'amount',
        accessorKey: 'amount',
        header: () => <span className="block text-right">{t('feeStructure.amount')}</span>,
        cell: ({ row }) => {
          const fee = row.original
          return (
            <span className="block text-right font-medium text-[rgb(var(--text-primary))] tabular-nums">
              {format(fee.amount)}
              {fee.taxRate > 0 && (
                <span className="text-xs text-[rgb(var(--text-tertiary))] ml-1">
                  +{fee.taxRate}% {fee.taxType}
                </span>
              )}
            </span>
          )
        },
      },
      {
        id: 'frequency',
        accessorKey: 'frequency',
        header: t('feeStructure.frequency'),
        cell: ({ row }) => (
          <span className="text-sm text-[rgb(var(--text-secondary))]">
            {t(`feeStructure.frequencies.${row.original.frequency}`, { defaultValue: row.original.frequency })}
          </span>
        ),
      },
      {
        id: 'gradeLevels',
        accessorFn: (fee) => (fee.gradeLevels ?? []).join(', '),
        header: t('feeStructure.gradeLevels'),
        enableSorting: false,
        cell: ({ row }) => {
          const grades = row.original.gradeLevels ?? []
          if (grades.length === 0) {
            return (
              <span className="text-xs text-[rgb(var(--text-tertiary))]">
                {t('feeStructure.allGrades')}
              </span>
            )
          }
          return (
            <div className="flex flex-wrap gap-1">
              {grades.map((grade) => (
                <span
                  key={grade}
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-[rgb(var(--state-info-bg)/0.18)] text-[rgb(var(--state-info-fg))]"
                >
                  <GraduationCap className="w-2.5 h-2.5 mr-0.5" />
                  {grade}
                </span>
              ))}
            </div>
          )
        },
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onEdit(row.original) }}
              className="p-1.5 rounded-md hover:bg-[rgb(var(--background-tertiary))] transition-colors"
              aria-label={t('feeStructure.editFee')}
            >
              <Pencil className="w-3.5 h-3.5 text-[rgb(var(--text-tertiary))]" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete(row.original) }}
              className="p-1.5 rounded-md hover:bg-[rgb(var(--state-danger-bg)/0.18)] transition-colors"
              aria-label={t('feeStructure.deleteFee')}
            >
              <Trash2 className="w-3.5 h-3.5 text-[rgb(var(--state-danger-fg))]" />
            </button>
          </div>
        ),
      },
    ],
    [t, format, onEdit, onDelete],
  )

  return (
    <TanstackDataTable<FeeStructure>
      columns={columns}
      data={safeList}
      getRowId={(row) => row.id}
      isLoading={isLoading}
      tableId="settings.fee-structures"
      enableSorting
      enableColumnVisibility
      pagination={{ pageSize: 20 }}
      pageSizes={[10, 20, 50]}
      defaultSort={[{ id: 'name', desc: false }]}
      searchPlaceholder={t('feeStructure.name')}
      exportOptions={{ filename: 'fee-structures', formats: ['csv'] }}
      emptyState={{
        icon: <DollarSign className="w-10 h-10" />,
        title: t('feeStructure.noFeeStructures'),
        description: t('feeStructure.noFeeStructuresDescription'),
      }}
    />
  )
}
