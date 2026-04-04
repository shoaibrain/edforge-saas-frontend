/**
 * FilterRow — V2 Finance Filters & Export
 *
 * Quick-select time pills, date range inputs, academic year dropdown, and CSV export.
 * V2 styled with token-based styling.
 */

import { useMemo } from 'react'
import { Loader2, Download, X } from 'lucide-react'

interface FilterRowProps {
  fromDate: string
  toDate: string
  academicYear: string
  academicYears: string[]
  hasActiveFilters: boolean
  isExporting: boolean
  onFromChange: (v: string) => void
  onToChange: (v: string) => void
  onAcademicYearChange: (v: string) => void
  onClear: () => void
  onExport: () => void
}

type QuickRange = 'today' | 'week' | 'month' | 'year'

function getQuickRange(range: QuickRange): { from: string; to: string } {
  const now = new Date()
  const to = now.toISOString().slice(0, 10)

  switch (range) {
    case 'today':
      return { from: to, to }
    case 'week': {
      const weekAgo = new Date(now)
      weekAgo.setDate(weekAgo.getDate() - 6)
      return { from: weekAgo.toISOString().slice(0, 10), to }
    }
    case 'month': {
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      return { from: firstOfMonth.toISOString().slice(0, 10), to }
    }
    case 'year': {
      const firstOfYear = new Date(now.getFullYear(), 0, 1)
      return { from: firstOfYear.toISOString().slice(0, 10), to }
    }
  }
}

const QUICK_OPTIONS: { key: QuickRange; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This week' },
  { key: 'month', label: 'This month' },
  { key: 'year', label: 'This year' },
]

export function FilterRow({
  fromDate,
  toDate,
  academicYear,
  academicYears,
  hasActiveFilters,
  isExporting,
  onFromChange,
  onToChange,
  onAcademicYearChange,
  onClear,
  onExport,
}: FilterRowProps) {
  const inputStyle = {
    background: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    color: 'var(--v2-text-secondary)',
    colorScheme: 'dark' as const,
  }

  // Detect which quick-select pill is active (if any)
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
      // Toggle off
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
      {/* Quick-select pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {QUICK_OPTIONS.map((opt) => {
          const isActive = activeQuick === opt.key
          return (
            <button
              key={opt.key}
              onClick={() => handleQuickSelect(opt.key)}
              className="px-2.5 py-1 text-[11px] font-medium rounded-full border transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--v2-brand-primary)]/30"
              style={{
                background: isActive ? 'var(--v2-brand-primary)' : 'transparent',
                borderColor: isActive ? 'var(--v2-brand-primary)' : 'rgba(255, 255, 255, 0.1)',
                color: isActive ? '#fff' : 'var(--v2-text-hint)',
              }}
            >
              {opt.label}
            </button>
          )
        })}

        <span className="text-[10px] mx-1" style={{ color: 'var(--v2-text-ghost)' }}>or</span>

        {/* Date inputs */}
        <input
          type="date"
          value={fromDate}
          onChange={(e) => onFromChange(e.target.value)}
          aria-label="From date"
          className="px-2 py-1 text-[11px] border rounded-[7px] focus:outline-none focus:ring-2 focus:ring-[var(--v2-brand-primary)]/30"
          style={inputStyle}
        />
        <span className="text-[10px]" style={{ color: 'var(--v2-text-ghost)' }}>→</span>
        <input
          type="date"
          value={toDate}
          onChange={(e) => onToChange(e.target.value)}
          aria-label="To date"
          className="px-2 py-1 text-[11px] border rounded-[7px] focus:outline-none focus:ring-2 focus:ring-[var(--v2-brand-primary)]/30"
          style={inputStyle}
        />

        {academicYears.length > 0 && (
          <select
            value={academicYear}
            onChange={(e) => onAcademicYearChange(e.target.value)}
            className="px-2 py-1 text-[11px] border rounded-[7px] focus:outline-none focus:ring-2 focus:ring-[var(--v2-brand-primary)]/30"
            style={inputStyle}
          >
            <option value="">All Years</option>
            {academicYears.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        )}

        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-full transition-colors hover:opacity-80"
            style={{ color: 'var(--v2-brand-primary)' }}
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        )}

        <div className="ml-auto">
          <button
            onClick={onExport}
            disabled={isExporting}
            aria-label="Export invoices as CSV"
            className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-medium rounded-[7px] border transition-colors hover:opacity-80 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[var(--v2-brand-primary)]/40"
            style={{
              background: 'var(--v2-bg-elevated)',
              borderColor: 'var(--v2-border-default)',
              color: 'var(--v2-text-secondary)',
            }}
          >
            {isExporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
            Export CSV
          </button>
        </div>
      </div>
    </div>
  )
}
