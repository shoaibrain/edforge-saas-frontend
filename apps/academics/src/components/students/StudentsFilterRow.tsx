/**
 * StudentsFilterRow — filter presets + search + grade/status for the Students
 * table toolbar.
 *
 * Quick-select mode chips, search input, grade/status dropdowns, and a clear
 * button. Rendered as the table toolbar's leading (left) slot; Export CSV is a
 * sibling right-slot action owned by the page.
 */

import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { Select, Input, TablePresetTabs } from '@edforge/ui'
import type { StudentStatus } from '@aibrains/shared-types'
import { useDebounce } from '../../hooks'
import { useSchoolEnabledGradeOptions } from '../../hooks/useGradeOptions'
import {
  useStudentFilters,
  useStudentFilterActions,
  type StudentFilterMode,
} from '../../stores/students.store'
import { useAcademicsI18n } from '../../lib/i18n'

// ============================================================================
// CONSTANTS
// ============================================================================

const MODE_CHIPS: { key: StudentFilterMode; labelKey: string }[] = [
  { key: 'all', labelKey: 'studentsModule.filters.modes.all' },
  { key: 'active', labelKey: 'studentsModule.filters.modes.active' },
  { key: 'at-risk', labelKey: 'studentsModule.filters.modes.atRisk' },
  { key: 'pending', labelKey: 'studentsModule.filters.modes.pending' },
]

// TODO(sprint-2 follow-up): Add the pending status once backend filtering supports it.
// The StudentStatus enum (packages/shared-types/.../student.schema.ts) includes
// 'pending' but this dropdown omits it. Deferred from Sprint 2 chip-fix scope.
const STATUS_OPTIONS: { value: StudentStatus; labelKey: string }[] = [
  { value: 'active', labelKey: 'status.active' },
  { value: 'inactive', labelKey: 'status.inactive' },
  { value: 'graduated', labelKey: 'status.graduated' },
  { value: 'transferred', labelKey: 'status.transferred' },
  { value: 'withdrawn', labelKey: 'status.withdrawn' },
  { value: 'suspended', labelKey: 'status.suspended' },
]

// ============================================================================
// COMPONENT
// ============================================================================

interface StudentsFilterRowProps {
  /**
   * Active school. The Grade filter dropdown reads `enabledGradeLevels`
   * (with `gradeRange` fallback) via `useSchoolEnabledGradeOptions`.
   */
  schoolId: string | null
}

export function StudentsFilterRow({ schoolId }: StudentsFilterRowProps) {
  const { t } = useAcademicsI18n()
  const filters = useStudentFilters()
  // Gate dropdown on profile-load — see EnrollmentTable comment.
  const { options: gradeOptions, isLoading: gradeOptionsLoading } =
    useSchoolEnabledGradeOptions(schoolId)
  const {
    setSearchTerm,
    setGradeLevel,
    setStatus,
    setFilterMode,
    resetFilters,
    hasActiveFilters,
  } = useStudentFilterActions()

  // Local search state for immediate UI feedback
  const [localSearch, setLocalSearch] = useState(filters.searchTerm)
  const debouncedSearch = useDebounce(localSearch, 300)

  // Sync debounced search to store
  useEffect(() => {
    if (debouncedSearch !== filters.searchTerm) {
      setSearchTerm(debouncedSearch)
    }
  }, [debouncedSearch, filters.searchTerm, setSearchTerm])

  const handleClearFilters = () => {
    setLocalSearch('')
    resetFilters()
  }

  const isActiveFilters = hasActiveFilters()

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Status presets — docked segmented control (handoff ③) */}
      <TablePresetTabs
        presets={MODE_CHIPS.map((chip) => ({ value: chip.key, label: t(chip.labelKey) }))}
        active={filters.filterMode}
        onChange={(value) => setFilterMode(value as StudentFilterMode)}
      />

      {/* Search input */}
      <Input
        size="sm"
        className="flex-1 min-w-44 max-w-sm"
        prefix={<Search className="w-3.5 h-3.5" />}
        suffix={
          localSearch ? (
            <button
              type="button"
              onClick={() => setLocalSearch('')}
              aria-label={t('dataTable.clearSearch')}
              className="text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))]"
            >
              <X className="w-3 h-3" />
            </button>
          ) : undefined
        }
        value={localSearch}
        onChange={(e) => setLocalSearch(e.target.value)}
        placeholder={t('studentsModule.filters.searchPlaceholder')}
      />

      {/* Grade dropdown */}
      <Select
        aria-label={t('studentsModule.filters.gradeAria')}
        size="sm"
        className="w-36"
        value={filters.gradeLevel ?? ''}
        onChange={(v) => setGradeLevel(v || null)}
        disabled={gradeOptionsLoading}
        loading={gradeOptionsLoading}
        placeholder={t('studentsModule.filters.allGrades')}
        options={gradeOptionsLoading ? [] : [{ value: '', label: t('studentsModule.filters.allGrades') }, ...gradeOptions]}
      />

      {/* Status dropdown */}
      <Select
        aria-label={t('studentsModule.filters.statusAria')}
        size="sm"
        className="w-36"
        value={filters.status ?? ''}
        onChange={(v) => setStatus((v || null) as StudentStatus | null)}
        options={[
          { value: '', label: t('studentsModule.filters.allStatus') },
          ...STATUS_OPTIONS.map((status) => ({ value: status.value, label: t(status.labelKey) })),
        ]}
      />

      {/* Clear */}
      {isActiveFilters && (
        <button
          onClick={handleClearFilters}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--background-tertiary))] hover:text-[rgb(var(--text-primary))] transition-colors"
        >
          <X className="w-3 h-3" />
          {t('studentsModule.filters.clear')}
        </button>
      )}
    </div>
  )
}
