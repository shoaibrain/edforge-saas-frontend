/**
 * CourseFilters Component
 *
 * Filter bar for the course catalog with search, subject area,
 * course type, credit type, and active status filters.
 * Connected to the Zustand course filter store.
 */

import { useRef } from 'react'
import { Search, X, SlidersHorizontal } from 'lucide-react'
import {
  useCourseFilters,
  useCourseFilterActions,
} from '../../stores/courses.store'
import {
  SUBJECT_AREA_OPTIONS,
  COURSE_TYPE_OPTIONS,
  CREDIT_TYPE_OPTIONS,
} from '../../schemas/course.form'

// ============================================================================
// TYPES
// ============================================================================

interface CourseFiltersProps {
  /** Total count of courses matching current filters */
  totalCount?: number
}

// ============================================================================
// COURSE FILTERS
// ============================================================================

export function CourseFilters({ totalCount }: CourseFiltersProps) {
  const filters = useCourseFilters()
  const actions = useCourseFilterActions()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSearchChange = (value: string) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      actions.setSearchTerm(value)
    }, 300)
  }

  const hasFilters = actions.hasActiveFilters()
  const filterCount = actions.activeFilterCount()

  return (
    <div className="space-y-3">
      {/* Main filter row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search by code or name..."
            defaultValue={filters.searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-surface-primary border border-border-primary rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
          />
        </div>

        {/* Subject Area */}
        <select
          value={filters.subjectArea ?? ''}
          onChange={(e) =>
            actions.setSubjectArea(e.target.value ? (e.target.value as typeof filters.subjectArea) : null)
          }
          className="px-3 py-2 text-sm bg-surface-primary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
        >
          <option value="">All Subjects</option>
          {SUBJECT_AREA_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Course Type */}
        <select
          value={filters.courseType ?? ''}
          onChange={(e) =>
            actions.setCourseType(e.target.value ? (e.target.value as typeof filters.courseType) : null)
          }
          className="px-3 py-2 text-sm bg-surface-primary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
        >
          <option value="">All Types</option>
          {COURSE_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Credit Type */}
        <select
          value={filters.creditType ?? ''}
          onChange={(e) =>
            actions.setCreditType(e.target.value ? (e.target.value as typeof filters.creditType) : null)
          }
          className="px-3 py-2 text-sm bg-surface-primary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
        >
          <option value="">All Credit Types</option>
          {CREDIT_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Active Toggle */}
        <div className="flex items-center gap-1 border border-border-primary rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => actions.setIsActive(null)}
            className={`px-3 py-2 text-xs font-medium transition-colors ${
              filters.isActive === null
                ? 'bg-teal-500 text-white'
                : 'bg-surface-primary text-text-secondary hover:bg-surface-secondary'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => actions.setIsActive(true)}
            className={`px-3 py-2 text-xs font-medium transition-colors ${
              filters.isActive === true
                ? 'bg-teal-500 text-white'
                : 'bg-surface-primary text-text-secondary hover:bg-surface-secondary'
            }`}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => actions.setIsActive(false)}
            className={`px-3 py-2 text-xs font-medium transition-colors ${
              filters.isActive === false
                ? 'bg-teal-500 text-white'
                : 'bg-surface-primary text-text-secondary hover:bg-surface-secondary'
            }`}
          >
            Inactive
          </button>
        </div>

        {/* Clear filters */}
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              actions.resetFilters()
              if (searchInputRef.current) searchInputRef.current.value = ''
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-text-secondary hover:text-text-primary bg-surface-secondary hover:bg-surface-tertiary rounded-lg transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Clear ({filterCount})
          </button>
        )}
      </div>

      {/* Results count */}
      {totalCount !== undefined && (
        <div className="flex items-center gap-2 text-xs text-text-tertiary">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>
            {totalCount} course{totalCount !== 1 ? 's' : ''} found
            {hasFilters && ' (filtered)'}
          </span>
        </div>
      )}
    </div>
  )
}
