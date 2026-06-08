/**
 * StudentSelector Component
 *
 * Modal for searching and selecting students to enroll in a section.
 * Supports multi-select with checkboxes and bulk enrollment.
 */

import { useState, useMemo, useEffect } from 'react'
import { Search, UserPlus, Check, Loader2 } from 'lucide-react'
import { Modal } from '@edforge/ui'
import { useStudents, flattenStudentPages } from '../../hooks/useStudents'
import { useEnrollStudent } from '../../hooks/useSections'
import { useActiveSchoolId } from '../../stores/app.store'

// ============================================================================
// TYPES
// ============================================================================

interface StudentSelectorProps {
  open: boolean
  onClose: () => void
  sectionId: string
  excludeStudentIds: string[]
  maxCapacity: number
  currentEnrollment: number
}

// ============================================================================
// COMPONENT
// ============================================================================

export function StudentSelector({
  open,
  onClose,
  sectionId,
  excludeStudentIds,
  maxCapacity,
  currentEnrollment,
}: StudentSelectorProps) {
  const schoolId = useActiveSchoolId() || ''
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isEnrolling, setIsEnrolling] = useState(false)

  const enrollMutation = useEnrollStudent()

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setSelectedIds(new Set())
      setSearchTerm('')
      setDebouncedSearch('')
    }
  }, [open])

  // Fetch students
  const { data: studentsData, isLoading } = useStudents({
    schoolId,
    filters: {
      searchTerm: debouncedSearch || undefined,
      status: 'active',
    },
    limit: 50,
    enabled: open && !!schoolId,
  })

  const allStudents = flattenStudentPages(studentsData)

  // Filter out already enrolled students
  const excludeSet = useMemo(() => new Set(excludeStudentIds), [excludeStudentIds])
  const availableStudents = useMemo(
    () => allStudents.filter((s) => !excludeSet.has(s.studentId)),
    [allStudents, excludeSet]
  )

  const spotsRemaining = maxCapacity - currentEnrollment
  const canSelectMore = selectedIds.size < spotsRemaining

  const toggleStudent = (studentId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(studentId)) {
        next.delete(studentId)
      } else if (canSelectMore || prev.has(studentId)) {
        next.add(studentId)
      }
      return next
    })
  }

  const handleEnroll = async () => {
    if (selectedIds.size === 0) return
    setIsEnrolling(true)
    try {
      // Enroll students sequentially to avoid race conditions
      for (const studentId of selectedIds) {
        await enrollMutation.mutateAsync({ sectionId, schoolId, studentId })
      }
      onClose()
    } catch {
      // Error handled by the mutation's onError
    } finally {
      setIsEnrolling(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Students to Section"
      description={`Select students to enroll. ${spotsRemaining} spot${spotsRemaining !== 1 ? 's' : ''} remaining.`}
      size="lg"
    >
      <div className="flex flex-col" style={{ maxHeight: '60vh' }}>
        {/* Search */}
        <div className="px-1 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search by name or student number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-surface-primary border border-border-primary rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)] focus:border-[rgb(var(--border-focus))] transition-colors"
              autoFocus
            />
          </div>
        </div>

        {/* Student List */}
        <div className="flex-1 overflow-y-auto min-h-0 border-t border-b border-border-secondary">
          {isLoading ? (
            <div className="py-8 text-center">
              <Loader2 className="w-6 h-6 mx-auto text-text-tertiary animate-spin" />
              <p className="text-xs text-text-tertiary mt-2">Loading students...</p>
            </div>
          ) : availableStudents.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-text-tertiary">
                {debouncedSearch
                  ? 'No students match your search.'
                  : 'All students are already enrolled.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border-secondary">
              {availableStudents.map((student) => {
                const isSelected = selectedIds.has(student.studentId)
                const disabled = !isSelected && !canSelectMore

                return (
                  <button
                    key={student.studentId}
                    type="button"
                    onClick={() => toggleStudent(student.studentId)}
                    disabled={disabled}
                    className={`flex items-center gap-3 w-full px-4 py-3 text-left transition-colors ${
                      isSelected
                        ? 'bg-[rgb(var(--state-info-bg)/0.18)]/50'
                        : disabled
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-surface-secondary/50'
                    }`}
                  >
                    {/* Checkbox */}
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-[rgb(var(--state-info-bg)/0.18)]0 border-[rgb(var(--border-focus))]'
                          : 'border-border-primary'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-[rgb(var(--action-primary-fg))]" />}
                    </div>

                    {/* Student info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-text-primary">
                        {student.firstName} {student.lastName}
                      </div>
                      <div className="text-xs text-text-tertiary">
                        {student.studentNumber && `#${student.studentNumber}`}
                        {student.currentGradeLevel &&
                          ` · Grade ${student.currentGradeLevel}`}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 px-1">
          <span className="text-xs text-text-tertiary">
            {selectedIds.size} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isEnrolling}
              className="px-4 py-2 text-sm font-medium text-text-secondary bg-surface-primary border border-border-primary rounded-lg hover:bg-surface-secondary transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleEnroll}
              disabled={selectedIds.size === 0 || isEnrolling}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[rgb(var(--action-primary-fg))] bg-[rgb(var(--state-info-bg)/0.18)]0 rounded-lg hover:bg-[rgb(var(--action-primary-bg-hover))] transition-colors disabled:opacity-50"
            >
              {isEnrolling ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enrolling...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Enroll {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
