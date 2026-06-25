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
import { Modal, ModalFooter, Button, Select } from '@edforge/ui'
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
  const selectRef = useRef<HTMLButtonElement>(null)
  const enrollStudentMutation = useEnrollStudent()

  const [selectedSectionId, setSelectedSectionId] = useState('')
  const [error, setError] = useState('')

  // Fetch instructional sections — a student is added to a subject section
  // here; homerooms use the separate homeroom-assign flow.
  const { data: sectionsData } = useSections({
    schoolId,
    filters: { sectionType: 'instructional' },
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
      setError('Please select a classroom')
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
        setError('This student is already in this classroom')
      } else {
        setError(parsed.message || "Couldn't add the student to the classroom. Please try again.")
      }
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add to classroom"
      description={`Add ${student.fullName} to a classroom`}
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
              <BookOpen className="w-5 h-5 text-[rgb(var(--state-info-fg))]" />
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
          <Select
            controlId="sectionId"
            ref={selectRef}
            label="Section"
            required
            value={selectedSectionId}
            onChange={(v) => {
              setSelectedSectionId(v ?? '')
              setError('')
            }}
            disabled={!hasActiveEnrollment || enrollStudentMutation.isPending}
            error={error || undefined}
            placeholder="Select a section..."
            options={sections.map((section: any) => ({
              value: section.sectionId,
              label: `${section.sectionName || section.name}${section.courseName ? ` — ${section.courseName}` : ''}${section.primaryTeacherName ? ` (${section.primaryTeacherName})` : ''}`,
            }))}
          />
          {sections.length === 0 && hasActiveEnrollment && (
            <p className="mt-1 text-xs text-[rgb(var(--text-tertiary))]">
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
          className="min-w-32"
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
