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
import { DataTable, type Column } from '../ui'
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
  hasMore?: boolean
  isFetchingMore?: boolean
  onLoadMore?: () => void
  onAddStaff?: () => void
  onViewStaff?: (staff: StaffResponseDto) => void
}

// ============================================================================
// STAFF TABLE COMPONENT
// ============================================================================

export function StaffTable({
  staff,
  isLoading = false,
  hasMore = false,
  isFetchingMore = false,
  onLoadMore,
  onAddStaff,
  onViewStaff,
}: StaffTableProps) {
  const { t } = useTranslation('people')

  const columns: Column<StaffResponseDto>[] = useMemo(
    () => [
      {
        key: 'name',
        header: t('tableHeaders.staff'),
        sortable: true,
        width: '280px',
        render: (s) => (
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
        ),
      },
      {
        key: 'role',
        header: t('tableHeaders.role'),
        sortable: true,
        width: '140px',
        render: (s) => <StaffRoleBadge role={s.role} />,
      },
      {
        key: 'employmentStatus',
        header: t('tableHeaders.status'),
        sortable: true,
        width: '120px',
        render: (s) => <StaffStatusBadge status={s.employmentStatus} />,
      },
      {
        key: 'hireDate',
        header: t('tableHeaders.hired'),
        sortable: true,
        width: '120px',
        render: (s) => (
          <span className="text-text-secondary">{formatDate(s.hireDate)}</span>
        ),
      },
      {
        key: 'department',
        header: t('tableHeaders.department'),
        width: '140px',
        render: (s) => (
          <span className="text-text-secondary text-sm">
            {s.departmentName || '—'}
          </span>
        ),
      },
      {
        key: 'systemAccess',
        header: t('tableHeaders.systemAccess'),
        width: '130px',
        render: (s) =>
          s.userId ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
              <Key className="w-3 h-3" />
              {t('systemAccess.active')}
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 dark:bg-slate-500/20 dark:text-slate-400">
              {t('systemAccess.noAccess')}
            </span>
          ),
      },
    ],
    [t],
  )

  return (
    <DataTable
      columns={columns}
      data={staff}
      keyExtractor={(s) => s.staffId}
      isLoading={isLoading}
      skeletonRows={8}
      emptyState={{
        icon: <UsersRound className="w-12 h-12" />,
        title: t('empty.noStaff'),
        description: t('empty.getStarted'),
        action: onAddStaff
          ? { label: t('staffDirectory.addStaff'), onClick: onAddStaff }
          : undefined,
      }}
      hasMore={hasMore}
      isFetchingMore={isFetchingMore}
      onLoadMore={onLoadMore}
      onRowClick={onViewStaff}
    />
  )
}
