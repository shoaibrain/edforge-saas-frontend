/**
 * EmploymentHistory Component
 *
 * Vertical timeline of employment status changes with
 * "Update Status" modal. Uses existing backend endpoints.
 */

import { useState } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useTranslation } from '@edforge/i18n'
import {
  History,
  Plus,
  ArrowRight,
  Calendar,
  User as UserIcon,
} from 'lucide-react'
import {
  updateEmploymentStatusSchema,
  type UpdateEmploymentStatusDto,
  type EmploymentHistoryResponseDto,
} from '@aibrains/shared-types'
import { TextField, SelectField, DateField, TextareaField } from '@edforge/forms'
import { Modal, ModalFooter, Button } from '../ui'
import { useStaffEmploymentHistory, useUpdateEmploymentStatus } from '../../hooks'
import { StaffStatusBadge } from './StaffStatusBadge'
import { optionValueToI18nKey } from './wizard/staff-wizard.utils'
import { parseApiError } from '../../services/people.service'
import { formatDate } from '../../lib/utils'

// ============================================================================
// CONSTANTS
// ============================================================================

const STATUS_TIMELINE_COLORS: Record<string, string> = {
  active: 'bg-[rgb(var(--state-success-fg))]',
  on_leave: 'bg-amber-500',
  suspended: 'bg-[rgb(var(--state-danger-bg))]0',
  terminated: 'bg-[rgb(var(--text-tertiary))]',
  retired: 'bg-[rgb(var(--state-info-fg))]',
  resigned: 'bg-[rgb(var(--state-warning-fg))]',
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
  const { t } = useTranslation('people')
  const updateStatus = useUpdateEmploymentStatus()

  const methods = useForm<UpdateEmploymentStatusDto>({
    resolver: zodResolver(updateEmploymentStatusSchema),
    defaultValues: {
      employmentStatus: '' as UpdateEmploymentStatusDto['employmentStatus'],
      effectiveDate: new Date().toISOString().split('T')[0],
      reason: '',
      notes: '',
    },
  })

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting, isDirty },
  } = methods

  const handleClose = () => {
    if (isDirty) {
      const confirmed = window.confirm(t('common.unsavedCloseConfirm'))
      if (!confirmed) return
    }
    reset()
    onClose()
  }

  const onSubmit = handleSubmit(async (data) => {
    try {
      await updateStatus.mutateAsync({ staffId, data })
      toast.success(t('employmentHistory.toasts.updated'))
      reset()
      onClose()
    } catch (error) {
      const parsed = parseApiError(error)
      toast.error(parsed.message)
    }
  })

  const statusOptions = EMPLOYMENT_STATUS_OPTIONS.filter((opt) => opt.value !== currentStatus)

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={t('employmentHistory.updateTitle')}
      description={t('employmentHistory.currentStatus', {
        status: t(`employmentStatus.${optionValueToI18nKey(currentStatus)}`, { defaultValue: currentStatus.replace('_', ' ') }),
      })}
      size="md"
    >
      <FormProvider {...methods}>
        <form onSubmit={onSubmit} className="space-y-4">
          {/* New Status */}
          <SelectField
            name="employmentStatus"
            label={t('employmentHistory.fields.newStatus')}
            required
            options={statusOptions.map((option) => ({
              ...option,
              label: t(`employmentStatus.${optionValueToI18nKey(option.value)}`, { defaultValue: option.label }),
            }))}
            placeholder={t('employmentHistory.placeholders.selectStatus')}
            disabled={isSubmitting}
          />

          {/* Effective Date */}
          <DateField
            name="effectiveDate"
            label={t('employmentHistory.fields.effectiveDate')}
            required
            disabled={isSubmitting}
          />

          {/* Reason */}
          <TextField
            name="reason"
            label={t('leave.table.reason')}
            type="text"
            placeholder={t('employmentHistory.placeholders.reason')}
            disabled={isSubmitting}
          />

          {/* Notes */}
          <TextareaField
            name="notes"
            label={t('employmentHistory.fields.notes')}
            rows={3}
            placeholder={t('common.additionalDetails')}
            disabled={isSubmitting}
          />

          <ModalFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              {t('actions.cancel')}
            </Button>
            <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting} className="min-w-36">
              {t('actions.updateStatus')}
            </Button>
          </ModalFooter>
        </form>
      </FormProvider>
    </Modal>
  )
}

// ============================================================================
// TIMELINE ENTRY
// ============================================================================

function TimelineEntry({ entry, isLast }: { entry: EmploymentHistoryResponseDto; isLast: boolean }) {
  const { t } = useTranslation('people')
  const dotColor = STATUS_TIMELINE_COLORS[entry.newStatus] || 'bg-[rgb(var(--text-tertiary))]'

  return (
    <div className="relative flex gap-4">
      {/* Timeline Line + Dot */}
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full ${dotColor} ring-4 ring-[rgb(var(--background-primary))] flex-shrink-0 mt-1.5`} />
        {!isLast && (
          <div className="w-0.5 flex-1 bg-[rgb(var(--border-secondary))] mt-1" />
        )}
      </div>

      {/* Content */}
      <div className="pb-8 min-w-0 flex-1">
        <div className="p-4 rounded-xl border border-[rgb(var(--border-secondary))] bg-[rgb(var(--background-secondary))]">
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
                <span className="font-medium">{t('employmentHistory.fields.reasonLabel')}</span> {entry.reason}
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
              {t('employmentHistory.effective', { date: formatDate(entry.effectiveDate) })}
            </span>
            {entry.changedByName && (
              <span className="flex items-center gap-1">
                <UserIcon className="w-3 h-3" />
                {entry.changedByName}
              </span>
            )}
            <span>{t('employmentHistory.recorded', { date: new Date(entry.createdAt).toLocaleDateString() })}</span>
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
  const { t } = useTranslation('people')
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
          <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))]">{t('tabs.employmentHistory')}</h3>
          <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
            {t('employmentHistory.description')}
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-[rgb(var(--action-primary-bg))] text-[rgb(var(--action-primary-fg))] rounded-lg hover:bg-[rgb(var(--action-primary-bg-hover))] transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          {t('actions.updateStatus')}
        </button>
      </motion.div>

      {/* Timeline */}
      <motion.div variants={fadeInUp}>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex gap-4">
                <div className="w-3 h-3 rounded-full bg-[rgb(var(--background-secondary))] mt-1.5" />
                <div className="flex-1 h-24 bg-[rgb(var(--background-secondary))] rounded-xl" />
              </div>
            ))}
          </div>
        ) : !history || history.length === 0 ? (
          <div className="text-center py-16 bg-[rgb(var(--background-secondary))] rounded-xl border-2 border-dashed border-[rgb(var(--border-secondary))]">
            <History className="w-12 h-12 mx-auto mb-4 text-[rgb(var(--text-tertiary))] opacity-40" />
            <h4 className="font-medium text-[rgb(var(--text-secondary))] mb-2">{t('employmentHistory.emptyTitle')}</h4>
            <p className="text-sm text-[rgb(var(--text-tertiary))] max-w-sm mx-auto">
              {t('employmentHistory.emptyDescription')}
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
