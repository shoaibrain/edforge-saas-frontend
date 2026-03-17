/**
 * StaffTable Component
 *
 * Displays a paginated table of staff with DiceBear avatars.
 * Row click opens a quick-info drawer (managed by parent).
 * Follows the StudentTable pattern from the academics app.
 */

import { useMemo } from 'react'
import { UsersRound, Key } from 'lucide-react'
import { useTranslation } from '@edforge/i18n'
import { TanstackDataTable, type ColumnDef } from '@edforge/ui'
import type { StaffResponseDto } from '@aibrains/shared-types'
import { StaffRoleBadge } from './StaffRoleBadge'
import { StaffStatusBadge } from './StaffStatusBadge'
import { getStaffAvatar } from '../../lib/avatar'
import { formatDate } from '../../lib/utils'

// ============================================================================
// TYPES
// ============================================================================

interface StaffTableProps {
  staff: StaffResponseDto[]
  isLoading?: boolean
  onAddStaff?: () => void
  onViewStaff?: (staff: StaffResponseDto) => void
}

// ============================================================================
// STAFF TABLE COMPONENT
// ============================================================================

export function StaffTable({
  staff,
  isLoading = false,
  onAddStaff,
  onViewStaff,
}: StaffTableProps) {
  const { t } = useTranslation('people')

  const columns: ColumnDef<StaffResponseDto, unknown>[] = useMemo(
    () => [
      {
        id: 'name',
        accessorFn: (row) => `${row.firstName} ${row.lastSurname}`,
        header: t('tableHeaders.staff'),
        size: 280,
        cell: ({ row }) => {
          const s = row.original
          return (
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden bg-surface-tertiary">
                <img
                  src={getStaffAvatar(s.staffId)}
                  alt={`${s.firstName} ${s.lastSurname}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-text-primary truncate">
                  {s.firstName} {s.lastSurname}
                </p>
                <p className="text-xs text-text-tertiary truncate">{s.email}</p>
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: 'role',
        header: t('tableHeaders.role'),
        size: 140,
        cell: ({ row }) => <StaffRoleBadge role={row.original.role} />,
      },
      {
        accessorKey: 'employmentStatus',
        header: t('tableHeaders.status'),
        size: 120,
        cell: ({ row }) => <StaffStatusBadge status={row.original.employmentStatus} />,
      },
      {
        accessorKey: 'hireDate',
        header: t('tableHeaders.hired'),
        size: 120,
        cell: ({ row }) => (
          <span className="text-text-secondary">{formatDate(row.original.hireDate)}</span>
        ),
      },
      {
        accessorKey: 'departmentName',
        header: t('tableHeaders.department'),
        size: 140,
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-text-secondary text-sm">
            {row.original.departmentName || '—'}
          </span>
        ),
      },
      {
        id: 'systemAccess',
        accessorFn: (row) => (row.userId ? 'active' : 'none'),
        header: t('tableHeaders.systemAccess'),
        size: 130,
        enableSorting: false,
        cell: ({ row }) => {
          const s = row.original
          return s.userId ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
              <Key className="w-3 h-3" />
              {t('systemAccess.active')}
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 dark:bg-slate-500/20 dark:text-slate-400">
              {t('systemAccess.noAccess')}
            </span>
          )
        },
      },
    ],
    [t],
  )

  return (
    <TanstackDataTable
      columns={columns}
      data={staff}
      getRowId={(s) => s.staffId}
      isLoading={isLoading}
      enableSorting={true}
      pagination={{ pageSize: 20 }}
      emptyState={{
        icon: <UsersRound className="w-12 h-12" />,
        title: t('empty.noStaff'),
        description: t('empty.getStarted'),
        action: onAddStaff
          ? { label: t('staffDirectory.addStaff'), onClick: onAddStaff }
          : undefined,
      }}
      onRowClick={onViewStaff}
    />
  )
}
