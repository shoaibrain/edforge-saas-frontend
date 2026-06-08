/**
 * AddToSectionModal Component
 *
 * Modal for adding a student to a class section (rostering).
 * Requires an active enrollment before rostering is allowed.
 *
 * Sprint 8 - SCHED-01
 */

import { useEffect, useRef, useState } from 'react'
import { Loader2, BookOpen } from 'lucide-react'
import { Modal, ModalFooter, Button } from '@edforge/ui'
import {
  useSections,
  flattenSectionPages,
  useEnrollStudent,
} from '../../../hooks'
import { useActiveSchoolId } from '../../../stores/app.store'
import { parseApiError } from '../../../services/academics.service'
import type { StudentProfileResponseDto } from '@aibrains/shared-types'

// ============================================================================
// TYPES
// ============================================================================

export interface AddToSectionModalProps {
  open: boolean
  onClose: () => void
  student: StudentProfileResponseDto
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AddToSectionModal({
  open,
  onClose,
  student,
}: AddToSectionModalProps) {
  const schoolId = useActiveSchoolId() || ''
  const selectRef = useRef<HTMLSelectElement>(null)
  const enrollStudentMutation = useEnrollStudent()

  const [selectedSectionId, setSelectedSectionId] = useState('')
  const [error, setError] = useState('')

  // Fetch sections for this school
  const { data: sectionsData } = useSections({
    schoolId,
    enabled: !!schoolId && open,
  })
  const sections = flattenSectionPages(sectionsData)

  // Check if student has active enrollment
  const hasActiveEnrollment = !!student.currentEnrollment

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setSelectedSectionId('')
      setError('')
      setTimeout(() => selectRef.current?.focus(), 100)
    }
  }, [open])

  const handleSubmit = async () => {
    if (!selectedSectionId) {
      setError('Please select a section')
      return
    }

    try {
      await enrollStudentMutation.mutateAsync({
        sectionId: selectedSectionId,
        schoolId,
        studentId: student.studentId,
      })
      onClose()
    } catch (err) {
      const parsed = parseApiError(err as Error)
      if (parsed.statusCode === 409) {
        setError('Student is already rostered in this section')
      } else {
        setError(parsed.message || 'Failed to add student to section')
      }
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add to Section"
      description={`Add ${student.fullName} to a class section`}
      size="md"
    >
      <div className="space-y-4">
        {/* Pre-condition check */}
        {!hasActiveEnrollment && (
          <div className="p-3 rounded-lg bg-[rgb(var(--state-warning-fg))]/5 border border-amber-500/15">
            <p className="text-sm text-[rgb(var(--state-warning-fg))]">
              Student must have an active enrollment before being added to
              sections. Please enroll the student first.
            </p>
          </div>
        )}

        {/* Student info */}
        <div className="p-3 rounded-lg bg-surface-secondary border border-border-secondary">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[rgb(var(--state-info-fg))]/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">
                {student.fullName}
              </p>
              <p className="text-xs text-text-tertiary">
                Grade {student.currentGradeLevel}
                {student.currentEnrollment &&
                  ` · ${student.currentEnrollment.academicYearName || 'Current Year'}`}
              </p>
            </div>
          </div>
        </div>

        {/* Section selector */}
        <div>
          <label
            htmlFor="sectionId"
            className="block text-sm font-medium text-text-primary mb-1.5"
          >
            Section <span className="text-[rgb(var(--state-danger-fg))]">*</span>
          </label>
          <select
            id="sectionId"
            ref={selectRef}
            value={selectedSectionId}
            onChange={(e) => {
              setSelectedSectionId(e.target.value)
              setError('')
            }}
            disabled={!hasActiveEnrollment || enrollStudentMutation.isPending}
            className={`
              w-full px-3 py-2 rounded-lg border
              bg-surface-secondary text-text-primary
              focus:outline-none focus:ring-2 focus:ring-accent-primary/20
              transition-colors disabled:opacity-50
              ${error ? 'border-[rgb(var(--state-danger-border))]' : 'border-border-secondary'}
            `}
          >
            <option value="">Select a section...</option>
            {sections.map((section: any) => (
              <option key={section.sectionId} value={section.sectionId}>
                {section.sectionName || section.name}
                {section.courseName ? ` — ${section.courseName}` : ''}
                {section.primaryTeacherName
                  ? ` (${section.primaryTeacherName})`
                  : ''}
              </option>
            ))}
          </select>
          {error && (
            <p className="mt-1 text-sm text-[rgb(var(--state-danger-fg))]">{error}</p>
          )}
          {sections.length === 0 && hasActiveEnrollment && (
            <p className="mt-1 text-xs text-text-tertiary">
              No sections found. Create sections in Scheduling first.
            </p>
          )}
        </div>
      </div>

      <ModalFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={enrollStudentMutation.isPending}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={
            !hasActiveEnrollment ||
            !selectedSectionId ||
            enrollStudentMutation.isPending
          }
          className="min-w-[120px]"
        >
          {enrollStudentMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <BookOpen className="w-4 h-4 mr-2" />
              Add to Section
            </>
          )}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
