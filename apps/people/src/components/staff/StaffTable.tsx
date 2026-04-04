/**
 * StaffTable Component — V2
 *
 * Displays a paginated table of staff with V2 styling.
 * DiceBear avatars, V2 role chips, access chips, status chips.
 * Row click opens a quick-info drawer (managed by parent).
 */

import { useMemo } from 'react'
import { UsersRound, Eye, Pencil, MoreVertical } from 'lucide-react'
import { useTranslation } from '@edforge/i18n'
import { TanstackDataTable, type ColumnDef } from '@edforge/ui'
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

const EMPLOYMENT_STYLES: Record<string, { bg: string; color: string }> = {
  active: { bg: 'rgba(239,159,39,0.10)', color: '#EF9F27' },
  on_leave: { bg: 'rgba(239,159,39,0.10)', color: '#EF9F27' },
  suspended: { bg: 'rgba(226,75,74,0.10)', color: '#E24B4A' },
  terminated: { bg: 'rgba(226,75,74,0.10)', color: '#E24B4A' },
  retired: { bg: 'rgba(255,255,255,0.06)', color: 'var(--v2-text-hint, #4a5068)' },
  resigned: { bg: 'rgba(255,255,255,0.06)', color: 'var(--v2-text-hint, #4a5068)' },
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img
                src={getStaffAvatar(s.staffId)}
                alt={`${s.firstName} ${s.lastSurname}`}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  flexShrink: 0,
                  objectFit: 'cover',
                }}
                loading="lazy"
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: 'var(--v2-text-primary, #e8eaf0)',
                    }}
                  >
                    {s.firstName} {s.lastSurname}
                  </span>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 500,
                      padding: '1px 5px',
                      borderRadius: 4,
                      background: empStyle.bg,
                      color: empStyle.color,
                    }}
                  >
                    {getEmploymentLabel(s.employmentStatus)}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 10,
                    color: 'var(--v2-text-ghost, #2a3045)',
                  }}
                >
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
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 10,
                fontWeight: 500,
                padding: '2px 8px',
                borderRadius: 7,
                whiteSpace: 'nowrap',
                background: isActive ? 'rgba(29,158,117,0.10)' : 'rgba(255,255,255,0.05)',
                color: isActive ? '#1D9E75' : 'var(--v2-text-hint, #4a5068)',
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: isActive ? '#1D9E75' : 'var(--v2-text-hint, #4a5068)',
                  flexShrink: 0,
                }}
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
          <span style={{ fontSize: 11, color: 'var(--v2-text-muted, #7a8099)' }}>
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
            style={{
              fontSize: 11,
              color: row.original.departmentName
                ? 'var(--v2-text-muted, #7a8099)'
                : 'var(--v2-text-ghost, #2a3045)',
            }}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
            <ActionBtn
              icon={<Eye style={{ width: 13, height: 13 }} />}
              title="View"
              onClick={(e) => {
                e.stopPropagation()
                onViewStaff?.(row.original)
              }}
            />
            <ActionBtn
              icon={<Pencil style={{ width: 13, height: 13 }} />}
              title="Edit"
              onClick={(e) => e.stopPropagation()}
            />
            <ActionBtn
              icon={<MoreVertical style={{ width: 13, height: 13 }} />}
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
      maxHeight="calc(100vh - 13rem)"
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
  icon: React.ReactNode
  title: string
  onClick: (e: React.MouseEvent) => void
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      style={{
        width: 26,
        height: 26,
        borderRadius: 6,
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--v2-text-hint, #4a5068)',
        transition: 'all 0.12s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
        e.currentTarget.style.color = 'var(--v2-text-secondary, #c8ccd8)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.color = 'var(--v2-text-hint, #4a5068)'
      }}
    >
      {icon}
    </button>
  )
}
