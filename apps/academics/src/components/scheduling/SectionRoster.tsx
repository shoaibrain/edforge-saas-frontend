/**
 * SectionRoster Component
 *
 * Displays and manages enrolled students for a section.
 * Supports add (via StudentSelector modal) and remove operations.
 */

import { useState } from 'react'
import {
  Users,
  UserPlus,
  Trash2,
  Loader2,
  GraduationCap,
} from 'lucide-react'
import type { SectionResponseDto, StudentSectionResponseDto } from '@aibrains/shared-types'
import { useSectionRoster, useRemoveStudent } from '../../hooks/useSections'
import { useActiveSchoolId } from '../../stores/app.store'
import {
  getCapacityColor,
  getCapacityPercent,
  getCapacityLabel,
} from '../../schemas/section.form'
import { ConfirmationDialog } from '../common/ConfirmationDialog'
import { StudentSelector } from '../common/StudentSelector'

// ============================================================================
// TYPES
// ============================================================================

interface SectionRosterProps {
  section: SectionResponseDto
}

// ============================================================================
// CAPACITY HEADER
// ============================================================================

function CapacityHeader({
  current,
  max,
}: {
  current: number
  max: number
}) {
  const percent = getCapacityPercent(current, max)
  const barColor = getCapacityColor(current, max)

  return (
    <div className="flex items-center gap-4">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-medium text-text-primary">
            {getCapacityLabel(current, max)} students
          </span>
          <span className="text-xs text-text-tertiary">{percent}% full</span>
        </div>
        <div className="h-2 bg-surface-secondary rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// STUDENT ROW
// ============================================================================

function StudentRow({
  student,
  onRemove,
  isRemoving,
}: {
  student: StudentSectionResponseDto
  onRemove: () => void
  isRemoving: boolean
}) {
  return (
    <div className="flex items-center justify-between py-3 px-4 hover:bg-surface-secondary/50 transition-colors rounded-lg">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500/20 to-blue-500/20 flex items-center justify-center">
          <GraduationCap className="w-4 h-4 text-teal-600" />
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
        className="p-1.5 rounded-md text-text-tertiary hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
        aria-label="Remove student"
      >
        {isRemoving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Trash2 className="w-4 h-4" />
        )}
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-surface-secondary rounded-lg animate-pulse" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 bg-surface-secondary rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Capacity Header */}
      <CapacityHeader
        current={roster?.totalCount ?? section.currentEnrollment}
        max={section.maxEnrollment}
      />

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">
          Enrolled Students
        </h3>
        <button
          type="button"
          onClick={() => setShowSelector(true)}
          disabled={isFull}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Add Students
        </button>
      </div>

      {/* Student List */}
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
      ) : (
        <div className="divide-y divide-border-secondary rounded-lg border border-border-secondary overflow-hidden">
          {students.map((student) => (
            <StudentRow
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
