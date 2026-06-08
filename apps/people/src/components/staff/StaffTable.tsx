/**
 * StaffTable Component — V2
 *
 * Displays a paginated table of staff with V2 styling.
 * DiceBear avatars, V2 role chips, access chips, status chips.
 * Row click opens a quick-info drawer (managed by parent).
 */

import { useMemo, type MouseEvent, type ReactNode } from 'react'
import { UsersRound, Eye, Pencil, MoreVertical } from 'lucide-react'
import { useTranslation } from '@edforge/i18n'
import { focusRingInset, TanstackDataTable, type ColumnDef } from '@edforge/ui'
import type { StaffResponseDto } from '@aibrains/shared-types'
import { StaffRoleChip } from './StaffRoleChip'
import { AccessChip } from './AccessChip'
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
// EMPLOYMENT TYPE BADGE COLORS
// ============================================================================

const EMPLOYMENT_STYLES: Record<string, string> = {
  active: 'bg-[var(--v2-warning-bg)] text-[var(--v2-warning)]',
  on_leave: 'bg-[var(--v2-warning-bg)] text-[var(--v2-warning)]',
  suspended: 'bg-[var(--v2-danger-bg)] text-[var(--v2-danger)]',
  terminated: 'bg-[var(--v2-danger-bg)] text-[var(--v2-danger)]',
  retired: 'bg-[rgb(var(--surface-tertiary))] text-[var(--v2-text-hint)]',
  resigned: 'bg-[rgb(var(--surface-tertiary))] text-[var(--v2-text-hint)]',
}

function getEmploymentLabel(status?: string): string {
  if (!status) return 'Full-time'
  const labels: Record<string, string> = {
    active: 'Full-time',
    on_leave: 'On Leave',
    suspended: 'Suspended',
    terminated: 'Terminated',
    retired: 'Retired',
    resigned: 'Resigned',
  }
  return labels[status] || 'Full-time'
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
          const empStyle = EMPLOYMENT_STYLES[s.employmentStatus] || EMPLOYMENT_STYLES.active
          return (
            <div className="flex items-center gap-2.5">
              <img
                src={getStaffAvatar(s.staffId)}
                alt={`${s.firstName} ${s.lastSurname}`}
                className="h-8 w-8 shrink-0 rounded-full object-cover"
                loading="lazy"
              />
              <div className="flex min-w-0 flex-col gap-0.5">
                <div className="flex items-center gap-1">
                  <span className="truncate text-xs font-medium text-[var(--v2-text-primary)]">
                    {s.firstName} {s.lastSurname}
                  </span>
                  <span className={`rounded px-1.5 py-px text-[9px] font-medium ${empStyle}`}>
                    {getEmploymentLabel(s.employmentStatus)}
                  </span>
                </div>
                <span className="truncate text-[10px] text-[var(--v2-text-ghost)]">
                  {s.email}
                </span>
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: 'role',
        header: t('tableHeaders.role'),
        size: 140,
        cell: ({ row }) => <StaffRoleChip role={row.original.role} />,
      },
      {
        accessorKey: 'employmentStatus',
        header: t('tableHeaders.status'),
        size: 120,
        cell: ({ row }) => {
          const status = row.original.employmentStatus
          const isActive = status === 'active'
          return (
            <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-2 py-0.5 text-[10px] font-medium ${isActive ? 'bg-[var(--v2-success-bg)] text-[var(--v2-success)]' : 'bg-[rgb(var(--surface-tertiary))] text-[var(--v2-text-hint)]'}`}>
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${isActive ? 'bg-[var(--v2-success)]' : 'bg-[var(--v2-text-hint)]'}`}
              />
              {isActive ? 'Active' : (status?.replace('_', ' ') || 'Unknown')}
            </span>
          )
        },
      },
      {
        accessorKey: 'hireDate',
        header: t('tableHeaders.hired'),
        size: 120,
        cell: ({ row }) => (
          <span className="text-[11px] text-[var(--v2-text-muted)]">
            {formatDate(row.original.hireDate)}
          </span>
        ),
      },
      {
        accessorKey: 'departmentName',
        header: t('tableHeaders.department'),
        size: 140,
        enableSorting: false,
        cell: ({ row }) => (
          <span
            className={`text-[11px] ${row.original.departmentName ? 'text-[var(--v2-text-muted)]' : 'text-[var(--v2-text-ghost)]'}`}
          >
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
        cell: ({ row }) => <AccessChip hasAccess={!!row.original.userId} />,
      },
      {
        id: 'actions',
        header: '',
        size: 100,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <ActionBtn
              icon={<Eye className="h-3.5 w-3.5" />}
              title="View"
              onClick={(e) => {
                e.stopPropagation()
                onViewStaff?.(row.original)
              }}
            />
            <ActionBtn
              icon={<Pencil className="h-3.5 w-3.5" />}
              title="Edit"
              onClick={(e) => e.stopPropagation()}
            />
            <ActionBtn
              icon={<MoreVertical className="h-3.5 w-3.5" />}
              title="More"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        ),
      },
    ],
    [t, onViewStaff],
  )

  return (
    <TanstackDataTable
      columns={columns}
      data={staff}
      getRowId={(s) => s.staffId}
      isLoading={isLoading}
      enableSorting={true}
      pagination={{ pageSize: 20 }}
      maxHeight="calc(100vh - 22rem)"
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

// ============================================================================
// ACTION BUTTON
// ============================================================================

function ActionBtn({
  icon,
  title,
  onClick,
}: {
  icon: ReactNode
  title: string
  onClick: (e: MouseEvent<HTMLButtonElement>) => void
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`flex h-7 w-7 items-center justify-center rounded-md text-[var(--v2-text-hint)] transition-colors hover:bg-[rgb(var(--surface-tertiary))] hover:text-[var(--v2-text-secondary)] ${focusRingInset}`}
    >
      {icon}
    </button>
  )
}
