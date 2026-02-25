/**
 * EnrollmentTable Component
 *
 * DataTable for enrollment records with search, filters, and actions.
 */

import { useState } from 'react'
import {
  Search,
  MoreHorizontal,
  UserMinus,
  ArrowRightLeft,
  Users,
  X,
} from 'lucide-react'
import type { EnrollmentResponseDto } from '../../services/academics.service'
import { useDebounce } from '../../hooks'

// ============================================================================
// TYPES
// ============================================================================

interface EnrollmentTableProps {
  enrollments: EnrollmentResponseDto[]
  isLoading: boolean
  hasMore?: boolean
  onLoadMore?: () => void
  searchTerm: string
  onSearchChange: (term: string) => void
  gradeLevel: string | null
  onGradeLevelChange: (level: string | null) => void
  statusFilter: string | null
  onStatusChange: (status: string | null) => void
  onWithdraw?: (enrollment: EnrollmentResponseDto) => void
  onTransfer?: (enrollment: EnrollmentResponseDto) => void
}

const gradeLevels = [
  'Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12',
]

const statusOptions = [
  { value: 'enrolled', label: 'Enrolled' },
  { value: 'pending', label: 'Pending' },
  { value: 'withdrawn', label: 'Withdrawn' },
  { value: 'transferred', label: 'Transferred' },
  { value: 'graduated', label: 'Graduated' },
]

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    enrolled: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
    active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
    withdrawn: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
    transferred: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
    graduated: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
  }
  return styles[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400'
}

// ============================================================================
// ACTION MENU
// ============================================================================

function ActionMenu({
  enrollment,
  onWithdraw,
  onTransfer,
}: {
  enrollment: EnrollmentResponseDto
  onWithdraw: () => void
  onTransfer: () => void
}) {
  const [open, setOpen] = useState(false)
  const isActive = enrollment.status === 'enrolled' || enrollment.status === 'active' || enrollment.status === 'pending'

  if (!isActive) return null

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-md text-text-tertiary hover:text-text-primary hover:bg-surface-hover transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-44 bg-surface-primary border border-border-secondary rounded-lg shadow-lg py-1">
            <button
              type="button"
              onClick={() => { onWithdraw(); setOpen(false) }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-primary hover:bg-surface-secondary transition-colors"
            >
              <UserMinus className="w-4 h-4 text-red-500" />
              Withdraw
            </button>
            <button
              type="button"
              onClick={() => { onTransfer(); setOpen(false) }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-primary hover:bg-surface-secondary transition-colors"
            >
              <ArrowRightLeft className="w-4 h-4 text-blue-500" />
              Transfer
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ============================================================================
// COMPONENT
// ============================================================================

export function EnrollmentTable({
  enrollments,
  isLoading,
  hasMore,
  onLoadMore,
  searchTerm,
  onSearchChange,
  gradeLevel,
  onGradeLevelChange,
  statusFilter,
  onStatusChange,
  onWithdraw,
  onTransfer,
}: EnrollmentTableProps) {
  // Client-side search filter
  const debouncedSearch = useDebounce(searchTerm, 300)
  const filtered = enrollments.filter((e) => {
    if (debouncedSearch) {
      const term = debouncedSearch.toLowerCase()
      const name = `${(e as Record<string, unknown>).studentName || ''}`.toLowerCase()
      if (!name.includes(term) && !e.studentId.toLowerCase().includes(term)) return false
    }
    return true
  })

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search students..."
            className="w-full pl-10 pr-4 py-2.5 bg-surface-secondary border border-border-secondary rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
        <select
          value={gradeLevel ?? ''}
          onChange={(e) => onGradeLevelChange(e.target.value || null)}
          className="px-3 py-2.5 bg-surface-secondary border border-border-secondary rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        >
          <option value="">All Grades</option>
          {gradeLevels.map((g) => (
            <option key={g} value={g}>Grade {g}</option>
          ))}
        </select>
        <select
          value={statusFilter ?? ''}
          onChange={(e) => onStatusChange(e.target.value || null)}
          className="px-3 py-2.5 bg-surface-secondary border border-border-secondary rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        >
          <option value="">All Status</option>
          {statusOptions.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        {(gradeLevel || statusFilter) && (
          <button
            type="button"
            onClick={() => { onGradeLevelChange(null); onStatusChange(null) }}
            className="flex items-center gap-1 px-3 py-2.5 text-sm text-text-secondary hover:text-text-primary bg-surface-secondary hover:bg-surface-hover rounded-lg transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 bg-surface-secondary rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center">
          <Users className="w-10 h-10 mx-auto text-text-tertiary mb-3" />
          <h4 className="text-sm font-medium text-text-primary mb-1">
            No enrollments found
          </h4>
          <p className="text-xs text-text-tertiary">
            Try adjusting your filters or search term.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border-secondary overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-secondary">
                <th className="px-4 py-3 text-left font-semibold text-text-primary">Student</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Grade Level</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Status</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Entry Date</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Exit Date</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Type</th>
                <th className="px-4 py-3 w-12" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border-secondary">
              {filtered.map((enrollment) => (
                <tr key={`${enrollment.studentId}-${enrollment.schoolId}`} className="hover:bg-surface-secondary/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-text-primary">
                    {(enrollment as Record<string, unknown>).studentName as string || enrollment.studentId.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{enrollment.gradeLevel}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(enrollment.status)}`}>
                      {enrollment.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {(enrollment.entryDate || enrollment.enrollmentDate) ? new Date(enrollment.entryDate || enrollment.enrollmentDate!).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {(enrollment.exitWithdrawDate || enrollment.withdrawalDate) ? new Date(enrollment.exitWithdrawDate || enrollment.withdrawalDate!).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-text-secondary capitalize">
                    {enrollment.enrollmentType || '—'}
                  </td>
                  <td className="px-4 py-3">
                    {(onWithdraw || onTransfer) && <ActionMenu
                      enrollment={enrollment}
                      onWithdraw={() => onWithdraw?.(enrollment)}
                      onTransfer={() => onTransfer?.(enrollment)}
                    />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {hasMore && onLoadMore && (
            <div className="px-4 py-3 text-center border-t border-border-secondary">
              <button
                type="button"
                onClick={onLoadMore}
                className="text-sm text-teal-600 hover:text-teal-700 font-medium"
              >
                Load more
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
