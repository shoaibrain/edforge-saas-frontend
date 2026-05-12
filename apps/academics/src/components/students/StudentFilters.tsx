/**
 * StudentFilters Component
 *
 * Filter controls for the student directory including:
 * - Search input with debouncing
 * - Grade level dropdown
 * - Status dropdown
 * - Clear filters button
 */

import { useEffect, useState } from 'react'
import { Search, X, ChevronDown } from 'lucide-react'
import type { StudentStatus } from '@aibrains/shared-types'
import { useDebounce } from '../../hooks'
import { useFilteredGradeOptions } from '../../hooks/useGradeOptions'
import {
  useStudentFilters,
  useStudentFilterActions,
} from '../../stores/students.store'

// ============================================================================
// CONSTANTS
// ============================================================================

const STATUS_OPTIONS: { value: StudentStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'graduated', label: 'Graduated' },
  { value: 'transferred', label: 'Transferred' },
  { value: 'withdrawn', label: 'Withdrawn' },
  { value: 'suspended', label: 'Suspended' },
]

// ============================================================================
// DROPDOWN COMPONENT
// ============================================================================

interface FilterDropdownProps {
  label: string
  value: string | null
  options: { value: string; label: string }[]
  onChange: (value: string | null) => void
  placeholder?: string
}

function FilterDropdown({
  label,
  value,
  options,
  onChange,
  placeholder = 'All',
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  const selectedOption = options.find((opt) => opt.value === value)

  return (
    <div className="relative">
      <label className="sr-only">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 h-10 px-3 rounded-lg border border-border-secondary bg-surface-primary text-sm text-text-primary hover:border-border-primary transition-colors min-w-[140px]"
      >
        <span className="flex-1 text-left truncate">
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-text-tertiary transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute left-0 z-20 mt-1 w-full min-w-[160px] rounded-lg bg-surface-primary border border-border-primary shadow-lg py-1 max-h-60 overflow-auto">
            {/* All option */}
            <button
              type="button"
              onClick={() => {
                onChange(null)
                setIsOpen(false)
              }}
              className={`w-full px-3 py-2 text-sm text-left transition-colors ${
                value === null
                  ? 'bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400'
                  : 'text-text-primary hover:bg-surface-secondary'
              }`}
            >
              {placeholder}
            </button>

            {/* Options */}
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className={`w-full px-3 py-2 text-sm text-left transition-colors ${
                  value === option.value
                    ? 'bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400'
                    : 'text-text-primary hover:bg-surface-secondary'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ============================================================================
// STUDENT FILTERS COMPONENT
// ============================================================================

interface StudentFiltersProps {
  /** Callback when filters change (debounced search) */
  onFiltersChange?: () => void
  /** School's configured grade range — drives the Grade dropdown options. */
  schoolGradeRange?: { start: string; end: string } | null
}

export function StudentFilters({ onFiltersChange, schoolGradeRange }: StudentFiltersProps) {
  const filters = useStudentFilters()
  const { setSearchTerm, setGradeLevel, setStatus, resetFilters } = useStudentFilterActions()
  const gradeOptions = useFilteredGradeOptions(schoolGradeRange)

  // Local search state for immediate UI feedback
  const [localSearch, setLocalSearch] = useState(filters.searchTerm)

  // Debounce search input
  const debouncedSearch = useDebounce(localSearch, 300)

  // Sync debounced search to store
  useEffect(() => {
    if (debouncedSearch !== filters.searchTerm) {
      setSearchTerm(debouncedSearch)
      onFiltersChange?.()
    }
  }, [debouncedSearch, filters.searchTerm, setSearchTerm, onFiltersChange])

  // Handle grade level change
  const handleGradeLevelChange = (value: string | null) => {
    setGradeLevel(value)
    onFiltersChange?.()
  }

  // Handle status change
  const handleStatusChange = (value: string | null) => {
    setStatus(value as StudentStatus | null)
    onFiltersChange?.()
  }

  // Handle clear filters
  const handleClearFilters = () => {
    setLocalSearch('')
    resetFilters()
    onFiltersChange?.()
  }

  // Compute filter state locally (avoid calling store functions during render)
  const hasFilters =
    filters.searchTerm.trim() !== '' ||
    filters.gradeLevel !== null ||
    filters.status !== null

  let filterCount = 0
  if (filters.searchTerm.trim() !== '') filterCount++
  if (filters.gradeLevel !== null) filterCount++
  if (filters.status !== null) filterCount++

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      {/* Search Input */}
      <div className="relative flex-1 min-w-0 w-full sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
        <input
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="Search by name or student ID..."
          className="w-full h-10 pl-10 pr-4 rounded-lg border border-border-secondary bg-surface-primary text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
        />
        {localSearch && (
          <button
            type="button"
            onClick={() => setLocalSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded text-text-tertiary hover:text-text-secondary"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Dropdowns */}
      <div className="flex items-center gap-2 flex-wrap">
        <FilterDropdown
          label="Grade Level"
          value={filters.gradeLevel}
          options={[...gradeOptions]}
          onChange={handleGradeLevelChange}
          placeholder="All Grades"
        />

        <FilterDropdown
          label="Status"
          value={filters.status}
          options={STATUS_OPTIONS}
          onChange={handleStatusChange}
          placeholder="All Status"
        />

        {/* Clear Filters Button */}
        {hasFilters && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="inline-flex items-center gap-1.5 h-10 px-3 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Clear</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-400 text-xs font-semibold">
              {filterCount}
            </span>
          </button>
        )}
      </div>
    </div>
  )
}
