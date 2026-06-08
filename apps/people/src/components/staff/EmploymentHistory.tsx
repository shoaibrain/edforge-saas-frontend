/**
 * EmploymentHistory Component
 *
 * Vertical timeline of employment status changes with
 * "Update Status" modal. Uses existing backend endpoints.
 */

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  History,
  Plus,
  ArrowRight,
  Loader2,
  Save,
  Calendar,
  User as UserIcon,
} from 'lucide-react'
import {
  updateEmploymentStatusSchema,
  type UpdateEmploymentStatusDto,
  type EmploymentHistoryResponseDto,
} from '@aibrains/shared-types'
import { Modal, ModalFooter, Button } from '../ui'
import { useStaffEmploymentHistory, useUpdateEmploymentStatus } from '../../hooks'
import { StaffStatusBadge } from './StaffStatusBadge'
import { parseApiError } from '../../services/people.service'
import { formatDate } from '../../lib/utils'

// ============================================================================
// CONSTANTS
// ============================================================================

const STATUS_TIMELINE_COLORS: Record<string, string> = {
  active: 'bg-emerald-500',
  on_leave: 'bg-amber-500',
  suspended: 'bg-[rgb(var(--state-danger-bg))]0',
  terminated: 'bg-slate-500',
  retired: 'bg-blue-500',
  resigned: 'bg-orange-500',
}

const EMPLOYMENT_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'on_leave', label: 'On Leave' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'terminated', label: 'Terminated' },
  { value: 'retired', label: 'Retired' },
  { value: 'resigned', label: 'Resigned' },
]

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
// UPDATE STATUS MODAL
// ============================================================================

function UpdateStatusModal({
  open,
  onClose,
  staffId,
  currentStatus,
}: {
  open: boolean
  onClose: () => void
  staffId: string
  currentStatus: string
}) {
  const updateStatus = useUpdateEmploymentStatus()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateEmploymentStatusDto>({
    resolver: zodResolver(updateEmploymentStatusSchema),
    defaultValues: {
      employmentStatus: '' as UpdateEmploymentStatusDto['employmentStatus'],
      effectiveDate: new Date().toISOString().split('T')[0],
      reason: '',
      notes: '',
    },
  })

  const handleClose = () => {
    if (isDirty) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to close?')
      if (!confirmed) return
    }
    reset()
    onClose()
  }

  const onSubmit = handleSubmit(async (data) => {
    try {
      await updateStatus.mutateAsync({ staffId, data })
      toast.success('Employment status updated successfully')
      reset()
      onClose()
    } catch (error) {
      const parsed = parseApiError(error)
      toast.error(parsed.message)
    }
  })

  const inputClass = (hasError: boolean) => `
    w-full px-3 py-2 rounded-lg border
    bg-surface-secondary text-text-primary
    placeholder:text-text-tertiary
    focus:outline-none focus:ring-2 focus:ring-accent-primary/20
    transition-colors disabled:opacity-50 disabled:cursor-not-allowed
    ${hasError ? 'border-[rgb(var(--state-danger-border))]' : 'border-border-secondary'}
  `

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Update Employment Status"
      description={`Current status: ${currentStatus.replace('_', ' ')}`}
      size="md"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {/* New Status */}
        <div>
          <label htmlFor="emp-status" className="block text-sm font-medium text-text-primary mb-1.5">
            New Status <span className="text-[rgb(var(--state-danger-fg))]">*</span>
          </label>
          <select
            id="emp-status"
            {...register('employmentStatus')}
            className={inputClass(!!errors.employmentStatus)}
            disabled={isSubmitting}
          >
            <option value="">Select status...</option>
            {EMPLOYMENT_STATUS_OPTIONS.filter(opt => opt.value !== currentStatus).map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {errors.employmentStatus && (
            <p className="mt-1 text-sm text-[rgb(var(--state-danger-fg))]">{errors.employmentStatus.message}</p>
          )}
        </div>

        {/* Effective Date */}
        <div>
          <label htmlFor="emp-date" className="block text-sm font-medium text-text-primary mb-1.5">
            Effective Date <span className="text-[rgb(var(--state-danger-fg))]">*</span>
          </label>
          <input
            id="emp-date"
            type="date"
            {...register('effectiveDate')}
            className={inputClass(!!errors.effectiveDate)}
            disabled={isSubmitting}
          />
          {errors.effectiveDate && (
            <p className="mt-1 text-sm text-[rgb(var(--state-danger-fg))]">{errors.effectiveDate.message}</p>
          )}
        </div>

        {/* Reason */}
        <div>
          <label htmlFor="emp-reason" className="block text-sm font-medium text-text-primary mb-1.5">
            Reason
          </label>
          <input
            id="emp-reason"
            type="text"
            {...register('reason')}
            className={inputClass(!!errors.reason)}
            placeholder="e.g., End of contract, Promotion, Medical leave"
            disabled={isSubmitting}
          />
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="emp-notes" className="block text-sm font-medium text-text-primary mb-1.5">
            Notes
          </label>
          <textarea
            id="emp-notes"
            {...register('notes')}
            className={inputClass(!!errors.notes)}
            rows={3}
            placeholder="Additional details..."
            disabled={isSubmitting}
          />
        </div>

        <ModalFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="min-w-36">
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Update Status
              </>
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}

// ============================================================================
// TIMELINE ENTRY
// ============================================================================

function TimelineEntry({ entry, isLast }: { entry: EmploymentHistoryResponseDto; isLast: boolean }) {
  const dotColor = STATUS_TIMELINE_COLORS[entry.newStatus] || 'bg-slate-400'

  return (
    <div className="relative flex gap-4">
      {/* Timeline Line + Dot */}
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full ${dotColor} ring-4 ring-[rgb(var(--surface-primary))] flex-shrink-0 mt-1.5`} />
        {!isLast && (
          <div className="w-0.5 flex-1 bg-[rgb(var(--border-secondary))] mt-1" />
        )}
      </div>

      {/* Content */}
      <div className="pb-8 min-w-0 flex-1">
        <div className="p-4 rounded-xl border border-[rgb(var(--border-secondary))] bg-[rgb(var(--surface-secondary))]">
          {/* Status Transition */}
          <div className="flex items-center gap-2 flex-wrap">
            <StaffStatusBadge status={entry.previousStatus} />
            <ArrowRight className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
            <StaffStatusBadge status={entry.newStatus} />
          </div>

          {/* Details */}
          <div className="mt-3 space-y-1.5">
            {entry.reason && (
              <p className="text-sm text-[rgb(var(--text-secondary))]">
                <span className="font-medium">Reason:</span> {entry.reason}
              </p>
            )}
            {entry.notes && (
              <p className="text-sm text-[rgb(var(--text-tertiary))]">{entry.notes}</p>
            )}
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-4 mt-3 text-xs text-[rgb(var(--text-tertiary))]">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Effective {formatDate(entry.effectiveDate)}
            </span>
            {entry.changedByName && (
              <span className="flex items-center gap-1">
                <UserIcon className="w-3 h-3" />
                {entry.changedByName}
              </span>
            )}
            <span>Recorded {new Date(entry.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function EmploymentHistory({
  staffId,
  currentStatus,
}: {
  staffId: string
  currentStatus: string
}) {
  const { data: history, isLoading } = useStaffEmploymentHistory(staffId)
  const [modalOpen, setModalOpen] = useState(false)

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
          <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))]">Employment History</h3>
          <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
            Track employment status changes over time
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Update Status
        </button>
      </motion.div>

      {/* Timeline */}
      <motion.div variants={fadeInUp}>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex gap-4">
                <div className="w-3 h-3 rounded-full bg-[rgb(var(--surface-secondary))] mt-1.5" />
                <div className="flex-1 h-24 bg-[rgb(var(--surface-secondary))] rounded-xl" />
              </div>
            ))}
          </div>
        ) : !history || history.length === 0 ? (
          <div className="text-center py-16 bg-[rgb(var(--surface-secondary))] rounded-xl border-2 border-dashed border-[rgb(var(--border-secondary))]">
            <History className="w-12 h-12 mx-auto mb-4 text-[rgb(var(--text-tertiary))] opacity-40" />
            <h4 className="font-medium text-[rgb(var(--text-secondary))] mb-2">No Employment History</h4>
            <p className="text-sm text-[rgb(var(--text-tertiary))] max-w-sm mx-auto">
              No employment status changes have been recorded yet. Click &quot;Update Status&quot; to record a change.
            </p>
          </div>
        ) : (
          <div>
            {history.map((entry, index) => (
              <TimelineEntry
                key={entry.historyId}
                entry={entry}
                isLast={index === history.length - 1}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* Update Status Modal */}
      <UpdateStatusModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        staffId={staffId}
        currentStatus={currentStatus}
      />
    </motion.div>
  )
}
