/**
 * SectionFilters Component
 *
 * Clean filter bar with compact filter selects, active filter badges,
 * and results count.
 */

import { useMemo } from 'react'
import { X } from 'lucide-react'
import { Select } from '@edforge/ui'
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

  const chipClass = (active: boolean) =>
    `px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
      active
        ? 'bg-[rgb(var(--state-info-bg))] border-[rgb(var(--state-info-border)/0.4)] text-[rgb(var(--state-info-fg))]'
        : 'bg-[rgb(var(--background-secondary))] border-[rgb(var(--border-primary)/0.35)] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--background-tertiary))]'
    }`

  return (
    <div className="space-y-2.5">
      {/* Single-row: Filters + Status chips */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select
          size="sm"
          className="w-44"
          clearable
          placeholder="Course"
          value={filters.courseId || ''}
          onChange={(v) => actions.setCourseId(v || null)}
          options={courses.map((c) => ({
            value: c.courseId,
            label: `${c.courseCode} — ${c.courseName}`,
          }))}
        />

        <Select
          size="sm"
          className="w-44"
          clearable
          placeholder="Teacher"
          value={filters.teacherId || ''}
          onChange={(v) => actions.setTeacherId(v || null)}
          options={teachers.map((t) => ({
            value: t.staffId,
            label: getStaffDisplayName(t),
          }))}
        />

        <Select
          size="sm"
          className="w-40"
          clearable
          placeholder="Year"
          value={filters.academicYearId || ''}
          onChange={(v) => actions.setAcademicYearId(v || null)}
          options={(academicYears || []).map((y) => ({
            value: y.yearId,
            label: `${y.name}${y.isCurrent ? ' (Current)' : ''}`,
          }))}
        />

        {/* Active status toggle chips */}
        {([null, true, false] as const).map((val) => {
          const isSelected = filters.isActive === val
          const label = val === null ? 'All' : val ? 'Active' : 'Inactive'
          return (
            <button
              key={String(val)}
              type="button"
              onClick={() => actions.setIsActive(val)}
              className={chipClass(isSelected)}
            >
              {label}
            </button>
          )
        })}

        {/* Results count */}
        {totalResults !== undefined && (
          <span className="text-xs ml-auto text-[rgb(var(--text-tertiary))]">
            {totalResults} section{totalResults !== 1 ? 's' : ''}
            {filterCount > 0 ? ' matched' : ''}
          </span>
        )}
      </div>

      {/* Active filter badges */}
      {activeFilterBadges.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilterBadges.map((badge) => (
            <span
              key={badge.key}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-[rgb(var(--state-info-bg))] text-[rgb(var(--state-info-fg))] border border-[rgb(var(--state-info-border)/0.3)]"
            >
              {badge.label}
              <button
                type="button"
                onClick={badge.onClear}
                className="ml-0.5 p-0.5 rounded opacity-70 hover:opacity-100 transition-opacity"
                aria-label={`Remove ${badge.label} filter`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={actions.resetFilters}
            className="text-xs ml-1 text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] transition-colors"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  )
}
