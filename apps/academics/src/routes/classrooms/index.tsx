/**
 * Classrooms Module
 *
 * Google Classroom-inspired unified interface for the Academics domain.
 * Consolidates Scheduling, Grades & Assessments, and Attendance into a
 * single tabbed experience. The Section entity is the convergence point
 * between the administrative (Ed-Fi/EMIS) and instructional (LMS) worlds.
 *
 * Tabs:
 * - Overview: Section card grid / table with filters, stats, and CRUD
 * - Gradebook: Grade analytics dashboard + cross-section grade recording
 * - Grading Policies: Policy CRUD management
 * - Attendance Board: Daily attendance entry + analytics
 *
 * No backend changes — presentation layer only.
 */

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { useResourcePermissions } from '@edforge/abac'
import {
  School,
  BarChart3,
  BookCheck,
  Settings,
  ClipboardCheck,
  Plus,
  GraduationCap,
  Lock,
  AlertTriangle,
  ChevronLeft,
  Download,
  BookOpen,
  Users,
  Calendar,
  LayoutGrid,
  List,
  Send,
  ToggleLeft,
  ToggleRight,
  Building2,
  Gauge,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  StatBand,
  type StatMetric,
  Button,
  Select,
  PageHeader,
  Tabs,
  SegmentedControl,
  DataTableToolbar,
  AttentionCorner,
  AttentionCornerPill,
  AttentionCornerShade,
  SelectionContextBar,
  type Signal,
  type SelectionAction,
} from '@edforge/ui'
import type { RowSelectionState } from '@tanstack/react-table'
import { useActiveSchoolId } from '../../stores/app.store'

// --- Scheduling (My Classes) imports ---
import { useSectionFilters, useSectionFilterActions, useViewMode } from '../../stores/sections.store'
import {
  useSections,
  flattenSectionPages,
  getSectionTotalFromPages,
  useUpdateSection,
  useSectionRoster,
} from '../../hooks/useSections'
import { useCourses, flattenCoursePages } from '../../hooks/useCourses'
import { useSchoolStaff, flattenStaffData, getStaffDisplayName } from '../../hooks/useStaff'
import { useAcademicYears } from '../../hooks/useSchool'
import { SectionTable } from '../../components/scheduling/SectionTable'
import { BulkSectionStatusModal } from '../../components/scheduling/BulkSectionStatusModal'
import type { SectionResponseDto } from '@aibrains/shared-types'
import { ClassroomCardGrid } from '../../components/classrooms/ClassroomCardGrid'

// --- Grades imports ---
import { useGradesStore } from '../../stores/grades.store'
import { useCurrentAcademicYear, useGradingPeriods } from '../../hooks'
import { useAttendanceOverview } from '../../hooks/useAttendance'
import { useSignalAcks } from '../../hooks/useSignalAcks'
import { useSectionGrades, useGradingPolicies } from '../../hooks/useGrades'
import { GradebookGrid } from '../../components/grades/GradebookGrid'
import { GradebookLaunchpad } from '../../components/grades/GradebookLaunchpad'
import { GradingPolicyList } from '../../components/grades/GradingPolicyList'
import { BulkGradeModal } from '../../components/grades/BulkGradeModal'
import { FinalizationWizard } from '../../components/grades/FinalizationWizard'
import { AssignmentEditor } from '../../components/grades/AssignmentEditor'
import { GradeOverview } from '../grades/overview'

// --- Shared ---
import { TabErrorBoundary } from '../../components/common/TabErrorBoundary'
import { NoCurrentAcademicYearEmptyState } from '../../components/common'
import { AnimatedIcon, type IconName } from '@edforge/ui/motion'
import { useAcademicsI18n } from '../../lib/i18n'

// ============================================================================
// TYPES
// ============================================================================

type ClassroomTabId = 'overview' | 'gradebook' | 'policies' | 'attendance'

const TABS: { id: ClassroomTabId; labelKey: string; icon: typeof School }[] = [
  { id: 'overview', labelKey: 'classrooms.tabs.overview', icon: School },
  { id: 'gradebook', labelKey: 'classrooms.tabs.gradebook', icon: BookCheck },
  { id: 'policies', labelKey: 'classrooms.tabs.policies', icon: Settings },
  { id: 'attendance', labelKey: 'classrooms.tabs.attendance', icon: ClipboardCheck },
]

const VALID_TABS = new Set<string>(TABS.map((t) => t.id))

// Signature glyph per tab (clean counterparts only); unmapped tabs stay static.
const TAB_SIGNATURE: Partial<Record<ClassroomTabId, IconName>> = {
  overview: 'overview',
  policies: 'settings',
  attendance: 'attendance',
}

// ============================================================================
// OVERVIEW TAB (class cards / list with stats and filters)
// ============================================================================

function OverviewTab() {
  const schoolId = useActiveSchoolId() || ''
  const navigate = useNavigate()
  const { t, formatNumber, dataTableLabels } = useAcademicsI18n()
  const schedPerms = useResourcePermissions('scheduling')
  const { viewMode, setViewMode } = useViewMode()

  // Filters (server-driven) + local text search (client-side over loaded pages)
  const filters = useSectionFilters()
  const filterActions = useSectionFilterActions()
  const [search, setSearch] = useState('')

  // Section query
  const {
    data: sectionsData,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useSections({
    schoolId,
    filters: {
      courseId: filters.courseId || undefined,
      teacherId: filters.teacherId || undefined,
      academicYearId: filters.academicYearId || undefined,
      termId: filters.termId || undefined,
      isActive: filters.isActive ?? undefined,
    },
    enabled: !!schoolId,
  })

  const allSections = flattenSectionPages(sectionsData)
  const total = getSectionTotalFromPages(sectionsData)
  const updateMutation = useUpdateSection()

  // Facet option sources (Course · Teacher · Year) — reused by the unified toolbar.
  const { data: coursesData } = useCourses({ schoolId, filters: { isActive: true }, limit: 100, enabled: !!schoolId })
  const courses = useMemo(() => flattenCoursePages(coursesData), [coursesData])
  const subjectAreaMap = useMemo(
    () => new Map(courses.map((c) => [c.courseId, c.subjectArea])),
    [courses],
  )
  const { data: staffData } = useSchoolStaff(schoolId)
  const teachers = useMemo(() => flattenStaffData(staffData), [staffData])
  const teacherNameById = useMemo(
    () => new Map(teachers.map((tc) => [tc.staffId, getStaffDisplayName(tc)])),
    [teachers],
  )
  const { data: academicYears } = useAcademicYears(schoolId)

  // Client-side text search over the loaded sections (course · code · number · teacher).
  const sections = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return allSections
    return allSections.filter((s) => {
      const tn = s.primaryTeacherId ? teacherNameById.get(s.primaryTeacherId) ?? '' : ''
      return [s.courseName, s.courseCode, s.sectionNumber, tn]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    })
  }, [allSections, search, teacherNameById])

  // Stats derive from the full (unfiltered) result set.
  const stats = useMemo(() => {
    const totalSections = allSections.length
    const totalEnrolled = allSections.reduce((sum, s) => sum + s.currentEnrollment, 0)
    const totalCapacity = allSections.reduce((sum, s) => sum + s.maxEnrollment, 0)
    const utilization = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0
    const uniqueTeachers = new Set(allSections.map((s) => s.primaryTeacherId)).size
    return { totalSections, totalEnrolled, utilization, uniqueTeachers }
  }, [allSections])

  // ── StatBand metrics (calm; Avg Utilization → meter vs 80% target) ────────
  const metrics: StatMetric[] = [
    {
      label: t('classrooms.stats.totalSections'),
      value: formatNumber(total ?? stats.totalSections),
      iconSignature: 'sections',
      state: 'normal',
      primary: true,
      sub: t('classrooms.stats.activeClassrooms'),
    },
    {
      label: t('classrooms.stats.totalStudents'),
      value: formatNumber(stats.totalEnrolled),
      iconSignature: 'students',
      state: 'normal',
      sub: t('classrooms.stats.acrossAllSections'),
    },
    {
      label: t('classrooms.stats.avgUtilization'),
      value: `${formatNumber(stats.utilization)}%`,
      iconSignature: 'overview',
      state: stats.utilization >= 80 ? 'normal' : 'warn',
      meter: { pct: stats.utilization, target: 80 },
      sub: t('classrooms.stats.ofSeatCapacity'),
    },
    {
      label: t('classrooms.stats.activeTeachers'),
      value: formatNumber(stats.uniqueTeachers),
      iconSignature: 'people',
      state: 'normal',
      sub: t('classrooms.stats.assignedSections'),
    },
  ]

  const handleToggleActive = async (section: SectionResponseDto) => {
    await updateMutation.mutateAsync({
      sectionId: section.sectionId,
      schoolId,
      data: { isActive: !section.isActive } as any,
    })
  }

  // Bulk activate / deactivate — lift selection so the modal can clear it.
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [bulkStatusTarget, setBulkStatusTarget] = useState<{
    rows: SectionResponseDto[]
    targetActive: boolean
  } | null>(null)

  // ⑨ Selection Context Bar — state-aware matrix (retires the floating pill).
  // Activate applies only to selected INACTIVE sections, Deactivate only to
  // ACTIVE ones (subset chips + confirm-on-subset); both lock visibly without
  // scheduling:edit. Notify stays a coming-soon toast.
  const selectedSections = useMemo(() => {
    const ids = new Set(Object.keys(rowSelection))
    return sections.filter((s) => ids.has(s.sectionId))
  }, [rowSelection, sections])

  const selectionActions = useMemo<SelectionAction[]>(() => {
    const byId = new Map(selectedSections.map((s) => [s.sectionId, s]))
    const rowsFor = (ids: string[]) =>
      ids.map((id) => byId.get(id)).filter((s): s is SectionResponseDto => !!s)
    const inactiveIds = selectedSections.filter((s) => !s.isActive).map((s) => s.sectionId)
    const activeIds = selectedSections.filter((s) => s.isActive).map((s) => s.sectionId)
    return [
      {
        id: 'activate',
        label: t('classrooms.actions.activate'),
        icon: <ToggleRight className="h-3.5 w-3.5" />,
        applicableIds: inactiveIds,
        locked: !schedPerms.edit,
        lockedReason: t('studentsModule.bulk.requiresAdmin'),
        disabledReason: t('classrooms.selection.noInactive'),
        onAction: (ids) => setBulkStatusTarget({ rows: rowsFor(ids), targetActive: true }),
      },
      {
        id: 'deactivate',
        label: t('classrooms.actions.deactivate'),
        icon: <ToggleLeft className="h-3.5 w-3.5" />,
        applicableIds: activeIds,
        locked: !schedPerms.edit,
        lockedReason: t('studentsModule.bulk.requiresAdmin'),
        disabledReason: t('classrooms.selection.noActive'),
        onAction: (ids) => setBulkStatusTarget({ rows: rowsFor(ids), targetActive: false }),
      },
      {
        id: 'notify',
        label: t('classrooms.actions.sendNotification'),
        icon: <Send className="h-3.5 w-3.5" />,
        applicableIds: selectedSections.map((s) => s.sectionId),
        onAction: (ids) => toast.info(t('classrooms.toast.notifyComingSoon', { count: ids.length })),
      },
    ]
  }, [selectedSections, schedPerms.edit, t])

  const singleSection = selectedSections.length === 1 ? selectedSections[0] : null
  const selectionBar = (
    <SelectionContextBar
      selectedCount={selectedSections.length}
      totalCount={sections.length}
      onClear={() => setRowSelection({})}
      onSelectAll={() =>
        setRowSelection(Object.fromEntries(sections.map((s) => [s.sectionId, true])))
      }
      actions={selectionActions}
      aria-label={t('dataTable.selection.aria')}
      labels={{
        selected: (count) => t('dataTable.selection.selected', { count: formatNumber(count) }),
        selectAll: (total) => t('dataTable.selection.selectAll', { count: formatNumber(total) }),
        clear: t('dataTable.selection.clear'),
      }}
      peek={
        singleSection ? (
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-[rgb(var(--text-primary))]">
              {singleSection.courseName ?? singleSection.courseCode} — {singleSection.sectionNumber}
            </div>
            <div className="truncate text-2xs text-[rgb(var(--text-tertiary))]">
              {t('classrooms.selection.peekSeats', {
                enrolled: formatNumber(singleSection.currentEnrollment),
                cap: formatNumber(singleSection.maxEnrollment),
              })}
              {' · '}
              {singleSection.isActive ? t('common.active') : t('common.inactive')}
            </div>
          </div>
        ) : undefined
      }
    />
  )

  const handleNavigateToDetail = (section: SectionResponseDto) => {
    navigate({ to: `/classrooms/${section.sectionId}` })
  }

  const handleNavigateToEdit = (section: SectionResponseDto) => {
    navigate({ to: `/classrooms/${section.sectionId}/edit` })
  }

  // CSV export of the current (filtered) sections.
  const handleExport = useCallback(() => {
    const rows = [
      ['Section', 'Course', 'Code', 'Teacher', 'Enrolled', 'Capacity', 'Status'],
      ...sections.map((s) => [
        s.courseName ?? s.courseCode ?? '',
        s.courseName ?? '',
        s.courseCode ?? '',
        (s.primaryTeacherId ? teacherNameById.get(s.primaryTeacherId) : '') ?? '',
        String(s.currentEnrollment),
        String(s.maxEnrollment),
        s.isActive ? 'Active' : 'Inactive',
      ]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sections.csv'
    a.click()
    URL.revokeObjectURL(url)
  }, [sections, teacherNameById])

  // Docked status presets ↔ store `isActive`.
  const activePreset = filters.isActive === null ? 'all' : filters.isActive ? 'active' : 'inactive'

  return (
    <div className="space-y-5">
      {/* KPI band */}
      <StatBand metrics={metrics} ariaLabel={t('classrooms.stats.region')} />

      {/* Unified toolbar + body — one connected container (toolbar row → content) */}
      <div>
        {/* Shared toolbar in STANDALONE mode (no table instance — one bar
            drives both the card grid and the table): fluid search, scrollable
            presets, Course primary facet (folds into the overflow below @4xl),
            Teacher · Year in the overflow, view toggle + export trailing.
            ⑨ Selecting rows morphs it into the selection bar in place via the
            shared same-footprint swap; ✕/Esc restores it. */}
        <div className="rounded-t-xl border border-b-0 border-[rgb(var(--border-primary)/0.5)] bg-[rgb(var(--background-secondary))] px-3 py-2.5">
          <DataTableToolbar
            searchPlaceholder={t('classrooms.toolbar.searchPlaceholder')}
            searchValue={search}
            onSearchChange={setSearch}
            labels={dataTableLabels}
            presets={[
              { value: 'all', label: t('classrooms.toolbar.all') },
              { value: 'active', label: t('common.active') },
              { value: 'inactive', label: t('common.inactive') },
            ]}
            activePreset={activePreset}
            onPresetChange={(v) => filterActions.setIsActive(v === 'all' ? null : v === 'active')}
            primaryFilter={
              <Select
                size="sm"
                className="w-40"
                clearable
                leadingIcon={<BookOpen className="h-4 w-4" />}
                placeholder={t('classrooms.toolbar.course')}
                value={filters.courseId || ''}
                onChange={(v) => filterActions.setCourseId(v || null)}
                options={courses.map((c) => ({ value: c.courseId, label: `${c.courseCode} — ${c.courseName}` }))}
                buttonClassName="border-[rgb(var(--border-primary)/0.35)]"
              />
            }
            overflowFilters={
              <>
                <Select
                  size="sm"
                  className="w-full"
                  clearable
                  leadingIcon={<Users className="h-4 w-4" />}
                  placeholder={t('classrooms.toolbar.teacher')}
                  value={filters.teacherId || ''}
                  onChange={(v) => filterActions.setTeacherId(v || null)}
                  options={teachers.map((tc) => ({ value: tc.staffId, label: getStaffDisplayName(tc) }))}
                  buttonClassName="border-[rgb(var(--border-primary)/0.35)]"
                />
                <Select
                  size="sm"
                  className="w-full"
                  clearable
                  leadingIcon={<Calendar className="h-4 w-4" />}
                  placeholder={t('classrooms.toolbar.year')}
                  value={filters.academicYearId || ''}
                  onChange={(v) => filterActions.setAcademicYearId(v || null)}
                  options={(academicYears || []).map((y) => ({
                    value: y.yearId,
                    label: `${y.name}${y.isCurrent ? ` (${t('common.current')})` : ''}`,
                  }))}
                  buttonClassName="border-[rgb(var(--border-primary)/0.35)]"
                />
              </>
            }
            overflowLabel={t('dataTable.moreFilters')}
            overflowClearLabel={t('dataTable.clearFilters')}
            overflowActiveCount={(filters.teacherId ? 1 : 0) + (filters.academicYearId ? 1 : 0)}
            onOverflowClear={() => {
              filterActions.setTeacherId(null)
              filterActions.setAcademicYearId(null)
            }}
            toolbarExtra={
              <>
                <SegmentedControl
                  aria-label={t('classrooms.toolbar.viewToggle')}
                  value={viewMode === 'grid' ? 'cards' : 'table'}
                  onChange={(v) => setViewMode(v === 'cards' ? 'grid' : 'list')}
                  tabs={[
                    {
                      id: 'cards',
                      label: (
                        <>
                          <LayoutGrid aria-hidden="true" className="h-4 w-4" />
                          <span className="sr-only">{t('classrooms.actions.gridView')}</span>
                        </>
                      ),
                    },
                    {
                      id: 'table',
                      label: (
                        <>
                          <List aria-hidden="true" className="h-4 w-4" />
                          <span className="sr-only">{t('classrooms.actions.listView')}</span>
                        </>
                      ),
                    },
                  ]}
                />
                <button
                  type="button"
                  onClick={handleExport}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[rgb(var(--border-primary)/0.35)] px-3 text-sm font-medium text-[rgb(var(--text-secondary))] transition-colors hover:bg-[rgb(var(--background-tertiary))]"
                >
                  <Download className="h-4 w-4" />
                  {t('classrooms.toolbar.export')}
                </button>
              </>
            }
            bulkBar={selectionBar}
            bulkActive={selectedSections.length > 0}
          />
        </div>

        {/* Body — connects to the toolbar above (shared bordered container) */}
        {viewMode === 'grid' ? (
          <div className="rounded-b-xl border border-t-0 border-[rgb(var(--border-primary)/0.5)] p-4">
            <ClassroomCardGrid
              sections={sections}
              isLoading={isLoading}
              hasMore={hasNextPage}
              isFetchingMore={isFetchingNextPage}
              subjectAreaMap={subjectAreaMap}
              onLoadMore={() => fetchNextPage()}
              onNavigate={(id) => navigate({ to: `/classrooms/${id}` })}
              onEdit={schedPerms.edit ? (id) => navigate({ to: `/classrooms/${id}/edit` }) : undefined}
              onToggleActive={schedPerms.edit ? handleToggleActive : undefined}
            />
          </div>
        ) : (
          /* Selection morph lives in the page-level standalone toolbar above
             (the table's internal toolbar is suppressed, so a selectionBar
             passed here would never render). */
          <SectionTable
            sections={sections}
            isLoading={isLoading}
            hideToolbar
            className="!rounded-t-none !border-t-0"
            onViewSection={handleNavigateToDetail}
            onEditSection={schedPerms.edit ? handleNavigateToEdit : undefined}
            onToggleActive={schedPerms.edit ? handleToggleActive : undefined}
            onViewRoster={handleNavigateToDetail}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
          />
        )}
      </div>

      {/* Bulk activate / deactivate modal (#224) */}
      <BulkSectionStatusModal
        open={!!bulkStatusTarget}
        sections={bulkStatusTarget?.rows ?? []}
        targetActive={bulkStatusTarget?.targetActive ?? true}
        schoolId={schoolId}
        onClose={() => setBulkStatusTarget(null)}
        onComplete={() => setRowSelection({})}
      />
    </div>
  )
}

// ============================================================================
// GRADEBOOK TAB (Grade Analytics + Grade Recording)
// ============================================================================

function GradebookTab() {
  const schoolId = useActiveSchoolId() || ''
  const navigate = useNavigate()
  const { t } = useAcademicsI18n()
  const gradePerms = useResourcePermissions('grades')
  // Gradebook views: launchpad (no section entered) → section grid → analytics
  // (school-wide, opens in place of the grid). `gbEntered` gates launchpad↔grid;
  // `showAnalytics` swaps in the analytics view over either.
  const [gbEntered, setGbEntered] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [lastSectionId, setLastSectionId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('edf-cr-lastsec')
    } catch {
      return null
    }
  })

  // --- Grade Analytics data ---
  const { data: currentYear } = useCurrentAcademicYear(schoolId)
  const { data: policies } = useGradingPolicies(schoolId)
  const defaultPolicy = useMemo(() => policies?.find((p) => p.isDefault), [policies])

  // --- Gradebook data ---
  const selectedSectionId = useGradesStore((s) => s.selectedSectionId)
  const setSelectedSectionId = useGradesStore((s) => s.setSelectedSectionId)
  const selectedTermId = useGradesStore((s) => s.selectedTermId)
  const setSelectedTermId = useGradesStore((s) => s.setSelectedTermId)

  const [showBulkModal, setShowBulkModal] = useState(false)
  const [showFinalize, setShowFinalize] = useState(false)
  const [showAssignmentEditor, setShowAssignmentEditor] = useState(false)

  const { data: gradingPeriods } = useGradingPeriods(schoolId, currentYear?.yearId || '', !!currentYear?.yearId)
  const hasGradingPeriods = !!gradingPeriods && gradingPeriods.length > 0

  useEffect(() => {
    if (!hasGradingPeriods && currentYear?.yearId && !selectedTermId) {
      setSelectedTermId(currentYear.yearId)
    }
  }, [hasGradingPeriods, currentYear?.yearId, selectedTermId, setSelectedTermId])

  const effectiveTermId = selectedTermId || (hasGradingPeriods ? null : currentYear?.yearId) || null

  const { data: sectionsData, isLoading: sectionsLoading } = useSections({
    schoolId,
    filters: { isActive: true, academicYearId: currentYear?.yearId },
    enabled: !!schoolId,
  })
  const sections = useMemo(() => flattenSectionPages(sectionsData), [sectionsData])

  // Enter a section's gradebook grid (from the launchpad or the switcher);
  // persists the id so Attendance stays in sync + the launchpad can resume it.
  const enterSection = useCallback(
    (id: string) => {
      setSelectedSectionId(id)
      setLastSectionId(id)
      setShowAnalytics(false)
      setGbEntered(true)
      try {
        localStorage.setItem('edf-cr-lastsec', id)
      } catch {
        /* ignore */
      }
    },
    [setSelectedSectionId],
  )

  // Back to the launchpad — keep the section selected so Attendance keeps it.
  const backToLaunchpad = useCallback(() => {
    setGbEntered(false)
    setShowAnalytics(false)
  }, [])

  const { data: gradebook, isLoading: gradesLoading } = useSectionGrades(
    selectedSectionId || '',
    { schoolId, termId: effectiveTermId || undefined },
    !!selectedSectionId && !!schoolId
  )

  const { data: roster } = useSectionRoster({
    sectionId: selectedSectionId || '',
    schoolId,
    enabled: !!selectedSectionId && !!schoolId,
  })

  const policyCategories = useMemo(
    () => defaultPolicy?.categoryWeights?.map((c) => ({ id: c.categoryId, label: c.categoryName })) ?? [],
    [defaultPolicy]
  )
  const hasNoPolicies = policies !== undefined && policies.length === 0
  const hasNoDefaultPolicy = policies !== undefined && policies.length > 0 && !defaultPolicy

  const selectedSection = sections.find((s) => s.sectionId === selectedSectionId)
  const hasAllFinalized = useMemo(() => {
    const grades = gradebook?.grades ?? []
    return grades.length > 0 && grades.every((g) => g.isFinal)
  }, [gradebook])

  // "% graded · avg" chip for the section-context sub-header.
  const gradedStats = useMemo(() => {
    const grades = gradebook?.grades ?? []
    const rosterCount = roster?.students?.length ?? 0
    if (grades.length === 0 || rosterCount === 0) return null
    return {
      pct: Math.round((grades.length / rosterCount) * 100),
      avg: Math.round(grades.reduce((sum, g) => sum + g.numericGrade, 0) / grades.length),
    }
  }, [gradebook, roster])

  const handleViewReportCard = useCallback(
    (studentId: string, studentName: string) => {
      navigate({ to: '/classrooms/report-card', search: { studentId, studentName } })
    },
    [navigate]
  )

  if (!currentYear?.yearId) {
    return <NoCurrentAcademicYearEmptyState />
  }

  // Grade Analytics — school-wide; opens in place of the grid/launchpad.
  if (showAnalytics) {
    return (
      <GradeOverview
        schoolId={schoolId}
        academicYearId={currentYear.yearId}
        policyWeights={defaultPolicy?.categoryWeights}
        onBack={() => setShowAnalytics(false)}
      />
    )
  }

  // Launchpad — the default landing when no section is open.
  if (!gbEntered || !selectedSectionId) {
    if (!sectionsLoading && sections.length === 0) {
      return (
        <div className="bg-surface-secondary rounded-xl border border-border-secondary p-12 text-center">
          <GraduationCap className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
          <h4 className="text-lg font-medium text-text-primary mb-2">
            {t('classrooms.gradebook.launchpad.noSectionsTitle')}
          </h4>
          <p className="text-text-secondary max-w-md mx-auto">{t('classrooms.empty.noSectionsAssigned')}</p>
        </div>
      )
    }
    return (
      <GradebookLaunchpad
        sections={sections}
        schoolId={schoolId}
        termId={effectiveTermId || undefined}
        lastSectionId={lastSectionId}
        onEnterSection={enterSection}
        onOpenAnalytics={() => setShowAnalytics(true)}
      />
    )
  }

  // Section grid view — section-context sub-header + grid + modals.
  return (
    <div className="space-y-5">
      {/* Section-context sub-header */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={backToLaunchpad}
          className="inline-flex items-center gap-1 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          {t('classrooms.gradebook.launchpad.backToSections')}
        </button>
        <div className="w-px h-6 bg-border-primary/30" />
        <Select
          className="min-w-64"
          value={selectedSectionId ?? ''}
          onChange={(v) => v && enterSection(v)}
          placeholder={t('classrooms.gradebook.selectSection')}
          options={sections.map((s) => ({
            value: s.sectionId,
            label: `${s.courseName || s.courseCode || t('classrooms.gradebook.sectionFallback')} - ${s.sectionNumber}`,
          }))}
        />

        {gradingPeriods && gradingPeriods.length > 0 && (
          <Select
            className="min-w-48"
            value={selectedTermId ?? ''}
            onChange={(v) => setSelectedTermId(v || null)}
            placeholder={t('classrooms.gradebook.selectGradingPeriod')}
            options={gradingPeriods.map((gp) => ({
              value: gp.termId ?? gp.periodId ?? '',
              label: gp.name,
            }))}
          />
        )}

        {gradedStats && (
          <span className="inline-flex h-7 items-center rounded-full bg-[rgb(var(--state-warning-bg)/0.4)] px-2.5 text-xs font-medium text-[rgb(var(--state-warning-fg))]">
            {t('classrooms.gradebook.gradedChip', { pct: gradedStats.pct, avg: gradedStats.avg })}
          </span>
        )}

        <div className="ms-auto flex items-center gap-2">
          {hasGradingPeriods && !selectedTermId && (
            <span className="text-xs text-caramel-300">{t('classrooms.gradebook.selectGradingPeriodPrompt')}</span>
          )}
          {gradePerms.create && (
            <Button size="sm" onClick={() => setShowBulkModal(true)} disabled={!effectiveTermId || !currentYear?.yearId}>
              <Plus className="w-3.5 h-3.5" />
              {t('classrooms.actions.record')}
            </Button>
          )}
          {gradePerms.edit && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowFinalize(true)}
              disabled={!effectiveTermId || !currentYear?.yearId}
            >
              <Lock className="w-3.5 h-3.5" />
              {t('classrooms.actions.finalize')}
            </Button>
          )}
          <button
            type="button"
            onClick={() => setShowAnalytics(true)}
            className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            {t('classrooms.actions.gradeAnalytics')}
          </button>
        </div>
      </div>

      {/* Warnings */}
      {hasNoPolicies && selectedSectionId && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-caramel-50/40 dark:bg-caramel-500/8 border border-caramel-300/25 dark:border-caramel-400/15">
          <AlertTriangle className="w-6 h-6 text-golden-400 flex-shrink-0" />
          <div>
            <p className="text-sm text-text-primary font-medium">{t('classrooms.gradebook.noPolicyTitle')}</p>
            <p className="text-xs text-text-secondary mt-0.5">
              {t('classrooms.gradebook.noPolicyDescription')}
            </p>
          </div>
        </div>
      )}
      {hasNoDefaultPolicy && selectedSectionId && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[rgb(var(--state-info-bg)/0.18)]/30 dark:bg-[rgb(var(--state-info-fg))]/8 border border-[rgb(var(--state-info-border)/0.30)] ">
          <AlertTriangle className="w-5 h-5 text-[rgb(var(--state-info-fg))] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-text-primary font-medium">{t('classrooms.gradebook.noDefaultPolicyTitle')}</p>
            <p className="text-xs text-text-secondary mt-0.5">
              {t('classrooms.gradebook.noDefaultPolicyDescription', { count: policies?.length ?? 0 })}
            </p>
          </div>
        </div>
      )}

      {/* Gradebook grid (roster always renders — empty-section state lives in GradebookGrid) */}
      <GradebookGrid
        grades={gradebook?.grades ?? []}
        roster={roster?.students ?? []}
        isLoading={gradesLoading}
        sectionId={selectedSectionId}
        courseId={selectedSection?.courseId}
        courseName={selectedSection?.courseName}
        schoolId={schoolId}
        termId={effectiveTermId || ''}
        academicYearId={currentYear?.yearId}
        teacherId={selectedSection?.primaryTeacherId}
        disabled={hasAllFinalized || !effectiveTermId || !gradePerms.edit}
        onAddAssignment={gradePerms.create && effectiveTermId ? () => setShowAssignmentEditor(true) : undefined}
        onViewReportCard={handleViewReportCard}
      />

      {/* Modals */}
      {showBulkModal && selectedSectionId && selectedSection && selectedSection.courseId && effectiveTermId && currentYear?.yearId && (
        <BulkGradeModal
          open={showBulkModal}
          onClose={() => setShowBulkModal(false)}
          students={roster?.students ?? []}
          sectionId={selectedSectionId}
          courseId={selectedSection.courseId}
          courseName={selectedSection.courseName}
          schoolId={schoolId}
          termId={effectiveTermId}
          academicYearId={currentYear.yearId}
          teacherId={selectedSection.primaryTeacherId}
          categories={policyCategories}
        />
      )}
      {showAssignmentEditor && selectedSectionId && selectedSection && selectedSection.courseId && effectiveTermId && currentYear?.yearId && (
        <AssignmentEditor
          onClose={() => setShowAssignmentEditor(false)}
          sectionId={selectedSectionId}
          courseId={selectedSection.courseId}
          schoolId={schoolId}
          termId={effectiveTermId}
          academicYearId={currentYear.yearId}
          teacherId={selectedSection.primaryTeacherId}
          students={roster?.students ?? []}
          categories={policyCategories}
        />
      )}
      {showFinalize && selectedSectionId && effectiveTermId && (
        <FinalizationWizard
          open={showFinalize}
          onClose={() => setShowFinalize(false)}
          sectionId={selectedSectionId}
          schoolId={schoolId}
          termId={effectiveTermId}
        />
      )}
    </div>
  )
}

// ============================================================================
// ATTENDANCE BOARD TAB — direct import (React.lazy conflicts with Module Federation)
// ============================================================================

import { AttendanceModule } from '../attendance/index'

// ============================================================================
// CLASSROOMS MODULE (main export)
// ============================================================================

export function ClassroomsModule() {
  const navigate = useNavigate()
  const schedPerms = useResourcePermissions('scheduling')
  const schoolId = useActiveSchoolId() || ''
  const { t, formatNumber } = useAcademicsI18n()

  // Lightweight section count for tab badge
  const { data: sectionPages } = useSections({ schoolId, enabled: !!schoolId, limit: 1 })
  const sectionCount = getSectionTotalFromPages(sectionPages)

  // Tab state from URL search params (type-safe via validateSearch)
  const search = useSearch({ strict: false }) as { tab?: string }
  const rawTab = search?.tab || 'overview'
  const activeTab: ClassroomTabId = VALID_TABS.has(rawTab) ? (rawTab as ClassroomTabId) : 'overview'

  const setActiveTab = useCallback(
    (tab: ClassroomTabId) => {
      navigate({ search: { tab } as any, replace: true })
    },
    [navigate]
  )

  // ── ⑧ Attention Corner signals — page-scoped, spanning all four tabs.
  // Derived from queries the tabs already run (identical react-query keys, so
  // no duplicate fetches once a tab is open): the active-sections list
  // (capacity signals) and today's attendance overview (recording coverage —
  // recording attendance in the drawer invalidates the key, which refetches
  // and auto-resolves the signal live).
  const { acked, ack, unack } = useSignalAcks()
  const { data: currentYear } = useCurrentAcademicYear(schoolId)
  const { data: allSectionPages } = useSections({
    schoolId,
    filters: { isActive: true, academicYearId: currentYear?.yearId },
    enabled: !!schoolId && !!currentYear?.yearId,
  })
  const activeSections = useMemo(() => flattenSectionPages(allSectionPages), [allSectionPages])
  const today = useMemo(() => new Date().toISOString().split('T')[0], [])
  const { data: attnOverview } = useAttendanceOverview({
    schoolId,
    academicYearId: currentYear?.yearId ?? '',
    date: today,
    enabled: !!schoolId && !!currentYear?.yearId,
  })

  const signals: Signal[] = useMemo(() => {
    const list: Signal[] = []
    const atCapacity = activeSections.filter(
      (s) => s.maxEnrollment > 0 && s.currentEnrollment >= s.maxEnrollment,
    ).length
    const lowUtil = activeSections.filter(
      (s) => s.maxEnrollment > 0 && s.currentEnrollment / s.maxEnrollment < 0.4,
    ).length
    const unrecorded = attnOverview?.sectionCompletion
      ? Math.max(
          0,
          attnOverview.sectionCompletion.totalSections -
            attnOverview.sectionCompletion.sectionsWithAttendance,
        )
      : 0
    if (atCapacity > 0) {
      list.push({
        id: 'classrooms.at-capacity',
        severity: 'critical',
        domain: t('moduleOverview.signals.domains.capacity'),
        icon: <Building2 className="h-4 w-4" aria-hidden="true" />,
        title: t('classrooms.signals.atCapacityTitle', { count: formatNumber(atCapacity) }),
        description: t('classrooms.signals.atCapacitySub'),
        fix: { label: t('classrooms.signals.reviewSections'), onAction: () => setActiveTab('overview') },
      })
    }
    if (lowUtil > 0) {
      list.push({
        id: 'classrooms.low-utilization',
        severity: 'warn',
        domain: t('moduleOverview.signals.domains.capacity'),
        icon: <Gauge className="h-4 w-4" aria-hidden="true" />,
        title: t('classrooms.signals.lowUtilTitle', { count: formatNumber(lowUtil) }),
        description: t('classrooms.signals.lowUtilSub'),
        fix: { label: t('classrooms.signals.reviewSections'), onAction: () => setActiveTab('overview') },
      })
    }
    if (unrecorded > 0) {
      list.push({
        id: 'classrooms.attendance-unrecorded',
        severity: 'info',
        domain: t('moduleOverview.signals.domains.attendance'),
        icon: <ClipboardCheck className="h-4 w-4" aria-hidden="true" />,
        title: t('classrooms.signals.unrecordedTitle', { count: formatNumber(unrecorded) }),
        description: t('classrooms.signals.unrecordedSub', {
          done: formatNumber(attnOverview?.sectionCompletion?.sectionsWithAttendance ?? 0),
          total: formatNumber(attnOverview?.sectionCompletion?.totalSections ?? 0),
        }),
        fix: { label: t('classrooms.actions.openAttendance'), onAction: () => setActiveTab('attendance') },
      })
    }
    return list
  }, [activeSections, attnOverview, t, formatNumber, setActiveTab])

  // Canonical tab bar (icon + label + count). Label is a ReactNode so the
  // per-tab AnimatedIcon rides inside it; the `?tab=` URL stays the source of truth.
  const tabItems = TABS.map((tab) => ({
    id: tab.id,
    label: (
      <span className="inline-flex items-center gap-1.5">
        <AnimatedIcon
          name={TAB_SIGNATURE[tab.id]}
          icon={tab.icon}
          size={16}
          applyAccent={false}
          className={activeTab === tab.id ? 'opacity-100' : 'opacity-70'}
        />
        {t(tab.labelKey)}
      </span>
    ),
    count: tab.id === 'overview' ? sectionCount : undefined,
  }))
  const activeTabLabel = t(TABS.find((x) => x.id === activeTab)?.labelKey ?? 'classrooms.tabs.overview')

  return (
    <div className="min-h-full bg-[rgb(var(--background-primary))]">
      {/* Screen-reader page heading (breadcrumb names the page visually) */}
      <h1 className="sr-only">{t('classrooms.pageTitle')}</h1>

      {/* ⑧ Header zone: pagebar (attention pill left · actions right) + shade
          above the tab strip — signals span all four tabs */}
      <div className="border-b border-[rgb(var(--border-primary)/0.35)] bg-[rgb(var(--background-secondary))] px-6 pt-4">
        <AttentionCorner
          signals={signals}
          acked={acked}
          onAck={ack}
          onUnack={unack}
          labels={{
            needAttention: t('moduleOverview.signals.needAttention'),
            allClear: t('moduleOverview.signals.allClear'),
            region: t('moduleOverview.needsAttention.title'),
            minimize: t('moduleOverview.signals.minimize'),
            acknowledge: t('moduleOverview.signals.acknowledge'),
            acknowledged: t('moduleOverview.signals.acknowledged'),
            acknowledgedHint: t('moduleOverview.signals.acknowledgedHint'),
            dismiss: t('moduleOverview.signals.dismiss'),
            emptyTitle: t('moduleOverview.signals.emptyTitle'),
          }}
        >
          <PageHeader
            mode="pagebar"
            attention={<AttentionCornerPill />}
            actions={
              schedPerms.create
                ? [
                    {
                      label: t('classrooms.actions.newClassroom'),
                      icon: <Plus className="h-3.5 w-3.5" />,
                      primary: true,
                      onClick: () => navigate({ to: '/classrooms/create' }),
                    },
                  ]
                : undefined
            }
          />
          <AttentionCornerShade className="pt-3" />
        </AttentionCorner>
        <Tabs
          className="mt-4"
          variant="line"
          value={activeTab}
          onChange={(v) => setActiveTab(v as ClassroomTabId)}
          tabs={tabItems}
          aria-label={t('classrooms.aria.tabs')}
        />
      </div>

      {/* Tab Content — error-bounded */}
      <div className="p-6 min-h-128" role="tabpanel" aria-label={activeTabLabel}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'overview' && (
              <TabErrorBoundary tabName={t('classrooms.tabs.overview')}>
                <OverviewTab />
              </TabErrorBoundary>
            )}

            {activeTab === 'gradebook' && (
              <TabErrorBoundary tabName={t('classrooms.tabs.gradebook')}>
                <GradebookTab />
              </TabErrorBoundary>
            )}

            {activeTab === 'policies' && (
              <TabErrorBoundary tabName={t('classrooms.tabs.policies')}>
                <GradingPolicyList />
              </TabErrorBoundary>
            )}

            {activeTab === 'attendance' && (
              <TabErrorBoundary tabName={t('classrooms.tabs.attendanceBoard')}>
                <AttendanceModule />
              </TabErrorBoundary>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default ClassroomsModule
