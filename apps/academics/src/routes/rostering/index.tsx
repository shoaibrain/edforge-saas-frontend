/**
 * Bulk Rostering Matrix Page
 *
 * Matrix-based UI for managing student-to-section assignments in bulk.
 * Rows = students, Columns = sections, Checkboxes at intersections.
 *
 * Features:
 * - Checkbox matrix with pre-filled existing enrollments
 * - Conflict detection for same-period assignments
 * - Pending changes summary with batch submit
 * - CSS content-visibility for lightweight virtualization
 *
 * Sprint 5 — Rostering & Attendance
 */

import { useState, useMemo, useCallback, useRef } from 'react'
import { Grid3x3, Loader2, AlertTriangle, Check, Plus, Minus, Save } from 'lucide-react'
import { toast } from 'sonner'
import { useActiveSchoolId } from '../../stores/app.store'
import { useSchoolEnabledGradeOptions } from '../../hooks/useGradeOptions'
import { useCurrentAcademicYear } from '../../hooks'
import { useStudents, flattenStudentPages } from '../../hooks/useStudents'
import {
  useSections,
  flattenSectionPages,
  useEnrollStudent,
  useRemoveStudent,
  useBulkSectionRosters,
} from '../../hooks/useSections'
import { parseApiError } from '../../services/academics.service'
import { NoCurrentAcademicYearEmptyState } from '../../components/common'

// ============================================================================
// TYPES
// ============================================================================

/** A pending change in the matrix: enroll or remove a student from a section */
interface PendingChange {
  studentId: string
  sectionId: string
  action: 'add' | 'remove'
}

/** Conflict info when a student is assigned to 2+ sections sharing a classPeriodId */
interface ConflictInfo {
  classPeriodId: string
  conflictingSectionIds: string[]
}

/** Lightweight student shape used within the matrix */
interface MatrixStudent {
  studentId: string
  firstName: string
  lastName: string
  studentNumber?: string
  currentGradeLevel: string
}

/** Lightweight section shape used within the matrix */
interface MatrixSection {
  sectionId: string
  sectionNumber: string
  courseName?: string
  courseCode?: string
  classPeriodId?: string
  maxEnrollment: number
  currentEnrollment: number
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STUDENT_LIMIT = 200
const ROW_HEIGHT_PX = 48


// ============================================================================
// HELPER: Build initial enrollment set from roster data
// ============================================================================

/**
 * Builds a Set of "studentId::sectionId" keys representing current enrollments.
 */
function buildInitialEnrollmentSet(
  sectionIds: string[],
  rosterResults: ReturnType<typeof useBulkSectionRosters>,
): Set<string> {
  const set = new Set<string>()
  sectionIds.forEach((sectionId, idx) => {
    const result = rosterResults[idx]
    if (result?.data) {
      for (const student of result.data.students) {
        set.add(`${student.studentId}::${sectionId}`)
      }
    }
  })
  return set
}

/**
 * Computes a map of studentId -> Map<classPeriodId, sectionId[]> for conflict detection.
 * Considers the initial enrollment state plus any pending changes.
 */
function buildConflictMap(
  sections: MatrixSection[],
  effectiveEnrollments: Set<string>,
): Map<string, Map<string, string[]>> {
  // studentId -> (classPeriodId -> sectionId[])
  const map = new Map<string, Map<string, string[]>>()

  const sectionPeriodLookup = new Map<string, string>()
  for (const section of sections) {
    if (section.classPeriodId) {
      sectionPeriodLookup.set(section.sectionId, section.classPeriodId)
    }
  }

  for (const key of effectiveEnrollments) {
    const [studentId, sectionId] = key.split('::')
    const periodId = sectionPeriodLookup.get(sectionId)
    if (!periodId) continue

    if (!map.has(studentId)) {
      map.set(studentId, new Map())
    }
    const periodMap = map.get(studentId)!
    if (!periodMap.has(periodId)) {
      periodMap.set(periodId, [])
    }
    periodMap.get(periodId)!.push(sectionId)
  }

  return map
}

/**
 * Returns conflict info for a specific cell, or null if no conflict.
 */
function getCellConflict(
  studentId: string,
  sectionId: string,
  sections: MatrixSection[],
  conflictMap: Map<string, Map<string, string[]>>,
): ConflictInfo | null {
  const section = sections.find(s => s.sectionId === sectionId)
  if (!section?.classPeriodId) return null

  const studentPeriods = conflictMap.get(studentId)
  if (!studentPeriods) return null

  const sectionIdsInPeriod = studentPeriods.get(section.classPeriodId)
  if (!sectionIdsInPeriod || sectionIdsInPeriod.length < 2) return null

  // Only return conflict if this section is one of the conflicting ones
  if (!sectionIdsInPeriod.includes(sectionId)) return null

  return {
    classPeriodId: section.classPeriodId,
    conflictingSectionIds: sectionIdsInPeriod.filter(id => id !== sectionId),
  }
}

// ============================================================================
// MATRIX CHECKBOX CELL
// ============================================================================

function MatrixCell({
  checked,
  isPending,
  pendingAction,
  conflict,
  sectionLabel,
  onToggle,
}: {
  checked: boolean
  isPending: boolean
  pendingAction: 'add' | 'remove' | null
  conflict: ConflictInfo | null
  sectionLabel: string
  onToggle: () => void
}) {
  const hasConflict = conflict !== null && checked

  return (
    <td className="px-1 py-1 text-center border-r border-border-secondary relative group">
      <button
        type="button"
        onClick={onToggle}
        className={`
          w-7 h-7 rounded border-2 flex items-center justify-center mx-auto transition-all
          ${hasConflict
            ? 'border-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20'
            : checked
              ? isPending && pendingAction === 'add'
                ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100'
                : 'border-teal-500 bg-teal-500 hover:bg-teal-600 hover:border-teal-600'
              : isPending && pendingAction === 'remove'
                ? 'border-red-300 bg-red-50/50 dark:bg-red-500/5 hover:bg-red-100'
                : 'border-border-secondary hover:border-teal-400 hover:bg-surface-hover'
          }
        `}
        aria-label={`${checked ? 'Remove from' : 'Add to'} ${sectionLabel}`}
      >
        {checked && !hasConflict && (
          <Check className="w-4 h-4 text-white" />
        )}
        {checked && hasConflict && (
          <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
        )}
        {!checked && isPending && pendingAction === 'remove' && (
          <Minus className="w-3.5 h-3.5 text-red-400" />
        )}
        {checked && isPending && pendingAction === 'add' && (
          <Plus className="w-3.5 h-3.5 text-emerald-500" />
        )}
      </button>
      {/* Conflict tooltip */}
      {hasConflict && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-red-600 text-white text-xs rounded-lg shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity">
          <div className="font-medium mb-0.5">Schedule Conflict</div>
          <div>Same class period as {conflict.conflictingSectionIds.length} other section(s)</div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-red-600" />
        </div>
      )}
      {/* Pending change indicator dot */}
      {isPending && (
        <div className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${
          pendingAction === 'add' ? 'bg-emerald-500' : 'bg-red-500'
        }`} />
      )}
    </td>
  )
}

// ============================================================================
// MATRIX STUDENT ROW
// ============================================================================

function MatrixStudentRow({
  student,
  sections,
  effectiveEnrollments,
  pendingChanges,
  conflictMap,
  onToggleCell,
}: {
  student: MatrixStudent
  sections: MatrixSection[]
  effectiveEnrollments: Set<string>
  pendingChanges: Map<string, PendingChange>
  conflictMap: Map<string, Map<string, string[]>>
  onToggleCell: (studentId: string, sectionId: string) => void
}) {
  return (
    <tr
      className="hover:bg-surface-hover/50 transition-colors"
      style={{
        contentVisibility: 'auto',
        containIntrinsicSize: `0 ${ROW_HEIGHT_PX}px`,
      }}
    >
      {/* Sticky student name column */}
      <td className="sticky left-0 z-10 bg-surface-primary px-3 py-2 border-r-2 border-border-secondary whitespace-nowrap min-w-[220px]">
        <div className="text-sm font-medium text-text-primary truncate max-w-[200px]">
          {student.lastName}, {student.firstName}
        </div>
        <div className="text-xs text-text-tertiary">
          {student.studentNumber && `#${student.studentNumber}`}
          {student.currentGradeLevel && ` · Gr ${student.currentGradeLevel}`}
        </div>
      </td>
      {sections.map((section) => {
        const key = `${student.studentId}::${section.sectionId}`
        const isChecked = effectiveEnrollments.has(key)
        const pending = pendingChanges.get(key)
        const conflict = getCellConflict(
          student.studentId,
          section.sectionId,
          sections,
          conflictMap,
        )

        return (
          <MatrixCell
            key={section.sectionId}
            checked={isChecked}
            isPending={!!pending}
            pendingAction={pending?.action ?? null}
            conflict={conflict}
            sectionLabel={`${section.courseName ?? ''} ${section.sectionNumber}`}
            onToggle={() => onToggleCell(student.studentId, section.sectionId)}
          />
        )
      })}
    </tr>
  )
}

// ============================================================================
// SUMMARY BAR
// ============================================================================

function SummaryBar({
  addCount,
  removeCount,
  conflictCount,
  isSubmitting,
  progress,
  total,
  onApply,
}: {
  addCount: number
  removeCount: number
  conflictCount: number
  isSubmitting: boolean
  progress: number
  total: number
  onApply: () => void
}) {
  const hasChanges = addCount > 0 || removeCount > 0

  if (!hasChanges && !isSubmitting) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border-secondary bg-surface-primary/95 backdrop-blur-sm shadow-lg">
      {/* Progress bar */}
      {isSubmitting && total > 0 && (
        <div className="h-1 bg-surface-secondary">
          <div
            className="h-full bg-teal-500 transition-all duration-300 ease-out"
            style={{ width: `${Math.round((progress / total) * 100)}%` }}
          />
        </div>
      )}

      <div className="px-6 py-3 flex items-center justify-between max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-4">
          {addCount > 0 && (
            <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
              <Plus className="w-4 h-4" />
              {addCount} addition{addCount !== 1 ? 's' : ''}
            </span>
          )}
          {removeCount > 0 && (
            <span className="flex items-center gap-1.5 text-sm font-medium text-red-600 dark:text-red-400">
              <Minus className="w-4 h-4" />
              {removeCount} removal{removeCount !== 1 ? 's' : ''}
            </span>
          )}
          {conflictCount > 0 && (
            <span className="flex items-center gap-1.5 text-sm font-medium text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
              {conflictCount} conflict{conflictCount !== 1 ? 's' : ''}
            </span>
          )}
          {isSubmitting && (
            <span className="text-sm text-text-secondary">
              Processing {progress} of {total}...
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onApply}
          disabled={!hasChanges || isSubmitting}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-teal-500 rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isSubmitting ? 'Applying...' : 'Apply Changes'}
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// BULK ROSTERING PAGE
// ============================================================================

export function BulkRosteringPage() {
  const schoolId = useActiveSchoolId() || ''
  const { data: currentYear, isLoading: yearLoading } = useCurrentAcademicYear(schoolId)
  // Gate dropdown on profile-load — see EnrollmentTable comment.
  const { options: gradeLevelOptions, isLoading: gradeOptionsLoading } =
    useSchoolEnabledGradeOptions(schoolId || null)

  // ---------------------------------------------------------------------------
  // Filters
  // ---------------------------------------------------------------------------
  const [gradeLevelFilter, setGradeLevelFilter] = useState<string>('')
  const [courseFilter, setCourseFilter] = useState<string>('')

  // ---------------------------------------------------------------------------
  // Data Fetching: Students
  // ---------------------------------------------------------------------------
  const {
    data: studentsData,
    isLoading: studentsLoading,
    hasNextPage: hasMoreStudents,
    fetchNextPage: fetchMoreStudents,
  } = useStudents({
    schoolId,
    filters: {
      status: 'active',
      ...(gradeLevelFilter ? { gradeLevel: gradeLevelFilter } : {}),
    },
    limit: STUDENT_LIMIT,
    enabled: !!schoolId,
  })

  const allStudents: MatrixStudent[] = useMemo(() => {
    const flat = flattenStudentPages(studentsData)
    return flat.map(s => ({
      studentId: s.studentId,
      firstName: s.firstName,
      lastName: s.lastName,
      studentNumber: s.studentNumber,
      currentGradeLevel: s.currentGradeLevel,
    }))
  }, [studentsData])

  // Load all student pages
  const studentsLoadedRef = useRef(false)
  if (hasMoreStudents && !studentsLoading && !studentsLoadedRef.current) {
    fetchMoreStudents()
  }
  if (!hasMoreStudents && allStudents.length > 0) {
    studentsLoadedRef.current = true
  }

  // ---------------------------------------------------------------------------
  // Data Fetching: Sections
  // ---------------------------------------------------------------------------
  const {
    data: sectionsData,
    isLoading: sectionsLoading,
    hasNextPage: hasMoreSections,
    fetchNextPage: fetchMoreSections,
  } = useSections({
    schoolId,
    filters: {
      isActive: true,
      academicYearId: currentYear?.yearId,
    },
    enabled: !!schoolId && !!currentYear?.yearId,
  })

  const allSections: MatrixSection[] = useMemo(() => {
    const flat = flattenSectionPages(sectionsData)
    let filtered = flat
    if (courseFilter) {
      const lower = courseFilter.toLowerCase()
      filtered = flat.filter(s =>
        (s.courseName?.toLowerCase().includes(lower)) ||
        (s.courseCode?.toLowerCase().includes(lower))
      )
    }
    return filtered.map(s => ({
      sectionId: s.sectionId,
      sectionNumber: s.sectionNumber,
      courseName: s.courseName,
      courseCode: s.courseCode,
      classPeriodId: s.classPeriodId,
      maxEnrollment: s.maxEnrollment,
      currentEnrollment: s.currentEnrollment,
    }))
  }, [sectionsData, courseFilter])

  // Load all section pages
  const sectionsLoadedRef = useRef(false)
  if (hasMoreSections && !sectionsLoading && !sectionsLoadedRef.current) {
    fetchMoreSections()
  }
  if (!hasMoreSections && allSections.length > 0) {
    sectionsLoadedRef.current = true
  }

  // ---------------------------------------------------------------------------
  // Data Fetching: Rosters (bulk)
  // ---------------------------------------------------------------------------
  const sectionIds = useMemo(
    () => allSections.map(s => s.sectionId),
    [allSections],
  )

  const rosterResults = useBulkSectionRosters(sectionIds, schoolId)
  const rostersLoading = rosterResults.some(r => r.isLoading)

  // ---------------------------------------------------------------------------
  // Initial enrollment state (computed from roster data)
  // ---------------------------------------------------------------------------
  const initialEnrollments = useMemo(
    () => buildInitialEnrollmentSet(sectionIds, rosterResults),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sectionIds, rosterResults.map(r => r.dataUpdatedAt).join(',')],
  )

  // ---------------------------------------------------------------------------
  // Pending changes state
  // ---------------------------------------------------------------------------
  const [pendingChanges, setPendingChanges] = useState<Map<string, PendingChange>>(new Map())

  // Effective enrollments = initial + pending adds - pending removes
  const effectiveEnrollments = useMemo(() => {
    const set = new Set(initialEnrollments)
    for (const [key, change] of pendingChanges) {
      if (change.action === 'add') {
        set.add(key)
      } else {
        set.delete(key)
      }
    }
    return set
  }, [initialEnrollments, pendingChanges])

  // Conflict map based on effective state
  const conflictMap = useMemo(
    () => buildConflictMap(allSections, effectiveEnrollments),
    [allSections, effectiveEnrollments],
  )

  // Count conflicts
  const conflictCount = useMemo(() => {
    let count = 0
    for (const [, periodMap] of conflictMap) {
      for (const [, sids] of periodMap) {
        if (sids.length >= 2) {
          count += sids.length
        }
      }
    }
    return count
  }, [conflictMap])

  // Change counts
  const addCount = useMemo(
    () => Array.from(pendingChanges.values()).filter(c => c.action === 'add').length,
    [pendingChanges],
  )
  const removeCount = useMemo(
    () => Array.from(pendingChanges.values()).filter(c => c.action === 'remove').length,
    [pendingChanges],
  )

  // ---------------------------------------------------------------------------
  // Toggle a cell
  // ---------------------------------------------------------------------------
  const handleToggleCell = useCallback((studentId: string, sectionId: string) => {
    const key = `${studentId}::${sectionId}`
    setPendingChanges(prev => {
      const next = new Map(prev)
      const wasInitiallyEnrolled = initialEnrollments.has(key)
      const currentPending = next.get(key)

      if (currentPending) {
        // Toggling back cancels the pending change
        next.delete(key)
      } else if (wasInitiallyEnrolled) {
        // Was enrolled, toggle = schedule removal
        next.set(key, { studentId, sectionId, action: 'remove' })
      } else {
        // Was not enrolled, toggle = schedule addition
        next.set(key, { studentId, sectionId, action: 'add' })
      }

      return next
    })
  }, [initialEnrollments])

  // ---------------------------------------------------------------------------
  // Batch submit
  // ---------------------------------------------------------------------------
  const enrollMutation = useEnrollStudent()
  const removeMutation = useRemoveStudent()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitProgress, setSubmitProgress] = useState(0)
  const [submitTotal, setSubmitTotal] = useState(0)

  const handleApplyChanges = useCallback(async () => {
    const changes = Array.from(pendingChanges.values())
    if (changes.length === 0) return

    setIsSubmitting(true)
    setSubmitProgress(0)
    setSubmitTotal(changes.length)

    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < changes.length; i++) {
      const change = changes[i]
      try {
        if (change.action === 'add') {
          await enrollMutation.mutateAsync({
            sectionId: change.sectionId,
            schoolId,
            studentId: change.studentId,
          })
        } else {
          await removeMutation.mutateAsync({
            sectionId: change.sectionId,
            schoolId,
            studentId: change.studentId,
          })
        }
        successCount++
      } catch (error: unknown) {
        errorCount++
        const parsed = parseApiError(error)
        console.error(`Failed to ${change.action} student ${change.studentId} in section ${change.sectionId}:`, parsed.message)
      }
      setSubmitProgress(i + 1)
    }

    setIsSubmitting(false)

    if (successCount > 0 && errorCount === 0) {
      toast.success(`All ${successCount} change${successCount !== 1 ? 's' : ''} applied successfully`)
      setPendingChanges(new Map())
    } else if (successCount > 0 && errorCount > 0) {
      toast.warning(
        `${successCount} change${successCount !== 1 ? 's' : ''} applied, ${errorCount} failed. Review and retry failed changes.`,
      )
      // Clear only successful changes; keep failed ones
      setPendingChanges(() => new Map())
    } else {
      toast.error(`All ${errorCount} changes failed. Please check your connection and try again.`)
    }
  }, [pendingChanges, enrollMutation, removeMutation, schoolId])

  // ---------------------------------------------------------------------------
  // Unique course names for filter dropdown
  // ---------------------------------------------------------------------------
  const uniqueCourseNames = useMemo(() => {
    const flat = flattenSectionPages(sectionsData)
    const names = new Set<string>()
    for (const s of flat) {
      if (s.courseName) names.add(s.courseName)
    }
    return Array.from(names).sort()
  }, [sectionsData])

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------
  const isInitialLoading = yearLoading || studentsLoading || sectionsLoading || rostersLoading

  // Sprint 1 / Ticket 1.5: bulk rostering requires a current AY to know
  // which sections to roster into. The downstream sections query is already
  // gated by `!!currentYear?.yearId`, but without a gate the user sees an
  // empty grid with no guidance. Render the shared empty state instead.
  if (!yearLoading && !currentYear?.yearId) {
    return (
      <div className="p-6">
        <NoCurrentAcademicYearEmptyState
          secondaryMessage="Set up an academic year in school settings before rostering students."
        />
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-border-secondary bg-surface-secondary/50">
        <div className="px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-teal-500/20 to-blue-500/20">
              <Grid3x3 className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Bulk Rostering</h1>
              <p className="text-text-secondary mt-0.5">
                Manage student-to-section assignments across all active sections
                {currentYear && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-500/10 text-teal-600 dark:text-teal-400">
                    {currentYear.name}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="border-b border-border-secondary bg-surface-primary px-6 py-3 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label htmlFor="grade-filter" className="text-sm font-medium text-text-secondary">
            Grade Level
          </label>
          <select
            id="grade-filter"
            value={gradeLevelFilter}
            onChange={(e) => {
              setGradeLevelFilter(e.target.value)
              studentsLoadedRef.current = false
            }}
            disabled={gradeOptionsLoading}
            className="px-3 py-1.5 bg-surface-secondary border border-border-secondary rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <option value="">{gradeOptionsLoading ? 'Loading grades…' : 'All Grades'}</option>
            {!gradeOptionsLoading && gradeLevelOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="course-filter" className="text-sm font-medium text-text-secondary">
            Course
          </label>
          <select
            id="course-filter"
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="px-3 py-1.5 bg-surface-secondary border border-border-secondary rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
          >
            <option value="">All Courses</option>
            {uniqueCourseNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className="ml-auto text-xs text-text-tertiary">
          {allStudents.length} student{allStudents.length !== 1 ? 's' : ''} x{' '}
          {allSections.length} section{allSections.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Matrix */}
      <div className="flex-1 overflow-auto relative" style={{ paddingBottom: pendingChanges.size > 0 || isSubmitting ? '72px' : '0' }}>
        {isInitialLoading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-10 h-10 text-teal-500 animate-spin mb-4" />
            <p className="text-sm text-text-secondary">Loading rostering data...</p>
            <p className="text-xs text-text-tertiary mt-1">
              Fetching students, sections, and current enrollments
            </p>
          </div>
        ) : allStudents.length === 0 || allSections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Grid3x3 className="w-12 h-12 text-text-tertiary mb-4" />
            <p className="text-lg font-medium text-text-primary mb-1">No data available</p>
            <p className="text-sm text-text-secondary max-w-md text-center">
              {allStudents.length === 0
                ? 'No active students found for the selected grade level.'
                : 'No active sections found for the current academic year.'}
            </p>
          </div>
        ) : (
          <table className="border-collapse w-max min-w-full">
            {/* Sticky header row */}
            <thead className="sticky top-0 z-20">
              <tr className="bg-surface-secondary">
                {/* Top-left corner cell */}
                <th className="sticky left-0 z-30 bg-surface-secondary px-3 py-3 border-r-2 border-b border-border-secondary min-w-[220px] text-left">
                  <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Student
                  </span>
                </th>
                {allSections.map((section) => (
                  <th
                    key={section.sectionId}
                    className="px-1 py-2 border-r border-b border-border-secondary min-w-[80px] max-w-[120px]"
                  >
                    <div className="text-xs font-semibold text-text-primary truncate" title={`${section.courseName ?? ''} - Section ${section.sectionNumber}`}>
                      {section.courseCode ?? section.courseName ?? ''}
                    </div>
                    <div className="text-[10px] text-text-tertiary truncate">
                      Sec {section.sectionNumber}
                    </div>
                    <div className="text-[10px] text-text-tertiary">
                      {section.currentEnrollment}/{section.maxEnrollment}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allStudents.map((student) => (
                <MatrixStudentRow
                  key={student.studentId}
                  student={student}
                  sections={allSections}
                  effectiveEnrollments={effectiveEnrollments}
                  pendingChanges={pendingChanges}
                  conflictMap={conflictMap}
                  onToggleCell={handleToggleCell}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Summary bar */}
      <SummaryBar
        addCount={addCount}
        removeCount={removeCount}
        conflictCount={conflictCount}
        isSubmitting={isSubmitting}
        progress={submitProgress}
        total={submitTotal}
        onApply={handleApplyChanges}
      />
    </div>
  )
}

export default BulkRosteringPage
