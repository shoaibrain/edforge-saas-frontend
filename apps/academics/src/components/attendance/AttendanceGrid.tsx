/**
 * AttendanceGrid Component
 *
 * Bulk attendance entry grid for a section.
 * Shows all enrolled students with status toggles and a save button.
 * Supports save status indicator and disabled state (non-instructional days).
 */

import { useState, useCallback, useMemo } from 'react'
import {
  CheckCircle,
  XCircle,
  Loader2,
  Save,
  Users,
  Check,
  WifiOff,
  CloudOff,
} from 'lucide-react'
import type { AttendanceStatus } from '../../services/academics.service'
import type { StudentSectionResponseDto } from '@aibrains/shared-types'
import { AttendanceRow } from './AttendanceRow'
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
}

interface AttendanceGridProps {
  students: StudentSectionResponseDto[]
  date: string
  existingRecords?: Array<{
    studentId: string
    status: AttendanceStatus
    notes?: string
  }>
  onSave: (records: Array<{ studentId: string; status: AttendanceStatus; notes?: string }>) => void
  isSaving: boolean
  disabled?: boolean
  saveStatus?: SaveStatus
}

// ============================================================================
// SAVE STATUS BADGE
// ============================================================================

function SaveStatusBadge({ status }: { status?: SaveStatus }) {
  if (!status || status === 'idle') return null

  const configs: Record<string, { icon: typeof Check; text: string; className: string }> = {
    saved: {
      icon: Check,
      text: 'Saved',
      className: 'text-emerald-600 dark:text-emerald-400',
    },
    saving: {
      icon: Loader2,
      text: 'Auto-saving...',
      className: 'text-amber-600 dark:text-amber-400',
    },
    offline: {
      icon: WifiOff,
      text: 'Offline',
      className: 'text-red-600 dark:text-red-400',
    },
    error: {
      icon: CloudOff,
      text: 'Save failed',
      className: 'text-red-600 dark:text-red-400',
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
// COMPONENT
// ============================================================================

export function AttendanceGrid({
  students,
  date: _date,
  existingRecords = [],
  onSave,
  isSaving,
  disabled = false,
  saveStatus,
}: AttendanceGridProps) {
  // Initialize entries from students + any existing records
  const initialEntries = useMemo(() => {
    return students.map((s) => {
      const existing = existingRecords.find((r) => r.studentId === s.studentId)
      return {
        studentId: s.studentId,
        studentName: s.studentName || s.studentId,
        studentNumber: undefined as string | undefined,
        status: (existing?.status ?? null) as AttendanceStatus | null,
        notes: existing?.notes ?? '',
      }
    })
  }, [students, existingRecords])

  const [entries, setEntries] = useState<StudentAttendanceEntry[]>(initialEntries)

  // Track if anything has changed
  const hasChanges = useMemo(() => {
    return entries.some((entry) => {
      const existing = existingRecords.find((r) => r.studentId === entry.studentId)
      if (!existing && entry.status !== null) return true
      if (existing && entry.status !== existing.status) return true
      if (existing && entry.notes !== (existing.notes ?? '')) return true
      return false
    })
  }, [entries, existingRecords])

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

  const markAllPresent = useCallback(() => {
    setEntries((prev) =>
      prev.map((e) => ({ ...e, status: 'present' as AttendanceStatus }))
    )
  }, [])

  const markAllAbsent = useCallback(() => {
    setEntries((prev) =>
      prev.map((e) => ({ ...e, status: 'absent' as AttendanceStatus }))
    )
  }, [])

  const clearAll = useCallback(() => {
    setEntries((prev) =>
      prev.map((e) => ({ ...e, status: null, notes: '' }))
    )
  }, [])

  const handleSave = () => {
    const records = entries
      .filter((e) => e.status !== null)
      .map((e) => ({
        studentId: e.studentId,
        status: e.status as AttendanceStatus,
        notes: e.notes || undefined,
      }))
    onSave(records)
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
      {/* Quick Actions Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={markAllPresent}
            disabled={disabled}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 dark:text-emerald-400 rounded-lg transition-colors disabled:opacity-50"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            All Present
          </button>
          <button
            type="button"
            onClick={markAllAbsent}
            disabled={disabled}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-400 rounded-lg transition-colors disabled:opacity-50"
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
        </div>

        <div className="flex items-center gap-3">
          <SaveStatusBadge status={saveStatus} />
          <span className="text-xs text-text-tertiary">
            {markedCount} / {totalCount} marked
          </span>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || markedCount === 0 || !hasChanges || disabled}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-teal-500 hover:bg-teal-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Attendance
          </button>
        </div>
      </div>

      {/* Keyboard Hint */}
      <div className="text-xs text-text-tertiary px-1">
        Keyboard shortcuts: <kbd className="px-1 py-0.5 bg-surface-secondary rounded text-text-secondary">P</kbd> Present{' '}
        <kbd className="px-1 py-0.5 bg-surface-secondary rounded text-text-secondary">A</kbd> Absent{' '}
        <kbd className="px-1 py-0.5 bg-surface-secondary rounded text-text-secondary">L</kbd> Late{' '}
        <kbd className="px-1 py-0.5 bg-surface-secondary rounded text-text-secondary">E</kbd> Excused{' '}
        <kbd className="px-1 py-0.5 bg-surface-secondary rounded text-text-secondary">R</kbd> Remote
      </div>

      {/* Student Rows */}
      <div className="rounded-xl border border-border-secondary overflow-hidden" role="grid">
        {entries.map((entry) => (
          <AttendanceRow
            key={entry.studentId}
            studentId={entry.studentId}
            studentName={entry.studentName}
            studentNumber={entry.studentNumber}
            currentStatus={entry.status}
            notes={entry.notes}
            onStatusChange={(status) => handleStatusChange(entry.studentId, status)}
            onNotesChange={(notes) => handleNotesChange(entry.studentId, notes)}
          />
        ))}
      </div>
    </div>
  )
}
