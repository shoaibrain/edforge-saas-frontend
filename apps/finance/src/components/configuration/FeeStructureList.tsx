/**
 * FeeStructureList
 *
 * Admin table of configured fee structures with edit/delete actions.
 * Uses TanstackDataTable from @edforge/ui for pagination and sorting.
 */

import type { FeeStructure } from '@edforge/types'
import { formatNPR } from '@edforge/types'
import { TanstackDataTable, createActionsColumn, type ColumnDef } from '@edforge/ui'
import { Pencil, Trash2, GraduationCap, DollarSign } from 'lucide-react'
import { useMemo } from 'react'

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

  const columns = useMemo<ColumnDef<FeeStructure, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => {
          const fee = row.original
          return (
            <div>
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
            </div>
          )
        },
      },
      {
        accessorKey: 'feeType',
        header: 'Type',
        cell: ({ row }) => (
          <span className="text-[rgb(var(--text-secondary))]">
            {FEE_TYPE_LABELS[row.original.feeType] ?? row.original.feeType}
          </span>
        ),
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        meta: { align: 'right' as const },
        cell: ({ row }) => {
          const fee = row.original
          return (
            <span className="font-medium text-[rgb(var(--text-primary))]">
              {formatNPR(fee.amount)}
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
              <span className="text-xs text-[rgb(var(--text-tertiary))]">All Grades</span>
            )
          }
          return (
            <div className="flex flex-wrap gap-1">
              {gradeLevels.map((grade) => (
                <span
                  key={grade}
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                >
                  <GraduationCap className="w-2.5 h-2.5 mr-0.5" />
                  {grade}
                </span>
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
              className="p-1.5 rounded-lg hover:bg-[rgb(var(--surface-tertiary))] transition-colors"
              aria-label="Edit fee structure"
            >
              <Pencil className="w-3.5 h-3.5 text-[rgb(var(--text-tertiary))]" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(row.original)}
              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              aria-label="Delete fee structure"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
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
      maxHeight="calc(100vh - 15rem)"
      emptyState={{
        icon: <DollarSign className="w-10 h-10 text-[rgb(var(--text-tertiary))] opacity-40" />,
        title: 'No fee structures configured',
        description: 'Add fee structures to start generating invoices.',
      }}
    />
  )
}
