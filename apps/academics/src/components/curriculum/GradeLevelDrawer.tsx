/**
 * GradeLevelDrawer Component
 *
 * Slide-over drawer showing grade level details:
 * - Assigned courses list (clickable)
 * - Student enrollment placeholder
 * - Three-dot dropdown: Edit, Export
 *
 * Follows the same pattern as CourseDrawer.tsx.
 */

import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  X,
  Layers,
  BookOpen,
  Users,
  MoreVertical,
  Pencil,
  Download,
  GraduationCap,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import type { CourseResponseDto } from '@edforge/shared-types'
import { getSubjectAreaLabel, SUBJECT_AREA_COLORS } from '../../schemas/course.form'

// ============================================================================
// TYPES
// ============================================================================

export interface GradeLevelData {
  value: string
  label: string
  courseCount: number
  courses: CourseResponseDto[]
}

interface GradeLevelDrawerProps {
  open: boolean
  onClose: () => void
  gradeLevel: GradeLevelData | null
  onViewCourse?: (course: CourseResponseDto) => void
}

// ============================================================================
// ACTIONS DROPDOWN
// ============================================================================

function ActionsDropdown() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
        aria-label="Actions"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-48 rounded-xl bg-surface-primary border border-border-primary shadow-xl py-1.5">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                toast.info('Edit functionality coming soon')
              }}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-text-primary hover:bg-surface-secondary transition-colors"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                toast.info('Export functionality coming soon')
              }}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ============================================================================
// SECTION CARD — visual container for each content section
// ============================================================================

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof BookOpen
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border-secondary bg-surface-secondary/50 overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-3 border-b border-border-secondary bg-surface-secondary/80">
        <Icon className="w-4 h-4 text-text-tertiary" />
        <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          {title}
        </h4>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}

// ============================================================================
// COURSE ROW
// ============================================================================

function CourseRow({
  course,
  onView,
}: {
  course: CourseResponseDto
  onView?: () => void
}) {
  const subjectColors =
    SUBJECT_AREA_COLORS[course.subjectArea] ?? SUBJECT_AREA_COLORS.other

  return (
    <button
      type="button"
      onClick={onView}
      className="w-full flex items-center gap-4 p-4 bg-surface-primary rounded-xl border border-border-secondary hover:border-teal-400 transition-all text-left group"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-xs font-semibold text-text-secondary bg-surface-tertiary px-2 py-0.5 rounded-md">
            {course.courseCode}
          </span>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium ${subjectColors.bg} ${subjectColors.text}`}
          >
            {getSubjectAreaLabel(course.subjectArea)}
          </span>
        </div>
        <p className="text-sm font-medium text-text-primary truncate">
          {course.courseName}
        </p>
        <p className="text-xs text-text-tertiary mt-1">
          {course.credits} credit{course.credits !== 1 ? 's' : ''} &middot;{' '}
          {course.isActive ? 'Active' : 'Inactive'}
        </p>
      </div>
      {onView && (
        <ExternalLink className="w-4 h-4 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      )}
    </button>
  )
}

// ============================================================================
// GRADE LEVEL DRAWER
// ============================================================================

export function GradeLevelDrawer({
  open,
  onClose,
  gradeLevel,
  onViewCourse,
}: GradeLevelDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  // Handle Escape key
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  // Prevent body scroll
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

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  const activeCourses = gradeLevel?.courses.filter((c) => c.isActive) ?? []
  const inactiveCourses = gradeLevel?.courses.filter((c) => !c.isActive) ?? []

  return (
    <AnimatePresence>
      {open && gradeLevel && (
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
              className="w-screen max-w-2xl h-full"
            >
              <div className="flex h-full flex-col bg-surface-primary shadow-xl border-l border-border-secondary">
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-5 border-b border-border-secondary">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20">
                      <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h2 className="text-lg font-semibold text-text-primary">
                      {gradeLevel.label} Details
                    </h2>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ActionsDropdown />
                    <button
                      type="button"
                      onClick={onClose}
                      className="p-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-colors"
                      aria-label="Close drawer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                  {/* Hero section */}
                  <div className="px-8 py-7 bg-surface-secondary/40 border-b border-border-secondary">
                    <div className="flex items-center gap-6">
                      <div className="w-[88px] h-[88px] rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center shadow-lg ring-2 ring-white/10">
                        <span className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                          {gradeLevel.value}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-text-primary">
                          {gradeLevel.label}
                        </h3>
                        <p className="text-sm text-text-secondary mt-1">
                          {gradeLevel.courseCount} course
                          {gradeLevel.courseCount !== 1 ? 's' : ''} assigned to
                          this level
                        </p>
                      </div>
                    </div>

                    {/* Quick Stats - inside hero */}
                    <div className="grid grid-cols-3 gap-4 mt-6">
                      <div className="p-4 rounded-xl bg-surface-primary border border-border-secondary text-center">
                        <BookOpen className="w-5 h-5 text-rose-500 mx-auto mb-1.5" />
                        <p className="text-xl font-bold text-text-primary">
                          {gradeLevel.courseCount}
                        </p>
                        <p className="text-xs text-text-tertiary mt-0.5">
                          Courses
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-surface-primary border border-border-secondary text-center">
                        <GraduationCap className="w-5 h-5 text-emerald-500 mx-auto mb-1.5" />
                        <p className="text-xl font-bold text-text-primary">
                          {activeCourses.length}
                        </p>
                        <p className="text-xs text-text-tertiary mt-0.5">
                          Active
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-surface-primary border border-border-secondary text-center">
                        <Users className="w-5 h-5 text-blue-500 mx-auto mb-1.5" />
                        <p className="text-xl font-bold text-text-primary">
                          &mdash;
                        </p>
                        <p className="text-xs text-text-tertiary mt-0.5">
                          Students
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Section cards */}
                  <div className="px-8 py-6 space-y-5">
                    {/* Assigned Courses */}
                    <SectionCard icon={BookOpen} title="Assigned Courses">
                      {gradeLevel.courses.length === 0 ? (
                        <div className="py-8 text-center">
                          <BookOpen className="w-8 h-8 mx-auto text-text-tertiary mb-2" />
                          <p className="text-sm text-text-secondary">
                            No courses assigned to this grade level
                          </p>
                          <p className="text-xs text-text-tertiary mt-1">
                            Courses with this grade level will appear here.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {activeCourses.length > 0 && (
                            <>
                              <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">
                                Active ({activeCourses.length})
                              </p>
                              {activeCourses.map((course) => (
                                <CourseRow
                                  key={course.courseId}
                                  course={course}
                                  onView={
                                    onViewCourse
                                      ? () => onViewCourse(course)
                                      : undefined
                                  }
                                />
                              ))}
                            </>
                          )}
                          {inactiveCourses.length > 0 && (
                            <>
                              <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mt-5 mb-2">
                                Inactive ({inactiveCourses.length})
                              </p>
                              {inactiveCourses.map((course) => (
                                <CourseRow
                                  key={course.courseId}
                                  course={course}
                                  onView={
                                    onViewCourse
                                      ? () => onViewCourse(course)
                                      : undefined
                                  }
                                />
                              ))}
                            </>
                          )}
                        </div>
                      )}
                    </SectionCard>

                    {/* Student Enrollment (placeholder) */}
                    <SectionCard icon={Users} title="Student Enrollment">
                      <div className="py-6 text-center">
                        <Users className="w-8 h-8 mx-auto text-text-tertiary mb-2" />
                        <p className="text-sm text-text-secondary">
                          Student enrollment data by grade level
                        </p>
                        <p className="text-xs text-text-tertiary mt-1">
                          Coming in a future release
                        </p>
                      </div>
                    </SectionCard>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}
