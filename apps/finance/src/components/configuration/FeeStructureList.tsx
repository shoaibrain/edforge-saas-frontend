/**
 * FeeStructureList
 *
 * Admin table of configured fee structures with edit/delete actions.
 * Uses TanstackDataTable from @edforge/ui for pagination and sorting.
 */

import type { FeeStructure } from '@edforge/types'
import { formatGradeLabel, gradeSort } from '@edforge/types'
import { useCurrency } from '@edforge/types/use-currency'
import { useFinanceSettings } from '../../layouts/FinanceLayout'
import { TanstackDataTable, createActionsColumn, type ColumnDef } from '@edforge/ui'
import { Pencil, Trash2, Layers } from 'lucide-react'
import { useMemo } from 'react'
import { FeeTypeChip } from '../shared'

interface FeeStructureListProps {
  feeStructures: FeeStructure[]
  isLoading?: boolean
  onEdit: (fee: FeeStructure) => void
  onDelete: (fee: FeeStructure) => void
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
  const settings = useFinanceSettings()
  const { formatCompact } = useCurrency(settings)
  const safeList = Array.isArray(feeStructures) ? feeStructures : []

  const columns = useMemo<ColumnDef<FeeStructure, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => {
          const fee = row.original
          return (
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 inline-block ${fee.isActive !== false ? 'bg-[rgb(var(--accent-enrollment))]' : 'bg-[rgb(var(--text-disabled))]'}`} />
                <span className="text-xs font-medium text-[rgb(var(--text-primary))]">
                  {fee.name}
                </span>
              </div>
              <span className="text-3xs text-[rgb(var(--text-tertiary))]">
                {fee.description}
                {fee.autoApplyOnEnrollment && (
                  <> · <span className="text-[rgb(var(--accent-enrollment-text))]">Auto-apply on enrollment</span></>
                )}
              </span>
            </div>
          )
        },
      },
      {
        accessorKey: 'feeType',
        header: 'Type',
        cell: ({ row }) => (
          <FeeTypeChip type={row.original.feeType} />
        ),
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        meta: { align: 'right' as const },
        cell: ({ row }) => {
          const fee = row.original
          return (
            <div className="text-right flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-[rgb(var(--text-primary))]">
                {formatCompact(fee.amount)}
              </span>
              <span className="text-4xs text-[rgb(var(--text-disabled))]">
                {settings.currency} · {fee.frequency?.replace(/_/g, ' ').toLowerCase() ?? ''}
              </span>
            </div>
          )
        },
      },
      {
        accessorKey: 'frequency',
        header: 'Frequency',
        cell: ({ row }) => (
          <span className="text-[rgb(var(--text-secondary))]">
            {FREQUENCY_LABELS[row.original.frequency] ?? row.original.frequency}
          </span>
        ),
      },
      {
        accessorKey: 'gradeLevels',
        header: 'Grade Levels',
        enableSorting: false,
        cell: ({ row }) => {
          const gradeLevels = row.original.gradeLevels ?? []
          if (gradeLevels.length === 0) {
            return (
              <div className="flex flex-wrap gap-1">
                <span className="text-3xs font-medium py-px px-1.5 rounded-[5px] border bg-[rgb(var(--accent-enrollment)/0.08)] text-[rgb(var(--accent-enrollment-text))] border-[rgb(var(--accent-enrollment)/0.15)]">All Grades</span>
              </div>
            )
          }
          return (
            <div className="flex flex-wrap gap-1">
              {[...gradeLevels].sort(gradeSort).map((g) => (
                <span key={g} className="text-3xs font-medium py-px px-1.5 rounded-[5px] border bg-[rgb(var(--accent-academics)/0.08)] text-[rgb(var(--accent-academics))] border-[rgb(var(--accent-academics)/0.15)]">{formatGradeLabel(g)}</span>
              ))}
            </div>
          )
        },
      },
      createActionsColumn<FeeStructure>({
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onEdit(row.original)}
              className="p-1.5 rounded-lg hover:bg-[rgb(var(--background-tertiary))] transition-colors"
              aria-label="Edit fee structure"
            >
              <Pencil className="w-3.5 h-3.5 text-[rgb(var(--text-tertiary))]" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(row.original)}
              className="p-1.5 rounded-lg hover:bg-[rgb(var(--state-danger-bg)/0.18)] transition-colors"
              aria-label="Delete fee structure"
            >
              <Trash2 className="w-3.5 h-3.5 text-[rgb(var(--state-danger-fg))]" />
            </button>
          </div>
        ),
      }),
    ],
    [onEdit, onDelete],
  )

  return (
    <TanstackDataTable<FeeStructure>
      columns={columns}
      data={safeList}
      isLoading={isLoading}
      enableSorting={true}
      pagination={{ pageSize: 10 }}
      maxHeight="calc(100vh - 24rem)"
      emptyState={{
        icon: <Layers className="w-10 h-10 text-[rgb(var(--text-tertiary))] opacity-40" />,
        title: 'No fee structures configured',
        description: 'Add fee structures to start generating invoices.',
      }}
      className="min-h-96"
    />
  )
}
