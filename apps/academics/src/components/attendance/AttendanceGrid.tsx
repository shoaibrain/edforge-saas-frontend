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

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { Users, ChevronUp, ChevronDown } from 'lucide-react'
import type { AttendanceStatus } from '../../services/academics.service'
import type { StudentSectionResponseDto } from '@aibrains/shared-types'
import { RosterList } from './roster/RosterList'
import { RosterToolbar, type RosterFilter } from './roster/RosterToolbar'
import { RosterSummaryStrip } from './roster/RosterSummaryStrip'
import { useHasHover } from '../../hooks/useHasHover'
import { ENTRY_STATUSES, ATTENDANCE_STATUS_META, isLockedOverrideStatus, summarizeByBucket } from './attendanceStatus'
import type { SaveStatus } from '../../hooks/useOfflineAttendance'
import { useAcademicsI18n } from '../../lib/i18n'

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
   * Seed status for unmarked students on a fresh day. Default is `null` — the
   * grid does NOT pre-select anyone (operator feedback 2026-06-27, reversing the
   * earlier absentee-first auto-Present): the existing "All Present" quick action
   * is the one-click path, and a blank grid never mis-reports Present on a
   * weekend/holiday or a not-yet-recorded day. Callers may still pass 'present'
   * to opt into pre-fill.
   */
  defaultStatus?: AttendanceStatus | null
  /**
   * Narrow-container mode (the recording drawer): drops the keyboard-hint row
   * (shortcuts still work) and lets the search share a row with the filter
   * chips, so the toolbar reads as one calm line instead of three stacked rows.
   */
  compact?: boolean
}

type SortKey = 'name' | 'number' | 'status'
type SortDir = 'asc' | 'desc'

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
  defaultStatus = null,
  compact = false,
}: AttendanceGridProps) {
  const { t, attendanceStatusLabel } = useAcademicsI18n()
  // Task 4.6: Determine if this is a past date
  const isPastDate = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    return date < today
  }, [date])

  // A non-null defaultStatus (pre-fill) only applies to a fresh present/future
  // day. Past dates are correction mode (start from saved values, never fill).
  // With the default `null`, the grid stays blank until the operator acts.
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

  // Filter chip (All / Unmarked / Absent / Flagged / Locked) — focuses the view.
  const [activeFilter, setActiveFilter] = useState<RosterFilter>('all')

  // Task 4.3: Sort state
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  // Task 5.3: aria-live announcement
  const [announcement, setAnnouncement] = useState('')

  // Past-date correction edit state, lifted out of the row so it survives a row
  // unmount/remount under virtualization.
  const [editingIds, setEditingIds] = useState<Set<string>>(new Set())

  // Inline Reason/Note panel open state, lifted so it survives a row unmount /
  // remount under virtualization.
  const [detailsOpenIds, setDetailsOpenIds] = useState<Set<string>>(new Set())
  const toggleDetails = useCallback((studentId: string) => {
    setDetailsOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(studentId)) next.delete(studentId)
      else next.add(studentId)
      return next
    })
  }, [])

  // Hover-capable pointers get the compact reveal control; touch/coarse pointers
  // always see the full status set (no hover to reveal it).
  const expandTrigger: 'hover' | 'always' = useHasHover() ? 'hover' : 'always'

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

  // Chip filter (independent of search). Counts come from the full roster so a
  // chip shows the true total even while a search narrows the visible rows.
  const matchesFilter = useCallback(
    (e: StudentAttendanceEntry): boolean => {
      switch (activeFilter) {
        case 'unmarked':
          return e.status === null && !lockedStudents?.has(e.studentId)
        case 'absent':
          return e.status === 'absent'
        case 'flagged':
          return !!e.notes || !!e.excuseType
        case 'locked':
          return !!lockedStudents?.has(e.studentId)
        default:
          return true
      }
    },
    [activeFilter, lockedStudents],
  )

  const filterCounts = useMemo<Record<RosterFilter, number>>(
    () => ({
      all: entries.length,
      unmarked: entries.filter((e) => e.status === null && !lockedStudents?.has(e.studentId)).length,
      absent: entries.filter((e) => e.status === 'absent').length,
      flagged: entries.filter((e) => !!e.notes || !!e.excuseType).length,
      locked: entries.filter((e) => !!lockedStudents?.has(e.studentId)).length,
    }),
    [entries, lockedStudents],
  )

  // Task 4.2: chip filter, then search.
  const filteredEntries = useMemo(() => {
    const byChip = entries.filter(matchesFilter)
    if (!searchQuery.trim()) return byChip
    const q = searchQuery.toLowerCase()
    return byChip.filter(
      (e) =>
        e.studentName.toLowerCase().includes(q) ||
        (e.studentNumber && e.studentNumber.toLowerCase().includes(q)),
    )
  }, [entries, matchesFilter, searchQuery])

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

  // Row focus + keyboard navigation now live in RosterList (virtualized).

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
    setAnnouncement(t('attendance.announcements.allPresent'))
  }, [lockedStudents, t])

  const markAllAbsent = useCallback(() => {
    setEntries((prev) =>
      prev.map((e) => {
        if (lockedStudents?.has(e.studentId)) return e
        touchedRef.current.add(e.studentId)
        return { ...e, status: 'absent' as AttendanceStatus }
      })
    )
    setAnnouncement(t('attendance.announcements.allAbsent'))
  }, [lockedStudents, t])

  const clearAll = useCallback(() => {
    setEntries((prev) =>
      prev.map((e) => {
        if (lockedStudents?.has(e.studentId)) return e
        touchedRef.current.add(e.studentId)
        return { ...e, status: null, notes: '', excuseType: undefined }
      })
    )
    setAnnouncement(t('attendance.announcements.allCleared'))
  }, [lockedStudents, t])

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
    setAnnouncement(t('attendance.announcements.saved', { count: records.length }))
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

  const startEdit = useCallback((studentId: string) => {
    setEditingIds((prev) => new Set(prev).add(studentId))
  }, [])

  const finishEdit = useCallback((studentId: string) => {
    setEditingIds((prev) => {
      const next = new Set(prev)
      next.delete(studentId)
      return next
    })
  }, [])

  const onRowCorrectionSave = useCallback(
    (studentId: string) => {
      finishEdit(studentId)
      handleCorrectionSave(studentId)
    },
    [finishEdit, handleCorrectionSave],
  )

  const onRowCorrectionCancel = useCallback(
    (studentId: string) => {
      finishEdit(studentId)
      handleCorrectionCancel(studentId)
    },
    [finishEdit, handleCorrectionCancel],
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
  const buckets = useMemo(() => summarizeByBucket(entries.map((e) => e.status)), [entries])

  if (students.length === 0) {
    return (
      <div className="py-16 text-center">
        <Users className="w-10 h-10 mx-auto text-text-tertiary mb-3" />
        <h4 className="text-sm font-medium text-text-primary mb-1">
          {t('attendance.empty.noStudentsTitle')}
        </h4>
        <p className="text-xs text-text-tertiary">
          {t('attendance.empty.noStudentsDescription')}
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

      {/* Keyboard Hint (hide on past dates, on mobile, and in compact mode) —
          derived from the single status source (F0.T2/F2.T3) so labels +
          shortcuts can't drift. */}
      {!isPastDate && !compact && (
        <div className="text-xs text-text-tertiary px-1 hidden sm:block">
          {t('attendance.grid.keyboardShortcuts')}{' '}
          {ENTRY_STATUSES.map((s) => {
            const meta = ATTENDANCE_STATUS_META[s]
            const label = attendanceStatusLabel(s)
            return (
              <span key={s}>
                <kbd className="px-1 py-0.5 bg-surface-secondary rounded text-text-secondary">
                  {meta.shortcut ?? meta.shortLabel}
                </kbd>{' '}
                {label}{' '}
              </span>
            )
          })}
          <kbd className="px-1 py-0.5 bg-surface-secondary rounded text-text-secondary">↑↓</kbd> {t('attendance.grid.navigate')}
        </div>
      )}

      {/* Bounded, virtualized roster (Task 4.3 sort header + windowed rows). Only
          the inner list scrolls — the column header stays put — so page height is
          capped regardless of roster size. */}
      <div
        className="flex flex-col overflow-hidden rounded-xl border border-border-secondary"
        style={{ maxHeight: 'min(70vh, 720px)' }}
        role="grid"
        aria-label={t('attendance.grid.ariaLabel')}
      >
        <RosterToolbar
          compact={compact}
          search={searchQuery}
          onSearchChange={setSearchQuery}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          counts={filterCounts}
          showLockedChip={(lockedStudents?.size ?? 0) > 0}
          canBulk={!isPastDate && !disabled}
          onMarkAllPresent={markAllPresent}
          onMarkAllAbsent={markAllAbsent}
          onClearAll={clearAll}
          bulkScopeCount={null}
          markedCount={markedCount}
        />

        <RosterSummaryStrip
          marked={markedCount}
          total={totalCount}
          buckets={buckets}
          saveStatus={saveStatus}
          isPastDate={isPastDate}
          isSaving={isSaving}
          hasChanges={hasChanges}
          disabled={disabled}
          onSave={handleSave}
        />

        {/* Hide column headers on mobile (stacked layout doesn't need them). */}
        <div className="hidden flex-shrink-0 items-center gap-3 border-b border-border-secondary bg-surface-secondary px-4 py-2 sm:flex">
          <div className="min-w-0 flex-1">
            <SortableHeader label={t('attendance.grid.name')} field="name" currentSort={sortKey} currentDir={sortDir} onSort={toggleSort} />
          </div>
          <div className="pe-2">
            <SortableHeader label={t('attendance.grid.status')} field="status" currentSort={sortKey} currentDir={sortDir} onSort={toggleSort} />
          </div>
        </div>

        <RosterList
          entries={sortedEntries}
          isPastDate={isPastDate}
          expandTrigger={expandTrigger}
          lockedStudents={lockedStudents}
          editingIds={editingIds}
          onStatusChange={handleStatusChange}
          onNotesChange={handleNotesChange}
          onExcuseTypeChange={handleExcuseTypeChange}
          onStartEdit={startEdit}
          onCorrectionSave={onRowCorrectionSave}
          onCorrectionCancel={onRowCorrectionCancel}
          detailsOpenIds={detailsOpenIds}
          onToggleDetails={toggleDetails}
        />
      </div>
    </div>
  )
}
