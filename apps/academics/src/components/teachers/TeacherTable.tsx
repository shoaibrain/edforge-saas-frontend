/**
 * TeacherTable Component
 *
 * DataTable for faculty directory with search and role filtering.
 * Uses TanstackDataTable from @edforge/ui for table rendering,
 * sorting, pagination, and built-in search.
 */

import { useState, useMemo } from 'react'
import { Mail, Users, X } from 'lucide-react'
import { TanstackDataTable, type ColumnDef } from '@edforge/ui'

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
    active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
    on_leave: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
    suspended: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
    terminated: 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400',
  }
  return styles[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400'
}

function getRoleBadge(role: string) {
  const styles: Record<string, string> = {
    teacher: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
    principal: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
    vice_principal: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400',
    counselor: 'bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-400',
    admin_staff: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
  }
  return styles[role] || 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400'
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
  },
  {
    accessorFn: (row) => row.employmentStatus || row.status || 'active',
    id: 'status',
    header: 'Status',
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
  },
]

// ============================================================================
// COMPONENT
// ============================================================================

export function TeacherTable({ staff, isLoading, onSelect }: TeacherTableProps) {
  const [roleFilter, setRoleFilter] = useState<string | null>(null)

  // Derive unique roles from the full staff list
  const roles = useMemo(
    () => [...new Set(staff.map((m) => m.role).filter(Boolean))] as string[],
    [staff]
  )

  // Pre-filter by role before handing data to the DataTable
  // (search / globalFilter is handled internally by TanstackDataTable)
  const filteredByRole = useMemo(
    () => (roleFilter ? staff.filter((m) => m.role === roleFilter) : staff),
    [staff, roleFilter]
  )

  return (
    <TanstackDataTable<StaffMember>
      columns={columns}
      data={filteredByRole}
      getRowId={(row) => row.staffId || row.userId || row.email || ''}
      isLoading={isLoading}
      enableSorting={true}
      pagination={{ pageSize: 20 }}
      searchPlaceholder="Search by name or email..."
      onRowClick={onSelect}
      emptyState={{
        icon: <Users className="w-10 h-10 text-text-tertiary opacity-40" />,
        title: 'No staff found',
        description: 'Try adjusting your search or filters.',
      }}
      maxHeight="calc(100vh - 13rem)"
      toolbarExtra={
        <div className="flex items-center gap-2">
          <select
            value={roleFilter ?? ''}
            onChange={(e) => setRoleFilter(e.target.value || null)}
            className="px-3 py-2 text-sm border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--surface-primary))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="">All Roles</option>
            {roles.map((r) => (
              <option key={r} value={r}>
                {r.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
          {roleFilter && (
            <button
              type="button"
              onClick={() => setRoleFilter(null)}
              className="flex items-center gap-1 px-3 py-2 text-sm text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] bg-[rgb(var(--surface-secondary))] hover:bg-[rgb(var(--surface-tertiary))] rounded-lg transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>
      }
    />
  )
}
