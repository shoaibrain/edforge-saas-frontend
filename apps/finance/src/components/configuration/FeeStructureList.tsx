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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: fee.isActive !== false ? '#1D9E75' : 'rgb(var(--text-disabled))',
                  flexShrink: 0, display: 'inline-block'
                }} />
                <span style={{ fontSize: '12px', fontWeight: 500, color: 'rgb(var(--text-primary))' }}>
                  {fee.name}
                </span>
              </div>
              <span style={{ fontSize: '10px', color: 'rgb(var(--text-tertiary))' }}>
                {fee.description}
                {fee.autoApplyOnEnrollment && (
                  <> · <span style={{ color: '#1D9E75' }}>Auto-apply on enrollment</span></>
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
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgb(var(--text-primary))' }}>
                {formatCompact(fee.amount)}
              </span>
              <span style={{ fontSize: '9px', color: 'rgb(var(--text-disabled))' }}>
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
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                <span style={{
                  background: 'rgba(29,158,117,0.08)',
                  color: '#1D9E75',
                  border: '1px solid rgba(29,158,117,0.15)',
                  fontSize: '10px', fontWeight: 500,
                  padding: '1px 6px', borderRadius: 5
                }}>All Grades</span>
              </div>
            )
          }
          return (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {[...gradeLevels].sort(gradeSort).map((g) => (
                <span key={g} style={{
                  background: 'rgba(55,138,221,0.08)',
                  color: '#378ADD',
                  border: '1px solid rgba(55,138,221,0.15)',
                  fontSize: '10px', fontWeight: 500,
                  padding: '1px 6px', borderRadius: 5
                }}>{formatGradeLabel(g)}</span>
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
