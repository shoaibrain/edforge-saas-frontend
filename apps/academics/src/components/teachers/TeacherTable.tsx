/**
 * TeacherTable Component
 *
 * DataTable for faculty directory with search and role / status facets.
 * Uses TanstackDataTable from @edforge/ui for table rendering,
 * sorting, pagination, density / column-visibility persistence, and
 * the prototype-matched toolbar.
 */

import { useMemo } from 'react'
import { Mail, Users } from 'lucide-react'
import {
  TanstackDataTable,
  type ColumnDef,
  type FacetedFilterConfig,
} from '@edforge/ui'

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

function humanizeEnum(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

// ============================================================================
// COLUMN DEFINITIONS
// ============================================================================

const columns: ColumnDef<StaffMember, unknown>[] = [
  {
    accessorFn: (row) => `${row.firstName} ${row.lastSurname || row.lastName || ''}`,
    id: 'name',
    header: 'Name',
    cell: ({ getValue }) => (
      <span className="font-medium text-text-primary">
        {getValue<string>()}
      </span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: 'email',
    header: 'Email',
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
    header: 'Role',
    filterFn: 'arrIncludesSome',
    cell: ({ row }) => {
      const role = row.original.role
      return role ? (
        <span
          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getRoleBadge(role)}`}
        >
          {role.replace(/_/g, ' ')}
        </span>
      ) : (
        <span className="text-text-tertiary">&mdash;</span>
      )
    },
    enableSorting: true,
    meta: {
      facetLabelMap: (value: unknown) => humanizeEnum(String(value)),
    },
  },
  {
    accessorFn: (row) => row.employmentStatus || row.status || 'active',
    id: 'status',
    header: 'Status',
    filterFn: 'arrIncludesSome',
    cell: ({ getValue }) => {
      const status = getValue<string>()
      return (
        <span
          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusBadge(status)}`}
        >
          {status.replace(/_/g, ' ')}
        </span>
      )
    },
    enableSorting: true,
    meta: {
      facetLabelMap: (value: unknown) => humanizeEnum(String(value)),
    },
  },
]

// ============================================================================
// COMPONENT
// ============================================================================

export function TeacherTable({ staff, isLoading, onSelect }: TeacherTableProps) {
  // Derive facet options from the loaded staff list — counts are computed
  // live inside the shared DataTable via getFacetedUniqueValues.
  const roleOptions = useMemo(() => {
    const set = new Set<string>()
    staff.forEach((m) => m.role && set.add(m.role))
    return Array.from(set).sort().map((value) => ({ value, label: humanizeEnum(value) }))
  }, [staff])

  const statusOptions = useMemo(() => {
    const set = new Set<string>()
    staff.forEach((m) => {
      const s = m.employmentStatus || m.status
      if (s) set.add(s)
    })
    return Array.from(set).sort().map((value) => ({ value, label: humanizeEnum(value) }))
  }, [staff])

  const facets = useMemo<FacetedFilterConfig[]>(
    () => [
      ...(roleOptions.length > 0
        ? [{ columnId: 'role', title: 'Role', options: roleOptions }]
        : []),
      ...(statusOptions.length > 0
        ? [{ columnId: 'status', title: 'Status', options: statusOptions }]
        : []),
    ],
    [roleOptions, statusOptions],
  )

  // Row selection + bulk actions intentionally omitted — the staff
  // bulk endpoints (#226 change role, #228 update status) aren't built
  // yet. Re-add `enableRowSelection` + a real `bulkActions` array once
  // either backend slice lands; until then the table stays chrome-only.

  return (
    <TanstackDataTable<StaffMember>
      columns={columns}
      data={staff}
      getRowId={(row) => row.staffId || row.userId || row.email || ''}
      isLoading={isLoading}
      tableId="academics.teachers"
      enableSorting
      enableColumnVisibility
      pagination={{ pageSize: 20 }}
      pageSizes={[10, 20, 50]}
      defaultSort={[{ id: 'name', desc: false }]}
      searchPlaceholder="Search by name or email…"
      facets={facets}
      exportOptions={{ filename: 'teachers', formats: ['csv'] }}
      onRowClick={onSelect}
      emptyState={{
        icon: <Users className="w-10 h-10 text-text-tertiary opacity-40" />,
        title: 'No staff found',
        description: 'Try adjusting your search or filters.',
      }}
      maxHeight="calc(100vh - 13rem)"
    />
  )
}
