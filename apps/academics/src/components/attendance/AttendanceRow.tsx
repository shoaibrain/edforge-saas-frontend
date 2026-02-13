/**
 * AttendanceRow Component
 *
 * Single student row in the attendance grid with status toggle buttons.
 * Supports keyboard shortcuts: P=Present, A=Absent, L=Late, E=Excused, R=Remote
 */

import { useState, useRef } from 'react'
import { MessageSquare, ChevronDown, ChevronUp } from 'lucide-react'
import type { AttendanceStatus } from '../../services/academics.service'

interface AttendanceRowProps {
  studentId: string
  studentName: string
  studentNumber?: string
  currentStatus: AttendanceStatus | null
  notes: string
  onStatusChange: (status: AttendanceStatus) => void
  onNotesChange: (notes: string) => void
}

const statusButtons: { status: AttendanceStatus; label: string; shortcut: string; color: string; activeColor: string }[] = [
  { status: 'present', label: 'P', shortcut: 'P', color: 'hover:bg-emerald-100 hover:text-emerald-700 dark:hover:bg-emerald-500/20 dark:hover:text-emerald-400', activeColor: 'bg-emerald-500 text-white' },
  { status: 'absent', label: 'A', shortcut: 'A', color: 'hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-500/20 dark:hover:text-red-400', activeColor: 'bg-red-500 text-white' },
  { status: 'late', label: 'L', shortcut: 'L', color: 'hover:bg-amber-100 hover:text-amber-700 dark:hover:bg-amber-500/20 dark:hover:text-amber-400', activeColor: 'bg-amber-500 text-white' },
  { status: 'excused', label: 'E', shortcut: 'E', color: 'hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-500/20 dark:hover:text-blue-400', activeColor: 'bg-blue-500 text-white' },
  { status: 'remote', label: 'R', shortcut: 'R', color: 'hover:bg-indigo-100 hover:text-indigo-700 dark:hover:bg-indigo-500/20 dark:hover:text-indigo-400', activeColor: 'bg-indigo-500 text-white' },
]

export function AttendanceRow({
  studentName,
  studentNumber,
  currentStatus,
  notes,
  onStatusChange,
  onNotesChange,
}: AttendanceRowProps) {
  const [showNotes, setShowNotes] = useState(false)
  const rowRef = useRef<HTMLDivElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const key = e.key.toUpperCase()
    const match = statusButtons.find((b) => b.shortcut === key)
    if (match) {
      e.preventDefault()
      onStatusChange(match.status)
    }
  }

  return (
    <div
      ref={rowRef}
      className="group border-b border-border-secondary last:border-0"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="row"
    >
      <div className="flex items-center gap-4 py-3 px-4">
        {/* Student Info */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-text-primary truncate">
            {studentName}
          </div>
          {studentNumber && (
            <div className="text-xs text-text-tertiary">{studentNumber}</div>
          )}
        </div>

        {/* Status Buttons */}
        <div className="flex items-center gap-1.5">
          {statusButtons.map((btn) => (
            <button
              key={btn.status}
              type="button"
              onClick={() => onStatusChange(btn.status)}
              className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${
                currentStatus === btn.status
                  ? btn.activeColor
                  : `bg-surface-secondary text-text-tertiary ${btn.color}`
              }`}
              title={`${btn.status} (${btn.shortcut})`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Notes Toggle */}
        <button
          type="button"
          onClick={() => setShowNotes(!showNotes)}
          className={`p-2 rounded-lg transition-colors ${
            notes
              ? 'text-teal-500 bg-teal-50 dark:bg-teal-500/10'
              : 'text-text-tertiary hover:text-text-secondary hover:bg-surface-secondary'
          }`}
          title="Add notes"
        >
          <MessageSquare className="w-4 h-4" />
          {showNotes ? (
            <ChevronUp className="w-3 h-3 absolute -bottom-0.5 -right-0.5" />
          ) : notes ? (
            <ChevronDown className="w-3 h-3 absolute -bottom-0.5 -right-0.5" />
          ) : null}
        </button>
      </div>

      {/* Notes Input */}
      {showNotes && (
        <div className="px-4 pb-3">
          <input
            type="text"
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Add a note..."
            className="w-full px-3 py-2 text-sm bg-surface-secondary border border-border-secondary rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
      )}
    </div>
  )
}
