/**
 * AttendanceRow — a single, fixed-height roster row (presentational).
 *
 * Composes IdentityCell (avatar + name) + StatusControl (compact P/A/T/E/R) +
 * RowDetailsPopover (note + reason). UI state that used to live here (note open,
 * editing) is owned by the parent so a row can unmount/remount under
 * virtualization without losing it.
 *
 * Keyboard contract (unchanged): the row wrapper owns the fast roll-call
 * shortcuts P/A/T/E/R via `statusForShortcut` and vertical nav ↑/↓ — these keep
 * working even when a StatusControl segment is focused (the control only consumes
 * ←/→). A locked (daily_presence) row may still record Tardy/Excused but never
 * flip Present↔Absent.
 */

import { forwardRef, useImperativeHandle, useRef } from 'react'
import { Edit2, Lock, X } from 'lucide-react'
import { StatusBadge } from './StatusBadge'
import { statusForShortcut, LOCKED_OVERRIDE_STATUSES } from './attendanceStatus'
import { IdentityCell } from './roster/IdentityCell'
import { StatusControl } from './roster/StatusControl'
import { RowDetailsPopover } from './roster/RowDetailsPopover'
import type { AttendanceStatus } from '../../services/academics.service'

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
  /** Task 4.6: Past date mode — row starts read-only, parent flips `isEditing`. */
  isPastDate?: boolean
  isEditing?: boolean
  onStartEdit?: () => void
  onCorrectionSave?: () => void
  onCorrectionCancel?: () => void
  /** Arrow-key navigation (wired to the virtualized list's focus model). */
  onArrowUp?: () => void
  onArrowDown?: () => void
  /**
   * Daily_presence: the student's day-presence is already locked by an earlier
   * section, so this row is read-only here except Tardy/Excused. `lockedHint`
   * says where (e.g. "Already present in Middle School Social Studies").
   */
  locked?: boolean
  lockedHint?: string
  /** Compact-control reveal mode; 'always' on touch/coarse pointers. */
  expandTrigger?: 'hover' | 'always'
  /** Roving tabindex from the list (0 = active row, -1 = others). */
  tabIndex?: number
}

export interface AttendanceRowRef {
  focus: () => void
}

export const AttendanceRow = forwardRef<AttendanceRowRef, AttendanceRowProps>(function AttendanceRow(
  {
    studentId,
    studentName,
    studentNumber,
    currentStatus,
    notes,
    excuseType,
    onStatusChange,
    onNotesChange,
    onExcuseTypeChange,
    isPastDate = false,
    isEditing = false,
    onStartEdit,
    onCorrectionSave,
    onCorrectionCancel,
    onArrowUp,
    onArrowDown,
    locked = false,
    lockedHint,
    expandTrigger = 'hover',
    tabIndex = 0,
  },
  ref,
) {
  const rowRef = useRef<HTMLDivElement>(null)
  useImperativeHandle(ref, () => ({ focus: () => rowRef.current?.focus() }))

  const isViewMode = isPastDate && !isEditing

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
    if (isViewMode) return
    const match = statusForShortcut(e.key)
    if (!match) return
    // A locked row may still record Tardy/Excused, but not flip presence.
    if (locked && !LOCKED_OVERRIDE_STATUSES.includes(match)) return
    e.preventDefault()
    onStatusChange(match)
  }

  return (
    <div
      ref={rowRef}
      className="group/row h-full border-b border-border-secondary outline-none last:border-0 focus-visible:bg-surface-secondary/40"
      onKeyDown={handleKeyDown}
      tabIndex={tabIndex}
      role="row"
      aria-label={`Attendance for ${studentName}`}
    >
      <div className="flex h-full items-center gap-3 px-4">
        <div className="min-w-0 flex-1">
          <IdentityCell
            studentId={studentId}
            studentName={studentName}
            studentNumber={studentNumber}
            dimmed={locked}
          />
        </div>

        <div className="flex items-center gap-2">
          {locked ? (
            <>
              <span
                className="flex items-center gap-1 text-xs text-text-tertiary"
                title={lockedHint}
              >
                <Lock className="h-3 w-3 flex-shrink-0" />
                {lockedHint || 'Day-presence already recorded'}
              </span>
              <StatusControl
                value={currentStatus}
                onChange={onStatusChange}
                allowed={LOCKED_OVERRIDE_STATUSES}
                expandTrigger={expandTrigger}
              />
            </>
          ) : isViewMode ? (
            <>
              {currentStatus && <StatusBadge status={currentStatus} />}
              <button
                type="button"
                onClick={onStartEdit}
                className="flex items-center gap-1 rounded-lg bg-surface-secondary px-2.5 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
                aria-label={`Edit attendance for ${studentName}`}
              >
                <Edit2 className="h-3.5 w-3.5" />
                Edit
              </button>
            </>
          ) : (
            <StatusControl value={currentStatus} onChange={onStatusChange} expandTrigger={expandTrigger} />
          )}

          {!isViewMode && (
            <RowDetailsPopover
              status={currentStatus}
              notes={notes}
              excuseType={excuseType}
              onNotesChange={onNotesChange}
              onExcuseTypeChange={onExcuseTypeChange}
            />
          )}

          {isPastDate && isEditing && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onCorrectionSave}
                className="rounded-lg bg-[rgb(var(--action-primary-bg))] px-3 py-1.5 text-xs font-medium text-[rgb(var(--action-primary-fg))] transition-colors hover:bg-[rgb(var(--action-primary-bg-hover))]"
              >
                Save
              </button>
              <button
                type="button"
                onClick={onCorrectionCancel}
                className="rounded-lg p-1.5 text-text-tertiary transition-colors hover:bg-surface-hover hover:text-text-primary"
                aria-label="Cancel edit"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})
