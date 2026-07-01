/**
 * StaffTable Component — V2
 *
 * Displays a paginated table of staff with V2 styling.
 * DiceBear avatars, V2 role chips, access chips, status chips.
 * Row click opens a quick-info drawer (managed by parent).
 */

import { useMemo, type MouseEvent, type ReactNode } from 'react'
import { UsersRound, Eye, Pencil, MoreVertical } from 'lucide-react'
import { AnimatedIcon } from '@edforge/ui/motion'
import { useTranslation } from '@edforge/i18n'
import { focusRingInset, IdentityCell, StatusBadge, TanstackDataTable, type ColumnDef, type StatusTone } from '@edforge/ui'
import type { StaffResponseDto } from '@aibrains/shared-types'
import { StaffRoleChip } from './StaffRoleChip'
import { getStatusI18nKey } from './StaffStatusBadge'
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

const EMPLOYMENT_TONE: Record<string, StatusTone> = {
  active: 'neutral',
  on_leave: 'warning',
  suspended: 'warning',
  terminated: 'danger',
  retired: 'neutral',
  resigned: 'neutral',
}

function getEmploymentLabel(status: string | undefined, t: ReturnType<typeof useTranslation>['t']): string {
  if (!status) return t('employmentTypes.fullTime')
  return t(`employmentStatus.${getStatusI18nKey(status)}`, { defaultValue: status.replace('_', ' ') })
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
          const empTone = EMPLOYMENT_TONE[s.employmentStatus] ?? 'neutral'
          return (
            <IdentityCell
              name={`${s.firstName} ${s.lastSurname}`}
              avatarSrc={getStaffAvatar(s.staffId)}
              secondary={s.email}
              trailing={<StatusBadge tone={empTone}>{getEmploymentLabel(s.employmentStatus, t)}</StatusBadge>}
            />
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
            <StatusBadge tone={isActive ? 'success' : 'neutral'} dot>
              {status ? t(`employmentStatus.${getStatusI18nKey(status)}`, { defaultValue: status.replace('_', ' ') }) : t('common.unknown')}
            </StatusBadge>
          )
        },
      },
      {
        accessorKey: 'hireDate',
        header: t('tableHeaders.hired'),
        size: 120,
        cell: ({ row }) => (
          <span className="text-xs text-[rgb(var(--text-tertiary))] tabular-nums">
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
            className={`text-xs ${row.original.departmentName ? 'text-[rgb(var(--text-tertiary))]' : 'text-[rgb(var(--text-disabled))]'}`}
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
              title={t('actions.view')}
              onClick={(e) => {
                e.stopPropagation()
                onViewStaff?.(row.original)
              }}
            />
            <ActionBtn
              icon={<AnimatedIcon name="edit" icon={Pencil} size={14} applyAccent={false} />}
              title={t('actions.edit')}
              onClick={(e) => e.stopPropagation()}
            />
            <ActionBtn
              icon={<AnimatedIcon name="more" icon={MoreVertical} size={14} applyAccent={false} />}
              title={t('actions.more')}
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
      tableId="people.staff"
      enableSorting={true}
      pagination={{ pageSize: 20 }}
      maxHeight="calc(100vh - 22rem)"
      emptyState={{
        icon: <UsersRound className="w-10 h-10" />,
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
      className={`ef-motion flex h-7 w-7 items-center justify-center rounded-md text-[rgb(var(--text-tertiary))] transition-colors hover:bg-[rgb(var(--background-tertiary))] hover:text-[rgb(var(--text-secondary))] ${focusRingInset}`}
    >
      {icon}
    </button>
  )
}
