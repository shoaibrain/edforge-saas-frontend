/**
 * AttendanceRow Component
 *
 * Single student row in the attendance grid with status toggle buttons.
 * Supports keyboard shortcuts: P=Present, A=Absent, L=Late, E=Excused, R=Remote
 *
 * Sprint 4 enhancements:
 * - Task 4.4: Keyboard navigation (Enter/Space toggles, arrow keys between rows)
 * - Task 4.5: Structured absence reason selector
 * - Task 4.6: Correction workflow (view mode for past dates)
 * - Task 4.8: Previous day status indicator
 * - Task 5.2: ARIA labels on status buttons and notes toggle
 */

import { useState, useRef, forwardRef, useImperativeHandle } from 'react'
import { MessageSquare, Edit2, X, Lock } from 'lucide-react'
import { Select, Input } from '@edforge/ui'
import { StatusBadge } from './StatusBadge'
import {
  ENTRY_STATUSES,
  ATTENDANCE_STATUS_META,
  TONE_CLASSES,
  statusForShortcut,
  LOCKED_OVERRIDE_STATUSES,
} from './attendanceStatus'
import type { AttendanceStatus } from '../../services/academics.service'

// ============================================================================
// TYPES
// ============================================================================

export interface AttendanceRowProps {
  studentId: string
  studentName: string
  studentNumber?: string
  currentStatus: AttendanceStatus | null
  notes: string
  excuseType?: string
  onStatusChange: (status: AttendanceStatus) => void
  onNotesChange: (notes: string) => void
  onExcuseTypeChange?: (excuseType: string) => void
  /** Task 4.6: Past date mode — row starts read-only, user clicks Edit */
  isPastDate?: boolean
  /** Task 4.6: Callback for correction save (PATCH) */
  onCorrectionSave?: () => void
  onCorrectionCancel?: () => void
  /** Task 4.4: Arrow key navigation */
  onArrowUp?: () => void
  onArrowDown?: () => void
  /**
   * Attendance realignment (daily_presence): the student's day-presence is already
   * locked by an earlier section, so this row is read-only here. `lockedHint`
   * explains where (e.g. "Already present in Middle School Social Studies").
   */
  locked?: boolean
  lockedHint?: string
}

export interface AttendanceRowRef {
  focus: () => void
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Entry-grid toggle buttons, derived from the single status source (F0.T2).
const buildButton = (status: AttendanceStatus) => {
  const meta = ATTENDANCE_STATUS_META[status]
  const tone = TONE_CLASSES[meta.tone]
  return {
    status,
    label: meta.shortLabel,
    shortcut: meta.shortcut ?? meta.shortLabel,
    title: meta.label,
    color: tone.btnHover,
    activeColor: tone.btnActive,
  }
}

const statusButtons = ENTRY_STATUSES.map(buildButton)
// F2.T4 — the only statuses a locked (day-presence) row may still record.
const lockedOverrideButtons = LOCKED_OVERRIDE_STATUSES.map(buildButton)

// Task 4.5: Structured absence reasons
const EXCUSE_TYPES = [
  { value: '', label: 'Select reason...' },
  { value: 'medical', label: 'Medical' },
  { value: 'family_emergency', label: 'Family Emergency' },
  { value: 'religious', label: 'Religious' },
  { value: 'school_activity', label: 'School Activity' },
  { value: 'weather', label: 'Weather' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'other', label: 'Other' },
]

// ============================================================================
// COMPONENT
// ============================================================================

export const AttendanceRow = forwardRef<AttendanceRowRef, AttendanceRowProps>(function AttendanceRow(
  {
    studentName,
    studentNumber,
    currentStatus,
    notes,
    excuseType,
    onStatusChange,
    onNotesChange,
    onExcuseTypeChange,
    isPastDate = false,
    onCorrectionSave,
    onCorrectionCancel,
    onArrowUp,
    onArrowDown,
    locked = false,
    lockedHint,
  },
  ref
) {
  const [showNotes, setShowNotes] = useState(false)
  // Task 4.6: Editing state for past-date corrections
  const [isEditing, setIsEditing] = useState(false)
  const rowRef = useRef<HTMLDivElement>(null)

  // Task 4.4: Expose focus method
  useImperativeHandle(ref, () => ({
    focus: () => rowRef.current?.focus(),
  }))

  // Task 4.6: In past-date mode, start read-only unless editing
  const isViewMode = isPastDate && !isEditing

  // Task 4.5: Show reason selector when absent or excused
  const showReasonSelector = (currentStatus === 'absent' || currentStatus === 'excused') && !isViewMode

  // Task 4.4: Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Arrow navigation
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      onArrowUp?.()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      onArrowDown?.()
      return
    }
    // Escape closes notes
    if (e.key === 'Escape' && showNotes) {
      setShowNotes(false)
      return
    }

    // Don't process shortcuts in view (past-date) mode.
    if (isViewMode) return

    const match = statusForShortcut(e.key)
    if (!match) return
    // F2.T4 — a locked row may still record Tardy/Excused, but not flip presence.
    if (locked && !LOCKED_OVERRIDE_STATUSES.includes(match)) return
    e.preventDefault()
    onStatusChange(match)
  }

  // Task 4.6: Correction handlers
  const handleStartEdit = () => {
    setIsEditing(true)
  }
  const handleCancelEdit = () => {
    setIsEditing(false)
    onCorrectionCancel?.()
  }
  const handleSaveCorrection = () => {
    setIsEditing(false)
    onCorrectionSave?.()
  }

  return (
    <div
      ref={rowRef}
      className="group border-b border-border-secondary last:border-0"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="row"
      aria-label={`Attendance for ${studentName}`}
    >
      {/* Task 5.5: Responsive layout — stack on mobile (<768px), inline on desktop */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-3 px-4">
        {/* Student Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text-primary truncate">
              {studentName}
            </span>
          </div>
          {studentNumber && (
            <div className="text-xs text-text-tertiary">{studentNumber}</div>
          )}
        </div>

        {/* Status Buttons or View-Mode Badge */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {locked ? (
            // F2.T4 — day-presence locked by an earlier section: show where it was
            // recorded, and still allow Tardy/Excused overrides for THIS section.
            // Present↔Absent is intentionally not offered.
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1 text-xs text-text-tertiary" title={lockedHint}>
                <Lock className="w-3.5 h-3.5" />
                {lockedHint || 'Day-presence already recorded'}
              </span>
              <div className="flex items-center gap-1.5">
                {lockedOverrideButtons.map((btn) => (
                  <button
                    key={btn.status}
                    type="button"
                    onClick={() => onStatusChange(btn.status)}
                    className={`px-2.5 h-9 sm:h-8 rounded-lg text-xs font-semibold transition-all ${
                      currentStatus === btn.status
                        ? btn.activeColor
                        : `bg-surface-secondary text-text-tertiary ${btn.color}`
                    }`}
                    title={`Mark ${btn.title} (allowed on a locked row)`}
                    aria-label={`Mark ${btn.title}`}
                    aria-pressed={currentStatus === btn.status}
                  >
                    {btn.title}
                  </button>
                ))}
              </div>
            </div>
          ) : isViewMode ? (
            <>
              {currentStatus && <StatusBadge status={currentStatus} />}
              {/* Task 4.6: Edit button for corrections */}
              <button
                type="button"
                onClick={handleStartEdit}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary bg-surface-secondary hover:bg-surface-hover rounded-lg transition-colors"
                aria-label={`Edit attendance for ${studentName}`}
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit
              </button>
            </>
          ) : (
            <div className="flex items-center gap-1.5">
              {statusButtons.map((btn) => (
                <button
                  key={btn.status}
                  type="button"
                  onClick={() => onStatusChange(btn.status)}
                  className={`w-11 h-11 sm:w-9 sm:h-9 rounded-lg text-sm font-bold transition-all ${
                    currentStatus === btn.status
                      ? btn.activeColor
                      : `bg-surface-secondary text-text-tertiary ${btn.color}`
                  }`}
                  title={`${btn.title} (${btn.shortcut})`}
                  aria-label={`Mark ${btn.title}`}
                  aria-pressed={currentStatus === btn.status}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          )}

          {/* Notes Toggle */}
          {!isViewMode && !locked && (
            <button
              type="button"
              onClick={() => setShowNotes(!showNotes)}
              className={`relative p-2 rounded-lg transition-colors ${
                notes
                  ? 'text-[rgb(var(--action-secondary-fg))] bg-[rgb(var(--state-info-bg)/0.18)]'
                  : 'text-text-tertiary hover:text-text-secondary hover:bg-surface-secondary'
              }`}
              title="Add notes"
              aria-label={notes ? 'Edit notes' : 'Add notes'}
              aria-expanded={showNotes}
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          )}

          {/* Task 4.6: Save/Cancel for correction */}
          {isPastDate && isEditing && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleSaveCorrection}
                className="px-3 py-1.5 text-xs font-medium text-[rgb(var(--action-primary-fg))] bg-[rgb(var(--action-primary-bg))] hover:bg-[rgb(var(--action-primary-bg-hover))] rounded-lg transition-colors"
              >
                Save
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-surface-hover rounded-lg transition-colors"
                aria-label="Cancel edit"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Task 4.5: Absence Reason Selector */}
      {showReasonSelector && (
        <div className="px-4 pb-2">
          <Select
            className="max-w-xs"
            size="sm"
            aria-label="Absence reason"
            value={excuseType || ''}
            onChange={(v) => onExcuseTypeChange?.(v ?? '')}
            clearable
            placeholder="Select reason..."
            options={EXCUSE_TYPES.filter((t) => t.value !== '')}
          />
        </div>
      )}

      {/* Notes Input */}
      {showNotes && !isViewMode && (
        <div className="px-4 pb-3">
          <Input
            type="text"
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Add a note..."
            aria-label="Attendance note"
          />
        </div>
      )}

      {/* View mode: show notes as read-only if present */}
      {isViewMode && notes && (
        <div className="px-4 pb-3">
          <p className="text-xs text-text-secondary italic">{notes}</p>
        </div>
      )}
    </div>
  )
})
