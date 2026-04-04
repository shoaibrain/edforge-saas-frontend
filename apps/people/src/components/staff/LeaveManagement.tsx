/**
 * LeaveManagement Component
 *
 * Leave requests table with create/approve/reject/cancel actions.
 * Consumes existing backend endpoints (no new backend work).
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
  Clock,
  Calendar,
  CalendarCheck2,
  CalendarX2,
  Hourglass,
} from 'lucide-react'
import type { LeaveRequestResponseDto } from '@aibrains/shared-types'
import { useStaffLeaveRequests, useApproveLeave, useRejectLeave, useCancelLeave } from '../../hooks'
import { CreateLeaveModal } from './CreateLeaveModal'
import { formatDate } from '../../lib/utils'

// ============================================================================
// CONSTANTS
// ============================================================================

const LEAVE_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  approved: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  rejected: 'bg-red-500/10 text-red-600 dark:text-red-400',
  cancelled: 'bg-slate-500/10 text-slate-500 dark:text-slate-400',
  in_progress: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  completed: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
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

const LEAVE_TYPE_COLORS: Record<string, string> = {
  annual: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  sick: 'bg-red-500/10 text-red-600 dark:text-red-400',
  personal: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  bereavement: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
  maternity: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
  paternity: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
  family_medical: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  professional_development: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
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

  // Leave balance summary
  const leaveSummary = useMemo(() => {
    if (!requests || requests.length === 0) return null
    const approved = requests.filter((r) => r.status === 'approved' || r.status === 'completed' || r.status === 'in_progress')
    const pending = requests.filter((r) => r.status === 'pending')
    const totalUsed = approved.reduce((sum, r) => sum + (r.totalDays || 0), 0)
    const totalPending = pending.reduce((sum, r) => sum + (r.totalDays || 0), 0)
    return { totalUsed, totalPending, pendingCount: pending.length, totalRequests: requests.length }
  }, [requests])

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
          className="flex items-center gap-2 px-3.5 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Request Leave
        </button>
      </motion.div>

      {/* Leave Balance Summary */}
      {leaveSummary && (
        <motion.div variants={fadeInUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-[rgb(var(--surface-secondary))] rounded-xl border border-[rgb(var(--border-secondary))] p-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <CalendarDays className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-[rgb(var(--text-tertiary))]">Total Requests</p>
                <p className="text-lg font-bold text-[rgb(var(--text-primary))]">{leaveSummary.totalRequests}</p>
              </div>
            </div>
          </div>
          <div className="bg-[rgb(var(--surface-secondary))] rounded-xl border border-[rgb(var(--border-secondary))] p-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <CalendarCheck2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-[rgb(var(--text-tertiary))]">Days Used</p>
                <p className="text-lg font-bold text-[rgb(var(--text-primary))]">{leaveSummary.totalUsed}</p>
              </div>
            </div>
          </div>
          <div className="bg-[rgb(var(--surface-secondary))] rounded-xl border border-[rgb(var(--border-secondary))] p-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Hourglass className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-[rgb(var(--text-tertiary))]">Pending Requests</p>
                <p className="text-lg font-bold text-[rgb(var(--text-primary))]">{leaveSummary.pendingCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-[rgb(var(--surface-secondary))] rounded-xl border border-[rgb(var(--border-secondary))] p-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-red-500/10">
                <CalendarX2 className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-xs text-[rgb(var(--text-tertiary))]">Days Pending</p>
                <p className="text-lg font-bold text-[rgb(var(--text-primary))]">{leaveSummary.totalPending}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Leave Requests */}
      <motion.div variants={fadeInUp}>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse h-20 bg-[rgb(var(--surface-secondary))] rounded-xl" />
            ))}
          </div>
        ) : !requests || requests.length === 0 ? (
          <div className="text-center py-16 bg-[rgb(var(--surface-secondary))] rounded-xl border-2 border-dashed border-[rgb(var(--border-secondary))]">
            <CalendarDays className="w-12 h-12 mx-auto mb-4 text-[rgb(var(--text-tertiary))] opacity-40" />
            <h4 className="font-medium text-[rgb(var(--text-secondary))] mb-2">No Leave Requests</h4>
            <p className="text-sm text-[rgb(var(--text-tertiary))] max-w-sm mx-auto">
              No leave requests have been submitted yet. Click &quot;Request Leave&quot; to create one.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[rgb(var(--border-secondary))]">
            <table className="w-full">
              <thead>
                <tr className="bg-[rgb(var(--surface-tertiary))]">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[rgb(var(--text-tertiary))] uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[rgb(var(--text-tertiary))] uppercase tracking-wider">Dates</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[rgb(var(--text-tertiary))] uppercase tracking-wider">Duration</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[rgb(var(--text-tertiary))] uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[rgb(var(--text-tertiary))] uppercase tracking-wider">Reason</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-[rgb(var(--text-tertiary))] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgb(var(--border-secondary))]">
                {requests.map((request) => {
                  const isActionLoading = actionLoading === request.leaveId

                  return (
                    <tr
                      key={request.leaveId}
                      className="bg-[rgb(var(--surface-secondary))] hover:bg-[rgb(var(--surface-tertiary))] transition-colors"
                    >
                      {/* Type */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${LEAVE_TYPE_COLORS[request.leaveType] || 'bg-slate-500/10 text-slate-600'}`}>
                          {LEAVE_TYPE_LABELS[request.leaveType] || request.leaveType}
                        </span>
                      </td>

                      {/* Dates */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-sm text-[rgb(var(--text-secondary))]">
                          <Calendar className="w-3.5 h-3.5 text-[rgb(var(--text-tertiary))]" />
                          {formatDate(request.startDate)}
                          {request.startDate !== request.endDate && (
                            <>
                              <span className="text-[rgb(var(--text-tertiary))]">—</span>
                              {formatDate(request.endDate)}
                            </>
                          )}
                        </div>
                      </td>

                      {/* Duration */}
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-sm text-[rgb(var(--text-secondary))]">
                          <Clock className="w-3.5 h-3.5 text-[rgb(var(--text-tertiary))]" />
                          {formatDuration(request)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${LEAVE_STATUS_COLORS[request.status] || LEAVE_STATUS_COLORS.pending}`}>
                          {formatStatusLabel(request.status)}
                        </span>
                      </td>

                      {/* Reason */}
                      <td className="px-4 py-3">
                        <p className="text-sm text-[rgb(var(--text-tertiary))] max-w-[200px] truncate">
                          {request.reason || '—'}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        {isActionLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin text-[rgb(var(--text-tertiary))] inline-block" />
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            {request.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApprove(request.leaveId)}
                                  className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-[rgb(var(--text-tertiary))] hover:text-emerald-600 transition-colors"
                                  title="Approve"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleReject(request.leaveId)}
                                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-[rgb(var(--text-tertiary))] hover:text-red-600 transition-colors"
                                  title="Reject"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {(request.status === 'pending' || request.status === 'approved') && (
                              <button
                                onClick={() => handleCancel(request.leaveId)}
                                className="p-1.5 rounded-lg hover:bg-slate-500/10 text-[rgb(var(--text-tertiary))] hover:text-slate-600 transition-colors"
                                title="Cancel"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
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
