/**
 * SectionFilters Component
 *
 * Clean filter bar with full-width search, compact filter chips,
 * active filter badges, and results count.
 */

import { useEffect, useState, useMemo } from 'react'
import { Search, X } from 'lucide-react'
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
  const teachers = flattenStaffData(staffData)

  const { data: academicYears } = useAcademicYears(schoolId)

  const filterCount = actions.activeFilterCount()

  // Build active filter badges for display
  const activeFilterBadges = useMemo(() => {
    const badges: { key: string; label: string; onClear: () => void }[] = []
    if (filters.courseId) {
      const course = courses.find((c) => c.courseId === filters.courseId)
      badges.push({
        key: 'course',
        label: `Course: ${course?.courseCode || 'Selected'}`,
        onClear: () => actions.setCourseId(null),
      })
    }
    if (filters.teacherId) {
      const teacher = teachers.find((t) => t.staffId === filters.teacherId)
      badges.push({
        key: 'teacher',
        label: `Teacher: ${teacher ? getStaffDisplayName(teacher) : 'Selected'}`,
        onClear: () => actions.setTeacherId(null),
      })
    }
    if (filters.academicYearId) {
      const year = (academicYears || []).find((y) => y.yearId === filters.academicYearId)
      badges.push({
        key: 'year',
        label: `Year: ${year?.name || 'Selected'}`,
        onClear: () => actions.setAcademicYearId(null),
      })
    }
    if (filters.isActive !== null) {
      badges.push({
        key: 'status',
        label: filters.isActive ? 'Active only' : 'Inactive only',
        onClear: () => actions.setIsActive(null),
      })
    }
    return badges
  }, [filters, courses, teachers, academicYears, actions])

  return (
    <div className="space-y-3">
      {/* Search — full width */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
        <input
          type="text"
          placeholder="Search sections..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm bg-surface-primary border border-border-primary rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
        />
      </div>

      {/* Filter chips row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Course chip */}
        <select
          value={filters.courseId || ''}
          onChange={(e) => actions.setCourseId(e.target.value || null)}
          className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
            filters.courseId
              ? 'bg-teal-500/10 border-teal-500/30 text-teal-700 dark:text-teal-400'
              : 'bg-surface-primary border-border-primary text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
          }`}
        >
          <option value="">Course</option>
          {courses.map((c) => (
            <option key={c.courseId} value={c.courseId}>
              {c.courseCode} — {c.courseName}
            </option>
          ))}
        </select>

        {/* Teacher chip */}
        <select
          value={filters.teacherId || ''}
          onChange={(e) => actions.setTeacherId(e.target.value || null)}
          className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
            filters.teacherId
              ? 'bg-teal-500/10 border-teal-500/30 text-teal-700 dark:text-teal-400'
              : 'bg-surface-primary border-border-primary text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
          }`}
        >
          <option value="">Teacher</option>
          {teachers.map((t) => (
            <option key={t.staffId} value={t.staffId}>
              {getStaffDisplayName(t)}
            </option>
          ))}
        </select>

        {/* Academic Year chip */}
        <select
          value={filters.academicYearId || ''}
          onChange={(e) => actions.setAcademicYearId(e.target.value || null)}
          className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
            filters.academicYearId
              ? 'bg-teal-500/10 border-teal-500/30 text-teal-700 dark:text-teal-400'
              : 'bg-surface-primary border-border-primary text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
          }`}
        >
          <option value="">Year</option>
          {(academicYears || []).map((y) => (
            <option key={y.yearId} value={y.yearId}>
              {y.name} {y.isCurrent ? '(Current)' : ''}
            </option>
          ))}
        </select>

        {/* Active status toggle chips */}
        {([null, true, false] as const).map((val) => {
          const isSelected = filters.isActive === val
          const label = val === null ? 'All' : val ? 'Active' : 'Inactive'
          return (
            <button
              key={String(val)}
              type="button"
              onClick={() => actions.setIsActive(val)}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                isSelected
                  ? 'bg-teal-500/10 border-teal-500/30 text-teal-700 dark:text-teal-400'
                  : 'bg-surface-primary border-border-primary text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
              }`}
            >
              {label}
            </button>
          )
        })}

        {/* Results count */}
        {totalResults !== undefined && (
          <span className="text-xs text-text-tertiary ml-auto">
            {totalResults} section{totalResults !== 1 ? 's' : ''}
            {filterCount > 0 ? ' matched' : ''}
          </span>
        )}
      </div>

      {/* Active filter badges */}
      {activeFilterBadges.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {activeFilterBadges.map((badge) => (
            <span
              key={badge.key}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/20"
            >
              {badge.label}
              <button
                type="button"
                onClick={badge.onClear}
                className="ml-0.5 p-0.5 rounded hover:bg-teal-500/20 transition-colors"
                aria-label={`Remove ${badge.label} filter`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={actions.resetFilters}
            className="text-xs text-text-tertiary hover:text-text-primary transition-colors ml-1"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  )
}
