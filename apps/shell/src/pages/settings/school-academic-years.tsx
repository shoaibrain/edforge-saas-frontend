/**
 * School Academic Years Page
 * 
 * Manage academic years and their lifecycle for a school.
 * Academic years are critical temporal boundaries for all school data.
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
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { tenantService, type CreateGradingPeriodDto } from '@/services/tenant.service'
import type { Term } from '@edforge/types'
import type {
  CreateAcademicYearDto,
  UpdateAcademicYearDto,
} from '@edforge/shared-types'
import {
  SettingsSection,
  SettingsAlert,
  staggerChildren,
  fadeInUp,
} from '@/components/settings/SettingsShared'
import { Button } from '@edforge/ui'

// ============================================================================
// LOCAL TYPES
// ============================================================================

type AcademicYearStatus = 'planning' | 'active' | 'completed'

interface AcademicYear {
  id: string
  tenantId: string
  schoolId: string
  schoolName?: string
  name: string
  startDate: string
  endDate: string
  status: AcademicYearStatus
  terms: Term[]
  isLocked: boolean
  activatedAt?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

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
      ${status === 'active' && 'bg-teal-500/10 text-teal-700 dark:text-teal-400'}
      ${status === 'completed' && 'bg-slate-500/10 text-slate-700 dark:text-slate-400'}
    `}>
      <Icon className="w-3 h-3" />
      {config.label}
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
                ${isActive && 'bg-teal-500 ring-4 ring-teal-500/20'}
                ${isCompleted && 'bg-slate-400'}
                ${!isActive && !isCompleted && 'bg-golden-500'}
              `}>
                {isActive && <Play className="w-3 h-3 text-white" />}
                {isCompleted && <CheckCircle className="w-3 h-3 text-white" />}
                {!isActive && !isCompleted && <Clock className="w-3 h-3 text-white" />}
              </div>

              {/* Year card */}
              <div className={`
                flex-1 p-4 rounded-xl border transition-all
                ${isActive
                  ? 'bg-teal-500/5 border-teal-500/30 shadow-sm'
                  : 'bg-[rgb(var(--surface-secondary))] border-[rgb(var(--border-primary))] hover:border-[rgb(var(--border-secondary))]'
                }
              `}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-[rgb(var(--text-primary))]">{year.name}</h4>
                      <StatusBadge status={year.status} />
                      {year.isLocked && <Lock className="w-3.5 h-3.5 text-[rgb(var(--text-tertiary))]" />}
                    </div>
                    <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
                      {new Date(year.startDate).toLocaleDateString()} - {new Date(year.endDate).toLocaleDateString()}
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
}

function CreateAcademicYearModal({ isOpen, onClose, onSubmit, isLoading, schoolId }: CreateAcademicYearModalProps) {
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [termStructure, setTermStructure] = useState<'semester' | 'trimester' | 'quarter'>('semester')

  // Generate grading period DTOs that match backend schema
  const generateGradingPeriods = (): CreateGradingPeriodDto[] => {
    if (!startDate || !endDate) return []

    const start = new Date(startDate)
    const end = new Date(endDate)
    const totalDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

    const termConfigs = {
      semester: { count: 2, names: ['Fall Semester', 'Spring Semester'], shortNames: ['Fall', 'Spring'] },
      trimester: { count: 3, names: ['Fall Trimester', 'Winter Trimester', 'Spring Trimester'], shortNames: ['T1', 'T2', 'T3'] },
      quarter: { count: 4, names: ['Q1', 'Q2', 'Q3', 'Q4'], shortNames: ['Q1', 'Q2', 'Q3', 'Q4'] },
    }

    const config = termConfigs[termStructure]
    const daysPerTerm = Math.floor(totalDays / config.count)

    return config.names.map((periodName, index) => {
      const termStart = new Date(start)
      termStart.setDate(termStart.getDate() + (index * daysPerTerm))

      const termEnd = new Date(termStart)
      termEnd.setDate(termEnd.getDate() + daysPerTerm - 1)

      // Last term ends on the year end date
      if (index === config.count - 1) {
        termEnd.setTime(end.getTime())
      }

      return {
        name: periodName,
        shortName: config.shortNames[index],
        termType: termStructure,
        sequence: index + 1,
        startDate: termStart.toISOString().split('T')[0],
        endDate: termEnd.toISOString().split('T')[0],
      }
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      schoolId,
      name,
      startDate,
      endDate,
      calendarType: termStructure,
      generatedTerms: generateGradingPeriods(),
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-lg bg-[rgb(var(--surface-primary))] rounded-2xl shadow-xl p-6"
      >
        <h2 className="text-xl font-semibold text-[rgb(var(--text-primary))] mb-4">Create Academic Year</h2>

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
              placeholder="e.g., 2025-2026"
              className="w-full px-3 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">
              Term Structure
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'semester', label: 'Semester', count: 2 },
                { value: 'trimester', label: 'Trimester', count: 3 },
                { value: 'quarter', label: 'Quarter', count: 4 },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTermStructure(option.value as typeof termStructure)}
                  className={`
                    p-3 rounded-xl border-2 text-center transition-all
                    ${termStructure === option.value
                      ? 'border-teal-500 bg-teal-500/5'
                      : 'border-[rgb(var(--border-primary))] hover:border-[rgb(var(--border-secondary))]'
                    }
                  `}
                >
                  <p className={`text-sm font-medium ${termStructure === option.value ? 'text-teal-700 dark:text-teal-400' : 'text-[rgb(var(--text-primary))]'}`}>
                    {option.label}
                  </p>
                  <p className="text-xs text-[rgb(var(--text-tertiary))]">{option.count} terms</p>
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-[rgb(var(--surface-tertiary))]">
            <AlertCircle className="w-4 h-4 text-[rgb(var(--text-tertiary))] mt-0.5 flex-shrink-0" />
            <p className="text-xs text-[rgb(var(--text-tertiary))]">
              The academic year will be created in "Planning" status.
              You can activate it when ready. Once active, dates cannot be changed.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-secondary))] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !name || !startDate || !endDate}
              className="px-4 py-2 rounded-xl bg-teal-500 text-white text-sm font-medium hover:bg-teal-600 transition-colors disabled:opacity-50"
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
}

function EditAcademicYearModal({ isOpen, year, onClose, onSubmit, isLoading }: EditAcademicYearModalProps) {
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
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-lg bg-[rgb(var(--surface-primary))] rounded-2xl shadow-xl p-6"
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
              className="w-full px-3 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                disabled={!canEdit}
                className="w-full px-3 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                disabled={!canEdit}
                className="w-full px-3 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Info for locked years */}
          {!canEdit && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-[rgb(var(--surface-tertiary))]">
              <Lock className="w-4 h-4 text-[rgb(var(--text-tertiary))] mt-0.5 flex-shrink-0" />
              <p className="text-xs text-[rgb(var(--text-tertiary))]">
                This academic year is {year.status} and cannot be modified.
                Dates are locked to maintain data integrity.
              </p>
            </div>
          )}

          {/* Info for planning years */}
          {canEdit && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-[rgb(var(--surface-tertiary))]">
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
              className="px-4 py-2 rounded-xl text-sm font-medium text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-secondary))] transition-colors"
            >
              {canEdit ? 'Cancel' : 'Close'}
            </button>
            {canEdit && (
              <button
                type="submit"
                disabled={isLoading || !name || !startDate || !endDate}
                className="px-4 py-2 rounded-xl bg-teal-500 text-white text-sm font-medium hover:bg-teal-600 transition-colors disabled:opacity-50"
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
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md bg-[rgb(var(--surface-primary))] rounded-2xl shadow-xl p-6"
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
              className="px-4 py-2 rounded-xl text-sm font-medium text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-secondary))] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl bg-teal-500 text-white text-sm font-medium hover:bg-teal-600 transition-colors disabled:opacity-50"
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

  // Note: Academic years cannot be deleted by design
  // This preserves historical data integrity

  // Mock data if API fails
  const displayYears: AcademicYear[] = academicYears || [
    {
      id: 'ay-1',
      tenantId: user?.tenantId || '',
      schoolId,
      name: '2024-2025',
      startDate: '2024-08-15',
      endDate: '2025-06-15',
      status: 'active',
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

  const activeYear = displayYears.find((y) => y.status === 'active')
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
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Academic Year
        </Button>
      </motion.div>

      {/* Current Active Year Highlight */}
      {activeYear && (
        <SettingsSection
          title="Current Academic Year"
          icon={Play}
          description="Currently active year for all school operations"
        >
          <div className="p-4 rounded-xl bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border border-teal-500/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-bold text-[rgb(var(--text-primary))]">{activeYear.name}</h4>
                  <StatusBadge status={activeYear.status} />
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-teal-500/20 text-teal-700 dark:text-teal-400">
                    Current
                  </span>
                </div>
                <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
                  {new Date(activeYear.startDate).toLocaleDateString()} - {new Date(activeYear.endDate).toLocaleDateString()}
                </p>
                {activeYear.terms && (
                  <div className="flex items-center gap-4 mt-3">
                    {activeYear.terms.map((term: Term) => (
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (confirm(`Mark "${activeYear.name}" as completed? This will end the current academic year.`)) {
                      completeMutation.mutate(activeYear.id)
                    }
                  }}
                  disabled={completeMutation.isPending}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Complete Year
                </Button>
                <Lock className="w-5 h-5 text-[rgb(var(--text-tertiary))]" />
              </div>
            </div>
          </div>
        </SettingsSection>
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
                className="p-4 rounded-xl bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-primary))] hover:border-golden-500/30 transition-all cursor-pointer"
                onClick={() => setYearToEdit(year)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-[rgb(var(--text-primary))]">{year.name}</h4>
                      <StatusBadge status={year.status} />
                    </div>
                    <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
                      {new Date(year.startDate).toLocaleDateString()} - {new Date(year.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setYearToEdit(year)}
                      className="p-2 rounded-lg hover:bg-[rgb(var(--surface-tertiary))] text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] transition-colors"
                      title="Edit academic year"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
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
          <div className="flex items-start gap-3 p-4 rounded-xl bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-primary))]">
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
          <div className="p-4 rounded-full bg-[rgb(var(--surface-tertiary))] inline-flex mb-4">
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
          />
        )}
        {yearToEdit && (
          <EditAcademicYearModal
            isOpen={!!yearToEdit}
            year={yearToEdit}
            onClose={() => setYearToEdit(null)}
            onSubmit={(data) => updateMutation.mutate({ yearId: yearToEdit.id, data })}
            isLoading={updateMutation.isPending}
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
