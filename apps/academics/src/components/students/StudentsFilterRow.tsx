/**
 * useStudentsToolbar — builds the unified-toolbar filter controls for the
 * Students table, wired to the students Zustand store (server-side filtering).
 *
 * Returns everything the shared DataTable toolbar needs: a controlled search
 * (debounced → store), docked status presets (with counts), a primary Grade
 * facet, and a "More filters" popover holding Status. Replaces the old inline
 * StudentsFilterRow (own search + two loose selects) so the toolbar matches the
 * prototype and stays consistent across pages.
 */

import { useState, useEffect, type ReactNode } from 'react'
import { Select, DataTableMoreFilters } from '@edforge/ui'
import type { StudentStatus } from '@aibrains/shared-types'
import { useDebounce } from '../../hooks'
import { useSchoolEnabledGradeOptions } from '../../hooks/useGradeOptions'
import {
  useStudentFilters,
  useStudentFilterActions,
  type StudentFilterMode,
} from '../../stores/students.store'
import { useAcademicsI18n } from '../../lib/i18n'

const MODE_KEYS: { key: StudentFilterMode; labelKey: string }[] = [
  { key: 'all', labelKey: 'studentsModule.filters.modes.all' },
  { key: 'active', labelKey: 'studentsModule.filters.modes.active' },
  { key: 'at-risk', labelKey: 'studentsModule.filters.modes.atRisk' },
  { key: 'pending', labelKey: 'studentsModule.filters.modes.pending' },
]

const STATUS_OPTIONS: { value: StudentStatus; labelKey: string }[] = [
  { value: 'active', labelKey: 'status.active' },
  { value: 'inactive', labelKey: 'status.inactive' },
  { value: 'graduated', labelKey: 'status.graduated' },
  { value: 'transferred', labelKey: 'status.transferred' },
  { value: 'withdrawn', labelKey: 'status.withdrawn' },
  { value: 'suspended', labelKey: 'status.suspended' },
]

/** Optional per-preset counts (only render where a reliable number exists). */
export interface StudentPresetCounts {
  all?: number
  active?: number
  atRisk?: number
  pending?: number
}

export interface StudentsToolbar {
  searchPlaceholder: string
  searchValue: string
  onSearchChange: (value: string) => void
  presets: { value: string; label: string; count?: number }[]
  activePreset: string
  onPresetChange: (value: string) => void
  primaryFilter: ReactNode
  moreFilters: ReactNode
}

export function useStudentsToolbar(
  schoolId: string | null,
  counts?: StudentPresetCounts,
): StudentsToolbar {
  const { t } = useAcademicsI18n()
  const filters = useStudentFilters()
  const { options: gradeOptions, isLoading: gradeOptionsLoading } =
    useSchoolEnabledGradeOptions(schoolId)
  const { setSearchTerm, setGradeLevel, setStatus, setFilterMode } = useStudentFilterActions()

  // Local search for immediate feedback; debounce into the store (server refetch).
  const [localSearch, setLocalSearch] = useState(filters.searchTerm)
  const debouncedSearch = useDebounce(localSearch, 300)
  useEffect(() => {
    if (debouncedSearch !== filters.searchTerm) {
      setSearchTerm(debouncedSearch)
    }
  }, [debouncedSearch, filters.searchTerm, setSearchTerm])

  const countByMode: Record<StudentFilterMode, number | undefined> = {
    all: counts?.all,
    active: counts?.active,
    'at-risk': counts?.atRisk,
    pending: counts?.pending,
  }

  const primaryFilter = (
    <Select
      aria-label={t('studentsModule.filters.gradeAria')}
      size="sm"
      className="w-36"
      value={filters.gradeLevel ?? ''}
      onChange={(v) => setGradeLevel(v || null)}
      disabled={gradeOptionsLoading}
      loading={gradeOptionsLoading}
      placeholder={t('studentsModule.filters.allGrades')}
      options={
        gradeOptionsLoading
          ? []
          : [{ value: '', label: t('studentsModule.filters.allGrades') }, ...gradeOptions]
      }
    />
  )

  const moreFilters = (
    <DataTableMoreFilters
      label={t('dataTable.moreFilters')}
      activeCount={filters.status ? 1 : 0}
      onClear={() => setStatus(null)}
      clearLabel={t('studentsModule.filters.clear')}
    >
      <Select
        aria-label={t('studentsModule.filters.statusAria')}
        size="sm"
        value={filters.status ?? ''}
        onChange={(v) => setStatus((v || null) as StudentStatus | null)}
        options={[
          { value: '', label: t('studentsModule.filters.allStatus') },
          ...STATUS_OPTIONS.map((s) => ({ value: s.value, label: t(s.labelKey) })),
        ]}
      />
    </DataTableMoreFilters>
  )

  return {
    searchPlaceholder: t('studentsModule.filters.searchPlaceholder'),
    searchValue: localSearch,
    onSearchChange: setLocalSearch,
    presets: MODE_KEYS.map((m) => ({
      value: m.key,
      label: t(m.labelKey),
      count: countByMode[m.key],
    })),
    activePreset: filters.filterMode,
    onPresetChange: (value) => setFilterMode(value as StudentFilterMode),
    primaryFilter,
    moreFilters,
  }
}
