/**
 * SectionRoster Component
 *
 * Displays and manages enrolled students for a section as a sortable data table.
 * Supports add (via StudentSelector modal) and remove operations.
 */

import { useState, useMemo } from 'react'
import {
  Users,
  UserPlus,
  Search,
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  Loader2,
  UserMinus,
} from 'lucide-react'
import type { SectionResponseDto, StudentSectionResponseDto } from '@aibrains/shared-types'
import { useSectionRoster, useRemoveStudent } from '../../hooks/useSections'
import { useActiveSchoolId } from '../../stores/app.store'
import {
  getCapacityColor,
  getCapacityPercent,
} from '../../schemas/section.form'
import { ConfirmationDialog } from '../common/ConfirmationDialog'
import { StudentSelector } from '../common/StudentSelector'
import { UserAvatar } from '../common/UserAvatar'

// ============================================================================
// TYPES
// ============================================================================

interface SectionRosterProps {
  section: SectionResponseDto
}

type SortField = 'name' | 'studentNumber' | 'gradeLevel' | 'enrolledAt'
type SortDir = 'asc' | 'desc'

// ============================================================================
// DATE FORMATTING
// ============================================================================

function formatEnrolledDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

// ============================================================================
// SORT HEADER
// ============================================================================

function SortHeader({
  label,
  field,
  currentField,
  currentDir,
  onSort,
  className = '',
}: {
  label: string
  field: SortField
  currentField: SortField
  currentDir: SortDir
  onSort: (field: SortField) => void
  className?: string
}) {
  const isActive = currentField === field
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className={`group inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-text-tertiary hover:text-text-primary transition-colors ${className}`}
      aria-label={`Sort by ${label}`}
    >
      {label}
      <span className={`inline-flex flex-col ${isActive ? 'text-text-primary' : 'text-text-tertiary opacity-0 group-hover:opacity-50'}`}>
        {isActive && currentDir === 'asc' ? (
          <ChevronUp className="w-3.5 h-3.5" />
        ) : isActive && currentDir === 'desc' ? (
          <ChevronDown className="w-3.5 h-3.5" />
        ) : (
          <ChevronUp className="w-3.5 h-3.5" />
        )}
      </span>
    </button>
  )
}

// ============================================================================
// ROW ACTIONS DROPDOWN
// ============================================================================

function RowActions({
  onRemove,
  isRemoving,
  studentName,
}: {
  onRemove: () => void
  isRemoving: boolean
  studentName: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        disabled={isRemoving}
        className="p-1.5 rounded-md text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-colors disabled:opacity-50"
        aria-label={`Actions for ${studentName}`}
        aria-haspopup="true"
        aria-expanded={open}
      >
        {isRemoving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <MoreHorizontal className="w-4 h-4" />
        )}
      </button>

      {open && (
        <>
          {/* Backdrop to close dropdown */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 top-full mt-1 z-20 w-48 rounded-lg border border-border-secondary bg-surface-primary shadow-lg py-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                onRemove()
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <UserMinus className="w-4 h-4" />
              Remove from Section
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ============================================================================
// COMPACT CAPACITY HEADER
// ============================================================================

function CapacityBar({
  current,
  max,
  isFull,
  onAddStudents,
}: {
  current: number
  max: number
  isFull: boolean
  onAddStudents: () => void
}) {
  const percent = getCapacityPercent(current, max)
  const barColor = getCapacityColor(current, max)

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span className="text-sm font-medium text-text-primary whitespace-nowrap">
          {current}/{max} enrolled
        </span>
        <div className="h-1 flex-1 max-w-[120px] bg-surface-secondary rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
      <button
        type="button"
        onClick={onAddStudents}
        disabled={isFull}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/30 dark:hover:bg-teal-950/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Add students to section"
      >
        <UserPlus className="w-3.5 h-3.5" />
        Add Students
      </button>
    </div>
  )
}

// ============================================================================
// SECTION ROSTER
// ============================================================================

export function SectionRoster({ section }: SectionRosterProps) {
  const schoolId = useActiveSchoolId() || ''
  const [showSelector, setShowSelector] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<StudentSectionResponseDto | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const { data: roster, isLoading } = useSectionRoster({
    sectionId: section.sectionId,
    schoolId,
  })

  const removeMutation = useRemoveStudent()

  const students = roster?.students ?? []
  const enrolledStudentIds = students.map((s) => s.studentId)

  // ---- Search filter ----
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students
    const q = searchQuery.toLowerCase()
    return students.filter(
      (s) =>
        (s.studentName || '').toLowerCase().includes(q) ||
        (s.studentNumber || '').toLowerCase().includes(q) ||
        s.studentId.toLowerCase().includes(q)
    )
  }, [students, searchQuery])

  // ---- Sort ----
  const sortedStudents = useMemo(() => {
    const sorted = [...filteredStudents]
    sorted.sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case 'name':
          cmp = (a.studentName || a.studentId).localeCompare(b.studentName || b.studentId)
          break
        case 'studentNumber':
          cmp = (a.studentNumber || '').localeCompare(b.studentNumber || '')
          break
        case 'gradeLevel':
          cmp = (a.currentGradeLevel || '').localeCompare(b.currentGradeLevel || '')
          break
        case 'enrolledAt':
          cmp = a.enrolledAt.localeCompare(b.enrolledAt)
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return sorted
  }, [filteredStudents, sortField, sortDir])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const handleRemove = async () => {
    if (!removeTarget) return
    await removeMutation.mutateAsync({
      sectionId: section.sectionId,
      schoolId,
      studentId: removeTarget.studentId,
    })
    setRemoveTarget(null)
  }

  const isFull = section.currentEnrollment >= section.maxEnrollment

  // ---- Loading skeleton ----
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-surface-secondary rounded-lg animate-pulse" />
        <div className="h-10 bg-surface-secondary rounded-lg animate-pulse" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-surface-secondary rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Instructor Card */}
      {section.primaryTeacherId && (
        <div className="flex items-center gap-3 px-4 py-3 bg-surface-secondary/60 rounded-lg border border-border-secondary">
          <UserAvatar
            userId={section.primaryTeacherId}
            userName={section.primaryTeacherName || 'Teacher'}
            role="staff"
            size="md"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-text-primary truncate">
              {section.primaryTeacherName || 'Teacher'}
            </p>
            <p className="text-xs text-text-tertiary">Primary Instructor</p>
          </div>
          <span className="flex-shrink-0 inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400">
            Teacher
          </span>
        </div>
      )}

      {/* Compact Capacity Header */}
      <CapacityBar
        current={roster?.totalCount ?? section.currentEnrollment}
        max={section.maxEnrollment}
        isFull={isFull}
        onAddStudents={() => setShowSelector(true)}
      />

      {/* Search */}
      {students.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or student ID..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-surface-secondary border border-border-secondary rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-colors"
            aria-label="Search roster"
          />
        </div>
      )}

      {/* Data Table or Empty State */}
      {students.length === 0 ? (
        <div className="py-12 text-center">
          <Users className="w-10 h-10 mx-auto text-text-tertiary mb-3" />
          <h4 className="text-sm font-medium text-text-primary mb-1">
            No students enrolled yet
          </h4>
          <p className="text-xs text-text-tertiary max-w-xs mx-auto mb-4">
            Add students to this section to build your class roster.
          </p>
          <button
            type="button"
            onClick={() => setShowSelector(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-teal-500 rounded-lg hover:bg-teal-600 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Add Students
          </button>
        </div>
      ) : sortedStudents.length === 0 ? (
        /* No search results */
        <div className="py-8 text-center">
          <Search className="w-8 h-8 mx-auto text-text-tertiary mb-2" />
          <p className="text-sm text-text-secondary">
            No students match "{searchQuery}"
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border-secondary overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-secondary/60 border-b border-border-secondary">
                <th className="px-4 py-2.5">
                  <SortHeader
                    label="Name"
                    field="name"
                    currentField={sortField}
                    currentDir={sortDir}
                    onSort={handleSort}
                  />
                </th>
                <th className="px-4 py-2.5 hidden sm:table-cell">
                  <SortHeader
                    label="Student ID"
                    field="studentNumber"
                    currentField={sortField}
                    currentDir={sortDir}
                    onSort={handleSort}
                  />
                </th>
                <th className="px-4 py-2.5 hidden md:table-cell">
                  <SortHeader
                    label="Grade"
                    field="gradeLevel"
                    currentField={sortField}
                    currentDir={sortDir}
                    onSort={handleSort}
                  />
                </th>
                <th className="px-4 py-2.5 hidden lg:table-cell">
                  <SortHeader
                    label="Enrolled"
                    field="enrolledAt"
                    currentField={sortField}
                    currentDir={sortDir}
                    onSort={handleSort}
                  />
                </th>
                <th className="px-4 py-2.5 text-right">
                  <span className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
                    Actions
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-secondary">
              {sortedStudents.map((student) => {
                const isCurrentlyRemoving =
                  removeMutation.isPending &&
                  removeMutation.variables?.studentId === student.studentId
                const displayName = student.studentName || student.studentId

                return (
                  <tr
                    key={student.studentId}
                    className="hover:bg-surface-secondary/50 transition-colors"
                  >
                    {/* Avatar + Name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          userId={student.studentId}
                          userName={displayName}
                          role="student"
                          size="md"
                        />
                        <span className="text-sm font-medium text-text-primary truncate">
                          {displayName}
                        </span>
                      </div>
                    </td>

                    {/* Student Number */}
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {student.studentNumber ? (
                        <span className="text-sm font-mono text-text-secondary">
                          {student.studentNumber}
                        </span>
                      ) : (
                        <span className="text-sm text-text-tertiary">&mdash;</span>
                      )}
                    </td>

                    {/* Grade Level */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      {student.currentGradeLevel ? (
                        <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-surface-secondary text-text-secondary">
                          {student.currentGradeLevel}
                        </span>
                      ) : (
                        <span className="text-sm text-text-tertiary">&mdash;</span>
                      )}
                    </td>

                    {/* Enrolled Date */}
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm text-text-secondary">
                        {formatEnrolledDate(student.enrolledAt)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <RowActions
                        onRemove={() => setRemoveTarget(student)}
                        isRemoving={isCurrentlyRemoving}
                        studentName={displayName}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Student Selector Modal */}
      <StudentSelector
        open={showSelector}
        onClose={() => setShowSelector(false)}
        sectionId={section.sectionId}
        excludeStudentIds={enrolledStudentIds}
        maxCapacity={section.maxEnrollment}
        currentEnrollment={roster?.totalCount ?? section.currentEnrollment}
      />

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
