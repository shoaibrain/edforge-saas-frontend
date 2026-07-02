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
  ChevronDown,
  Download,
  BookOpen,
  Users,
  Calendar,
  LayoutGrid,
  List,
  Send,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  StatBand,
  type StatMetric,
  Button,
  Select,
  ToolbarSearch,
  PageHeader,
  Tabs,
  SegmentedControl,
  TablePresetTabs,
  DataTableMoreFilters,
  type BulkAction,
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
import { useSectionGrades, useGradingPolicies } from '../../hooks/useGrades'
import { GradebookGrid } from '../../components/grades/GradebookGrid'
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
  const { t, formatNumber } = useAcademicsI18n()
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

  const bulkActions = useMemo<BulkAction<SectionResponseDto>[]>(
    () => [
      {
        id: 'activate',
        label: t('classrooms.actions.activate'),
        icon: <ToggleRight className="w-4 h-4" />,
        onRun: (rows) => setBulkStatusTarget({ rows, targetActive: true }),
      },
      {
        id: 'deactivate',
        label: t('classrooms.actions.deactivate'),
        icon: <ToggleLeft className="w-4 h-4" />,
        onRun: (rows) => setBulkStatusTarget({ rows, targetActive: false }),
      },
      {
        id: 'notify',
        label: t('classrooms.actions.sendNotification'),
        icon: <Send className="w-4 h-4" />,
        onRun: (rows) =>
          toast.info(t('classrooms.toast.notifyComingSoon', { count: rows.length })),
      },
    ],
    [t],
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
        {/* Toolbar: one row drives both the card grid and the table */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-t-xl border border-b-0 border-[rgb(var(--border-primary)/0.5)] bg-[rgb(var(--background-secondary))] px-3 py-2.5">
          {/* Search — canonical unified-toolbar field */}
          <ToolbarSearch
            value={search}
            onChange={setSearch}
            placeholder={t('classrooms.toolbar.searchPlaceholder')}
            aria-label={t('classrooms.toolbar.searchPlaceholder')}
          />

          {/* Status presets */}
          <TablePresetTabs
            presets={[
              { value: 'all', label: t('classrooms.toolbar.all') },
              { value: 'active', label: t('common.active') },
              { value: 'inactive', label: t('common.inactive') },
            ]}
            active={activePreset}
            onChange={(v) => filterActions.setIsActive(v === 'all' ? null : v === 'active')}
            ariaLabel={t('classrooms.toolbar.statusPresets')}
          />

          {/* Primary facet: Course (inline) */}
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

          {/* Secondary facets folded into "More filters": Teacher · Year */}
          <DataTableMoreFilters
            label={t('dataTable.moreFilters')}
            clearLabel={t('dataTable.clearFilters')}
            activeCount={(filters.teacherId ? 1 : 0) + (filters.academicYearId ? 1 : 0)}
            onClear={() => {
              filterActions.setTeacherId(null)
              filterActions.setAcademicYearId(null)
            }}
          >
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
          </DataTableMoreFilters>

          {/* Right cluster: icon-only view toggle + export */}
          <div className="ml-auto flex items-center gap-2">
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
          </div>
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
          <SectionTable
            sections={sections}
            isLoading={isLoading}
            hideToolbar
            className="!rounded-t-none !border-t-0"
            onViewSection={handleNavigateToDetail}
            onEditSection={schedPerms.edit ? handleNavigateToEdit : undefined}
            onToggleActive={schedPerms.edit ? handleToggleActive : undefined}
            onViewRoster={handleNavigateToDetail}
            bulkActions={schedPerms.edit ? bulkActions : undefined}
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
  // Default-collapsed: the gradebook grid is the primary surface; analytics is
  // opt-in so the page doesn't open with a tall dashboard pushing the grid below
  // the fold.
  const [analyticsCollapsed, setAnalyticsCollapsed] = useState(true)

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

  useEffect(() => {
    if (!selectedSectionId && sections.length > 0 && sections.length <= 5) {
      setSelectedSectionId(sections[0].sectionId)
    }
  }, [sections, selectedSectionId, setSelectedSectionId])

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

  const handleViewReportCard = useCallback(
    (studentId: string, studentName: string) => {
      navigate({ to: '/classrooms/report-card', search: { studentId, studentName } })
    },
    [navigate]
  )

  if (!currentYear?.yearId) {
    return <NoCurrentAcademicYearEmptyState />
  }

  return (
    <div className="space-y-5">
      {/* Control toolbar: section / term selectors + actions + analytics toggle */}
      <div className="flex items-center gap-3 flex-wrap">
        {!sectionsLoading && sections.length === 0 ? (
          <div className="px-3 py-2 text-sm text-text-tertiary bg-surface-secondary border border-border-secondary rounded-lg min-w-64">
            {t('classrooms.empty.noSectionsAssigned')}
          </div>
        ) : (
          <Select
            className="min-w-64"
            value={selectedSectionId ?? ''}
            onChange={(v) => setSelectedSectionId(v || null)}
            disabled={sectionsLoading}
            placeholder={t('classrooms.gradebook.selectSection')}
            options={sections.map((s) => ({
              value: s.sectionId,
              label: `${s.courseName || s.courseCode || t('classrooms.gradebook.sectionFallback')} - ${s.sectionNumber}`,
            }))}
          />
        )}

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

        {selectedSectionId && (
          <>
            <div className="w-px h-6 bg-border-primary/30" />
            {hasGradingPeriods && !selectedTermId && (
              <span className="text-xs text-caramel-300">{t('classrooms.gradebook.selectGradingPeriodPrompt')}</span>
            )}
            {gradePerms.create && (
              <Button
                size="sm"
                onClick={() => setShowBulkModal(true)}
                disabled={!effectiveTermId || !currentYear?.yearId}
              >
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
          </>
        )}

        {/* Analytics toggle — right-aligned, opt-in */}
        <button
          type="button"
          onClick={() => setAnalyticsCollapsed(!analyticsCollapsed)}
          className="ml-auto flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          aria-expanded={!analyticsCollapsed}
        >
          <BarChart3 className="w-4 h-4" />
          {t('classrooms.actions.gradeAnalytics')}
          <ChevronDown className={`w-4 h-4 transition-transform ${analyticsCollapsed ? '-rotate-90' : ''}`} />
        </button>
      </div>

      {/* Grade Analytics (collapsible, opt-in) */}
      {!analyticsCollapsed && (
        <>
          <GradeOverview
            schoolId={schoolId}
            academicYearId={currentYear.yearId}
            policyWeights={defaultPolicy?.categoryWeights}
          />
          <div className="border-t border-border-secondary" />
        </>
      )}

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

      {/* Gradebook Content */}
      {!selectedSectionId ? (
        <div className="bg-surface-secondary rounded-xl border border-border-secondary p-12 text-center">
          <GraduationCap className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
          <h4 className="text-lg font-medium text-text-primary mb-2">{t('classrooms.empty.selectClassSectionTitle')}</h4>
          <p className="text-text-secondary max-w-md mx-auto">{t('classrooms.empty.selectClassSectionDescription')}</p>
        </div>
      ) : (
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
      )}

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
  const { t, formatDate } = useAcademicsI18n()
  const { data: currentYear } = useCurrentAcademicYear(schoolId)

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

      {/* Page header (pagebar) + canonical tab bar */}
      <div className="border-b border-[rgb(var(--border-primary)/0.35)] bg-[rgb(var(--background-secondary))] px-6 pt-4">
        <PageHeader
          mode="pagebar"
          year={currentYear?.name}
          date={formatDate(new Date(), { weekday: 'long', month: 'short', day: 'numeric' })}
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
