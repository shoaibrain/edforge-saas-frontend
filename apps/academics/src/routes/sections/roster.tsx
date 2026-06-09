/**
 * Section Roster Management Page
 *
 * Two-panel UI for managing section rosters:
 * - Left: Available students (enrolled at school but NOT in section)
 * - Right: Current section roster
 *
 * Sprint 5 — Rostering & Attendance
 */

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  Search,
  UserMinus,
  Users,
  Check,
  Loader2,
  GraduationCap,
  AlertCircle,
  ChevronRight,
} from 'lucide-react'
import { z } from 'zod'
import { toast } from 'sonner'
import { useSection, useSectionRoster, useEnrollStudent, useRemoveStudent } from '../../hooks/useSections'
import { useStudents, flattenStudentPages } from '../../hooks/useStudents'
import { useActiveSchoolId } from '../../stores/app.store'
import {
  getCapacityColor,
  getCapacityPercent,
} from '../../schemas/section.form'
import { ConfirmationDialog } from '../../components/common/ConfirmationDialog'
import type { StudentSectionResponseDto } from '@aibrains/shared-types'
import { parseApiError } from '../../services/academics.service'

// ============================================================================
// CAPACITY BAR
// ============================================================================

function CapacityBar({ current, max }: { current: number; max: number }) {
  const percent = getCapacityPercent(current, max)
  const barColor = getCapacityColor(current, max)

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-text-primary">
            {current} / {max} students
          </span>
          <span className="text-xs text-text-tertiary">{percent}% full</span>
        </div>
        <div className="h-2 bg-surface-secondary rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// AVAILABLE STUDENT ROW (Left Panel)
// ============================================================================

function AvailableStudentRow({
  student,
  isSelected,
  disabled,
  onToggle,
}: {
  student: { studentId: string; firstName: string; lastName: string; studentNumber?: string; currentGradeLevel?: string }
  isSelected: boolean
  disabled: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`flex items-center gap-3 w-full px-4 py-3 text-left transition-colors ${
        isSelected
          ? 'bg-[rgb(var(--state-info-bg)/0.18)]/50 dark:bg-[rgb(var(--state-info-bg)/0.18)]'
          : disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:bg-surface-secondary/50'
      }`}
    >
      <div
        className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
          isSelected ? 'bg-[rgb(var(--state-info-bg)/0.18)]0 border-[rgb(var(--border-focus))]' : 'border-border-primary'
        }`}
      >
        {isSelected && <Check className="w-3 h-3 text-[rgb(var(--action-primary-fg))]" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-text-primary truncate">
          {student.firstName} {student.lastName}
        </div>
        <div className="text-xs text-text-tertiary">
          {student.studentNumber && `#${student.studentNumber}`}
          {student.currentGradeLevel && ` · Grade ${student.currentGradeLevel}`}
        </div>
      </div>
    </button>
  )
}

// ============================================================================
// ROSTER STUDENT ROW (Right Panel)
// ============================================================================

function RosterStudentRow({
  student,
  onRemove,
  isRemoving,
}: {
  student: StudentSectionResponseDto
  onRemove: () => void
  isRemoving: boolean
}) {
  return (
    <div className="flex items-center justify-between py-3 px-4 hover:bg-surface-secondary/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[rgb(var(--state-info-bg)/0.20)] to-[rgb(var(--state-info-bg)/0.14)] flex items-center justify-center">
          <GraduationCap className="w-4 h-4 text-[rgb(var(--action-secondary-fg))]" />
        </div>
        <div>
          <div className="text-sm font-medium text-text-primary">
            {student.studentName || student.studentId}
          </div>
          <div className="flex items-center gap-2 text-xs text-text-tertiary">
            {student.studentNumber && (
              <span>#{student.studentNumber}</span>
            )}
            {student.currentGradeLevel && (
              <span className="px-1.5 py-0.5 rounded bg-surface-tertiary text-text-secondary font-medium">
                {student.currentGradeLevel}
              </span>
            )}
            <span>Enrolled {new Date(student.enrolledAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        disabled={isRemoving}
        className="p-1.5 rounded-md text-text-tertiary hover:text-[rgb(var(--state-danger-fg))] hover:bg-[rgb(var(--state-danger-bg)/0.18)] dark:hover:bg-[rgb(var(--state-danger-bg)/0.18)] transition-colors disabled:opacity-50"
        aria-label="Remove student"
      >
        {isRemoving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <UserMinus className="w-4 h-4" />
        )}
      </button>
    </div>
  )
}

// ============================================================================
// SECTION ROSTER PAGE
// ============================================================================

export function SectionRosterPage() {
  const { sectionId } = useParams({ from: '/sections/$sectionId/roster' })
  const navigate = useNavigate()
  const schoolId = useActiveSchoolId() || ''

  // Validate sectionId
  const isValidId = useMemo(() => {
    try {
      z.string().uuid().parse(sectionId)
      return true
    } catch {
      return false
    }
  }, [sectionId])

  // Section data
  const { data: section, isLoading: sectionLoading } = useSection({
    sectionId,
    schoolId,
    enabled: isValidId && !!schoolId,
  })

  // Section roster (right panel)
  const { data: roster, isLoading: rosterLoading } = useSectionRoster({
    sectionId,
    schoolId,
    enabled: isValidId && !!schoolId,
  })

  // Available students (left panel)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [removeTarget, setRemoveTarget] = useState<StudentSectionResponseDto | null>(null)
  const [isEnrolling, setIsEnrolling] = useState(false)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const { data: studentsData, isLoading: studentsLoading } = useStudents({
    schoolId,
    filters: {
      searchTerm: debouncedSearch || undefined,
      status: 'active',
    },
    limit: 100,
    enabled: !!schoolId,
  })

  const allStudents = flattenStudentPages(studentsData)
  const enrolledStudentIds = useMemo(
    () => new Set((roster?.students ?? []).map(s => s.studentId)),
    [roster],
  )

  const availableStudents = useMemo(
    () => allStudents.filter(s => !enrolledStudentIds.has(s.studentId)),
    [allStudents, enrolledStudentIds],
  )

  const enrollMutation = useEnrollStudent()
  const removeMutation = useRemoveStudent()

  const spotsRemaining = section
    ? section.maxEnrollment - (roster?.totalCount ?? section.currentEnrollment)
    : 0
  const canSelectMore = selectedIds.size < spotsRemaining

  const toggleStudent = useCallback((studentId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(studentId)) {
        next.delete(studentId)
      } else if (next.size < spotsRemaining) {
        next.add(studentId)
      }
      return next
    })
  }, [spotsRemaining])

  const handleBulkEnroll = async () => {
    if (selectedIds.size === 0 || !section) return
    setIsEnrolling(true)
    let enrolled = 0
    try {
      for (const studentId of selectedIds) {
        try {
          await enrollMutation.mutateAsync({ sectionId, schoolId, studentId })
          enrolled++
        } catch (error: any) {
          const parsed = parseApiError(error)
          toast.error(`Failed to enroll student: ${parsed.message}`)
        }
      }
      if (enrolled > 0) {
        toast.success(`${enrolled} student${enrolled !== 1 ? 's' : ''} added to section`)
      }
      setSelectedIds(new Set())
    } finally {
      setIsEnrolling(false)
    }
  }

  const handleRemove = async () => {
    if (!removeTarget) return
    await removeMutation.mutateAsync({
      sectionId,
      schoolId,
      studentId: removeTarget.studentId,
    })
    setRemoveTarget(null)
  }

  // Loading
  if (sectionLoading) {
    return (
      <div className="min-h-full p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-48 bg-surface-secondary rounded" />
          <div className="h-6 w-64 bg-surface-secondary rounded" />
          <div className="grid grid-cols-2 gap-6">
            <div className="h-96 bg-surface-secondary rounded-xl" />
            <div className="h-96 bg-surface-secondary rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  // Not found
  if (!isValidId || !section) {
    return (
      <div className="min-h-full flex items-center justify-center p-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
          <h2 className="text-lg font-semibold text-text-primary mb-2">Section Not Found</h2>
          <p className="text-sm text-text-secondary mb-4">
            This section may have been removed or you don't have access.
          </p>
          <button
            type="button"
            onClick={() => navigate({ to: '/classrooms', search: { tab: undefined } })}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[rgb(var(--action-primary-fg))] bg-[rgb(var(--action-primary-bg))] rounded-lg hover:bg-[rgb(var(--action-primary-bg-hover))] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Scheduling
          </button>
        </div>
      </div>
    )
  }

  const rosterStudents = roster?.students ?? []
  const currentCount = roster?.totalCount ?? section.currentEnrollment

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="border-b border-border-secondary bg-surface-secondary/50">
        <div className="px-6 py-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              type="button"
              onClick={() => navigate({ to: `/classrooms/${sectionId}` })}
              className="p-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-colors"
              aria-label="Back to section"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-text-primary">
                Manage Roster
              </h1>
              <p className="text-sm text-text-secondary mt-0.5">
                {section.courseName}
                {section.courseCode && ` (${section.courseCode})`}
                {' · '}
                Section {section.sectionNumber}
                {section.primaryTeacherName && ` · ${section.primaryTeacherName}`}
              </p>
            </div>
          </div>
          <CapacityBar current={currentCount} max={section.maxEnrollment} />
        </div>
      </div>

      {/* Two-Panel Layout */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT PANEL: Available Students */}
          <div className="rounded-xl border border-border-secondary overflow-hidden">
            <div className="bg-surface-secondary/50 px-4 py-3 border-b border-border-secondary">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <Users className="w-4 h-4 text-text-tertiary" />
                  Available Students
                  <span className="text-xs font-normal text-text-tertiary">
                    ({availableStudents.length})
                  </span>
                </h3>
                {selectedIds.size > 0 && (
                  <button
                    type="button"
                    onClick={handleBulkEnroll}
                    disabled={isEnrolling || spotsRemaining <= 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[rgb(var(--action-primary-fg))] bg-[rgb(var(--action-primary-bg))] rounded-lg hover:bg-[rgb(var(--action-primary-bg-hover))] transition-colors disabled:opacity-50"
                  >
                    {isEnrolling ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                    Add {selectedIds.size} to Roster
                  </button>
                )}
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search students..."
                  className="w-full pl-9 pr-3 py-2 text-sm bg-surface-primary border border-border-secondary rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)] focus:border-[rgb(var(--border-focus))] transition-colors"
                />
              </div>
            </div>

            <div className="max-h-128 overflow-y-auto">
              {studentsLoading ? (
                <div className="py-12 text-center">
                  <Loader2 className="w-6 h-6 mx-auto text-text-tertiary animate-spin" />
                  <p className="text-xs text-text-tertiary mt-2">Loading students...</p>
                </div>
              ) : availableStudents.length === 0 ? (
                <div className="py-12 text-center">
                  <Users className="w-8 h-8 mx-auto text-text-tertiary mb-2" />
                  <p className="text-sm text-text-tertiary">
                    {debouncedSearch ? 'No students match your search.' : 'All students are enrolled.'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border-secondary">
                  {availableStudents.map(student => (
                    <AvailableStudentRow
                      key={student.studentId}
                      student={student}
                      isSelected={selectedIds.has(student.studentId)}
                      disabled={!selectedIds.has(student.studentId) && !canSelectMore}
                      onToggle={() => toggleStudent(student.studentId)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANEL: Section Roster */}
          <div className="rounded-xl border border-border-secondary overflow-hidden">
            <div className="bg-surface-secondary/50 px-4 py-3 border-b border-border-secondary">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-text-tertiary" />
                Section Roster
                <span className="text-xs font-normal text-text-tertiary">
                  ({currentCount})
                </span>
              </h3>
            </div>

            <div className="max-h-128 overflow-y-auto">
              {rosterLoading ? (
                <div className="py-12 text-center">
                  <Loader2 className="w-6 h-6 mx-auto text-text-tertiary animate-spin" />
                  <p className="text-xs text-text-tertiary mt-2">Loading roster...</p>
                </div>
              ) : rosterStudents.length === 0 ? (
                <div className="py-12 text-center">
                  <Users className="w-8 h-8 mx-auto text-text-tertiary mb-2" />
                  <p className="text-sm font-medium text-text-primary mb-1">No students enrolled</p>
                  <p className="text-xs text-text-tertiary max-w-xs mx-auto">
                    Select students from the left panel to add them to this section.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border-secondary">
                  {rosterStudents.map(student => (
                    <RosterStudentRow
                      key={student.studentId}
                      student={student}
                      onRemove={() => setRemoveTarget(student)}
                      isRemoving={
                        removeMutation.isPending &&
                        removeMutation.variables?.studentId === student.studentId
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Remove Confirmation */}
      <ConfirmationDialog
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={handleRemove}
        title="Remove Student"
        description={`Are you sure you want to remove ${removeTarget?.studentName || 'this student'} from this section?`}
        confirmText="Remove"
        variant="destructive"
        isLoading={removeMutation.isPending}
      />
    </div>
  )
}

export default SectionRosterPage
