/**
 * SectionDrawer Component
 *
 * Slide-over drawer for section create/edit/view.
 * Uses framer-motion for animation (not @headlessui/react Dialog).
 * Follows the CourseDrawer pattern.
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence, motion } from 'framer-motion'
import {
  X,
  CalendarDays,
  Loader2,
  BookOpen,
  User,
  Users,
  MapPin,
  AlertCircle,
  Pencil,
} from 'lucide-react'
import type { SectionResponseDto, CreateSectionDto, UpdateSectionDto } from '@aibrains/shared-types'
import { useActiveSchoolId } from '../../stores/app.store'
import { useCreateSection, useUpdateSection } from '../../hooks/useSections'
import {
  sectionFormSchema,
  defaultSectionFormData,
  getCapacityColor,
  getCapacityPercent,
  getCapacityLabel,
  type SectionFormData,
} from '../../schemas/section.form'
import { SectionForm } from './SectionForm'

// ============================================================================
// TYPES
// ============================================================================

export type DrawerMode = 'view' | 'edit' | 'create'

interface SectionDrawerProps {
  open: boolean
  onClose: () => void
  mode: DrawerMode
  section?: SectionResponseDto | null
  onModeChange?: (mode: DrawerMode) => void
  onSuccess?: () => void
}

// ============================================================================
// DETAIL VIEW (Read-only)
// ============================================================================

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BookOpen
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="p-1.5 rounded-md bg-surface-secondary">
        <Icon className="w-4 h-4 text-text-tertiary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-text-tertiary">{label}</div>
        <div className="text-sm text-text-primary mt-0.5">{value || '—'}</div>
      </div>
    </div>
  )
}

function SectionDetailView({
  section,
  onEdit,
}: {
  section: SectionResponseDto
  onEdit: () => void
}) {
  const percent = getCapacityPercent(section.currentEnrollment, section.maxEnrollment)
  const barColor = getCapacityColor(section.currentEnrollment, section.maxEnrollment)

  return (
    <div className="space-y-6">
      {/* Quick edit */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit Section
        </button>
      </div>

      {/* Details */}
      <div className="divide-y divide-border-secondary">
        <DetailRow
          icon={BookOpen}
          label="Course"
          value={
            <span>
              {section.courseName || '—'}
              {section.courseCode && (
                <span className="text-text-tertiary ml-1">({section.courseCode})</span>
              )}
            </span>
          }
        />
        <DetailRow
          icon={User}
          label="Primary Teacher"
          value={section.primaryTeacherName}
        />
        <DetailRow icon={MapPin} label="Room" value={section.roomNumber} />
        <DetailRow
          icon={Users}
          label="Enrollment"
          value={
            <div className="space-y-1.5">
              <span>{getCapacityLabel(section.currentEnrollment, section.maxEnrollment)}</span>
              <div className="h-2 bg-surface-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${barColor}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          }
        />
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-secondary">
        <div
          className={`w-2 h-2 rounded-full ${section.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`}
        />
        <span className="text-sm text-text-secondary">
          {section.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>
    </div>
  )
}

// ============================================================================
// FORM VIEW (Create/Edit)
// ============================================================================

function SectionFormView({
  section,
  mode,
  onClose,
  onSuccess,
}: {
  section?: SectionResponseDto | null
  mode: 'create' | 'edit'
  onClose: () => void
  onSuccess: () => void
}) {
  const schoolId = useActiveSchoolId() || ''
  const createMutation = useCreateSection()
  const updateMutation = useUpdateSection()
  const isPending = createMutation.isPending || updateMutation.isPending

  const defaultValues = useMemo(() => {
    if (mode === 'edit' && section) {
      return {
        courseId: section.courseId,
        sectionNumber: section.sectionNumber,
        sectionName: section.sectionName || '',
        primaryTeacherId: section.primaryTeacherId,
        coTeacherIds: section.coTeacherIds || [],
        room: section.roomNumber || '',
        maxEnrollment: section.maxEnrollment,
        academicYearId: section.academicYearId,
        termId: section.termId || '',
      }
    }
    return defaultSectionFormData
  }, [mode, section])

  const form = useForm<SectionFormData>({
    resolver: zodResolver(sectionFormSchema),
    defaultValues,
    mode: 'onBlur',
  })

  const onSubmit = useCallback(
    async (data: SectionFormData) => {
      if (mode === 'create') {
        const payload: CreateSectionDto = {
          courseId: data.courseId,
          schoolId,
          academicYearId: data.academicYearId,
          termId: data.termId || undefined,
          sectionNumber: data.sectionNumber,
          sectionName: data.sectionName || undefined,
          primaryTeacherId: data.primaryTeacherId,
          coTeacherIds: data.coTeacherIds?.length ? data.coTeacherIds : undefined,
          roomId: undefined, // Room API deferred
          maxEnrollment: data.maxEnrollment,
        }
        await createMutation.mutateAsync(payload)
        onSuccess()
      } else if (mode === 'edit' && section) {
        const payload: UpdateSectionDto = {
          termId: data.termId || undefined,
          sectionNumber: data.sectionNumber,
          sectionName: data.sectionName || undefined,
          primaryTeacherId: data.primaryTeacherId,
          coTeacherIds: data.coTeacherIds?.length ? data.coTeacherIds : undefined,
          maxEnrollment: data.maxEnrollment,
        }
        await updateMutation.mutateAsync({
          sectionId: section.sectionId,
          schoolId: schoolId || section.schoolId,
          data: payload,
        })
        onSuccess()
      }
    },
    [mode, section, schoolId, createMutation, updateMutation, onSuccess]
  )

  // Prevent Enter key in text inputs from submitting the form
  const handleFormKeyDown = (e: React.KeyboardEvent) => {
    if (
      e.key === 'Enter' &&
      e.target instanceof HTMLElement &&
      e.target.tagName !== 'TEXTAREA' &&
      e.target.getAttribute('type') !== 'submit'
    ) {
      e.preventDefault()
    }
  }

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        onKeyDown={handleFormKeyDown}
        className="flex flex-col flex-1 min-h-0 overflow-hidden"
      >
        {/* Scrollable form content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <SectionForm isEdit={mode === 'edit'} />
        </div>

        {/* Footer — always visible */}
        <div className="shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-border-secondary bg-surface-secondary/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium text-text-secondary bg-surface-primary border border-border-primary rounded-lg hover:bg-surface-secondary transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-500 rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : mode === 'create' ? (
              'Create Section'
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </FormProvider>
  )
}

// ============================================================================
// SECTION DRAWER
// ============================================================================

export function SectionDrawer({
  open,
  onClose,
  mode: initialMode,
  section,
  onModeChange,
  onSuccess,
}: SectionDrawerProps) {
  const [internalMode, setInternalMode] = useState<DrawerMode>(initialMode)
  const panelRef = useRef<HTMLDivElement>(null)

  // Sync internal mode with prop
  useEffect(() => {
    setInternalMode(initialMode)
  }, [initialMode])

  // Handle Escape key to close
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open])

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const switchToEdit = () => {
    setInternalMode('edit')
    onModeChange?.('edit')
  }

  const handleClose = () => {
    setInternalMode(initialMode)
    onClose()
  }

  const handleSuccess = () => {
    handleClose()
    onSuccess?.()
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  const title =
    internalMode === 'create'
      ? 'Add New Section'
      : internalMode === 'edit'
        ? 'Edit Section'
        : 'Section Details'

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm"
            onClick={handleBackdropClick}
            aria-hidden="true"
          />

          {/* Slide-over panel */}
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <motion.div
              ref={panelRef}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="w-screen max-w-xl h-full"
            >
              <div className="flex h-full flex-col bg-surface-primary shadow-xl border-l border-border-secondary">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border-secondary">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20">
                      <CalendarDays className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h2 className="text-lg font-semibold text-text-primary">
                      {title}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-colors"
                    aria-label="Close drawer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                {internalMode === 'view' && section ? (
                  <div className="flex-1 overflow-y-auto px-6 py-4">
                    <SectionDetailView section={section} onEdit={switchToEdit} />
                  </div>
                ) : internalMode === 'create' || internalMode === 'edit' ? (
                  <SectionFormView
                    section={section}
                    mode={internalMode === 'edit' ? 'edit' : 'create'}
                    onClose={handleClose}
                    onSuccess={handleSuccess}
                  />
                ) : (
                  <div className="flex-1 flex items-center justify-center text-text-tertiary">
                    <div className="text-center">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">No section data available</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}
