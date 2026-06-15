/**
 * AcademicsFilterRow — V2 Academics Filters & Export
 *
 * Quick-select time pills, date range inputs, grade level filter,
 * academic year dropdown, and CSV export — adapted for academics context.
 */

import { useMemo } from 'react'
import { Loader2, Download, X } from 'lucide-react'

interface AcademicsFilterRowProps {
  fromDate: string
  toDate: string
  gradeLevelFilter: string
  gradeLevels: string[]
  hasActiveFilters: boolean
  isExporting: boolean
  hasAcademicYear: boolean
  onFromChange: (v: string) => void
  onToChange: (v: string) => void
  onGradeLevelChange: (v: string) => void
  onClear: () => void
  onExport: () => void
}

type QuickRange = 'week' | 'month' | 'semester' | 'year'

function getQuickRange(range: QuickRange): { from: string; to: string } {
  const now = new Date()
  const to = now.toISOString().slice(0, 10)

  switch (range) {
    case 'week': {
      const d = new Date(now)
      d.setDate(d.getDate() - 6)
      return { from: d.toISOString().slice(0, 10), to }
    }
    case 'month': {
      const d = new Date(now)
      d.setDate(d.getDate() - 29)
      return { from: d.toISOString().slice(0, 10), to }
    }
    case 'semester': {
      // ~6 months back
      const d = new Date(now)
      d.setMonth(d.getMonth() - 6)
      return { from: d.toISOString().slice(0, 10), to }
    }
    case 'year': {
      const firstOfYear = new Date(now.getFullYear(), 0, 1)
      return { from: firstOfYear.toISOString().slice(0, 10), to }
    }
  }
}

const QUICK_OPTIONS: { key: QuickRange; label: string }[] = [
  { key: 'week', label: 'Last 7 days' },
  { key: 'month', label: 'Last 30 days' },
  { key: 'semester', label: 'This semester' },
  { key: 'year', label: 'This year' },
]

function formatGradeLabel(grade: string): string {
  const lower = grade.toLowerCase()
  if (lower === 'k' || lower === 'kindergarten' || lower === 'kg') return 'Kindergarten'
  if (lower === 'pre-k' || lower === 'prek' || lower === 'pk') return 'Pre-K'
  const num = parseInt(grade, 10)
  if (!isNaN(num)) {
    const suffix = num === 1 ? 'st' : num === 2 ? 'nd' : num === 3 ? 'rd' : 'th'
    return `Grade ${num}${suffix}`
  }
  return grade
}

export function AcademicsFilterRow({
  fromDate,
  toDate,
  gradeLevelFilter,
  gradeLevels,
  hasActiveFilters,
  isExporting,
  hasAcademicYear,
  onFromChange,
  onToChange,
  onGradeLevelChange,
  onClear,
  onExport,
}: AcademicsFilterRowProps) {
  // Date/grade inputs read off the unified light theme. The former
  // rgba(255,255,255,0.0x) bg/border washed out to invisible, and
  // colorScheme:'dark' forced a dark native date-picker over the light app.
  const inputStyle = {
    background: 'rgb(var(--background-secondary))',
    borderColor: 'rgb(var(--border-primary) / 0.35)',
    color: 'rgb(var(--text-secondary))',
  }

  // Detect which quick-select pill is active
  const activeQuick = useMemo<QuickRange | null>(() => {
    if (!fromDate || !toDate) return null
    for (const opt of QUICK_OPTIONS) {
      const range = getQuickRange(opt.key)
      if (range.from === fromDate && range.to === toDate) return opt.key
    }
    return null
  }, [fromDate, toDate])

  function handleQuickSelect(key: QuickRange) {
    if (activeQuick === key) {
      onFromChange('')
      onToChange('')
      return
    }
    const range = getQuickRange(key)
    onFromChange(range.from)
    onToChange(range.to)
  }

  return (
    <div className="space-y-2">
      {/* Quick-select pills + filters */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {QUICK_OPTIONS.map((opt) => {
          const isActive = activeQuick === opt.key
          return (
            <button
              key={opt.key}
              onClick={() => handleQuickSelect(opt.key)}
              className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-enrollment))]/30 ${
                isActive
                  ? 'bg-[rgb(var(--accent-enrollment))] border-[rgb(var(--accent-enrollment))] text-[rgb(var(--action-primary-fg))]'
                  : 'bg-transparent border-[rgb(var(--border-primary)/0.4)] text-[rgb(var(--text-tertiary))]'
              }`}
            >
              {opt.label}
            </button>
          )
        })}

        <span className="text-xs mx-1 text-[rgb(var(--text-disabled))]">or</span>

        {/* Date inputs */}
        <input
          type="date"
          value={fromDate}
          onChange={(e) => onFromChange(e.target.value)}
          aria-label="From date"
          className="px-2 py-1 text-xs border rounded-[7px] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-enrollment))]/30"
          style={inputStyle}
        />
        <span className="text-xs text-[rgb(var(--text-disabled))]">→</span>
        <input
          type="date"
          value={toDate}
          onChange={(e) => onToChange(e.target.value)}
          aria-label="To date"
          className="px-2 py-1 text-xs border rounded-[7px] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-enrollment))]/30"
          style={inputStyle}
        />

        {/* Grade level filter */}
        {gradeLevels.length > 0 && (
          <select
            value={gradeLevelFilter}
            onChange={(e) => onGradeLevelChange(e.target.value)}
            className="px-2 py-1 text-xs border rounded-[7px] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-enrollment))]/30"
            style={inputStyle}
          >
            <option value="">All Grades</option>
            {gradeLevels.map((grade) => (
              <option key={grade} value={grade}>{formatGradeLabel(grade)}</option>
            ))}
          </select>
        )}

        {/* Clear */}
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full transition-colors hover:opacity-80 text-[rgb(var(--accent-enrollment-text))]"
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        )}

        {/* Export */}
        <div className="ml-auto">
          <button
            onClick={onExport}
            disabled={isExporting || !hasAcademicYear}
            aria-label="Export enrollments as CSV"
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-[7px] border transition-colors hover:opacity-80 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-enrollment))]/40 bg-[rgb(var(--background-tertiary))] border-[rgb(var(--border-primary)/0.35)] text-[rgb(var(--text-secondary))]"
          >
            {isExporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
            Export CSV
          </button>
        </div>
      </div>
    </div>
  )
}
