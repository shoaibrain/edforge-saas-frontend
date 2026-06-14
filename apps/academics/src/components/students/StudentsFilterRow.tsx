/**
 * StudentsFilterRow — filter presets + search + grade/status for the Students
 * table toolbar.
 *
 * Quick-select mode chips, search input, grade/status dropdowns, and a clear
 * button. Rendered as the table toolbar's leading (left) slot; Export CSV is a
 * sibling right-slot action owned by the page.
 */

import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { Select, Input } from '@edforge/ui'
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

// ============================================================================
// COMPONENT
// ============================================================================

interface StudentsFilterRowProps {
  /**
   * Active school. The Grade filter dropdown reads `enabledGradeLevels`
   * (with `gradeRange` fallback) via `useSchoolEnabledGradeOptions`.
   */
  schoolId: string | null
}

export function StudentsFilterRow({ schoolId }: StudentsFilterRowProps) {
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
    <div className="flex items-center gap-2 flex-wrap">
      {/* Mode chips */}
      {MODE_CHIPS.map((chip) => {
        const isActive = filters.filterMode === chip.key
        return (
          <button
            key={chip.key}
            onClick={() => setFilterMode(chip.key)}
            className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-all focus:outline-none ${
              isActive
                ? 'bg-[rgb(var(--accent-enrollment))] text-[rgb(var(--action-primary-fg))] border-[rgb(var(--accent-enrollment))]'
                : 'bg-transparent text-[rgb(var(--text-tertiary))] border-[rgb(var(--border-primary))] hover:text-[rgb(var(--text-secondary))]'
            }`}
          >
            {chip.label}
          </button>
        )
      })}

      <span className="text-xs mx-1 text-[rgb(var(--text-tertiary))]">or</span>

      {/* Search input */}
      <Input
        size="sm"
        className="flex-1 min-w-44 max-w-sm"
        prefix={<Search className="w-3.5 h-3.5" />}
        suffix={
          localSearch ? (
            <button
              type="button"
              onClick={() => setLocalSearch('')}
              aria-label="Clear search"
              className="text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))]"
            >
              <X className="w-3 h-3" />
            </button>
          ) : undefined
        }
        value={localSearch}
        onChange={(e) => setLocalSearch(e.target.value)}
        placeholder="Search by name or student ID..."
      />

      {/* Grade dropdown */}
      <Select
        aria-label="Grade"
        size="sm"
        className="w-36"
        value={filters.gradeLevel ?? ''}
        onChange={(v) => setGradeLevel(v || null)}
        disabled={gradeOptionsLoading}
        loading={gradeOptionsLoading}
        placeholder="All Grades"
        options={gradeOptionsLoading ? [] : [{ value: '', label: 'All Grades' }, ...gradeOptions]}
      />

      {/* Status dropdown */}
      <Select
        aria-label="Status"
        size="sm"
        className="w-36"
        value={filters.status ?? ''}
        onChange={(v) => setStatus((v || null) as StudentStatus | null)}
        options={[{ value: '', label: 'All Status' }, ...STATUS_OPTIONS]}
      />

      {/* Clear */}
      {isActiveFilters && (
        <button
          onClick={handleClearFilters}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full text-[rgb(var(--accent-enrollment))] hover:opacity-80 transition-opacity"
        >
          <X className="w-3 h-3" />
          Clear
        </button>
      )}
    </div>
  )
}
