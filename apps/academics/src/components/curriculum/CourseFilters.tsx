/**
 * CourseFilters Component — V2
 *
 * Filter bar for the course catalog with search, subject area,
 * course type, credit type, active status chips, and Export CSV.
 * Matches the V2 filter strip pattern from StudentsFilterRow.
 */

import { useRef, useState } from 'react'
import { Search, X, Download } from 'lucide-react'
import { Select, Input, Button } from '@edforge/ui'
import {
  useCourseFilters,
  useCourseFilterActions,
} from '../../stores/courses.store'
import {
  SUBJECT_AREA_OPTIONS,
  COURSE_TYPE_OPTIONS,
  CREDIT_TYPE_OPTIONS,
} from '../../schemas/course.form'
import { useSchoolEnabledGradeOptions } from '../../hooks/useGradeOptions'

// ============================================================================
// TYPES
// ============================================================================

interface CourseFiltersProps {
  /** Total count of courses matching current filters */
  totalCount?: number
  /** Active school — scopes the grade-level filter to the school's enabled grades */
  schoolId: string | null
  /** Export the current (filtered) catalog as CSV. Owner fetches all pages. */
  onExport?: () => Promise<void>
}

// ============================================================================
// COURSE FILTERS
// ============================================================================

export function CourseFilters({ totalCount: _totalCount, schoolId, onExport }: CourseFiltersProps) {
  const filters = useCourseFilters()
  const actions = useCourseFilterActions()
  const { options: gradeOptions } = useSchoolEnabledGradeOptions(schoolId)
  const [isExporting, setIsExporting] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleExport = async () => {
    if (!onExport) return
    setIsExporting(true)
    try {
      await onExport()
    } finally {
      setIsExporting(false)
    }
  }

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
      <Input
        ref={searchInputRef}
        prefix={<Search className="w-3.5 h-3.5" />}
        placeholder="Search by course code or name..."
        defaultValue={filters.searchTerm}
        onChange={(e) => handleSearchChange(e.target.value)}
        className="flex-1 min-w-52"
      />

      {/* Subject Area */}
      <Select
        aria-label="Subject area"
        size="sm"
        className="w-40"
        value={filters.subjectArea ?? ''}
        onChange={(v) => actions.setSubjectArea(v ? (v as typeof filters.subjectArea) : null)}
        options={[{ value: '', label: 'All Subjects' }, ...SUBJECT_AREA_OPTIONS]}
      />

      {/* Course Type */}
      <Select
        aria-label="Course type"
        size="sm"
        className="w-40"
        value={filters.courseType ?? ''}
        onChange={(v) => actions.setCourseType(v ? (v as typeof filters.courseType) : null)}
        options={[{ value: '', label: 'All Types' }, ...COURSE_TYPE_OPTIONS]}
      />

      {/* Credit Type */}
      <Select
        aria-label="Credit type"
        size="sm"
        className="w-44"
        value={filters.creditType ?? ''}
        onChange={(v) => actions.setCreditType(v ? (v as typeof filters.creditType) : null)}
        options={[{ value: '', label: 'All Credit Types' }, ...CREDIT_TYPE_OPTIONS]}
      />

      {/* Grade Level */}
      <Select
        aria-label="Grade level"
        size="sm"
        className="w-36"
        value={filters.gradeLevel ?? ''}
        onChange={(v) => actions.setGradeLevel(v || null)}
        options={[
          { value: '', label: 'All Grades' },
          ...gradeOptions.map((o) => ({ value: o.value, label: o.label })),
        ]}
      />

      {/* Status chips */}
      <div className="flex gap-1.5">
        {statusChips.map((chip) => {
          const isActive = filters.isActive === chip.value
          return (
            <button
              key={chip.label}
              type="button"
              onClick={() => actions.setIsActive(chip.value)}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                isActive
                  ? 'border-[rgb(var(--accent-reports))]/40 bg-[rgb(var(--accent-reports))]/10 text-[rgb(var(--accent-reports-text))]'
                  : 'border-[rgb(var(--border-primary))] text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))]'
              }`}
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
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[rgb(var(--accent-enrollment-text))] hover:opacity-80 transition-opacity"
        >
          <X className="w-3 h-3" />
          Clear ({filterCount})
        </button>
      )}

      {/* Export CSV — pushed to far right */}
      <div className="ml-auto">
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label="Export courses as CSV"
          onClick={handleExport}
          isLoading={isExporting}
          disabled={!onExport || isExporting}
        >
          <Download className="w-3 h-3 mr-1.5" />
          Export CSV
        </Button>
      </div>
    </div>
  )
}
