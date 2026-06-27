/**
 * AttendanceGrid Component
 *
 * Bulk attendance entry grid for a section.
 * Shows all enrolled students with status toggles and a save button.
 *
 * Sprint 4 enhancements:
 * - Task 4.2: Student search/filter
 * - Task 4.3: Sortable columns (Name, Student #, Status)
 * - Task 4.4: Keyboard navigation (arrow keys between rows)
 * - Task 4.6: Correction workflow (past-date view mode)
 * - Task 4.8: Progress bar + previous day status
 * - Task 5.3: aria-live announcements
 */

import { useState, useCallback, useMemo, useRef, useEffect, createRef } from 'react'
import {
  CheckCircle,
  XCircle,
  Loader2,
  Save,
  Users,
  Check,
  WifiOff,
  CloudOff,
  Search,
  X,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'
import { Input } from '@edforge/ui'
import type { AttendanceStatus } from '../../services/academics.service'
import type { StudentSectionResponseDto } from '@aibrains/shared-types'
import { AttendanceRow, type AttendanceRowRef } from './AttendanceRow'
import { ENTRY_STATUSES, ATTENDANCE_STATUS_META, isLockedOverrideStatus } from './attendanceStatus'
import type { SaveStatus } from '../../hooks/useOfflineAttendance'

// ============================================================================
// TYPES
// ============================================================================

interface StudentAttendanceEntry {
  studentId: string
  studentName: string
  studentNumber?: string
  status: AttendanceStatus | null
  notes: string
  excuseType?: string
}

interface AttendanceGridProps {
  students: StudentSectionResponseDto[]
  date: string
  existingRecords?: Array<{
    studentId: string
    status: AttendanceStatus
    notes?: string
    excuseReason?: string
  }>
  onSave: (records: Array<{ studentId: string; status: AttendanceStatus; notes?: string; excuseReason?: string }>) => void
  isSaving: boolean
  disabled?: boolean
  saveStatus?: SaveStatus
  /** Task 4.6: Correction callback for past-date updates */
  onCorrection?: (record: { studentId: string; status: AttendanceStatus; notes?: string; excuseType?: string }) => void
  /**
   * Attendance realignment (daily_presence): studentId → hint for students whose
   * day-presence is already locked by an earlier section. Those rows render
   * read-only with the hint; they're excluded from this section's save set.
   */
  lockedStudents?: Map<string, string>
  /**
   * F2.T1 — absentee-first default. On a fresh day (no existing record for a
   * student), unmarked students start at this status so the teacher only marks
   * exceptions ("everyone present unless told otherwise"). Applies to both
   * policy modes (Decision D-C). Pass `null` to keep the legacy unmarked grid
   * (e.g. past-date correction never auto-fills).
   */
  defaultStatus?: AttendanceStatus | null
}

type SortKey = 'name' | 'number' | 'status'
type SortDir = 'asc' | 'desc'

// ============================================================================
// SAVE STATUS BADGE
// ============================================================================

function SaveStatusBadge({ status }: { status?: SaveStatus }) {
  if (!status || status === 'idle') return null

  const configs: Record<string, { icon: typeof Check; text: string; className: string }> = {
    saved: {
      icon: Check,
      text: 'Saved',
      className: 'text-[rgb(var(--state-success-fg))]',
    },
    saving: {
      icon: Loader2,
      text: 'Auto-saving...',
      className: 'text-[rgb(var(--state-warning-fg))]',
    },
    offline: {
      icon: WifiOff,
      text: 'Offline',
      className: 'text-[rgb(var(--state-danger-fg))]',
    },
    error: {
      icon: CloudOff,
      text: 'Save failed',
      className: 'text-[rgb(var(--state-danger-fg))]',
    },
  }

  const config = configs[status]
  if (!config) return null

  const Icon = config.icon

  return (
    <span className={`flex items-center gap-1 text-xs ${config.className}`}>
      <Icon className={`w-3 h-3 ${status === 'saving' ? 'animate-spin' : ''}`} />
      {config.text}
    </span>
  )
}

// ============================================================================
// PROGRESS BAR (Task 4.8)
// ============================================================================

function ProgressBar({ marked, total }: { marked: number; total: number }) {
  const pct = total > 0 ? (marked / total) * 100 : 0
  const isComplete = marked === total && total > 0

  return (
    <div className="w-32 h-2 bg-surface-secondary rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-300 ${
          isComplete
            ? 'bg-[rgb(var(--state-success-fg))] animate-pulse'
            : 'bg-[rgb(var(--state-info-fg))]'
        }`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

// ============================================================================
// SORTABLE HEADER (Task 4.3)
// ============================================================================

function SortableHeader({
  label,
  field,
  currentSort,
  currentDir,
  onSort,
}: {
  label: string
  field: SortKey
  currentSort: SortKey
  currentDir: SortDir
  onSort: (key: SortKey) => void
}) {
  const isActive = currentSort === field
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className="flex items-center gap-1 text-xs font-medium text-text-tertiary hover:text-text-secondary transition-colors select-none"
    >
      {label}
      {isActive && (
        currentDir === 'asc'
          ? <ChevronUp className="w-3 h-3" />
          : <ChevronDown className="w-3 h-3" />
      )}
    </button>
  )
}

// ============================================================================
// COMPONENT
// ============================================================================

export function AttendanceGrid({
  students,
  date,
  existingRecords = [],
  onSave,
  isSaving,
  disabled = false,
  saveStatus,
  onCorrection,
  lockedStudents,
  defaultStatus = 'present',
}: AttendanceGridProps) {
  // Task 4.6: Determine if this is a past date
  const isPastDate = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    return date < today
  }, [date])

  // F2.T1 — absentee-first default only applies for a fresh present/future day.
  // Past dates are correction mode (start from saved values, never auto-fill).
  const freshDefault: AttendanceStatus | null = isPastDate ? null : defaultStatus

  // F2.T1 — studentIds the user has explicitly touched. The async backfill below
  // overrides the absentee-first default with saved records, but must NOT clobber
  // a real user edit; a `null` status is no longer a reliable "untouched" signal
  // once we pre-fill present, so we track touch explicitly.
  const touchedRef = useRef<Set<string>>(new Set())

  // Initialize entries from students + any existing records (absentee-first default
  // for fresh, non-locked students).
  const initialEntries = useMemo(() => {
    return students.map((s) => {
      const existing = existingRecords.find((r) => r.studentId === s.studentId)
      const isLocked = lockedStudents?.has(s.studentId) ?? false
      const status: AttendanceStatus | null = existing
        ? (existing.status as AttendanceStatus)
        : isLocked
          ? null // locked elsewhere — never default; excluded from this section's save
          : freshDefault
      return {
        studentId: s.studentId,
        studentName: s.studentName || s.studentId,
        studentNumber: s.studentNumber,
        status,
        notes: existing?.notes ?? '',
        excuseType: existing?.excuseReason as string | undefined,
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students, existingRecords, freshDefault])

  const [entries, setEntries] = useState<StudentAttendanceEntry[]>(initialEntries)

  // Ticket 5 + F2.T1: Sync entries when existingRecords load asynchronously.
  // Backfill from saved records for any student the user hasn't touched — this
  // overrides the absentee-first default with the real saved value on return.
  useEffect(() => {
    if (existingRecords.length === 0) return
    setEntries((prev) =>
      prev.map((entry) => {
        if (touchedRef.current.has(entry.studentId)) return entry // preserve user edit
        const existing = existingRecords.find((r) => r.studentId === entry.studentId)
        if (!existing) return entry
        return { ...entry, status: existing.status as AttendanceStatus, notes: existing.notes ?? '', excuseType: existing.excuseReason }
      })
    )
  }, [existingRecords])

  // Task 4.2: Search filter
  const [searchQuery, setSearchQuery] = useState('')

  // Task 4.3: Sort state
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  // Task 5.3: aria-live announcement
  const [announcement, setAnnouncement] = useState('')

  // Task 4.8: Previous day status map

  // Track if anything has changed
  const hasChanges = useMemo(() => {
    return entries.some((entry) => {
      const existing = existingRecords.find((r) => r.studentId === entry.studentId)
      if (!existing && entry.status !== null) return true
      if (existing && entry.status !== existing.status) return true
      if (existing && entry.notes !== (existing.notes ?? '')) return true
      // Sprint 1.6 — a reason-only edit (status unchanged) is still a change.
      if (existing && (entry.excuseType ?? '') !== (existing.excuseReason ?? '')) return true
      return false
    })
  }, [entries, existingRecords])

  // Task 4.2: Filtered entries
  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries
    const q = searchQuery.toLowerCase()
    return entries.filter(
      (e) =>
        e.studentName.toLowerCase().includes(q) ||
        (e.studentNumber && e.studentNumber.toLowerCase().includes(q))
    )
  }, [entries, searchQuery])

  // Task 4.3: Sorted entries
  const sortedEntries = useMemo(() => {
    const list = [...filteredEntries]
    list.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'name':
          cmp = a.studentName.localeCompare(b.studentName)
          break
        case 'number':
          cmp = (a.studentNumber || '').localeCompare(b.studentNumber || '')
          break
        case 'status': {
          const statusOrder: Record<string, number> = { present: 0, late: 1, remote: 2, excused: 3, half_day: 4, absent: 5 }
          const aVal = a.status ? (statusOrder[a.status] ?? 6) : 7
          const bVal = b.status ? (statusOrder[b.status] ?? 6) : 7
          cmp = aVal - bVal
          break
        }
      }
      return sortDir === 'desc' ? -cmp : cmp
    })
    return list
  }, [filteredEntries, sortKey, sortDir])

  // Task 4.4: Row refs for keyboard navigation
  const rowRefs = useRef<Map<string, React.RefObject<AttendanceRowRef | null>>>(new Map())
  const getRowRef = (studentId: string) => {
    if (!rowRefs.current.has(studentId)) {
      rowRefs.current.set(studentId, createRef<AttendanceRowRef>())
    }
    return rowRefs.current.get(studentId)!
  }

  const focusRow = (index: number) => {
    if (index >= 0 && index < sortedEntries.length) {
      const ref = rowRefs.current.get(sortedEntries[index].studentId)
      ref?.current?.focus()
    }
  }

  const handleStatusChange = useCallback((studentId: string, status: AttendanceStatus) => {
    touchedRef.current.add(studentId)
    setEntries((prev) =>
      prev.map((e) => (e.studentId === studentId ? { ...e, status } : e))
    )
  }, [])

  const handleNotesChange = useCallback((studentId: string, notes: string) => {
    touchedRef.current.add(studentId)
    setEntries((prev) =>
      prev.map((e) => (e.studentId === studentId ? { ...e, notes } : e))
    )
  }, [])

  const handleExcuseTypeChange = useCallback((studentId: string, excuseType: string) => {
    touchedRef.current.add(studentId)
    setEntries((prev) =>
      prev.map((e) => (e.studentId === studentId ? { ...e, excuseType } : e))
    )
  }, [])

  // Bulk actions count as touching every (non-locked) row so a late-arriving
  // existingRecords backfill can't silently revert them.
  const markAllPresent = useCallback(() => {
    setEntries((prev) =>
      prev.map((e) => {
        if (lockedStudents?.has(e.studentId)) return e
        touchedRef.current.add(e.studentId)
        return { ...e, status: 'present' as AttendanceStatus }
      })
    )
    setAnnouncement('All students marked present')
  }, [lockedStudents])

  const markAllAbsent = useCallback(() => {
    setEntries((prev) =>
      prev.map((e) => {
        if (lockedStudents?.has(e.studentId)) return e
        touchedRef.current.add(e.studentId)
        return { ...e, status: 'absent' as AttendanceStatus }
      })
    )
    setAnnouncement('All students marked absent')
  }, [lockedStudents])

  const clearAll = useCallback(() => {
    setEntries((prev) =>
      prev.map((e) => {
        if (lockedStudents?.has(e.studentId)) return e
        touchedRef.current.add(e.studentId)
        return { ...e, status: null, notes: '', excuseType: undefined }
      })
    )
    setAnnouncement('All entries cleared')
  }, [lockedStudents])

  const handleSave = () => {
    // Only send records that actually changed (dirty records)
    const records = entries
      .filter((e) => {
        if (e.status === null) return false
        // Locked students' day-presence is owned by an earlier section. Only an
        // explicit Tardy/Excused override the teacher set here is persisted
        // (F2.T4); the absentee-first present default is never written for them.
        if (lockedStudents?.has(e.studentId)) {
          if (!(touchedRef.current.has(e.studentId) && isLockedOverrideStatus(e.status))) return false
        }
        const existing = existingRecords.find((r) => r.studentId === e.studentId)
        if (!existing) return true // New record (no prior attendance)
        // Changed status, notes, or reason
        return (
          e.status !== existing.status ||
          e.notes !== (existing.notes ?? '') ||
          (e.excuseType ?? '') !== (existing.excuseReason ?? '')
        )
      })
      .map((e) => ({
        studentId: e.studentId,
        status: e.status as AttendanceStatus,
        notes: e.notes || undefined,
        excuseReason: e.excuseType || undefined,
      }))
    if (records.length === 0) return
    onSave(records)
    setAnnouncement(`Attendance saved for ${records.length} students`)
  }

  // Task 4.6: Correction handler for individual past-date edits
  const handleCorrectionSave = useCallback(
    (studentId: string) => {
      const entry = entries.find((e) => e.studentId === studentId)
      if (entry && entry.status && onCorrection) {
        onCorrection({
          studentId: entry.studentId,
          status: entry.status,
          notes: entry.notes || undefined,
          excuseType: entry.excuseType,
        })
      }
    },
    [entries, onCorrection]
  )

  const handleCorrectionCancel = useCallback(
    (studentId: string) => {
      const existing = existingRecords.find((r) => r.studentId === studentId)
      if (existing) {
        setEntries((prev) =>
          prev.map((e) =>
            e.studentId === studentId
              ? { ...e, status: existing.status, notes: existing.notes ?? '', excuseType: existing.excuseReason }
              : e
          )
        )
      }
    },
    [existingRecords]
  )

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const markedCount = entries.filter((e) => e.status !== null).length
  const totalCount = entries.length

  if (students.length === 0) {
    return (
      <div className="py-16 text-center">
        <Users className="w-10 h-10 mx-auto text-text-tertiary mb-3" />
        <h4 className="text-sm font-medium text-text-primary mb-1">
          No students in this section
        </h4>
        <p className="text-xs text-text-tertiary">
          Enroll students in this section to start taking attendance.
        </p>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${disabled ? 'opacity-60 pointer-events-none' : ''}`}>
      {/* Task 5.3: Screen reader announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>

      {/* Quick Actions Bar — Task 5.5: responsive wrapping */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {!isPastDate && (
            <>
              <button
                type="button"
                onClick={markAllPresent}
                disabled={disabled}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[rgb(var(--state-success-fg))] bg-[rgb(var(--state-success-bg)/0.18)] hover:bg-[rgb(var(--state-success-bg)/0.26)] dark:bg-[rgb(var(--state-success-bg)/0.18)] dark:hover:bg-[rgb(var(--state-success-fg)/0.2)]  rounded-lg transition-colors disabled:opacity-50"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                All Present
              </button>
              <button
                type="button"
                onClick={markAllAbsent}
                disabled={disabled}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[rgb(var(--state-danger-fg))] bg-[rgb(var(--state-danger-bg)/0.18)] hover:bg-[rgb(var(--state-danger-bg)/0.26)] dark:bg-[rgb(var(--state-danger-bg)/0.18)] dark:hover:bg-[rgb(var(--state-danger-fg)/0.2)]  rounded-lg transition-colors disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5" />
                All Absent
              </button>
              {markedCount > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  disabled={disabled}
                  className="px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary bg-surface-secondary hover:bg-surface-hover rounded-lg transition-colors disabled:opacity-50"
                >
                  Clear All
                </button>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Task 4.8: Progress bar */}
          <ProgressBar marked={markedCount} total={totalCount} />
          <SaveStatusBadge status={saveStatus} />
          <span className="text-xs text-text-tertiary">
            {markedCount} / {totalCount} marked
          </span>
          {/* Task 5.5: full-width save on small screens */}
          {!isPastDate && (
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || markedCount === 0 || !hasChanges || disabled}
              className="flex items-center justify-center gap-1.5 w-full sm:w-auto px-4 py-2.5 sm:py-2 text-sm font-medium text-[rgb(var(--action-primary-fg))] bg-[rgb(var(--action-primary-bg))] hover:bg-[rgb(var(--action-primary-bg-hover))] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Attendance
            </button>
          )}
        </div>
      </div>

      {/* Task 4.2: Search + Filter — Task 5.5: full-width on mobile */}
      <div className="flex items-center gap-3">
        <div className="flex-1 sm:max-w-xs">
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search students..."
            aria-label="Search students by name or number"
            prefix={<Search className="w-4 h-4" />}
            suffix={
              searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-0.5 text-text-tertiary hover:text-text-primary transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : undefined
            }
          />
        </div>
        {searchQuery && (
          <span className="text-xs text-text-tertiary">
            {filteredEntries.length} of {entries.length} students
          </span>
        )}
      </div>

      {/* Keyboard Hint (hide on past dates and on mobile) — derived from the
          single status source (F0.T2/F2.T3) so labels + shortcuts can't drift. */}
      {!isPastDate && (
        <div className="text-xs text-text-tertiary px-1 hidden sm:block">
          Keyboard shortcuts:{' '}
          {ENTRY_STATUSES.map((s) => {
            const meta = ATTENDANCE_STATUS_META[s]
            return (
              <span key={s}>
                <kbd className="px-1 py-0.5 bg-surface-secondary rounded text-text-secondary">
                  {meta.shortcut ?? meta.shortLabel}
                </kbd>{' '}
                {meta.label}{' '}
              </span>
            )
          })}
          <kbd className="px-1 py-0.5 bg-surface-secondary rounded text-text-secondary">↑↓</kbd> Navigate
        </div>
      )}

      {/* Task 4.3: Sortable Column Headers + Student Rows */}
      <div className="rounded-xl border border-border-secondary overflow-hidden" role="grid" aria-label="Attendance entry grid">
        {/* Task 5.5: Hide column headers on mobile (stacked layout doesn't need them) */}
        <div className="hidden sm:flex items-center gap-4 py-2 px-4 bg-surface-secondary border-b border-border-secondary">
          <div className="flex-1 min-w-0">
            <SortableHeader label="Name" field="name" currentSort={sortKey} currentDir={sortDir} onSort={toggleSort} />
          </div>
          <div className="w-56">
            <SortableHeader label="Status" field="status" currentSort={sortKey} currentDir={sortDir} onSort={toggleSort} />
          </div>
          <div className="w-10" />
        </div>

        {sortedEntries.length === 0 ? (
          <div className="py-8 text-center text-sm text-text-tertiary">
            No students match your search.
          </div>
        ) : (
          sortedEntries.map((entry, index) => (
            <AttendanceRow
              key={entry.studentId}
              ref={getRowRef(entry.studentId)}
              studentId={entry.studentId}
              studentName={entry.studentName}
              studentNumber={entry.studentNumber}
              currentStatus={entry.status}
              notes={entry.notes}
              excuseType={entry.excuseType}
              onStatusChange={(status) => handleStatusChange(entry.studentId, status)}
              onNotesChange={(notes) => handleNotesChange(entry.studentId, notes)}
              onExcuseTypeChange={(excuseType) => handleExcuseTypeChange(entry.studentId, excuseType)}
              isPastDate={isPastDate}
              onCorrectionSave={() => handleCorrectionSave(entry.studentId)}
              onCorrectionCancel={() => handleCorrectionCancel(entry.studentId)}
              onArrowUp={() => focusRow(index - 1)}
              onArrowDown={() => focusRow(index + 1)}
              locked={lockedStudents?.has(entry.studentId)}
              lockedHint={lockedStudents?.get(entry.studentId)}
            />
          ))
        )}
      </div>
    </div>
  )
}
