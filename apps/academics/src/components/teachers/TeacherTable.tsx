/**
 * TeacherTable Component
 *
 * DataTable for faculty directory with search and role filtering.
 */

import { useState } from 'react'
import {
  Search,
  Users,
  Mail,
  ChevronRight,
  X,
} from 'lucide-react'
import { useDebounce } from '../../hooks'

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
// COMPONENT
// ============================================================================

export function TeacherTable({ staff, isLoading, onSelect }: TeacherTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string | null>(null)
  const debouncedSearch = useDebounce(searchTerm, 300)

  // Client-side filtering
  const filtered = staff.filter((member) => {
    if (debouncedSearch) {
      const name = `${member.firstName} ${member.lastSurname || member.lastName || ''}`.toLowerCase()
      const email = (member.email || '').toLowerCase()
      const term = debouncedSearch.toLowerCase()
      if (!name.includes(term) && !email.includes(term)) return false
    }
    if (roleFilter && member.role !== roleFilter) return false
    return true
  })

  const roles = [...new Set(staff.map((m) => m.role).filter(Boolean))]

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-14 bg-surface-secondary rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2.5 bg-surface-secondary border border-border-secondary rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
        <select
          value={roleFilter ?? ''}
          onChange={(e) => setRoleFilter(e.target.value || null)}
          className="px-3 py-2.5 bg-surface-secondary border border-border-secondary rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        >
          <option value="">All Roles</option>
          {roles.map((r) => (
            <option key={r} value={r}>{(r || '').replace(/_/g, ' ')}</option>
          ))}
        </select>
        {roleFilter && (
          <button
            type="button"
            onClick={() => setRoleFilter(null)}
            className="flex items-center gap-1 px-3 py-2.5 text-sm text-text-secondary hover:text-text-primary bg-surface-secondary hover:bg-surface-hover rounded-lg transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
        <span className="text-xs text-text-tertiary ml-auto">
          {filtered.length} of {staff.length} staff
        </span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center">
          <Users className="w-10 h-10 mx-auto text-text-tertiary mb-3" />
          <h4 className="text-sm font-medium text-text-primary mb-1">
            No staff found
          </h4>
          <p className="text-xs text-text-tertiary">
            Try adjusting your search or filters.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border-secondary overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-secondary">
                <th className="px-4 py-3 text-left font-semibold text-text-primary">Name</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Email</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Role</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Status</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border-secondary">
              {filtered.map((member) => {
                const id = member.staffId || member.userId || member.email || ''
                const name = `${member.firstName} ${member.lastSurname || member.lastName || ''}`
                const status = member.employmentStatus || member.status || 'active'
                return (
                  <tr
                    key={id}
                    onClick={() => onSelect(member)}
                    className="hover:bg-surface-secondary/50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 font-medium text-text-primary">{name}</td>
                    <td className="px-4 py-3">
                      {member.email ? (
                        <span className="flex items-center gap-1.5 text-text-secondary">
                          <Mail className="w-3.5 h-3.5 text-text-tertiary" />
                          {member.email}
                        </span>
                      ) : (
                        <span className="text-text-tertiary">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {member.role ? (
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getRoleBadge(member.role)}`}>
                          {member.role.replace(/_/g, ' ')}
                        </span>
                      ) : (
                        <span className="text-text-tertiary">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusBadge(status)}`}>
                        {status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <ChevronRight className="w-4 h-4 text-text-tertiary" />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
