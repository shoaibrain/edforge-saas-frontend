/**
 * SectionFilters Component
 *
 * Clean filter bar with full-width search, compact filter chips,
 * active filter badges, and results count.
 */

import { useMemo } from 'react'
import { X } from 'lucide-react'
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

  const selectInactiveStyle = {
    background: 'var(--v2-bg-surface)',
    borderColor: 'var(--v2-border-default)',
    color: 'var(--v2-text-secondary)',
  }
  const selectActiveStyle = {
    background: 'rgba(55,138,221,0.10)',
    borderColor: 'rgba(55,138,221,0.25)',
    color: '#378ADD',
  }

  return (
    <div className="space-y-2.5">
      {/* Single-row: Filters + Status chips */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Course dropdown */}
        <select
          value={filters.courseId || ''}
          onChange={(e) => actions.setCourseId(e.target.value || null)}
          className="px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer"
          style={filters.courseId ? selectActiveStyle : selectInactiveStyle}
        >
          <option value="">Course</option>
          {courses.map((c) => (
            <option key={c.courseId} value={c.courseId}>
              {c.courseCode} — {c.courseName}
            </option>
          ))}
        </select>

        {/* Teacher dropdown */}
        <select
          value={filters.teacherId || ''}
          onChange={(e) => actions.setTeacherId(e.target.value || null)}
          className="px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer"
          style={filters.teacherId ? selectActiveStyle : selectInactiveStyle}
        >
          <option value="">Teacher</option>
          {teachers.map((t) => (
            <option key={t.staffId} value={t.staffId}>
              {getStaffDisplayName(t)}
            </option>
          ))}
        </select>

        {/* Academic Year dropdown */}
        <select
          value={filters.academicYearId || ''}
          onChange={(e) => actions.setAcademicYearId(e.target.value || null)}
          className="px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer"
          style={filters.academicYearId ? selectActiveStyle : selectInactiveStyle}
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
              className="px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors"
              style={isSelected ? selectActiveStyle : selectInactiveStyle}
            >
              {label}
            </button>
          )
        })}

        {/* Results count */}
        {totalResults !== undefined && (
          <span className="text-xs ml-auto" style={{ color: 'var(--v2-text-hint)' }}>
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
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md"
              style={{
                background: 'rgba(55,138,221,0.10)',
                color: '#378ADD',
                border: '1px solid rgba(55,138,221,0.20)',
              }}
            >
              {badge.label}
              <button
                type="button"
                onClick={badge.onClear}
                className="ml-0.5 p-0.5 rounded transition-colors"
                style={{ opacity: 0.7 }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '1' }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.7' }}
                aria-label={`Remove ${badge.label} filter`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={actions.resetFilters}
            className="text-xs transition-colors ml-1"
            style={{ color: 'var(--v2-text-hint)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--v2-text-primary)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--v2-text-hint)' }}
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  )
}
