/**
 * SectionFilters Component
 *
 * Filter bar for the section table: search, course, teacher,
 * academic year, active status, and clear filters.
 */

import { useEffect, useState } from 'react'
import { Search, X, Filter } from 'lucide-react'
import { useSectionFilters, useSectionFilterActions } from '../../stores/sections.store'
import { useCourses, flattenCoursePages } from '../../hooks/useCourses'
import { useSchoolStaff, flattenStaffData, getStaffDisplayName } from '../../hooks/useStaff'
import { useAcademicYears } from '../../hooks/useSchool'

// ============================================================================
// TYPES
// ============================================================================

interface SectionFiltersProps {
  schoolId: string
  totalResults?: number
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SectionFilters({ schoolId, totalResults }: SectionFiltersProps) {
  const filters = useSectionFilters()
  const actions = useSectionFilterActions()

  // Local search state with manual debounce
  const [localSearch, setLocalSearch] = useState(filters.searchTerm)

  useEffect(() => {
    const timer = setTimeout(() => {
      actions.setSearchTerm(localSearch)
    }, 300)
    return () => clearTimeout(timer)
  }, [localSearch, actions])

  // Sync local state when store resets
  useEffect(() => {
    if (filters.searchTerm === '' && localSearch !== '') {
      setLocalSearch('')
    }
  }, [filters.searchTerm])

  // Fetch data for selectors
  const { data: coursesData } = useCourses({
    schoolId,
    filters: { isActive: true },
    limit: 100,
    enabled: !!schoolId,
  })
  const courses = flattenCoursePages(coursesData)

  const { data: staffData } = useSchoolStaff(schoolId)
  // Show all staff/users as potential teachers.
  // Once the backend implements proper Ed-Fi Staff roles, we can re-add role filtering.
  const teachers = flattenStaffData(staffData)

  const { data: academicYears } = useAcademicYears(schoolId)

  const filterCount = actions.activeFilterCount()

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search sections..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-surface-primary border border-border-primary rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
          />
        </div>

        {/* Course Filter */}
        <select
          value={filters.courseId || ''}
          onChange={(e) => actions.setCourseId(e.target.value || null)}
          className="px-3 py-2 text-sm bg-surface-primary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
        >
          <option value="">All Courses</option>
          {courses.map((c) => (
            <option key={c.courseId} value={c.courseId}>
              {c.courseCode} — {c.courseName}
            </option>
          ))}
        </select>

        {/* Teacher Filter */}
        <select
          value={filters.teacherId || ''}
          onChange={(e) => actions.setTeacherId(e.target.value || null)}
          className="px-3 py-2 text-sm bg-surface-primary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
        >
          <option value="">All Teachers</option>
          {teachers.map((t) => (
            <option key={t.staffId} value={t.staffId}>
              {getStaffDisplayName(t)}
            </option>
          ))}
        </select>

        {/* Academic Year Filter */}
        <select
          value={filters.academicYearId || ''}
          onChange={(e) => actions.setAcademicYearId(e.target.value || null)}
          className="px-3 py-2 text-sm bg-surface-primary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
        >
          <option value="">All Years</option>
          {(academicYears || []).map((y) => (
            <option key={y.yearId} value={y.yearId}>
              {y.name} {y.isCurrent ? '(Current)' : ''}
            </option>
          ))}
        </select>

        {/* Active Toggle */}
        <div className="flex items-center border border-border-primary rounded-lg overflow-hidden">
          {([null, true, false] as const).map((val) => {
            const isSelected = filters.isActive === val
            const label = val === null ? 'All' : val ? 'Active' : 'Inactive'
            return (
              <button
                key={String(val)}
                type="button"
                onClick={() => actions.setIsActive(val)}
                className={`px-3 py-2 text-xs font-medium transition-colors ${
                  isSelected
                    ? 'bg-teal-500/10 text-teal-600 border-teal-500/20'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>

        {/* Clear Filters */}
        {filterCount > 0 && (
          <button
            type="button"
            onClick={actions.resetFilters}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-text-secondary hover:text-text-primary bg-surface-secondary hover:bg-surface-hover rounded-lg transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Clear ({filterCount})
          </button>
        )}
      </div>

      {/* Results count */}
      {totalResults !== undefined && (
        <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
          <Filter className="w-3.5 h-3.5" />
          <span>
            {totalResults} section{totalResults !== 1 ? 's' : ''}
            {filterCount > 0 ? ' matching filters' : ' total'}
          </span>
        </div>
      )}
    </div>
  )
}
