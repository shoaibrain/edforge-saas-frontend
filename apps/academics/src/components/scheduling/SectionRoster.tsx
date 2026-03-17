/**
 * SectionRoster Component
 *
 * Displays and manages enrolled students for a section using the TanstackDataTable.
 * Supports add (via StudentSelector modal) and remove operations.
 */

import { useState, useMemo } from 'react'
import {
  Users,
  UserPlus,
  MoreHorizontal,
  Loader2,
  UserMinus,
} from 'lucide-react'
import type { SectionResponseDto, StudentSectionResponseDto } from '@aibrains/shared-types'
import { TanstackDataTable, createActionsColumn, type ColumnDef } from '@edforge/ui'
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

  const { data: roster, isLoading } = useSectionRoster({
    sectionId: section.sectionId,
    schoolId,
  })

  const removeMutation = useRemoveStudent()

  const students = roster?.students ?? []
  const enrolledStudentIds = students.map((s) => s.studentId)

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

  // ---- Column Definitions ----
  const columns: ColumnDef<StudentSectionResponseDto, unknown>[] = useMemo(
    () => [
      {
        accessorKey: 'studentName',
        header: 'Name',
        size: 240,
        cell: ({ row }) => {
          const student = row.original
          const displayName = student.studentName || student.studentId
          return (
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
          )
        },
      },
      {
        accessorKey: 'studentNumber',
        header: 'Student ID',
        size: 140,
        cell: ({ row }) => {
          const studentNumber = row.original.studentNumber
          return studentNumber ? (
            <span className="text-sm font-mono text-text-secondary">
              {studentNumber}
            </span>
          ) : (
            <span className="text-sm text-text-tertiary">&mdash;</span>
          )
        },
      },
      {
        accessorKey: 'currentGradeLevel',
        header: 'Grade',
        size: 100,
        cell: ({ row }) => {
          const gradeLevel = row.original.currentGradeLevel
          return gradeLevel ? (
            <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-surface-secondary text-text-secondary">
              {gradeLevel}
            </span>
          ) : (
            <span className="text-sm text-text-tertiary">&mdash;</span>
          )
        },
      },
      {
        accessorKey: 'enrolledAt',
        header: 'Enrolled',
        size: 130,
        cell: ({ row }) => (
          <span className="text-sm text-text-secondary">
            {formatEnrolledDate(row.original.enrolledAt)}
          </span>
        ),
      },
      createActionsColumn<StudentSectionResponseDto>({
        cell: ({ row }) => {
          const student = row.original
          const displayName = student.studentName || student.studentId
          const isCurrentlyRemoving =
            removeMutation.isPending &&
            removeMutation.variables?.studentId === student.studentId
          return (
            <RowActions
              onRemove={() => setRemoveTarget(student)}
              isRemoving={isCurrentlyRemoving}
              studentName={displayName}
            />
          )
        },
      }),
    ],
    [removeMutation.isPending, removeMutation.variables?.studentId]
  )

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

      {/* Data Table */}
      <TanstackDataTable
        columns={columns}
        data={students}
        getRowId={(student) => student.studentId}
        isLoading={isLoading}
        enableSorting={true}
        searchPlaceholder="Search by name or student ID..."
        pagination={{ pageSize: 20 }}
        emptyState={{
          icon: <Users className="w-10 h-10" />,
          title: 'No students enrolled yet',
          description: 'Add students to this section to build your class roster.',
          action: {
            label: 'Add Students',
            onClick: () => setShowSelector(true),
          },
        }}
        onRowClick={(_student) => {
          // Row click preserved for future navigation
        }}
      />

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
