/**
 * useCourseToolbar — builds the unified-toolbar filter controls for the course
 * catalog, wired to the courses Zustand store (server-side filtering).
 *
 * Returns everything the shared DataTable toolbar needs: a controlled search
 * (debounced → store), docked status presets (All/Active/Inactive with counts),
 * a primary Subject facet, a "More filters" popover (Type · Credit · Grade),
 * and the Export button for the right cluster. Replaces the old inline
 * CourseFilters row that rendered every control at once.
 */

import { useEffect, useState, type ReactNode } from 'react'
import { Download } from 'lucide-react'
import { Select, Button, DataTableMoreFilters } from '@edforge/ui'
import { useCourseFilters, useCourseFilterActions } from '../../stores/courses.store'
import {
  SUBJECT_AREA_OPTIONS,
  COURSE_TYPE_OPTIONS,
  CREDIT_TYPE_OPTIONS,
} from '../../schemas/course.form'
import { useSchoolEnabledGradeOptions } from '../../hooks/useGradeOptions'
import { useDebounce } from '../../hooks'
import { useAcademicsI18n } from '../../lib/i18n'

type StatusPresetValue = 'all' | 'active' | 'inactive'

export interface CoursePresetCounts {
  all?: number
  active?: number
  inactive?: number
}

export interface CourseToolbar {
  searchPlaceholder: string
  searchValue: string
  onSearchChange: (value: string) => void
  presets: { value: string; label: string; count?: number }[]
  activePreset: string
  onPresetChange: (value: string) => void
  primaryFilter: ReactNode
  moreFilters: ReactNode
  toolbarExtra: ReactNode
}

export function useCourseToolbar(
  schoolId: string | null,
  opts?: { counts?: CoursePresetCounts; onExport?: () => Promise<void> },
): CourseToolbar {
  const { t } = useAcademicsI18n()
  const filters = useCourseFilters()
  const actions = useCourseFilterActions()
  const { options: gradeOptions } = useSchoolEnabledGradeOptions(schoolId)

  const [localSearch, setLocalSearch] = useState(filters.searchTerm)
  const debouncedSearch = useDebounce(localSearch, 300)
  useEffect(() => {
    if (debouncedSearch !== filters.searchTerm) {
      actions.setSearchTerm(debouncedSearch)
    }
  }, [debouncedSearch, filters.searchTerm, actions])

  const [isExporting, setIsExporting] = useState(false)
  const handleExport = async () => {
    if (!opts?.onExport) return
    setIsExporting(true)
    try {
      await opts.onExport()
    } finally {
      setIsExporting(false)
    }
  }

  const activePreset: StatusPresetValue =
    filters.isActive === null ? 'all' : filters.isActive ? 'active' : 'inactive'
  const onPresetChange = (value: string) =>
    actions.setIsActive(value === 'all' ? null : value === 'active')

  const secondaryActive =
    (filters.courseType ? 1 : 0) + (filters.creditType ? 1 : 0) + (filters.gradeLevel ? 1 : 0)

  const primaryFilter = (
    <Select
      aria-label={t('curriculumModule.filters.subjectArea')}
      size="sm"
      className="w-40"
      value={filters.subjectArea ?? ''}
      onChange={(v) => actions.setSubjectArea(v ? (v as typeof filters.subjectArea) : null)}
      options={[{ value: '', label: t('curriculumModule.filters.allSubjects') }, ...SUBJECT_AREA_OPTIONS]}
    />
  )

  const moreFilters = (
    <DataTableMoreFilters
      label={t('dataTable.moreFilters')}
      activeCount={secondaryActive}
      onClear={() => {
        actions.setCourseType(null)
        actions.setCreditType(null)
        actions.setGradeLevel(null)
      }}
    >
      <Select
        aria-label={t('curriculumModule.filters.courseType')}
        size="sm"
        value={filters.courseType ?? ''}
        onChange={(v) => actions.setCourseType(v ? (v as typeof filters.courseType) : null)}
        options={[{ value: '', label: t('curriculumModule.filters.allTypes') }, ...COURSE_TYPE_OPTIONS]}
      />
      <Select
        aria-label={t('curriculumModule.filters.creditType')}
        size="sm"
        value={filters.creditType ?? ''}
        onChange={(v) => actions.setCreditType(v ? (v as typeof filters.creditType) : null)}
        options={[{ value: '', label: t('curriculumModule.filters.allCreditTypes') }, ...CREDIT_TYPE_OPTIONS]}
      />
      <Select
        aria-label={t('curriculumModule.filters.gradeLevel')}
        size="sm"
        value={filters.gradeLevel ?? ''}
        onChange={(v) => actions.setGradeLevel(v || null)}
        options={[
          { value: '', label: t('curriculumModule.filters.allGrades') },
          ...gradeOptions.map((o) => ({ value: o.value, label: o.label })),
        ]}
      />
    </DataTableMoreFilters>
  )

  const toolbarExtra = (
    <Button
      type="button"
      variant="outline"
      size="sm"
      aria-label={t('curriculumModule.filters.exportAria')}
      onClick={handleExport}
      isLoading={isExporting}
      disabled={!opts?.onExport || isExporting}
    >
      <Download className="w-3 h-3 mr-1.5" />
      {t('curriculumModule.filters.exportCsv')}
    </Button>
  )

  return {
    searchPlaceholder: t('curriculumModule.filters.search'),
    searchValue: localSearch,
    onSearchChange: setLocalSearch,
    presets: [
      { value: 'all', label: t('curriculumModule.filters.all'), count: opts?.counts?.all },
      { value: 'active', label: t('common.active'), count: opts?.counts?.active },
      { value: 'inactive', label: t('common.inactive'), count: opts?.counts?.inactive },
    ],
    activePreset,
    onPresetChange,
    primaryFilter,
    moreFilters,
    toolbarExtra,
  }
}
