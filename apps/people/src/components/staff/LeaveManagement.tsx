/**
 * LeaveManagement Component
 *
 * Leave requests table with create/approve/reject/cancel actions.
 * Consumes existing backend endpoints (no new backend work). Per-row
 * actions only — no bulk affordances yet (a bulk approve/reject
 * backend doesn't exist).
 */

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  CalendarDays,
  Plus,
  Check,
  X,
  Ban,
  Loader2,
  CalendarCheck2,
  CalendarX2,
  Hourglass,
} from 'lucide-react'
import type { LeaveRequestResponseDto } from '@aibrains/shared-types'
import {
  StatusBadge,
  TanstackDataTable,
  type ColumnDef,
  type FacetedFilterConfig,
  type StatusTone,
} from '@edforge/ui'
import { useStaffLeaveRequests, useApproveLeave, useRejectLeave, useCancelLeave } from '../../hooks'
import { CreateLeaveModal } from './CreateLeaveModal'
import { formatDate } from '../../lib/utils'

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Domain status → semantic StatusBadge tone. Keeps the leave-specific
 * vocabulary in one place; visual styling is delegated to the shared
 * `<StatusBadge>` (state-token-backed), so dark mode + future token
 * shifts come for free.
 */
function leaveStatusTone(status: string): StatusTone {
  switch (status) {
    case 'approved':
    case 'completed':
      return 'success'
    case 'rejected':
      return 'danger'
    case 'pending':
      return 'warning'
    case 'in_progress':
      return 'info'
    case 'cancelled':
    default:
      return 'neutral'
  }
}

const LEAVE_TYPE_LABELS: Record<string, string> = {
  annual: 'Annual',
  sick: 'Sick',
  personal: 'Personal',
  bereavement: 'Bereavement',
  maternity: 'Maternity',
  paternity: 'Paternity',
  family_medical: 'FMLA',
  jury_duty: 'Jury Duty',
  military: 'Military',
  professional_development: 'Prof. Dev.',
  sabbatical: 'Sabbatical',
  unpaid: 'Unpaid',
  other: 'Other',
}

/**
 * Leave type → tone. Most types are neutral; the medical/family bucket
 * is `info` so it scans distinctly without leaning on danger red for
 * benign categories.
 */
function leaveTypeTone(type: string): StatusTone {
  switch (type) {
    case 'sick':
    case 'maternity':
    case 'paternity':
      return 'info'
    case 'family_medical':
      return 'warning'
    default:
      return 'neutral'
  }
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
}

const staggerChildren = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

// ============================================================================
// HELPERS
// ============================================================================

function formatDuration(request: LeaveRequestResponseDto): string {
  if (request.totalDays === 1) return '1 day'
  if (request.totalDays) return `${request.totalDays} days`
  if (request.totalHours) return `${request.totalHours} hours`
  return '—'
}

function formatStatusLabel(status: string): string {
  return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

// ============================================================================
// COMPONENT
// ============================================================================

export function LeaveManagement({
  staffId,
  staffName,
}: {
  staffId: string
  staffName: string
}) {
  const { data: requests, isLoading } = useStaffLeaveRequests(staffId)
  const approveLeave = useApproveLeave()
  const rejectLeave = useRejectLeave()
  const cancelLeave = useCancelLeave()
  const [modalOpen, setModalOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const rows: LeaveRequestResponseDto[] = requests ?? []

  // Leave balance summary
  const leaveSummary = useMemo(() => {
    if (rows.length === 0) return null
    const approved = rows.filter((r) => r.status === 'approved' || r.status === 'completed' || r.status === 'in_progress')
    const pending = rows.filter((r) => r.status === 'pending')
    const totalUsed = approved.reduce((sum, r) => sum + (r.totalDays || 0), 0)
    const totalPending = pending.reduce((sum, r) => sum + (r.totalDays || 0), 0)
    return { totalUsed, totalPending, pendingCount: pending.length, totalRequests: rows.length }
  }, [rows])

  const handleApprove = async (leaveId: string) => {
    setActionLoading(leaveId)
    try {
      await approveLeave.mutateAsync({ staffId, leaveId, data: {} })
      toast.success('Leave request approved')
    } catch {
      toast.error('Failed to approve leave request')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (leaveId: string) => {
    const reason = window.prompt('Please enter a rejection reason:')
    if (!reason) return

    setActionLoading(leaveId)
    try {
      await rejectLeave.mutateAsync({ staffId, leaveId, data: { rejectionReason: reason } })
      toast.success('Leave request rejected')
    } catch {
      toast.error('Failed to reject leave request')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancel = async (leaveId: string) => {
    const reason = window.prompt('Please enter a cancellation reason:')
    if (!reason) return

    setActionLoading(leaveId)
    try {
      await cancelLeave.mutateAsync({ staffId, leaveId, data: { cancellationReason: reason } })
      toast.success('Leave request cancelled')
    } catch {
      toast.error('Failed to cancel leave request')
    } finally {
      setActionLoading(null)
    }
  }

  const statusOptions = useMemo(() => {
    const seen = new Set<string>()
    for (const r of rows) seen.add(r.status)
    return Array.from(seen)
      .sort()
      .map((s) => ({ value: s, label: formatStatusLabel(s) }))
  }, [rows])

  const typeOptions = useMemo(() => {
    const seen = new Set<string>()
    for (const r of rows) seen.add(r.leaveType)
    return Array.from(seen)
      .sort()
      .map((t) => ({ value: t, label: LEAVE_TYPE_LABELS[t] ?? t }))
  }, [rows])

  const facets = useMemo<FacetedFilterConfig[]>(
    () => [
      ...(statusOptions.length > 0
        ? [{ columnId: 'status', title: 'Status', options: statusOptions }]
        : []),
      ...(typeOptions.length > 0
        ? [{ columnId: 'leaveType', title: 'Type', options: typeOptions }]
        : []),
    ],
    [statusOptions, typeOptions],
  )

  const columns: ColumnDef<LeaveRequestResponseDto, unknown>[] = useMemo(
    () => [
      {
        id: 'leaveType',
        accessorKey: 'leaveType',
        header: 'Type',
        cell: ({ row }) => {
          const t = row.original.leaveType
          return (
            <StatusBadge tone={leaveTypeTone(t)} size="sm">
              {LEAVE_TYPE_LABELS[t] ?? t}
            </StatusBadge>
          )
        },
        filterFn: (row, _id, value) => {
          if (!Array.isArray(value) || value.length === 0) return true
          return value.includes(row.original.leaveType)
        },
      },
      {
        id: 'dates',
        accessorFn: (r) => r.startDate,
        header: 'Dates',
        cell: ({ row }) => {
          const r = row.original
          return (
            <span className="text-xs text-[rgb(var(--text-secondary))] tabular-nums">
              {formatDate(r.startDate)}
              {r.startDate !== r.endDate && <> — {formatDate(r.endDate)}</>}
            </span>
          )
        },
        sortingFn: (a, b) => new Date(a.original.startDate).getTime() - new Date(b.original.startDate).getTime(),
      },
      {
        id: 'duration',
        accessorFn: (r) => r.totalDays ?? r.totalHours ?? 0,
        header: 'Duration',
        cell: ({ row }) => (
          <span className="text-xs text-[rgb(var(--text-secondary))] tabular-nums">
            {formatDuration(row.original)}
          </span>
        ),
      },
      {
        id: 'status',
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const s = row.original.status
          return (
            <StatusBadge tone={leaveStatusTone(s)} size="sm" dot>
              {formatStatusLabel(s)}
            </StatusBadge>
          )
        },
        filterFn: (row, _id, value) => {
          if (!Array.isArray(value) || value.length === 0) return true
          return value.includes(row.original.status)
        },
      },
      {
        id: 'reason',
        accessorKey: 'reason',
        header: 'Reason',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-xs text-[rgb(var(--text-tertiary))] truncate inline-block max-w-[28ch]">
            {row.original.reason || '—'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        enableSorting: false,
        cell: ({ row }) => {
          const r = row.original
          if (actionLoading === r.leaveId) {
            return (
              <span className="inline-flex justify-end w-full">
                <Loader2 className="w-4 h-4 animate-spin text-[rgb(var(--text-tertiary))]" />
              </span>
            )
          }
          return (
            <div className="flex items-center justify-end gap-1">
              {r.status === 'pending' && (
                <>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); void handleApprove(r.leaveId) }}
                    className="p-1.5 rounded-md hover:bg-[rgb(var(--state-success-bg)/0.18)] text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--state-success-fg))] transition-colors"
                    title="Approve"
                    aria-label="Approve"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); void handleReject(r.leaveId) }}
                    className="p-1.5 rounded-md hover:bg-[rgb(var(--state-danger-bg)/0.18)] text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--state-danger-fg))] transition-colors"
                    title="Reject"
                    aria-label="Reject"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              )}
              {(r.status === 'pending' || r.status === 'approved') && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); void handleCancel(r.leaveId) }}
                  className="p-1.5 rounded-md hover:bg-[rgb(var(--background-tertiary))] text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))] transition-colors"
                  title="Cancel"
                  aria-label="Cancel"
                >
                  <Ban className="w-4 h-4" />
                </button>
              )}
            </div>
          )
        },
      },
    ],
    [actionLoading],
  )

  return (
    <motion.div
      variants={staggerChildren}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))]">Leave Management</h3>
          <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
            View and manage leave requests
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-[rgb(var(--action-primary-bg))] text-[rgb(var(--action-primary-fg))] rounded-lg hover:bg-[rgb(var(--action-primary-bg-hover))] transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Request Leave
        </button>
      </motion.div>

      {/* Leave Balance Summary */}
      {leaveSummary && (
        <motion.div variants={fadeInUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-[rgb(var(--background-secondary))] rounded-xl border border-[rgb(var(--border-secondary))] p-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-[rgb(var(--state-info-bg)/0.18)]">
                <CalendarDays className="w-4 h-4 text-[rgb(var(--state-info-fg))]" />
              </div>
              <div>
                <p className="text-xs text-[rgb(var(--text-tertiary))]">Total Requests</p>
                <p className="text-lg font-bold text-[rgb(var(--text-primary))]">{leaveSummary.totalRequests}</p>
              </div>
            </div>
          </div>
          <div className="bg-[rgb(var(--background-secondary))] rounded-xl border border-[rgb(var(--border-secondary))] p-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-[rgb(var(--state-success-bg)/0.18)]">
                <CalendarCheck2 className="w-4 h-4 text-[rgb(var(--state-success-fg))]" />
              </div>
              <div>
                <p className="text-xs text-[rgb(var(--text-tertiary))]">Days Used</p>
                <p className="text-lg font-bold text-[rgb(var(--text-primary))]">{leaveSummary.totalUsed}</p>
              </div>
            </div>
          </div>
          <div className="bg-[rgb(var(--background-secondary))] rounded-xl border border-[rgb(var(--border-secondary))] p-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-[rgb(var(--state-warning-bg)/0.18)]">
                <Hourglass className="w-4 h-4 text-[rgb(var(--state-warning-fg))]" />
              </div>
              <div>
                <p className="text-xs text-[rgb(var(--text-tertiary))]">Pending Requests</p>
                <p className="text-lg font-bold text-[rgb(var(--text-primary))]">{leaveSummary.pendingCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-[rgb(var(--background-secondary))] rounded-xl border border-[rgb(var(--border-secondary))] p-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-[rgb(var(--state-danger-bg)/0.18)]">
                <CalendarX2 className="w-4 h-4 text-[rgb(var(--state-danger-fg))]" />
              </div>
              <div>
                <p className="text-xs text-[rgb(var(--text-tertiary))]">Days Pending</p>
                <p className="text-lg font-bold text-[rgb(var(--text-primary))]">{leaveSummary.totalPending}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Leave Requests Table */}
      <motion.div variants={fadeInUp}>
        <TanstackDataTable<LeaveRequestResponseDto>
          columns={columns}
          data={rows}
          getRowId={(row) => row.leaveId}
          isLoading={isLoading}
          tableId="people.staff.leave"
          enableSorting
          enableColumnVisibility
          pagination={{ pageSize: 10 }}
          pageSizes={[10, 20, 50]}
          defaultSort={[{ id: 'dates', desc: true }]}
          searchPlaceholder="Search reason…"
          facets={facets}
          exportOptions={{ filename: `leave-${staffId}`, formats: ['csv'] }}
          emptyState={{
            icon: <CalendarDays className="w-10 h-10" />,
            title: 'No leave requests',
            description: 'No leave requests have been submitted yet. Click "Request Leave" to create one.',
          }}
        />
      </motion.div>

      {/* Create Leave Modal */}
      <CreateLeaveModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        staffId={staffId}
        staffName={staffName}
      />
    </motion.div>
  )
}
