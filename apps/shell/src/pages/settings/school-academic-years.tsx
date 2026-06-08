/**
 * School Academic Years Page — ORPHANED / DEPRECATED.
 *
 * ⚠️ This file is NOT imported by any production route. The school
 * Academic Setup UI users see at
 *   /settings/organization/schools/:id?tab=academic-setup
 * is rendered by `apps/shell/src/pages/settings/tabs/AcademicSetupTab.tsx`,
 * which is mounted via `school-detail.tsx`.
 *
 * This component is preserved temporarily because it carries Sprint 2 of
 * the academic-year `isCurrent` flag drift fix (PR #100). Sprint 2 added
 * `isCurrent`-aware UI here in error — the changes never reached users
 * because nothing imports this file. The Set-as-Current UI was reimplemented
 * directly in `AcademicSetupTab.tsx` in a follow-up PR.
 *
 * Do NOT add new code here. Delete this file (and its test) when the
 * follow-up PR has soaked in prod for a sprint cycle.
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Calendar,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  Lock,
  CalendarDays,
  Milestone,
  Edit,
  Star,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { tenantService, type CreateGradingPeriodDto } from '@/services/tenant.service'
import type { AcademicYear, Term } from '@edforge/types'
import type {
  CreateAcademicYearDto,
  UpdateAcademicYearDto,
} from '@aibrains/shared-types'
import {
  SettingsSection,
  SettingsAlert,
  staggerChildren,
  fadeInUp,
} from '@/components/settings/SettingsShared'
import { Button, DateInput } from '@edforge/ui'
import { getAcademicYearLabel } from '@aibrains/shared-types'
import { adToBS, formatBSDate } from '@edforge/date-utils'
import { TenantDateRange } from '@/components/common/TenantDate'

// ============================================================================
// LOCAL TYPES
// ============================================================================

// AcademicYear is the canonical type from @edforge/types (imported above).
// Sprint 2 / Ticket 2.1 removed the locally-duplicated copy that was
// missing the `isCurrent` field.

type AcademicYearStatus = AcademicYear['status']

// Extended type for internal use that includes schoolId (for routing) and generated terms
interface CreateAcademicYearWithTerms extends CreateAcademicYearDto {
  schoolId: string
  generatedTerms?: CreateGradingPeriodDto[]
}

// ============================================================================
// STATUS BADGE
// ============================================================================

interface StatusBadgeProps {
  status: AcademicYearStatus
}

function StatusBadge({ status }: StatusBadgeProps) {
  const configs: Record<AcademicYearStatus, { icon: typeof Clock; color: string; label: string }> = {
    planning: { icon: Clock, color: 'golden', label: 'Planning' },
    active: { icon: Play, color: 'teal', label: 'Active' },
    completed: { icon: CheckCircle, color: 'slate', label: 'Completed' },
  }

  const config = configs[status]
  const Icon = config.icon

  return (
    <span className={`
      inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
      ${status === 'planning' && 'bg-golden-500/10 text-golden-700 dark:text-golden-400'}
      ${status === 'active' && 'bg-[rgb(var(--action-primary-bg))]/10 text-[rgb(var(--state-info-fg))] '}
      ${status === 'completed' && 'bg-[rgb(var(--background-tertiary))]0/10 text-[rgb(var(--text-secondary))] dark:text-[rgb(var(--text-tertiary))]'}
    `}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  )
}

// ============================================================================
// CURRENT / DRIFT PILLS  (Sprint 2 / Tickets 2.3, 2.5)
// ============================================================================

/** Renders when `year.isCurrent === true`. Visually distinct from StatusBadge. */
function CurrentPill() {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[rgb(var(--action-primary-bg))]/20 text-[rgb(var(--state-info-fg))] "
      title="Anchors dashboards, attendance, and grades"
    >
      <Star className="w-3 h-3" />
      Current
    </span>
  )
}

/**
 * Renders when `year.status === 'active' && !year.isCurrent`. Operator-
 * facing remediation signal: the year is operationally active but no AY
 * is designated as current. The "Set as Current" button alongside the
 * row fixes the state.
 */
function ActiveNotCurrentPill() {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-golden-500/10 text-golden-700 dark:text-golden-400"
      title="This year is active but no year is designated as current. Use 'Set as Current' to fix."
    >
      <AlertCircle className="w-3 h-3" />
      Active, not current
    </span>
  )
}

// ============================================================================
// TIMELINE VISUALIZATION
// ============================================================================

interface TimelineVisualizationProps {
  academicYears: AcademicYear[]
}

function TimelineVisualization({ academicYears }: TimelineVisualizationProps) {
  const sortedYears = [...academicYears].sort((a, b) =>
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  )

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-[rgb(var(--border-primary))]" />

      <div className="space-y-4">
        {sortedYears.map((year) => {
          const isActive = year.status === 'active'
          const isCompleted = year.status === 'completed'

          return (
            <motion.div
              key={year.id}
              variants={fadeInUp}
              className="relative flex items-start gap-4 pl-3"
            >
              {/* Timeline dot */}
              <div className={`
                relative z-10 w-6 h-6 rounded-full flex items-center justify-center
                ${isActive && 'bg-[rgb(var(--action-primary-bg))] ring-4 ring-[rgb(var(--border-focus))]/20'}
                ${isCompleted && 'bg-[rgb(var(--text-tertiary))]'}
                ${!isActive && !isCompleted && 'bg-golden-500'}
              `}>
                {isActive && <Play className="w-3 h-3 text-[rgb(var(--action-primary-fg))]" />}
                {isCompleted && <CheckCircle className="w-3 h-3 text-[rgb(var(--action-primary-fg))]" />}
                {!isActive && !isCompleted && <Clock className="w-3 h-3 text-[rgb(var(--action-primary-fg))]" />}
              </div>

              {/* Year card */}
              <div className={`
                flex-1 p-4 rounded-xl border transition-all
                ${isActive
                  ? 'bg-[rgb(var(--action-primary-bg))]/5 border-[rgb(var(--border-focus)/0.35)] shadow-sm'
                  : 'bg-[rgb(var(--background-secondary))] border-[rgb(var(--border-primary))] hover:border-[rgb(var(--border-secondary))]'
                }
              `}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-[rgb(var(--text-primary))]">
                        {year.startDateBS
                          ? `BS ${year.startDateBS.split('/')[0]}/${(parseInt(year.startDateBS.split('/')[0], 10) + 1)}`
                          : year.name}
                      </h4>
                      <StatusBadge status={year.status} />
                      {/* Sprint 2 / Tickets 2.3 + 2.5: surface the isCurrent
                          state independently of status. */}
                      {year.isCurrent && <CurrentPill />}
                      {year.status === 'active' && !year.isCurrent && <ActiveNotCurrentPill />}
                      {year.isLocked && <Lock className="w-3.5 h-3.5 text-[rgb(var(--text-tertiary))]" />}
                    </div>
                    <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
                      <TenantDateRange start={year.startDate} end={year.endDate} />
                    </p>
                  </div>
                  <CalendarDays className="w-5 h-5 text-[rgb(var(--text-tertiary))]" />
                </div>

                {/* Terms */}
                {year.terms && year.terms.length > 0 && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[rgb(var(--border-secondary))]">
                    <CalendarDays className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                    <span className="text-xs text-[rgb(var(--text-tertiary))]">
                      {year.terms.length} term{year.terms.length !== 1 ? 's' : ''}: {year.terms.map((t: Term) => t.name).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================================
// CREATE ACADEMIC YEAR MODAL
// ============================================================================

interface CreateAcademicYearModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateAcademicYearWithTerms) => void
  isLoading: boolean
  schoolId: string
  calendarSystem?: string
}

function CreateAcademicYearModal({ isOpen, onClose, onSubmit, isLoading, schoolId, calendarSystem = 'gregorian' }: CreateAcademicYearModalProps) {
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Sprint C4 — Sessions are NO LONGER auto-created on AY creation. Each
  // school's term structure is too varied for synthetic defaults to be
  // safe (Nepal festivals like Dashain/Tihar break the assumption that
  // year length divides evenly; PABSON terms have school-specific names
  // like "टर्म 1"; once Grades reference termIds, fixing wrong session
  // dates becomes destructive). After AY creation, the user is directed
  // to the Sessions & Terms tab where they explicitly create each session
  // — optionally seeded from a template — and review before saving.

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload: CreateAcademicYearWithTerms = {
      schoolId,
      name,
      startDate,
      endDate,
      // calendarType is preserved as a school-level hint for Session UI
      // template defaults; the AY itself doesn't enforce it. Default to
      // 'semester' since the AY modal no longer asks the user to pick one.
      calendarType: 'semester',
      // No generatedTerms — sessions are created explicitly on the
      // Sessions & Terms tab after the AY exists.
    }
    if (calendarSystem === 'bikram_sambat' && startDate && endDate) {
      try {
        payload.startDateBS = formatBSDate(adToBS(startDate))
        payload.endDateBS = formatBSDate(adToBS(endDate))
      } catch { /* ignore conversion errors */ }
    }
    onSubmit(payload)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-[rgb(var(--background-overlay)/0.50)] backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-lg bg-[rgb(var(--background-primary))] rounded-2xl shadow-xl p-6"
      >
        <h2 className="text-xl font-semibold text-[rgb(var(--text-primary))] mb-4">Create Academic Year</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <DateInput
                label="Start Date"
                value={startDate}
                onChange={(iso) => {
                  setStartDate(iso)
                  if (iso && endDate) {
                    try { setName(getAcademicYearLabel(iso, endDate, calendarSystem)) } catch { /* ignore */ }
                  }
                }}
                calendarSystem={calendarSystem}
                className="w-full"
              />
            </div>
            <div>
              <DateInput
                label="End Date"
                value={endDate}
                onChange={(iso) => {
                  setEndDate(iso)
                  if (startDate && iso) {
                    try { setName(getAcademicYearLabel(startDate, iso, calendarSystem)) } catch { /* ignore */ }
                  }
                }}
                calendarSystem={calendarSystem}
                className="w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">
              Year Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder={calendarSystem === 'bikram_sambat' ? 'e.g., 2082-2083' : 'e.g., 2025-2026'}
              className="w-full px-3 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus))]/50"
            />
            {calendarSystem === 'bikram_sambat' && (
              <p className="mt-1 text-xs text-[rgb(var(--text-tertiary))]">
                Year name is auto-generated from Bikram Sambat dates
              </p>
            )}
          </div>

          {/* Info */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-[rgb(var(--background-tertiary))]">
            <AlertCircle className="w-4 h-4 text-[rgb(var(--text-tertiary))] mt-0.5 flex-shrink-0" />
            <p className="text-xs text-[rgb(var(--text-tertiary))]">
              The academic year will be created in "Planning" status with no
              sessions yet. After creation, open the <b>Sessions &amp; Terms</b>{' '}
              tab to define your terms — pick a template or create them
              individually. You can activate the year once sessions are in place.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--background-secondary))] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !name || !startDate || !endDate}
              className="px-4 py-2 rounded-xl bg-[rgb(var(--action-primary-bg))] text-[rgb(var(--action-primary-fg))] text-sm font-medium hover:bg-[rgb(var(--action-primary-bg))] transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Academic Year'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

// ============================================================================
// EDIT ACADEMIC YEAR MODAL
// ============================================================================

interface EditAcademicYearModalProps {
  isOpen: boolean
  year: AcademicYear | null
  onClose: () => void
  onSubmit: (data: UpdateAcademicYearDto) => void
  isLoading: boolean
  calendarSystem?: string
}

function EditAcademicYearModal({ isOpen, year, onClose, onSubmit, isLoading, calendarSystem = 'gregorian' }: EditAcademicYearModalProps) {
  const [name, setName] = useState(year?.name || '')
  const [startDate, setStartDate] = useState(year?.startDate || '')
  const [endDate, setEndDate] = useState(year?.endDate || '')

  // Reset form when year changes
  useEffect(() => {
    if (year) {
      setName(year.name)
      setStartDate(year.startDate)
      setEndDate(year.endDate)
    }
  }, [year])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      name,
      startDate,
      endDate,
    })
  }

  if (!isOpen || !year) return null

  // Only allow editing years in planning status
  const canEdit = year.status === 'planning'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-[rgb(var(--background-overlay)/0.50)] backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-lg bg-[rgb(var(--background-primary))] rounded-2xl shadow-xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-[rgb(var(--text-primary))]">
              {canEdit ? 'Edit Academic Year' : 'View Academic Year'}
            </h2>
            <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
              {canEdit ? 'Update the academic year details' : 'This year is locked and cannot be edited'}
            </p>
          </div>
          <StatusBadge status={year.status} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">
              Year Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={!canEdit}
              placeholder="e.g., 2025-2026"
              className="w-full px-3 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus))]/50 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <DateInput
                label="Start Date"
                value={startDate}
                onChange={(iso) => setStartDate(iso)}
                calendarSystem={calendarSystem}
                disabled={!canEdit}
                className="w-full"
              />
            </div>
            <div>
              <DateInput
                label="End Date"
                value={endDate}
                onChange={(iso) => setEndDate(iso)}
                calendarSystem={calendarSystem}
                disabled={!canEdit}
                className="w-full"
              />
            </div>
          </div>

          {/* Info for locked years */}
          {!canEdit && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-[rgb(var(--background-tertiary))]">
              <Lock className="w-4 h-4 text-[rgb(var(--text-tertiary))] mt-0.5 flex-shrink-0" />
              <p className="text-xs text-[rgb(var(--text-tertiary))]">
                This academic year is {year.status} and cannot be modified.
                Dates are locked to maintain data integrity.
              </p>
            </div>
          )}

          {/* Info for planning years */}
          {canEdit && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-[rgb(var(--background-tertiary))]">
              <AlertCircle className="w-4 h-4 text-[rgb(var(--text-tertiary))] mt-0.5 flex-shrink-0" />
              <p className="text-xs text-[rgb(var(--text-tertiary))]">
                Once this year is activated, dates will be locked and cannot be changed.
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--background-secondary))] transition-colors"
            >
              {canEdit ? 'Cancel' : 'Close'}
            </button>
            {canEdit && (
              <button
                type="submit"
                disabled={isLoading || !name || !startDate || !endDate}
                className="px-4 py-2 rounded-xl bg-[rgb(var(--action-primary-bg))] text-[rgb(var(--action-primary-fg))] text-sm font-medium hover:bg-[rgb(var(--action-primary-bg))] transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  )
}

// ============================================================================
// ACTIVATE CONFIRMATION MODAL
// ============================================================================

interface ActivateConfirmModalProps {
  isOpen: boolean
  year: AcademicYear | null
  onClose: () => void
  onConfirm: () => void
  isLoading: boolean
}

function ActivateConfirmModal({ isOpen, year, onClose, onConfirm, isLoading }: ActivateConfirmModalProps) {
  if (!isOpen || !year) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-[rgb(var(--background-overlay)/0.50)] backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md bg-[rgb(var(--background-primary))] rounded-2xl shadow-xl p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-full bg-golden-500/10">
            <AlertCircle className="w-6 h-6 text-golden-600" />
          </div>
          <h2 className="text-xl font-semibold text-[rgb(var(--text-primary))]">Activate Academic Year</h2>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-[rgb(var(--text-secondary))]">
            You are about to activate <strong>{year.name}</strong>. This action:
          </p>

          <ul className="space-y-2 text-sm text-[rgb(var(--text-secondary))]">
            <li className="flex items-start gap-2">
              <Lock className="w-4 h-4 text-golden-600 mt-0.5 flex-shrink-0" />
              <span>Will lock the start and end dates permanently</span>
            </li>
            <li className="flex items-start gap-2">
              <Milestone className="w-4 h-4 text-golden-600 mt-0.5 flex-shrink-0" />
              <span>Will deactivate any currently active academic year</span>
            </li>
            <li className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rust-500 mt-0.5 flex-shrink-0" />
              <span className="text-rust-600 dark:text-rust-400">Cannot be reversed back to "Planning"</span>
            </li>
          </ul>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--background-secondary))] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl bg-[rgb(var(--action-primary-bg))] text-[rgb(var(--action-primary-fg))] text-sm font-medium hover:bg-[rgb(var(--action-primary-bg))] transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Activating...' : 'Activate Year'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface SchoolAcademicYearsPageProps {
  schoolId: string
}

export default function SchoolAcademicYearsPage({ schoolId }: SchoolAcademicYearsPageProps) {
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [yearToEdit, setYearToEdit] = useState<AcademicYear | null>(null)
  const [yearToActivate, setYearToActivate] = useState<AcademicYear | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Fetch school to get calendarSystem
  const { data: school } = useQuery({
    queryKey: ['school', schoolId],
    queryFn: () => tenantService.getSchool(schoolId),
    enabled: !!schoolId,
    staleTime: 10 * 60 * 1000,
  })

  const calendarSystem = school?.calendarSystem || 'gregorian'

  // Fetch academic years
  const {
    data: academicYears,
  } = useQuery({
    queryKey: ['academicYears', schoolId],
    queryFn: () => tenantService.getAcademicYears(schoolId),
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
  })

  // Create mutation with grading period creation
  const createMutation = useMutation({
    mutationFn: async (data: CreateAcademicYearWithTerms) => {
      // First create the academic year
      const { generatedTerms, ...yearData } = data
      const createdYear = await tenantService.createAcademicYear(schoolId, yearData)
      
      // Then create grading periods if provided
      if (generatedTerms && generatedTerms.length > 0 && createdYear.id) {
        try {
          await tenantService.createGradingPeriods(schoolId, createdYear.id, generatedTerms)
        } catch (err) {
          // Log but don't fail - year was created successfully
          console.warn('Failed to create grading periods:', err)
        }
      }
      
      return createdYear
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academicYears', schoolId] })
      setIsCreateModalOpen(false)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    },
    onError: (err: Error) => {
      setSaveError(err.message || 'Failed to create academic year')
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ yearId, data }: { yearId: string; data: UpdateAcademicYearDto }) =>
      tenantService.updateAcademicYear(schoolId, yearId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academicYears', schoolId] })
      setYearToEdit(null)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    },
    onError: (err: Error) => {
      setSaveError(err.message || 'Failed to update academic year')
    },
  })

  // Activate mutation
  const activateMutation = useMutation({
    mutationFn: (academicYearId: string) =>
      tenantService.updateAcademicYearStatus(schoolId, academicYearId, {
        status: 'active',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academicYears', schoolId] })
      setYearToActivate(null)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    },
    onError: (err: Error) => {
      setSaveError(err.message || 'Failed to activate academic year')
    },
  })

  // Complete year mutation (Active → Completed)
  const completeMutation = useMutation({
    mutationFn: (academicYearId: string) =>
      tenantService.updateAcademicYearStatus(schoolId, academicYearId, {
        status: 'completed',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academicYears', schoolId] })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    },
    onError: (err: Error) => {
      setSaveError(err.message || 'Failed to complete academic year')
    },
  })

  // Sprint 2 / Ticket 2.4 — Set-as-Current mutation. Flips `isCurrent=true`
  // on the target AY and clears it on any other AY for the school.
  // Invalidates both ['academicYears', schoolId] (this page) and
  // ['school', 'current-year', schoolId] (the academics MFE's hook).
  const setCurrentMutation = useMutation({
    mutationFn: (academicYearId: string) =>
      tenantService.setCurrentAcademicYear(schoolId, academicYearId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academicYears', schoolId] })
      queryClient.invalidateQueries({ queryKey: ['school', 'current-year', schoolId] })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    },
    onError: (err: Error) => {
      setSaveError(err.message || 'Failed to set academic year as current')
    },
  })

  // Note: Academic years cannot be deleted by design
  // This preserves historical data integrity

  // Mock data if API fails — dev-only fallback. Sprint 2 / Ticket 2.6:
  // include `isCurrent` so the dev-mode UI exercises the new pills + button.
  const displayYears: AcademicYear[] = academicYears || [
    {
      id: 'ay-1',
      tenantId: user?.tenantId || '',
      schoolId,
      name: '2024-2025',
      startDate: '2024-08-15',
      endDate: '2025-06-15',
      status: 'active',
      isCurrent: true,
      terms: [
        { id: 't1', name: 'Fall Semester', startDate: '2024-08-15', endDate: '2024-12-20', type: 'semester' },
        { id: 't2', name: 'Spring Semester', startDate: '2025-01-06', endDate: '2025-06-15', type: 'semester' },
      ],
      isLocked: true,
      activatedAt: '2024-08-01',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'ay-2',
      tenantId: user?.tenantId || '',
      schoolId,
      name: '2025-2026',
      startDate: '2025-08-15',
      endDate: '2026-06-15',
      status: 'planning',
      isCurrent: false,
      terms: [
        { id: 't3', name: 'Fall Semester', startDate: '2025-08-15', endDate: '2025-12-20', type: 'semester' },
        { id: 't4', name: 'Spring Semester', startDate: '2026-01-06', endDate: '2026-06-15', type: 'semester' },
      ],
      isLocked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'ay-0',
      tenantId: user?.tenantId || '',
      schoolId,
      name: '2023-2024',
      startDate: '2023-08-15',
      endDate: '2024-06-15',
      status: 'completed',
      isCurrent: false,
      terms: [
        { id: 't5', name: 'Fall Semester', startDate: '2023-08-15', endDate: '2023-12-20', type: 'semester' },
        { id: 't6', name: 'Spring Semester', startDate: '2024-01-06', endDate: '2024-06-15', type: 'semester' },
      ],
      isLocked: true,
      activatedAt: '2023-08-01',
      completedAt: '2024-06-30',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]

  // Sprint 2 / Ticket 2.3 — bind to `isCurrent`, not `status === 'active'`.
  // The two are independent: an AY can be active without being designated
  // current (e.g. during a transition window or as a result of the bug
  // this sprint fixes).
  const currentYear = displayYears.find((y) => y.isCurrent)
  // Drift state: active AYs that are NOT current. Surfaces the bug
  // operators are most likely to encounter so they can self-recover via
  // the "Set as Current" button added in Ticket 2.4.
  const driftedActiveYear = displayYears.find(
    (y) => y.status === 'active' && !y.isCurrent
  )
  const planningYears = displayYears.filter((y) => y.status === 'planning')

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerChildren}
      className="space-y-6"
    >
      {/* Alerts */}
      <AnimatePresence>
        {saveSuccess && (
          <SettingsAlert
            type="success"
            message="Academic year saved"
            onDismiss={() => setSaveSuccess(false)}
            autoDismiss
            autoDismissDelay={2000}
          />
        )}
        {saveError && (
          <SettingsAlert
            type="error"
            message={saveError}
            onDismiss={() => setSaveError(null)}
          />
        )}
      </AnimatePresence>

      {/* Header Actions */}
      <motion.div variants={fadeInUp} className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))]">Academic Years</h3>
          <p className="text-sm text-[rgb(var(--text-tertiary))]">
            Manage the temporal boundaries for academic data
          </p>
        </div>
        <Button variant={'outline'} onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Academic Year
        </Button>
      </motion.div>

      {/* Current Academic Year Highlight (Ticket 2.3 — bound to isCurrent) */}
      {currentYear && (
        <SettingsSection
          title="Current Academic Year"
          icon={Play}
          description="The year that anchors all downstream reads (dashboards, attendance, grades)"
        >
          <div className="p-4 rounded-xl bg-gradient-to-r from-[rgb(var(--state-info-bg)/0.14)] to-[rgb(var(--state-info-bg)/0.14)] border border-[rgb(var(--border-focus)/0.35)]">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-bold text-[rgb(var(--text-primary))]">{currentYear.name}</h4>
                  <StatusBadge status={currentYear.status} />
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[rgb(var(--action-primary-bg))]/20 text-[rgb(var(--state-info-fg))] ">
                    Current
                  </span>
                </div>
                <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
                  {new Date(currentYear.startDate).toLocaleDateString()} - {new Date(currentYear.endDate).toLocaleDateString()}
                </p>
                {currentYear.terms && (
                  <div className="flex items-center gap-4 mt-3">
                    {currentYear.terms.map((term: Term) => (
                      <div key={term.id} className="text-xs">
                        <span className="font-medium text-[rgb(var(--text-secondary))]">{term.name}</span>
                        <span className="text-[rgb(var(--text-tertiary))] ml-1">
                          ({new Date(term.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(term.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {currentYear.status === 'active' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Mark "${currentYear.name}" as completed? This will end the current academic year.`)) {
                        completeMutation.mutate(currentYear.id)
                      }
                    }}
                    disabled={completeMutation.isPending}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Complete Year
                  </Button>
                )}
                <Lock className="w-5 h-5 text-[rgb(var(--text-tertiary))]" />
              </div>
            </div>
          </div>
        </SettingsSection>
      )}

      {/* Drift-state callout (Tickets 2.3 + 2.5) — surfaces the bug when a
          year is active but not designated current. Sprint 4 (backend
          auto-promote) eventually prevents new schools from landing here,
          but until then the operator can self-recover with one click. */}
      {!currentYear && driftedActiveYear && (
        <motion.div variants={fadeInUp}>
          <div className="flex items-start gap-3 p-4 rounded-xl bg-golden-500/10 border border-golden-500/30">
            <AlertCircle className="w-5 h-5 text-golden-600 dark:text-golden-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-[rgb(var(--text-primary))]">
                Academic year &quot;{driftedActiveYear.name}&quot; is active but no year is designated as current.
              </p>
              <p className="text-[rgb(var(--text-tertiary))] mt-1">
                Dashboards, attendance, and grades depend on a designated current year.
              </p>
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (
                      confirm(
                        `Make "${driftedActiveYear.name}" the current academic year? This will anchor dashboards, attendance, and grades on this year.`
                      )
                    ) {
                      setCurrentMutation.mutate(driftedActiveYear.id)
                    }
                  }}
                  disabled={setCurrentMutation.isPending}
                >
                  <Star className="w-4 h-4 mr-1" />
                  Set as Current
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Planning Years - Actionable */}
      {planningYears.length > 0 && (
        <SettingsSection
          title="Upcoming Academic Years"
          icon={Clock}
          description="Years in planning that can be edited and activated"
        >
          <div className="space-y-3">
            {planningYears.map((year) => (
              <motion.div
                key={year.id}
                variants={fadeInUp}
                className="p-4 rounded-xl bg-[rgb(var(--background-secondary))] border border-[rgb(var(--border-primary))] hover:border-golden-500/30 transition-all cursor-pointer"
                onClick={() => setYearToEdit(year)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-[rgb(var(--text-primary))]">{year.name}</h4>
                      <StatusBadge status={year.status} />
                      {/* A planning AY *can* be the designated current year
                          (e.g. the upcoming year is pre-designated). Surface
                          the flag here too so the planning section stays
                          truthful. */}
                      {year.isCurrent && <CurrentPill />}
                    </div>
                    <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
                      {new Date(year.startDate).toLocaleDateString()} - {new Date(year.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setYearToEdit(year)}
                      className="p-2 rounded-lg hover:bg-[rgb(var(--background-tertiary))] text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] transition-colors"
                      title="Edit academic year"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {/* Sprint 2 / Ticket 2.4: Set as Current — hidden when
                        already current. Confirms intent before flipping
                        (clearing any other AY's isCurrent is a one-way
                        observable change for downstream dashboards). */}
                    {!year.isCurrent && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const otherCurrent = displayYears.find(
                            (y) => y.isCurrent && y.id !== year.id
                          )
                          const message = otherCurrent
                            ? `Make "${year.name}" the current academic year? "${otherCurrent.name}" will no longer be marked current.`
                            : `Make "${year.name}" the current academic year? Dashboards, attendance, and grades will anchor on this year.`
                          if (confirm(message)) {
                            setCurrentMutation.mutate(year.id)
                          }
                        }}
                        disabled={setCurrentMutation.isPending}
                        title="Designate as the current academic year"
                      >
                        <Star className="w-4 h-4 mr-1" />
                        Set as Current
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setYearToActivate(year)}
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Activate
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </SettingsSection>
      )}

      {/* Timeline View */}
      <SettingsSection
        title="Academic Year Timeline"
        icon={Calendar}
        description="Visual history of all academic years"
      >
        <TimelineVisualization academicYears={displayYears} />
      </SettingsSection>

      {/* Info Note */}
      {displayYears.length > 0 && (
        <motion.div variants={fadeInUp}>
          <div className="flex items-start gap-3 p-4 rounded-xl bg-[rgb(var(--background-secondary))] border border-[rgb(var(--border-primary))]">
            <AlertCircle className="w-5 h-5 text-[rgb(var(--text-tertiary))] flex-shrink-0 mt-0.5" />
            <div className="text-sm text-[rgb(var(--text-tertiary))]">
              <strong className="text-[rgb(var(--text-secondary))]">Note:</strong> Academic years cannot be deleted once created. 
              This preserves historical data integrity for grades, attendance records, and transcripts. 
              You can mark completed years as archived to hide them from active views.
            </div>
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {displayYears.length === 0 && (
        <div className="text-center py-12">
          <div className="p-4 rounded-full bg-[rgb(var(--background-tertiary))] inline-flex mb-4">
            <Calendar className="w-6 h-6 text-[rgb(var(--text-tertiary))]" />
          </div>
          <h3 className="font-medium text-[rgb(var(--text-primary))] mb-1">No Academic Years</h3>
          <p className="text-sm text-[rgb(var(--text-tertiary))] mb-4">
            Create your first academic year to get started
          </p>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Academic Year
          </Button>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <CreateAcademicYearModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onSubmit={(data) => createMutation.mutate(data)}
            isLoading={createMutation.isPending}
            schoolId={schoolId}
            calendarSystem={calendarSystem}
          />
        )}
        {yearToEdit && (
          <EditAcademicYearModal
            isOpen={!!yearToEdit}
            year={yearToEdit}
            onClose={() => setYearToEdit(null)}
            onSubmit={(data) => updateMutation.mutate({ yearId: yearToEdit.id, data })}
            isLoading={updateMutation.isPending}
            calendarSystem={calendarSystem}
          />
        )}
        {yearToActivate && (
          <ActivateConfirmModal
            isOpen={!!yearToActivate}
            year={yearToActivate}
            onClose={() => setYearToActivate(null)}
            onConfirm={() => activateMutation.mutate(yearToActivate.id)}
            isLoading={activateMutation.isPending}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
