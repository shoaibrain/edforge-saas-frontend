/**
 * GradeLevelsTab Component
 *
 * Enterprise-grade grade level management view with:
 * - DataTable listing all grade levels (PK–12) with course data
 * - Unified toolbar: search (grade name or code) + docked presets
 *   (All / With courses / Empty), filtered client-side
 * - Row click opens GradeLevelDrawer for detailed view
 * - Consistent with Courses tab design pattern
 *
 * Summary KPIs live in the page-level StatBand (see routes/curriculum), which
 * swaps its metrics to these grade-level stats when this tab is active.
 */

import { useMemo, useState, useCallback } from 'react'
import { Layers } from 'lucide-react'
import { TanstackDataTable, type ColumnDef } from '@edforge/ui'
import type { CourseResponseDto } from '@aibrains/shared-types'
import { GradeLevelDrawer, type GradeLevelData } from './GradeLevelDrawer'
import { useSchoolEnabledGradeOptions } from '../../hooks/useGradeOptions'
import { useAcademicsI18n } from '../../lib/i18n'

// ============================================================================
// TYPES
// ============================================================================

interface GradeLevelsTabProps {
  /** Course data to derive grade-level course counts from */
  courses: CourseResponseDto[]
  /** Whether course data is loading */
  isLoading?: boolean
  /** Callback when a course is clicked inside the drawer */
  onViewCourse?: (course: CourseResponseDto) => void
  /**
   * Active school. The grade rows shown are derived from the school's
   * `enabledGradeLevels` (with `gradeRange` fallback) so this view matches
   * the rest of the Curriculum / Enrollment / Student forms.
   */
  schoolId: string | null
  /** Per-grade enrollment counts from the current academic year (canonical Space A keys). */
  enrollmentByGradeLevel?: Record<string, number> | null
  /** True while the enrollment query is in flight on first paint. */
  enrollmentLoading?: boolean
  /** False when the active school has no current academic year yet. */
  hasCurrentAY?: boolean
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function GradeBadge({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[rgb(var(--state-info-bg)/0.18)] to-violet-500/20 flex items-center justify-center">
        <span className="text-xs font-bold text-[rgb(var(--state-info-fg))]">
          {value}
        </span>
      </div>
      <span className="font-medium text-text-primary text-sm">{label}</span>
    </div>
  )
}

function CourseChips({ courses }: { courses: CourseResponseDto[] }) {
  const { t } = useAcademicsI18n()
  if (courses.length === 0) {
    return <span className="text-text-tertiary text-sm">—</span>
  }

  const names = courses.map((c) => c.courseName)
  const maxShow = 2
  const display = names.slice(0, maxShow)
  const remaining = names.length - maxShow

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {display.map((name, i) => (
        <span
          key={i}
          className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-surface-tertiary text-text-secondary truncate max-w-36"
          title={name}
        >
          {name}
        </span>
      ))}
      {remaining > 0 && (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium bg-[rgb(var(--state-info-bg)/0.18)] text-[rgb(var(--action-secondary-fg))]">
          {t('common.more', { count: remaining })}
        </span>
      )}
    </div>
  )
}

// ============================================================================
// GRADE LEVELS TAB
// ============================================================================

export function GradeLevelsTab({
  courses,
  isLoading,
  onViewCourse,
  schoolId,
  enrollmentByGradeLevel,
  enrollmentLoading = false,
  hasCurrentAY = true,
}: GradeLevelsTabProps) {
  const { t, dataTableLabels } = useAcademicsI18n()
  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedGrade, setSelectedGrade] = useState<GradeLevelData | null>(null)

  const { options: filteredGradeOptions } = useSchoolEnabledGradeOptions(schoolId)

  // Derive enriched grade level data with associated courses
  const gradeData: GradeLevelData[] = useMemo(() => {
    const courseMap = new Map<string, CourseResponseDto[]>()

    // Initialize only the relevant grades
    for (const opt of filteredGradeOptions) {
      courseMap.set(opt.value, [])
    }

    // Group courses by grade level
    for (const course of courses) {
      if (course.gradeLevels) {
        for (const grade of course.gradeLevels) {
          const existing = courseMap.get(grade)
          if (existing !== undefined) {
            existing.push(course)
          }
        }
      }
    }

    return filteredGradeOptions.map((opt) => {
      const gradeCourses = courseMap.get(opt.value) ?? []
      const studentCount = enrollmentByGradeLevel?.[opt.value] ?? 0
      return {
        value: opt.value,
        label: opt.label,
        courseCount: gradeCourses.length,
        courses: gradeCourses,
        studentCount,
      }
    })
  }, [courses, filteredGradeOptions, enrollmentByGradeLevel])

  // Whether to show numeric student counts vs em-dash placeholders
  const showStudentCounts = hasCurrentAY && enrollmentByGradeLevel != null
  const studentsPending = hasCurrentAY && enrollmentLoading && enrollmentByGradeLevel == null

  // Unified-toolbar client state: a controlled search (grade name or code) and
  // docked presets (All / With courses / Empty). Both filter `gradeData`
  // client-side — the top-level KPI band now owns the summary stats.
  const [gradeSearch, setGradeSearch] = useState('')
  const [gradePreset, setGradePreset] = useState<'all' | 'with' | 'empty'>('all')

  const presetCounts = useMemo(() => {
    const withCourses = gradeData.filter((g) => g.courseCount > 0).length
    return { all: gradeData.length, withCourses, empty: gradeData.length - withCourses }
  }, [gradeData])

  const filteredGradeData = useMemo(() => {
    const q = gradeSearch.trim().toLowerCase()
    return gradeData.filter((g) => {
      if (gradePreset === 'with' && g.courseCount === 0) return false
      if (gradePreset === 'empty' && g.courseCount > 0) return false
      if (!q) return true
      return g.label.toLowerCase().includes(q) || g.value.toLowerCase().includes(q)
    })
  }, [gradeData, gradePreset, gradeSearch])

  // Open grade detail drawer
  const handleRowClick = useCallback((grade: GradeLevelData) => {
    setSelectedGrade(grade)
    setDrawerOpen(true)
  }, [])

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false)
    setSelectedGrade(null)
  }, [])

  // Handle clicking a course inside the drawer
  const handleViewCourseFromDrawer = useCallback(
    (course: CourseResponseDto) => {
      handleCloseDrawer()
      onViewCourse?.(course)
    },
    [handleCloseDrawer, onViewCourse]
  )

  // TanstackDataTable columns
  const columns: ColumnDef<GradeLevelData, unknown>[] = useMemo(
    () => [
      {
        accessorKey: 'value',
        header: t('tables.gradeLevels.columns.gradeLevel'),
        size: 200,
        cell: ({ row }) => (
          <GradeBadge value={row.original.value} label={row.original.label} />
        ),
      },
      {
        accessorKey: 'courseCount',
        header: t('tables.gradeLevels.columns.courseCount'),
        size: 130,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-text-primary tabular-nums">
              {row.original.courseCount}
            </span>
            {row.original.courseCount > 0 && (
              <span className="text-xs text-text-tertiary">
                {row.original.courseCount === 1
                  ? t('common.course')
                  : t('tables.gradeLevels.columns.courses')}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'courses',
        header: t('tables.gradeLevels.columns.courses'),
        size: 320,
        cell: ({ row }) => <CourseChips courses={row.original.courses} />,
      },
      {
        accessorKey: 'studentCount',
        header: t('tables.gradeLevels.columns.students'),
        size: 120,
        cell: ({ row }) => {
          if (!hasCurrentAY) {
            return (
              <span
                className="text-sm text-text-tertiary"
                title={t('tables.gradeLevels.noCurrentYearTitle')}
              >
                &mdash;
              </span>
            )
          }
          if (studentsPending) {
            return <span className="text-sm text-text-tertiary">…</span>
          }
          return (
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-text-primary tabular-nums">
                {row.original.studentCount}
              </span>
              {row.original.studentCount > 0 && (
                <span className="text-xs text-text-tertiary">
                  {row.original.studentCount === 1
                    ? t('common.student')
                    : t('tables.gradeLevels.columns.students')}
                </span>
              )}
            </div>
          )
        },
      },
    ],
    [hasCurrentAY, studentsPending, t]
  )

  return (
    <div className="space-y-6">
      {/* Grade Levels DataTable — unified toolbar (search + docked presets).
          The summary KPIs live in the page-level StatBand now. */}
      <TanstackDataTable
        columns={columns}
        data={filteredGradeData}
        getRowId={(grade) => grade.value}
        isLoading={isLoading}
        tableId="academics.grade-levels"
        enableSorting={true}
        pagination={{ pageSize: 20 }}
        searchPlaceholder={t('tables.gradeLevels.searchPlaceholder')}
        searchValue={gradeSearch}
        onSearchChange={setGradeSearch}
        presets={[
          { value: 'all', label: t('tables.gradeLevels.presets.all'), count: presetCounts.all },
          { value: 'with', label: t('tables.gradeLevels.presets.withCourses'), count: presetCounts.withCourses },
          { value: 'empty', label: t('tables.gradeLevels.presets.empty'), count: presetCounts.empty },
        ]}
        activePreset={gradePreset}
        onPresetChange={(v) => setGradePreset(v as 'all' | 'with' | 'empty')}
        presetsLabel={t('tables.gradeLevels.presets.label', { defaultValue: 'Show' })}
        emptyState={{
          icon: <Layers className="w-10 h-10" />,
          title: t('tables.gradeLevels.empty.title'),
          description: t('tables.gradeLevels.empty.description'),
        }}
        labels={dataTableLabels}
        onRowClick={handleRowClick}
        maxHeight="calc(100vh - 28rem)"
      />

      {/* Grade Level Drawer */}
      <GradeLevelDrawer
        open={drawerOpen}
        onClose={handleCloseDrawer}
        gradeLevel={selectedGrade}
        onViewCourse={onViewCourse ? handleViewCourseFromDrawer : undefined}
        showStudentCount={showStudentCounts}
      />
    </div>
  )
}
