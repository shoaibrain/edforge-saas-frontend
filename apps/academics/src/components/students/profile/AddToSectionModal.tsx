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
import { useAcademicsI18n } from '../../../lib/i18n'
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
  const { t } = useAcademicsI18n()
  const schoolId = useActiveSchoolId() || ''
  const selectRef = useRef<HTMLButtonElement>(null)
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
      setError(t('studentProfile.section.selectRequired'))
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
        setError(t('studentProfile.section.alreadyRostered'))
      } else {
        setError(parsed.message || t('studentProfile.section.addFailed'))
      }
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('actions.addToSection')}
      description={t('studentProfile.section.addDescription', { student: student.fullName })}
      size="md"
    >
      <div className="space-y-4">
        {/* Pre-condition check */}
        {!hasActiveEnrollment && (
          <div className="p-3 rounded-lg bg-[rgb(var(--state-warning-fg))]/5 border border-amber-500/15">
            <p className="text-sm text-[rgb(var(--state-warning-fg))]">
              {t('studentProfile.section.activeEnrollmentRequired')}
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
                {t('studentProfile.section.grade', { grade: student.currentGradeLevel })}
                {student.currentEnrollment &&
                  ` · ${student.currentEnrollment.academicYearName || t('studentProfile.section.currentYear')}`}
              </p>
            </div>
          </div>
        </div>

        {/* Section selector */}
        <div>
          <Select
            controlId="sectionId"
            ref={selectRef}
            label={t('studentProfile.section.section')}
            required
            value={selectedSectionId}
            onChange={(v) => {
              setSelectedSectionId(v ?? '')
              setError('')
            }}
            disabled={!hasActiveEnrollment || enrollStudentMutation.isPending}
            error={error || undefined}
            placeholder={t('studentProfile.section.selectPlaceholder')}
            options={sections.map((section: any) => ({
              value: section.sectionId,
              label: `${section.sectionName || section.name}${section.courseName ? ` — ${section.courseName}` : ''}${section.primaryTeacherName ? ` (${section.primaryTeacherName})` : ''}`,
            }))}
          />
          {sections.length === 0 && hasActiveEnrollment && (
            <p className="mt-1 text-xs text-[rgb(var(--text-tertiary))]">
              {t('studentProfile.section.noSectionsFound')}
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
          {t('actions.cancel')}
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
              <Loader2 className="w-4 h-4 me-2 animate-spin" />
              {t('actions.adding')}
            </>
          ) : (
            <>
              <BookOpen className="w-4 h-4 me-2" />
              {t('actions.addToSection')}
            </>
          )}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
