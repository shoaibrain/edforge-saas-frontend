/**
 * CourseFilters Component — V2
 *
 * Filter bar for the course catalog with search, subject area,
 * course type, credit type, active status chips, and Export CSV.
 * Matches the V2 filter strip pattern from StudentsFilterRow.
 */

import { useRef } from 'react'
import { Search, X, Download } from 'lucide-react'
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
// SHARED STYLES
// ============================================================================

const selectStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.04)',
  border: '1px solid rgba(255, 255, 255, 0.07)',
  borderRadius: 8,
  padding: '6px 10px',
  fontSize: 11,
  color: 'var(--v2-text-hint, #7a8099)',
  colorScheme: 'dark',
}

// ============================================================================
// COURSE FILTERS
// ============================================================================

export function CourseFilters({ totalCount: _totalCount }: CourseFiltersProps) {
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

  const statusChips: { label: string; value: boolean | null }[] = [
    { label: 'All', value: null },
    { label: 'Active', value: true },
    { label: 'Inactive', value: false },
  ]

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Search */}
      <div className="relative flex-1" style={{ minWidth: 200 }}>
        <Search
          className="absolute top-1/2 -translate-y-1/2"
          style={{
            left: 10,
            width: 13,
            height: 13,
            color: 'var(--v2-text-hint, #4a5068)',
            pointerEvents: 'none',
          }}
        />
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search by course code or name..."
          defaultValue={filters.searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          style={{
            width: '100%',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            borderRadius: 8,
            padding: '7px 12px 7px 32px',
            fontSize: 12,
            color: 'var(--v2-text-primary, #e8eaf0)',
            outline: 'none',
          }}
        />
      </div>

      {/* Subject Area */}
      <select
        value={filters.subjectArea ?? ''}
        onChange={(e) =>
          actions.setSubjectArea(e.target.value ? (e.target.value as typeof filters.subjectArea) : null)
        }
        style={selectStyle}
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
        style={selectStyle}
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
        style={selectStyle}
      >
        <option value="">All Credit Types</option>
        {CREDIT_TYPE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Status chips */}
      <div style={{ display: 'flex', gap: 5 }}>
        {statusChips.map((chip) => {
          const isActive = filters.isActive === chip.value
          return (
            <button
              key={chip.label}
              type="button"
              onClick={() => actions.setIsActive(chip.value)}
              style={{
                padding: '5px 9px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 500,
                border: `1px solid ${isActive ? 'rgba(127,119,221,0.25)' : 'rgba(255,255,255,0.07)'}`,
                background: isActive ? 'rgba(127,119,221,0.1)' : 'transparent',
                color: isActive ? '#7F77DD' : 'var(--v2-text-hint, #5a6070)',
                cursor: 'pointer',
              }}
            >
              {chip.label}
            </button>
          )
        })}
      </div>

      {/* Clear filters */}
      {hasFilters && (
        <button
          type="button"
          onClick={() => {
            actions.resetFilters()
            if (searchInputRef.current) searchInputRef.current.value = ''
          }}
          className="inline-flex items-center gap-1"
          style={{
            padding: '5px 9px',
            fontSize: 11,
            fontWeight: 500,
            color: 'var(--v2-brand-primary, #1D9E75)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <X style={{ width: 11, height: 11 }} />
          Clear ({filterCount})
        </button>
      )}

      {/* Export CSV — pushed to far right */}
      <div style={{ marginLeft: 'auto' }}>
        <button
          type="button"
          aria-label="Export courses as CSV"
          className="inline-flex items-center gap-1.5 transition-colors hover:opacity-80"
          style={{
            padding: '5px 11px',
            fontSize: 11,
            fontWeight: 500,
            borderRadius: 7,
            background: 'var(--v2-bg-elevated, rgba(255,255,255,0.05))',
            border: '1px solid var(--v2-border-default, rgba(255,255,255,0.09))',
            color: 'var(--v2-text-secondary, #9aa0b8)',
            cursor: 'pointer',
          }}
        >
          <Download style={{ width: 12, height: 12 }} />
          Export CSV
        </button>
      </div>
    </div>
  )
}
