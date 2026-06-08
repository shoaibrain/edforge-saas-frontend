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
import type { AttendanceStatus } from '../../services/academics.service'
import type { StudentSectionResponseDto } from '@aibrains/shared-types'
import { AttendanceRow, type AttendanceRowRef } from './AttendanceRow'
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
            ? 'bg-[rgb(var(--state-success-bg)/0.18)]0 animate-pulse'
            : 'bg-[rgb(var(--state-info-bg)/0.18)]0'
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
}: AttendanceGridProps) {
  // Task 4.6: Determine if this is a past date
  const isPastDate = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    return date < today
  }, [date])

  // Initialize entries from students + any existing records
  const initialEntries = useMemo(() => {
    return students.map((s) => {
      const existing = existingRecords.find((r) => r.studentId === s.studentId)
      return {
        studentId: s.studentId,
        studentName: s.studentName || s.studentId,
        studentNumber: s.studentNumber,
        status: (existing?.status ?? null) as AttendanceStatus | null,
        notes: existing?.notes ?? '',
        excuseType: existing?.excuseReason as string | undefined,
      }
    })
  }, [students, existingRecords])

  const [entries, setEntries] = useState<StudentAttendanceEntry[]>(initialEntries)

  // Ticket 5: Sync entries when existingRecords load asynchronously.
  // Only backfill entries where the user hasn't made a local edit (status is still null).
  useEffect(() => {
    if (existingRecords.length === 0) return
    setEntries((prev) =>
      prev.map((entry) => {
        if (entry.status !== null) return entry // User already set a status, don't overwrite
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
    setEntries((prev) =>
      prev.map((e) => (e.studentId === studentId ? { ...e, status } : e))
    )
  }, [])

  const handleNotesChange = useCallback((studentId: string, notes: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.studentId === studentId ? { ...e, notes } : e))
    )
  }, [])

  const handleExcuseTypeChange = useCallback((studentId: string, excuseType: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.studentId === studentId ? { ...e, excuseType } : e))
    )
  }, [])

  const markAllPresent = useCallback(() => {
    setEntries((prev) =>
      prev.map((e) => ({ ...e, status: 'present' as AttendanceStatus }))
    )
    setAnnouncement('All students marked present')
  }, [])

  const markAllAbsent = useCallback(() => {
    setEntries((prev) =>
      prev.map((e) => ({ ...e, status: 'absent' as AttendanceStatus }))
    )
    setAnnouncement('All students marked absent')
  }, [])

  const clearAll = useCallback(() => {
    setEntries((prev) =>
      prev.map((e) => ({ ...e, status: null, notes: '', excuseType: undefined }))
    )
    setAnnouncement('All entries cleared')
  }, [])

  const handleSave = () => {
    // Only send records that actually changed (dirty records)
    const records = entries
      .filter((e) => {
        if (e.status === null) return false
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
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[rgb(var(--state-success-fg))] bg-[rgb(var(--state-success-bg)/0.18)] hover:bg-[rgb(var(--state-success-bg)/0.26)] dark:bg-[rgb(var(--state-success-bg)/0.18)] dark:hover:bg-[rgb(var(--state-success-bg)/0.18)]0/20  rounded-lg transition-colors disabled:opacity-50"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                All Present
              </button>
              <button
                type="button"
                onClick={markAllAbsent}
                disabled={disabled}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[rgb(var(--state-danger-fg))] bg-[rgb(var(--state-danger-bg)/0.18)] hover:bg-[rgb(var(--state-danger-bg)/0.26)] dark:bg-[rgb(var(--state-danger-bg)/0.18)] dark:hover:bg-[rgb(var(--state-danger-bg)/0.18)]0/20  rounded-lg transition-colors disabled:opacity-50"
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
              className="flex items-center justify-center gap-1.5 w-full sm:w-auto px-4 py-2.5 sm:py-2 text-sm font-medium text-[rgb(var(--action-primary-fg))] bg-[rgb(var(--state-info-bg)/0.18)]0 hover:bg-[rgb(var(--action-primary-bg-hover))] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search students..."
            className="w-full pl-9 pr-8 py-2 text-sm bg-surface-secondary border border-border-secondary rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)]"
            aria-label="Search students by name or number"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-text-tertiary hover:text-text-primary transition-colors"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {searchQuery && (
          <span className="text-xs text-text-tertiary">
            {filteredEntries.length} of {entries.length} students
          </span>
        )}
      </div>

      {/* Keyboard Hint (hide on past dates and on mobile) */}
      {!isPastDate && (
        <div className="text-xs text-text-tertiary px-1 hidden sm:block">
          Keyboard shortcuts: <kbd className="px-1 py-0.5 bg-surface-secondary rounded text-text-secondary">P</kbd> Present{' '}
          <kbd className="px-1 py-0.5 bg-surface-secondary rounded text-text-secondary">A</kbd> Absent{' '}
          <kbd className="px-1 py-0.5 bg-surface-secondary rounded text-text-secondary">L</kbd> Late{' '}
          <kbd className="px-1 py-0.5 bg-surface-secondary rounded text-text-secondary">E</kbd> Excused{' '}
          <kbd className="px-1 py-0.5 bg-surface-secondary rounded text-text-secondary">R</kbd> Remote{' '}
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
            />
          ))
        )}
      </div>
    </div>
  )
}
