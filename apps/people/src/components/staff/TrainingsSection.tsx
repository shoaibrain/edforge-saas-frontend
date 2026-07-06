/**
 * TrainingsSection Component (Sprint B.10d)
 *
 * Card-based list of staff professional development / training records.
 * Mirrors CredentialsSection layout: header + grid of cards + add/edit
 * modal + delete-with-confirmation. Uses the Sprint B backend
 * (`/staff/:id/trainings`) via `useStaffTrainings` + `useDeleteStaffTraining`.
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  GraduationCap,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Clock,
  Calendar,
  FileText,
  ExternalLink,
} from 'lucide-react'
import type { StaffTrainingResponseDto } from '@aibrains/shared-types'
import { useStaffTrainings, useDeleteStaffTraining } from '../../hooks'
import { TrainingModal } from './TrainingModal'
import { formatDate } from '../../lib/utils'

// ============================================================================
// CONSTANTS
// ============================================================================

const TRAINING_TYPE_COLORS: Record<string, string> = {
  pedagogical: 'bg-[rgb(var(--state-info-bg)/0.18)] text-[rgb(var(--state-info-fg))] ',
  subject_matter: 'bg-[rgb(var(--state-info-bg)/0.18)] text-[rgb(var(--state-info-fg))] ',
  technology: 'bg-[rgb(var(--state-info-bg)/0.18)] text-[rgb(var(--state-info-fg))] ',
  inclusion: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  leadership: 'bg-[rgb(var(--state-danger-bg)/0.18)] text-[rgb(var(--state-danger-fg))] ',
  safety: 'bg-[rgb(var(--state-warning-bg)/0.18)] text-[rgb(var(--state-warning-fg))] ',
  assessment: 'bg-[rgb(var(--state-info-bg)/0.18)] text-[rgb(var(--action-secondary-fg))] ',
  language: 'bg-[rgb(var(--state-success-bg)/0.18)] text-[rgb(var(--state-success-fg))] ',
  induction: 'bg-[rgb(var(--state-info-bg)/0.18)] text-[rgb(var(--state-info-fg))] ',
  other: 'bg-[rgb(var(--background-tertiary))] text-[rgb(var(--text-secondary))] ',
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  in_progress: 'bg-[rgb(var(--state-info-bg)/0.18)] text-[rgb(var(--state-info-fg))] ',
  completed: 'bg-[rgb(var(--state-success-bg)/0.18)] text-[rgb(var(--state-success-fg))] ',
  cancelled: 'bg-[rgb(var(--background-tertiary))] text-[rgb(var(--text-tertiary))] ',
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

const staggerChildren = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

// ============================================================================
// HELPERS
// ============================================================================

function humanizeKey(key: string): string {
  return key.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function formatDateRange(start: string, end?: string): string {
  if (!end || end === start) return formatDate(start)
  return `${formatDate(start)} → ${formatDate(end)}`
}

// ============================================================================
// COMPONENT
// ============================================================================

export function TrainingsSection({ staffId }: { staffId: string }) {
  const { data: trainings, isLoading } = useStaffTrainings(staffId)
  const deleteTraining = useDeleteStaffTraining()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTraining, setEditingTraining] =
    useState<StaffTrainingResponseDto | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleEdit = (training: StaffTrainingResponseDto) => {
    setEditingTraining(training)
    setModalOpen(true)
  }

  const handleAdd = () => {
    setEditingTraining(null)
    setModalOpen(true)
  }

  const handleDelete = async (trainingId: string) => {
    const confirmed = window.confirm(
      'Delete this training record? This action cannot be undone.',
    )
    if (!confirmed) return

    setDeletingId(trainingId)
    try {
      await deleteTraining.mutateAsync({ staffId, trainingId })
      toast.success('Training deleted')
    } catch {
      toast.error('Failed to delete training')
    } finally {
      setDeletingId(null)
    }
  }

  // Sort by start date DESC (most recent first) — useful for CEHRD reporting
  // ("trainings completed this year") and matches operator mental model.
  const sorted = (trainings ?? []).slice().sort((a, b) =>
    a.startDate < b.startDate ? 1 : a.startDate > b.startDate ? -1 : 0,
  )

  // Total hours summary (CEHRD Flash-II input)
  const totalHours = sorted
    .filter((t) => t.status === 'completed')
    .reduce((sum, t) => sum + (t.durationHours ?? 0), 0)

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
          <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))]">Trainings</h3>
          <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
            Professional development records
            {sorted.length > 0 ? ` — ${totalHours}h completed` : ''}
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-3.5 py-2 bg-[rgb(var(--action-primary-bg))] text-[rgb(var(--action-primary-fg))] rounded-lg hover:bg-[rgb(var(--action-primary-bg-hover))] transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Training
        </button>
      </motion.div>

      {/* Content */}
      <motion.div variants={fadeInUp}>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse h-32 bg-[rgb(var(--background-secondary))] rounded-xl" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-16 bg-[rgb(var(--background-secondary))] rounded-xl border-2 border-dashed border-[rgb(var(--border-secondary))]">
            <GraduationCap className="w-12 h-12 mx-auto mb-4 text-[rgb(var(--text-tertiary))] opacity-40" />
            <h4 className="font-medium text-[rgb(var(--text-secondary))] mb-2">No Trainings</h4>
            <p className="text-sm text-[rgb(var(--text-tertiary))] max-w-sm mx-auto">
              No training records have been added for this staff member yet.
            </p>
            <button
              onClick={handleAdd}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[rgb(var(--action-secondary-fg))] hover:text-[rgb(var(--action-secondary-fg))] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add First Training
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {sorted.map((training) => (
              <motion.div
                key={training.trainingId}
                variants={fadeInUp}
                className="p-5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] hover:border-[rgb(var(--border-focus)/0.35)] transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 min-w-0">
                    {/* Type icon */}
                    <div className={`p-3 rounded-xl flex-shrink-0 ${TRAINING_TYPE_COLORS[training.trainingType] ?? TRAINING_TYPE_COLORS.other}`}>
                      <GraduationCap className="w-6 h-6" />
                    </div>

                    <div className="min-w-0">
                      {/* Title */}
                      <h4 className="font-semibold text-[rgb(var(--text-primary))] truncate">
                        {training.trainingTitle}
                      </h4>
                      <p className="text-xs text-[rgb(var(--text-tertiary))] mt-0.5">
                        {training.trainingProvider}
                      </p>

                      {/* Badges */}
                      <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${TRAINING_TYPE_COLORS[training.trainingType] ?? TRAINING_TYPE_COLORS.other}`}>
                          {humanizeKey(training.trainingType)}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${STATUS_COLORS[training.status] ?? STATUS_COLORS.scheduled}`}>
                          {humanizeKey(training.status)}
                        </span>
                      </div>

                      {/* Details */}
                      <div className="flex items-center gap-4 mt-2 text-xs text-[rgb(var(--text-tertiary))] flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDateRange(training.startDate, training.endDate)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {training.durationHours}h
                        </span>
                        {training.certificateNumber && (
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            Cert {training.certificateNumber}
                          </span>
                        )}
                        {training.certificateUrl && (
                          <a
                            href={training.certificateUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[rgb(var(--action-secondary-fg))]  hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Certificate
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ms-2">
                    <button
                      onClick={() => handleEdit(training)}
                      className="p-2 rounded-lg hover:bg-[rgb(var(--background-tertiary))] text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] transition-colors"
                      title="Edit training"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(training.trainingId)}
                      className="p-2 rounded-lg hover:bg-[rgb(var(--state-danger-bg))]0/10 text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--state-danger-fg))] transition-colors"
                      title="Delete training"
                      disabled={deletingId === training.trainingId}
                    >
                      {deletingId === training.trainingId ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      <TrainingModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingTraining(null)
        }}
        staffId={staffId}
        training={editingTraining}
      />
    </motion.div>
  )
}
