/**
 * TeacherTable Component
 *
 * DataTable for faculty directory with search and role / status facets.
 * Uses TanstackDataTable from @edforge/ui for table rendering,
 * sorting, pagination, density / column-visibility persistence, and
 * the prototype-matched toolbar.
 */

import { useMemo } from 'react'
import { Mail, Users, ShieldAlert, UserCog } from 'lucide-react'
import { toast } from 'sonner'
import {
  TanstackDataTable,
  createSelectColumn,
  type BulkAction,
  type ColumnDef,
  type FacetedFilterConfig,
} from '@edforge/ui'
import { useAcademicsI18n } from '../../lib/i18n'

// ============================================================================
// TYPES
// ============================================================================

interface StaffMember {
  staffId?: string
  userId?: string
  firstName: string
  lastSurname?: string
  lastName?: string
  email?: string
  role?: string
  employmentStatus?: string
  status?: string
}

interface TeacherTableProps {
  staff: StaffMember[]
  isLoading: boolean
  onSelect: (member: StaffMember) => void
}

// ============================================================================
// BADGE HELPERS
// ============================================================================

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    active: 'bg-[rgb(var(--state-success-bg)/0.18)] text-[rgb(var(--state-success-fg))] dark:bg-[rgb(var(--state-success-fg)/0.2)] ',
    on_leave: 'bg-[rgb(var(--state-warning-bg)/0.18)] text-amber-700 dark:bg-[rgb(var(--state-warning-fg))]/20 dark:text-amber-400',
    suspended: 'bg-[rgb(var(--state-danger-bg)/0.18)] text-[rgb(var(--state-danger-fg))] dark:bg-[rgb(var(--state-danger-fg)/0.2)] ',
    terminated: 'bg-[rgb(var(--background-tertiary))] text-[rgb(var(--text-secondary))] dark:bg-[rgb(var(--background-tertiary)/0.2)] ',
  }
  return styles[status] || 'bg-[rgb(var(--background-tertiary))] text-[rgb(var(--text-secondary))] dark:bg-[rgb(var(--background-tertiary)/0.2)] '
}

function getRoleBadge(role: string) {
  const styles: Record<string, string> = {
    teacher: 'bg-[rgb(var(--state-info-bg)/0.18)] text-[rgb(var(--state-info-fg))] dark:bg-[rgb(var(--state-info-fg))]/20 ',
    principal: 'bg-[rgb(var(--state-info-bg)/0.18)] text-[rgb(var(--state-info-fg))] dark:bg-[rgb(var(--state-info-fg))]/20 ',
    vice_principal: 'bg-[rgb(var(--state-info-bg)/0.18)] text-[rgb(var(--state-info-fg))] dark:bg-[rgb(var(--state-info-fg))]/20 ',
    counselor: 'bg-[rgb(var(--state-info-bg)/0.18)] text-[rgb(var(--text-secondary))] dark:bg-[rgb(var(--state-info-fg)/0.2)] ',
    admin_staff: 'bg-[rgb(var(--state-warning-bg)/0.18)] text-amber-700 dark:bg-[rgb(var(--state-warning-fg))]/20 dark:text-amber-400',
  }
  return styles[role] || 'bg-[rgb(var(--background-tertiary))] text-[rgb(var(--text-secondary))] dark:bg-[rgb(var(--background-tertiary)/0.2)] '
}

// ============================================================================
// COLUMN DEFINITIONS
// ============================================================================

export function TeacherTable({ staff, isLoading, onSelect }: TeacherTableProps) {
  const { t, dataTableLabels, enumLabel } = useAcademicsI18n()
  const columns: ColumnDef<StaffMember, unknown>[] = useMemo(
    () => [
      createSelectColumn<StaffMember>(),
      {
        accessorFn: (row) => `${row.firstName} ${row.lastSurname || row.lastName || ''}`,
        id: 'name',
        header: t('tables.teachers.columns.name'),
        cell: ({ getValue }) => (
          <span className="font-medium text-text-primary">
            {getValue<string>()}
          </span>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'email',
        header: t('tables.teachers.columns.email'),
        cell: ({ row }) => {
          const email = row.original.email
          return email ? (
            <span className="flex items-center gap-1.5 text-text-secondary">
              <Mail className="w-3.5 h-3.5 text-text-tertiary" />
              {email}
            </span>
          ) : (
            <span className="text-text-tertiary">&mdash;</span>
          )
        },
        enableSorting: true,
      },
      {
        accessorKey: 'role',
        header: t('tables.teachers.columns.role'),
        filterFn: 'arrIncludesSome',
        cell: ({ row }) => {
          const role = row.original.role
          return role ? (
            <span
              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getRoleBadge(role)}`}
            >
              {enumLabel('enums.staffRole', role)}
            </span>
          ) : (
            <span className="text-text-tertiary">&mdash;</span>
          )
        },
        enableSorting: true,
        meta: {
          facetLabelMap: (value: unknown) => enumLabel('enums.staffRole', String(value)),
        },
      },
      {
        accessorFn: (row) => row.employmentStatus || row.status || 'active',
        id: 'status',
        header: t('tables.teachers.columns.status'),
        filterFn: 'arrIncludesSome',
        cell: ({ getValue }) => {
          const status = getValue<string>()
          return (
            <span
              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusBadge(status)}`}
            >
              {enumLabel('enums.employmentStatus', status)}
            </span>
          )
        },
        enableSorting: true,
        meta: {
          facetLabelMap: (value: unknown) => enumLabel('enums.employmentStatus', String(value)),
        },
      },
    ],
    [enumLabel, t],
  )

  // Derive facet options from the loaded staff list — counts are computed
  // live inside the shared DataTable via getFacetedUniqueValues.
  const roleOptions = useMemo(() => {
    const set = new Set<string>()
    staff.forEach((m) => m.role && set.add(m.role))
    return Array.from(set).sort().map((value) => ({
      value,
      label: enumLabel('enums.staffRole', value),
    }))
  }, [staff, enumLabel])

  const statusOptions = useMemo(() => {
    const set = new Set<string>()
    staff.forEach((m) => {
      const s = m.employmentStatus || m.status
      if (s) set.add(s)
    })
    return Array.from(set).sort().map((value) => ({
      value,
      label: enumLabel('enums.employmentStatus', value),
    }))
  }, [staff, enumLabel])

  const facets = useMemo<FacetedFilterConfig[]>(
    () => [
      ...(roleOptions.length > 0
        ? [{ columnId: 'role', title: t('tables.teachers.columns.role'), options: roleOptions }]
        : []),
      ...(statusOptions.length > 0
        ? [{ columnId: 'status', title: t('tables.teachers.columns.status'), options: statusOptions }]
        : []),
    ],
    [roleOptions, statusOptions, t],
  )

  const bulkActions = useMemo<BulkAction<StaffMember>[]>(
    () => [
      {
        id: 'change-role',
        label: t('tables.teachers.actions.changeRole'),
        icon: <UserCog className="w-4 h-4" />,
        onRun: (rows) => toast.info(t('common.comingSoon', {
          action: t('tables.teachers.actions.changeRole'),
          countLabel: t('common.staff', { count: rows.length }),
        })),
      },
      {
        id: 'update-status',
        label: t('tables.teachers.actions.updateStatus'),
        icon: <ShieldAlert className="w-4 h-4" />,
        onRun: (rows) => toast.info(t('common.comingSoon', {
          action: t('tables.teachers.actions.updateStatus'),
          countLabel: t('common.staff', { count: rows.length }),
        })),
      },
    ],
    [t],
  )

  return (
    <TanstackDataTable<StaffMember>
      columns={columns}
      data={staff}
      getRowId={(row) => row.staffId || row.userId || row.email || ''}
      isLoading={isLoading}
      tableId="academics.teachers"
      enableSorting
      enableRowSelection
      enableColumnVisibility
      pagination={{ pageSize: 20 }}
      pageSizes={[10, 20, 50]}
      defaultSort={[{ id: 'name', desc: false }]}
      searchPlaceholder={t('tables.teachers.search')}
      facets={facets}
      bulkActions={bulkActions}
      exportOptions={{ filename: 'teachers', formats: ['csv'] }}
      onRowClick={onSelect}
      emptyState={{
        icon: <Users className="w-10 h-10 text-text-tertiary opacity-40" />,
        title: t('tables.teachers.empty.title'),
        description: t('tables.teachers.empty.description'),
      }}
      labels={dataTableLabels}
      maxHeight="calc(100vh - 13rem)"
    />
  )
}
