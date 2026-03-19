/**
 * FilterRow — V2 Finance Filters & Export
 *
 * Date range filters, academic year dropdown, and CSV export button.
 * V2 styled with token-based styling.
 */

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

  return (
    <div className="flex items-end gap-2.5 flex-wrap">
      <div>
        <label className="block text-[10px] font-medium mb-1" style={{ color: 'var(--v2-text-faint)' }}>
          From
        </label>
        <input
          type="date"
          value={fromDate}
          onChange={(e) => onFromChange(e.target.value)}
          className="px-2.5 py-1.5 text-[11px] border rounded-[7px] focus:outline-none focus:ring-2 focus:ring-[var(--v2-brand-primary)]/30"
          style={inputStyle}
        />
      </div>
      <div>
        <label className="block text-[10px] font-medium mb-1" style={{ color: 'var(--v2-text-faint)' }}>
          To
        </label>
        <input
          type="date"
          value={toDate}
          onChange={(e) => onToChange(e.target.value)}
          className="px-2.5 py-1.5 text-[11px] border rounded-[7px] focus:outline-none focus:ring-2 focus:ring-[var(--v2-brand-primary)]/30"
          style={inputStyle}
        />
      </div>
      {academicYears.length > 0 && (
        <div>
          <label className="block text-[10px] font-medium mb-1" style={{ color: 'var(--v2-text-faint)' }}>
            Academic Year
          </label>
          <select
            value={academicYear}
            onChange={(e) => onAcademicYearChange(e.target.value)}
            className="px-2.5 py-1.5 text-[11px] border rounded-[7px] focus:outline-none focus:ring-2 focus:ring-[var(--v2-brand-primary)]/30"
            style={inputStyle}
          >
            <option value="">All Years</option>
            {academicYears.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      )}
      {hasActiveFilters && (
        <button
          onClick={onClear}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-[7px] transition-colors hover:opacity-80"
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
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-[7px] border transition-colors hover:opacity-80 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[var(--v2-brand-primary)]/40"
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
  )
}
