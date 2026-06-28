/**
 * AttendanceRow — a single roster row (presentational).
 *
 * Composes IdentityCell (avatar + name) + StatusControl (compact P/A/T/E/R) + an
 * INLINE, expand-below details panel (Reason + Note) that animates open under the
 * row when the message toggle is clicked. Open state + editing state are owned by
 * the parent (lifted) so a row can unmount/remount under virtualization without
 * losing them — and the row reports its (variable) height to the virtualizer via
 * `measureElement`.
 *
 * Keyboard contract: the row wrapper owns the fast roll-call shortcuts P/A/T/E/R
 * (via `statusForShortcut`) and vertical nav ↑/↓ — these keep working when a
 * StatusControl segment is focused (the control only consumes ←/→), but are
 * suppressed when focus is inside the inline detail fields (so typing a note that
 * contains "p"/"a" doesn't flip the status). A locked (daily_presence) row may
 * record Tardy/Excused but never flip Present↔Absent.
 */

import { forwardRef, useImperativeHandle, useRef } from 'react'
import { Edit2, Lock, X, MessageCircleWarning } from 'lucide-react'
import { Input, Select, focusRingInset } from '@edforge/ui'
import { StatusBadge } from './StatusBadge'
import { statusForShortcut, LOCKED_OVERRIDE_STATUSES } from './attendanceStatus'
import { IdentityCell } from './roster/IdentityCell'
import { StatusControl } from './roster/StatusControl'
import { EXCUSE_TYPES } from './roster/excuseTypes'
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
  /** Inline Reason/Note panel open state (lifted to the grid). */
  detailsOpen?: boolean
  onToggleDetails?: () => void
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
    detailsOpen = false,
    onToggleDetails,
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
  const showReason = currentStatus === 'absent' || currentStatus === 'excused'
  const hasDetails = !!notes || !!excuseType
  const needsReason = showReason && !excuseType

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Keys typed inside the inline detail fields (note input / reason select) must
    // not trigger roll-call shortcuts or row navigation.
    const target = e.target as HTMLElement
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable ||
      target.closest('[data-row-details]')
    ) {
      return
    }
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
      className="group/row border-b border-border-secondary outline-none transition-colors last:border-0 hover:bg-surface-secondary/30 focus-visible:bg-surface-secondary/40"
      onKeyDown={handleKeyDown}
      tabIndex={tabIndex}
      role="row"
      aria-label={`Attendance for ${studentName}`}
    >
      {/* Header band (fixed height — the base row) */}
      <div className="flex h-14 items-center gap-3 px-4">
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
              <span className="flex items-center gap-1 text-xs text-text-tertiary" title={lockedHint}>
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
            <button
              type="button"
              onClick={onToggleDetails}
              aria-label={hasDetails ? 'Edit note or reason' : 'Add note or reason'}
              aria-expanded={detailsOpen}
              title={hasDetails ? 'Edit note / reason' : 'Add note / reason'}
              className={`relative rounded-lg p-2 transition-colors ${focusRingInset} ${
                detailsOpen || hasDetails
                  ? 'bg-[rgb(var(--accent-attendance)/0.12)] text-[rgb(var(--accent-attendance-text))]'
                  : 'text-text-tertiary hover:bg-surface-secondary hover:text-text-secondary'
              }`}
            >
              <MessageCircleWarning className="h-4 w-4" />
              {needsReason && (
                <span
                  data-testid="needs-reason-dot"
                  aria-hidden
                  className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[rgb(var(--state-warning-border))]"
                />
              )}
            </button>
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

      {/* Inline details — conditionally rendered, so the virtualizer measures one
          stable height (no animated height churn → no overlapping row that
          swallows clicks). No boxed border: the row's own divider separates rows,
          only the fields carry borders. A transform/opacity-only entrance keeps
          it gentle without affecting layout (reduced-motion-safe). */}
      {!isViewMode && detailsOpen && (
        <div data-row-details className="details-in px-4 pb-3">
          <div className={`grid gap-3 ${showReason ? 'sm:grid-cols-2' : ''}`}>
            {showReason && (
              <div>
                <span className="mb-1 block text-xs font-medium text-text-secondary">Reason</span>
                <Select
                  size="sm"
                  aria-label="Absence reason"
                  value={excuseType || ''}
                  onChange={(v) => onExcuseTypeChange?.(v ?? '')}
                  clearable
                  placeholder="Select reason…"
                  options={EXCUSE_TYPES}
                />
              </div>
            )}
            <div>
              <span className="mb-1 block text-xs font-medium text-text-secondary">Note</span>
              <Input
                type="text"
                value={notes}
                onChange={(e) => onNotesChange(e.target.value)}
                placeholder="Add a note…"
                aria-label="Attendance note"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
})
