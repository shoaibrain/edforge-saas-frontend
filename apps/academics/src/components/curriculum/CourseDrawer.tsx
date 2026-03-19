/**
 * CourseDrawer Component
 *
 * Slide-over drawer that handles:
 * - View mode: Read-only display of all course fields, with course name as title
 * - Edit mode: CourseForm pre-populated with course data, with "Editing" badge
 * - Create mode: Empty CourseForm for new course creation
 *
 * Uses framer-motion for slide animation + manual backdrop/escape handling.
 * NOTE: We intentionally avoid @headlessui/react Dialog here because its
 * aggressive "outside click" detection conflicts with form inputs inside
 * slide-over drawers, causing the drawer to close when users click form fields.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'framer-motion'
import {
  X,
  Loader2,
  BookOpen,
  Clock,
  Award,
  GraduationCap,
  Layers,
  FileText,
  AlertCircle,
} from 'lucide-react'
import { FormProvider, useForm, zodResolver } from '@edforge/forms'
import type { CourseResponseDto, CreateCourseDto, UpdateCourseDto } from '@aibrains/shared-types'
import { CourseForm } from './CourseForm'
import { useCreateCourse, useUpdateCourse } from '../../hooks/useCourses'
import { useActiveSchoolId } from '../../stores/app.store'
import { DrawerFooterCTA } from '../common/DrawerFooterCTA'
import {
  courseFormSchema,
  type CourseFormData,
  getSubjectAreaLabel,
  getCourseTypeLabel,
  getCreditTypeLabel,
  getDurationLabel,
  getGradeLevelLabel,
  SUBJECT_AREA_COLORS,
  COURSE_TYPE_COLORS,
} from '../../schemas/course.form'

// ============================================================================
// TYPES
// ============================================================================

export type DrawerMode = 'view' | 'edit' | 'create'

interface CourseDrawerProps {
  /** Whether the drawer is open */
  open: boolean
  /** Callback to close the drawer */
  onClose: () => void
  /** Current mode */
  mode: DrawerMode
  /** Course data (required for view/edit modes) */
  course?: CourseResponseDto | null
  /** Callback when mode changes */
  onModeChange?: (mode: DrawerMode) => void
  /** School's configured grade range for filtering grade options */
  schoolGradeRange?: { start: string; end: string } | null
}

// ============================================================================
// DETAIL VIEW HELPERS
// ============================================================================

function SectionHeader({ icon: Icon, title }: { icon: typeof BookOpen; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border-secondary">
      <Icon className="w-4 h-4 text-text-tertiary" />
      <h4 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
        {title}
      </h4>
    </div>
  )
}

function DetailField({
  label,
  value,
  mono,
}: {
  label: string
  value: React.ReactNode
  mono?: boolean
}) {
  return (
    <div>
      <dt className="text-xs font-medium text-text-tertiary mb-0.5">{label}</dt>
      <dd className={`text-sm text-text-primary ${mono ? 'font-mono' : ''}`}>
        {value || <span className="text-text-tertiary">—</span>}
      </dd>
    </div>
  )
}

function Badge({
  label,
  bg,
  text,
}: {
  label: string
  bg: string
  text: string
}) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${bg} ${text}`}>
      {label}
    </span>
  )
}

// ============================================================================
// DETAIL VIEW
// ============================================================================

function CourseDetailView({
  course,
}: {
  course: CourseResponseDto
}) {
  const subjectColors = SUBJECT_AREA_COLORS[course.subjectArea] ?? SUBJECT_AREA_COLORS.other
  const typeColors = COURSE_TYPE_COLORS[course.courseType] ?? COURSE_TYPE_COLORS.required

  // Avoid showing duplicate badges when creditType label matches courseType label
  const courseTypeLabel = getCourseTypeLabel(course.courseType)
  const creditTypeLabel = course.creditType ? getCreditTypeLabel(course.creditType) : null
  const showCreditBadge = creditTypeLabel && creditTypeLabel !== courseTypeLabel

  return (
    <div className="space-y-6">
      {/* Quick badges */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          label={getSubjectAreaLabel(course.subjectArea)}
          bg={subjectColors.bg}
          text={subjectColors.text}
        />
        <Badge
          label={courseTypeLabel}
          bg={typeColors.bg}
          text={typeColors.text}
        />
        {showCreditBadge && (
          <Badge
            label={creditTypeLabel}
            bg="bg-slate-50"
            text="text-slate-700"
          />
        )}
      </div>

      {/* Classification */}
      <div>
        <SectionHeader icon={GraduationCap} title="Classification" />
        <div className="grid grid-cols-2 gap-4">
          <DetailField label="Subject Area" value={getSubjectAreaLabel(course.subjectArea)} />
          <DetailField label="Course Type" value={getCourseTypeLabel(course.courseType)} />
          <DetailField label="Credits" value={`${course.credits}${course.creditType ? ` (${getCreditTypeLabel(course.creditType)})` : ''}`} />
          <DetailField label="Duration" value={getDurationLabel(course.typicalDuration)} />
          {course.periodsPerWeek && (
            <DetailField label="Periods/Week" value={course.periodsPerWeek} />
          )}
        </div>
      </div>

      {/* Grade Levels */}
      <div>
        <SectionHeader icon={Layers} title="Grade Levels" />
        <div className="flex flex-wrap gap-2">
          {course.gradeLevels.map((g) => (
            <span
              key={g}
              className="px-2.5 py-1 text-sm font-medium bg-surface-tertiary text-text-primary rounded-lg"
            >
              {getGradeLevelLabel(g)}
            </span>
          ))}
        </div>
      </div>

      {/* Description */}
      {course.description && (
        <div>
          <SectionHeader icon={FileText} title="Description" />
          <p className="text-sm text-text-secondary leading-relaxed">
            {course.description}
          </p>
        </div>
      )}

      {/* Objectives */}
      {course.objectives && course.objectives.length > 0 && (
        <div>
          <SectionHeader icon={Award} title="Learning Objectives" />
          <ul className="space-y-1.5">
            {course.objectives.map((obj, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0" />
                {obj}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Materials */}
      {course.textbooks && course.textbooks.length > 0 && (
        <div>
          <SectionHeader icon={BookOpen} title="Course Materials" />
          <div className="space-y-2">
            {course.textbooks.map((mat, i) => (
              <div
                key={mat.materialId ?? i}
                className="flex items-start gap-3 p-3 bg-surface-secondary rounded-lg"
              >
                <BookOpen className="w-4 h-4 text-text-tertiary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-text-primary">{mat.title}</p>
                  {mat.author && (
                    <p className="text-xs text-text-secondary">by {mat.author}</p>
                  )}
                  {mat.isbn && (
                    <p className="text-xs text-text-tertiary font-mono">ISBN: {mat.isbn}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div>
        <SectionHeader icon={Clock} title="Metadata" />
        <div className="grid grid-cols-2 gap-4">
          <DetailField
            label="Created"
            value={
              course.createdAt
                ? new Date(course.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })
                : undefined
            }
          />
          <DetailField
            label="Last Updated"
            value={
              course.updatedAt
                ? new Date(course.updatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })
                : undefined
            }
          />
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// FORM VIEW (Create/Edit)
// ============================================================================

function CourseFormView({
  course,
  mode,
  onClose,
  onSuccess,
  schoolGradeRange,
}: {
  course?: CourseResponseDto | null
  mode: 'create' | 'edit'
  onClose: () => void
  onSuccess: () => void
  schoolGradeRange?: { start: string; end: string } | null
}) {
  const schoolId = useActiveSchoolId()
  const createMutation = useCreateCourse()
  const updateMutation = useUpdateCourse()
  const isPending = createMutation.isPending || updateMutation.isPending

  const form = useForm<CourseFormData>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: mode === 'edit' && course
      ? {
          courseCode: course.courseCode,
          courseName: course.courseName,
          subjectArea: course.subjectArea,
          courseType: course.courseType,
          creditType: course.creditType ?? undefined,
          credits: course.credits,
          typicalDuration: course.typicalDuration,
          gradeLevels: course.gradeLevels,
          description: course.description ?? '',
          objectives: course.objectives ?? [],
          prerequisites: course.prerequisites ?? [],
          periodsPerWeek: course.periodsPerWeek ?? undefined,
        }
      : {
          courseCode: '',
          courseName: '',
          gradeLevels: [],
          credits: 1,
          description: '',
          objectives: [],
          prerequisites: [],
        },
    mode: 'onBlur',
  })

  const onSubmit = useCallback(
    async (data: CourseFormData) => {
      if (mode === 'create') {
        const payload: CreateCourseDto = {
          ...data,
          schoolId: schoolId || '',
          description: data.description || undefined,
          creditType: data.creditType ?? undefined,
          periodsPerWeek: data.periodsPerWeek ?? undefined,
          objectives: data.objectives && data.objectives.length > 0 ? data.objectives : undefined,
        }
        await createMutation.mutateAsync(payload)
        onSuccess()
      } else if (course) {
        const payload: UpdateCourseDto = {
          courseName: data.courseName,
          subjectArea: data.subjectArea,
          courseType: data.courseType,
          creditType: data.creditType ?? undefined,
          credits: data.credits,
          typicalDuration: data.typicalDuration,
          gradeLevels: data.gradeLevels,
          description: data.description || undefined,
          objectives: data.objectives && data.objectives.length > 0 ? data.objectives : undefined,
          periodsPerWeek: data.periodsPerWeek ?? undefined,
        }
        await updateMutation.mutateAsync({
          courseId: course.courseId,
          schoolId: schoolId || course.schoolId,
          data: payload,
        })
        onSuccess()
      }
    },
    [mode, course, schoolId, createMutation, updateMutation, onSuccess]
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
          <CourseForm isEdit={mode === 'edit'} schoolGradeRange={schoolGradeRange} />
        </div>

        {/* Footer — always visible at bottom */}
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
              'Create Course'
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
// COURSE DRAWER
// ============================================================================

export function CourseDrawer({
  open,
  onClose,
  mode: initialMode,
  course,
  onModeChange: _onModeChange,
  schoolGradeRange,
}: CourseDrawerProps) {
  const [internalMode, setInternalMode] = useState<DrawerMode>(initialMode)
  const panelRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  // Sync internal mode with prop
  useEffect(() => {
    setInternalMode(initialMode)
  }, [initialMode])

  // Handle Escape key to close
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      }
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

  const handleClose = () => {
    setInternalMode(initialMode)
    onClose()
  }

  const handleSuccess = () => {
    handleClose()
  }

  // Close on backdrop click only — NOT on panel clicks
  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only close if click is directly on the backdrop, not bubbled from panel
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  // Navigate to Course Detail Page with race-condition-safe timing
  const handleViewDetails = () => {
    if (!course) return
    const target = `/curriculum/${course.courseId}`
    handleClose()
    queueMicrotask(() => navigate({ to: target }))
  }

  // Dynamic title: entity name in view/edit, generic in create
  const title =
    internalMode === 'create'
      ? 'Add New Course'
      : course?.courseName || 'Course Details'

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="course-drawer-title">
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
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-rose-500/20 to-pink-500/20 flex-shrink-0">
                      <BookOpen className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2
                          id="course-drawer-title"
                          className="text-lg font-semibold text-text-primary truncate"
                        >
                          {title}
                        </h2>
                        {internalMode === 'edit' && (
                          <span className="flex-shrink-0 text-xs bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
                            Editing
                          </span>
                        )}
                      </div>
                      {/* Subtitle: course code + status (view/edit modes) */}
                      {internalMode !== 'create' && course && (
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-xs text-text-tertiary bg-surface-tertiary px-1.5 py-0.5 rounded">
                            {course.courseCode}
                          </span>
                          <span className={`text-[10px] font-medium ${course.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500'}`}>
                            {course.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-colors flex-shrink-0"
                    aria-label="Close drawer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                {internalMode === 'view' && course ? (
                  <div className="flex-1 overflow-y-auto px-6 py-4">
                    <CourseDetailView course={course} />
                  </div>
                ) : (internalMode === 'create' || internalMode === 'edit') ? (
                  <CourseFormView
                    course={course}
                    mode={internalMode === 'edit' ? 'edit' : 'create'}
                    onClose={handleClose}
                    onSuccess={handleSuccess}
                    schoolGradeRange={schoolGradeRange}
                  />
                ) : (
                  <div className="flex-1 flex items-center justify-center text-text-tertiary">
                    <div className="text-center">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">No course data available</p>
                    </div>
                  </div>
                )}

                {/* Footer CTA — view mode only */}
                {internalMode === 'view' && course && (
                  <DrawerFooterCTA
                    label="View Details"
                    onClick={handleViewDetails}
                    entityName={course.courseName}
                  />
                )}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}
