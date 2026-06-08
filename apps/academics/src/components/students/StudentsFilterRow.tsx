/**
 * StudentsFilterRow — V2 Filter Strip for Students Page
 *
 * Quick-select mode chips, search input, grade/status dropdowns,
 * clear button, and Export CSV — matching the V2 overview filter pattern.
 */

import { useState, useEffect } from 'react'
import { Search, X, Loader2, Download } from 'lucide-react'
import type { StudentStatus } from '@aibrains/shared-types'
import { useDebounce } from '../../hooks'
import { useSchoolEnabledGradeOptions } from '../../hooks/useGradeOptions'
import {
  useStudentFilters,
  useStudentFilterActions,
  type StudentFilterMode,
} from '../../stores/students.store'

// ============================================================================
// CONSTANTS
// ============================================================================

const MODE_CHIPS: { key: StudentFilterMode; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'at-risk', label: 'At-risk' },
  { key: 'pending', label: 'Pending' },
]

// TODO(sprint-2 follow-up): Add `{ value: 'pending', label: 'Pending' }` here.
// The StudentStatus enum (packages/shared-types/.../student.schema.ts) includes
// 'pending' but this dropdown omits it. Deferred from Sprint 2 chip-fix scope.
const STATUS_OPTIONS: { value: StudentStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'graduated', label: 'Graduated' },
  { value: 'transferred', label: 'Transferred' },
  { value: 'withdrawn', label: 'Withdrawn' },
  { value: 'suspended', label: 'Suspended' },
]

const inputStyle = {
  background: 'var(--v2-surface-interactive)',
  borderColor: 'var(--v2-border-default)',
  color: 'var(--v2-text-secondary)',
}

// ============================================================================
// COMPONENT
// ============================================================================

interface StudentsFilterRowProps {
  isExporting: boolean
  hasAcademicYear: boolean
  onExport: () => void
  /**
   * Active school. The Grade filter dropdown reads `enabledGradeLevels`
   * (with `gradeRange` fallback) via `useSchoolEnabledGradeOptions`.
   */
  schoolId: string | null
}

export function StudentsFilterRow({
  isExporting,
  hasAcademicYear,
  onExport,
  schoolId,
}: StudentsFilterRowProps) {
  const filters = useStudentFilters()
  // Gate dropdown on profile-load — see EnrollmentTable comment.
  const { options: gradeOptions, isLoading: gradeOptionsLoading } =
    useSchoolEnabledGradeOptions(schoolId)
  const {
    setSearchTerm,
    setGradeLevel,
    setStatus,
    setFilterMode,
    resetFilters,
    hasActiveFilters,
  } = useStudentFilterActions()

  // Local search state for immediate UI feedback
  const [localSearch, setLocalSearch] = useState(filters.searchTerm)
  const debouncedSearch = useDebounce(localSearch, 300)

  // Sync debounced search to store
  useEffect(() => {
    if (debouncedSearch !== filters.searchTerm) {
      setSearchTerm(debouncedSearch)
    }
  }, [debouncedSearch, filters.searchTerm, setSearchTerm])

  const handleClearFilters = () => {
    setLocalSearch('')
    resetFilters()
  }

  const isActiveFilters = hasActiveFilters()

  return (
    <div className="flex items-center gap-1.5 flex-wrap" style={{ marginBottom: 14 }}>
      {/* Mode chips */}
      {MODE_CHIPS.map((chip) => {
        const isActive = filters.filterMode === chip.key
        return (
          <button
            key={chip.key}
            onClick={() => setFilterMode(chip.key)}
            className="px-2.5 py-1 text-xs font-medium rounded-full border transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--v2-brand-primary)]/30"
            style={{
              background: isActive ? 'var(--v2-brand-primary)' : 'transparent',
              borderColor: isActive ? 'var(--v2-brand-primary)' : 'var(--v2-border-default)',
              color: isActive ? '#fff' : 'var(--v2-text-hint)',
            }}
          >
            {chip.label}
          </button>
        )
      })}

      <span className="text-xs mx-1" style={{ color: 'var(--v2-text-ghost)' }}>or</span>

      {/* Search input */}
      <div className="relative flex-1 min-w-[180px] max-w-sm">
        <Search
          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
          style={{ color: 'var(--v2-text-hint)' }}
        />
        <input
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="Search by name or student ID..."
          className="w-full pl-8 pr-7 py-1.5 text-xs border rounded-[7px] focus:outline-none focus:ring-2 focus:ring-[var(--v2-brand-primary)]/30"
          style={inputStyle}
        />
        {localSearch && (
          <button
            type="button"
            onClick={() => setLocalSearch('')}
            className="absolute right-2 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--v2-text-hint)' }}
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Grade dropdown */}
      <select
        value={filters.gradeLevel ?? ''}
        onChange={(e) => setGradeLevel(e.target.value || null)}
        disabled={gradeOptionsLoading}
        className="px-2 py-1 text-xs border rounded-[7px] focus:outline-none focus:ring-2 focus:ring-[var(--v2-brand-primary)]/30 disabled:opacity-60 disabled:cursor-not-allowed"
        style={inputStyle}
      >
        <option value="">{gradeOptionsLoading ? 'Loading grades…' : 'All Grades'}</option>
        {!gradeOptionsLoading && gradeOptions.map((g) => (
          <option key={g.value} value={g.value}>{g.label}</option>
        ))}
      </select>

      {/* Status dropdown */}
      <select
        value={filters.status ?? ''}
        onChange={(e) => setStatus((e.target.value || null) as StudentStatus | null)}
        className="px-2 py-1 text-xs border rounded-[7px] focus:outline-none focus:ring-2 focus:ring-[var(--v2-brand-primary)]/30"
        style={inputStyle}
      >
        <option value="">All Status</option>
        {STATUS_OPTIONS.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>

      {/* Clear */}
      {isActiveFilters && (
        <button
          onClick={handleClearFilters}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full transition-colors hover:opacity-80"
          style={{ color: 'var(--v2-brand-primary)' }}
        >
          <X className="w-3 h-3" />
          Clear
        </button>
      )}

      {/* Export CSV */}
      <div className="ml-auto">
        <button
          onClick={onExport}
          disabled={isExporting || !hasAcademicYear}
          aria-label="Export students as CSV"
          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-[7px] border transition-colors hover:opacity-80 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[var(--v2-brand-primary)]/40"
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
