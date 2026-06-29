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
  LayoutGrid,
  List,
  ChevronDown,
  Users,
  Gauge,
  UsersRound,
  Send,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import { toast } from 'sonner'
import type { BulkAction } from '@edforge/ui'
import type { RowSelectionState } from '@tanstack/react-table'
import { useActiveSchoolId } from '../../stores/app.store'

// --- Scheduling (My Classes) imports ---
import { useSectionFilters, useViewMode } from '../../stores/sections.store'
import {
  useSections,
  flattenSectionPages,
  getSectionTotalFromPages,
  useUpdateSection,
  useSectionRoster,
} from '../../hooks/useSections'
import { useCourses, flattenCoursePages } from '../../hooks/useCourses'
import { SectionTable } from '../../components/scheduling/SectionTable'
import { SectionFilters } from '../../components/scheduling/SectionFilters'
import { BulkSectionStatusModal } from '../../components/scheduling/BulkSectionStatusModal'
import type { SectionResponseDto } from '@aibrains/shared-types'
import { ClassroomCardGrid } from '../../components/classrooms/ClassroomCardGrid'

// --- Grades imports ---
import { useGradesStore } from '../../stores/grades.store'
import { useCurrentAcademicYear, useGradingPeriods } from '../../hooks'
import { useSectionGrades, useGradingPolicies, useGradeOverview } from '../../hooks/useGrades'
import { GradebookGrid } from '../../components/grades/GradebookGrid'
import { GradingPolicyList } from '../../components/grades/GradingPolicyList'
import { BulkGradeModal } from '../../components/grades/BulkGradeModal'
import { FinalizationWizard } from '../../components/grades/FinalizationWizard'
import { AssignmentEditor } from '../../components/grades/AssignmentEditor'
import { GradeOverview } from '../grades/overview'

// --- Shared ---
import { TabErrorBoundary } from '../../components/common/TabErrorBoundary'
import { NoCurrentAcademicYearEmptyState } from '../../components/common'
import { StatCard, WidgetErrorBoundaryV2, Button, Select, ContextBar } from '@edforge/ui'
import { AnimatedIcon, type IconName } from '@edforge/ui/motion'
import { useAttendanceOverview } from '../../hooks/useAttendance'
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
// V2 CAPACITY COLOR (for KPI utilization tile)
// ============================================================================

function getUtilizationAccent(utilization: number) {
  if (utilization < 15) return 'rgb(var(--accent-finance))'
  if (utilization <= 33) return 'rgb(var(--accent-attendance))'
  return 'rgb(var(--accent-enrollment))'
}

function getUtilizationAccentTint(utilization: number) {
  if (utilization < 15) return 'rgb(var(--accent-finance)/0.1)'
  if (utilization <= 33) return 'rgb(var(--accent-attendance)/0.1)'
  return 'rgb(var(--accent-enrollment)/0.1)'
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

  // Filters
  const filters = useSectionFilters()

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

  const sections = flattenSectionPages(sectionsData)
  const total = getSectionTotalFromPages(sectionsData)
  const updateMutation = useUpdateSection()

  // Courses lookup for subjectArea fallback (sections created before backfill)
  const { data: coursesData } = useCourses({ schoolId, filters: { isActive: true }, limit: 100, enabled: !!schoolId })
  const subjectAreaMap = useMemo(() => {
    const courses = flattenCoursePages(coursesData)
    return new Map(courses.map((c) => [c.courseId, c.subjectArea]))
  }, [coursesData])

  // Stats
  const stats = useMemo(() => {
    const totalSections = sections.length
    const totalEnrolled = sections.reduce((sum, s) => sum + s.currentEnrollment, 0)
    const totalCapacity = sections.reduce((sum, s) => sum + s.maxEnrollment, 0)
    const utilization = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0
    const uniqueTeachers = new Set(sections.map((s) => s.primaryTeacherId)).size
    return { totalSections, totalEnrolled, utilization, uniqueTeachers }
  }, [sections])

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

  return (
    <div className="space-y-6">
      {/* V2 KPI Tiles */}
      <WidgetErrorBoundaryV2 fallbackMessage={t('classrooms.stats.failedToLoad')}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label={t('classrooms.stats.totalSections')}
            value={formatNumber(total ?? stats.totalSections)}
            icon={LayoutGrid}
            accentColor="rgb(var(--accent-academics)/0.1)"
            iconColor="rgb(var(--accent-academics))"
            barColor="rgb(var(--accent-academics))"
            hint={t('classrooms.stats.activeClassrooms')}
            loading={isLoading}
          />
          <StatCard
            label={t('classrooms.stats.totalStudents')}
            value={formatNumber(stats.totalEnrolled)}
            icon={Users}
            accentColor="rgb(var(--accent-enrollment)/0.1)"
            iconColor="rgb(var(--accent-enrollment))"
            barColor="rgb(var(--accent-enrollment))"
            hint={t('classrooms.stats.acrossAllSections')}
            loading={isLoading}
          />
          <StatCard
            label={t('classrooms.stats.avgUtilization')}
            value={`${formatNumber(stats.utilization)}%`}
            icon={Gauge}
            accentColor={getUtilizationAccentTint(stats.utilization)}
            iconColor={getUtilizationAccent(stats.utilization)}
            barColor={getUtilizationAccent(stats.utilization)}
            hint={t('classrooms.stats.ofSeatCapacity')}
            loading={isLoading}
          />
          <StatCard
            label={t('classrooms.stats.activeTeachers')}
            value={formatNumber(stats.uniqueTeachers)}
            icon={UsersRound}
            accentColor="rgb(var(--accent-reports)/0.1)"
            iconColor="rgb(var(--accent-reports))"
            barColor="rgb(var(--accent-reports))"
            hint={t('classrooms.stats.assignedSections')}
            loading={isLoading}
          />
        </div>
      </WidgetErrorBoundaryV2>

      {/* Filters + View Toggle — single horizontal strip */}
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <SectionFilters schoolId={schoolId} totalResults={total} />
        </div>
        <div className="flex items-center rounded-lg p-0.5 flex-shrink-0 bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-primary)/0.35)]">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-[rgb(var(--accent-academics)/0.12)] text-[rgb(var(--accent-academics-text))]' : 'bg-transparent text-[rgb(var(--text-tertiary))]'}`}
            aria-label={t('classrooms.actions.gridView')}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-[rgb(var(--accent-academics)/0.12)] text-[rgb(var(--accent-academics-text))]' : 'bg-transparent text-[rgb(var(--text-tertiary))]'}`}
            aria-label={t('classrooms.actions.listView')}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid or Table */}
      {viewMode === 'grid' ? (
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
      ) : (
        <SectionTable
          sections={sections}
          isLoading={isLoading}
          onViewSection={handleNavigateToDetail}
          onEditSection={schedPerms.edit ? handleNavigateToEdit : undefined}
          onToggleActive={schedPerms.edit ? handleToggleActive : undefined}
          onViewRoster={handleNavigateToDetail}
          bulkActions={schedPerms.edit ? bulkActions : undefined}
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
        />
      )}

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
// CONTEXT BANNER (CLS-003)
// ============================================================================

function ContextBanner({
  activeTab,
  schoolId,
}: {
  activeTab: ClassroomTabId
  schoolId: string
}) {
  const { t, formatNumber } = useAcademicsI18n()
  // Overview data — from sections
  const { data: sectionsPages } = useSections({
    schoolId,
    filters: { isActive: true },
    enabled: !!schoolId && activeTab === 'overview',
  })
  const overviewSections = useMemo(() => flattenSectionPages(sectionsPages), [sectionsPages])
  const overviewStats = useMemo(() => {
    const total = overviewSections.length
    const students = overviewSections.reduce((s, sec) => s + sec.currentEnrollment, 0)
    const capacity = overviewSections.reduce((s, sec) => s + sec.maxEnrollment, 0)
    const utilization = capacity > 0 ? Math.round((students / capacity) * 100) : 0
    const courses = new Set(overviewSections.map((s) => s.courseId)).size
    return { total, students, utilization, courses }
  }, [overviewSections])

  // Gradebook data
  const { data: currentYear } = useCurrentAcademicYear(schoolId)
  const { data: gradeData } = useGradeOverview(
    schoolId,
    currentYear?.yearId || '',
    !!schoolId && !!currentYear?.yearId && activeTab === 'gradebook'
  )

  // Attendance data
  const today = new Date().toISOString().split('T')[0]
  const { data: attendanceData } = useAttendanceOverview({
    schoolId,
    academicYearId: currentYear?.yearId || '',
    date: today,
    enabled: !!schoolId && !!currentYear?.yearId && activeTab === 'attendance',
  })

  const bannerContent = useMemo(() => {
    if (activeTab === 'overview') {
      return (
        <>
          <em className="not-italic text-[rgb(var(--accent-academics-text))]">{formatNumber(overviewStats.total)} {t('classrooms.context.activeSections')}</em>
          {' '}{t('classrooms.context.across')}{' '}
          <em className="not-italic text-[rgb(var(--accent-academics-text))]">{formatNumber(overviewStats.courses)} {t('classrooms.context.courses')}</em>
          {' '}&mdash;{' '}
          <em className="not-italic text-[rgb(var(--accent-enrollment-text))]">{formatNumber(overviewStats.students)} {t('classrooms.context.studentsEnrolled')}</em>
          , {t('classrooms.context.avgUtilization')}{' '}
          <em className="not-italic text-[rgb(var(--accent-attendance-text))]">{formatNumber(overviewStats.utilization)}%</em>
          .
        </>
      )
    }

    if (activeTab === 'gradebook' && gradeData) {
      const worstCourse = gradeData.coursePerformance.length > 0
        ? [...gradeData.coursePerformance].sort((a, b) => a.avgGrade - b.avgGrade)[0]?.courseName
        : null
      const passingCourses = gradeData.coursePerformance.filter((c) => c.passRate === 100).length
      const completionPct = gradeData.gradingProgress?.completionRate?.toFixed(0) ?? '—'
      return (
        <>
          <em className="not-italic text-[rgb(var(--accent-finance-text))]">{formatNumber(gradeData.atRiskCount)}</em>
          {' '}{t('classrooms.context.studentsAtRisk')}{worstCourse && (
            <> &mdash; {t('classrooms.context.concentratedIn')} <em className="not-italic text-[rgb(var(--accent-finance-text))]">{worstCourse}</em></>
          )}.{' '}
          <em className="not-italic text-[rgb(var(--accent-enrollment-text))]">{formatNumber(passingCourses)} {t('classrooms.context.atFullPassRate')}</em>
          . {t('classrooms.context.grading')}{' '}
          <em className="not-italic text-[rgb(var(--accent-academics-text))]">{completionPct}% {t('classrooms.context.complete')}</em>
          .
        </>
      )
    }

    if (activeTab === 'attendance' && attendanceData) {
      const recorded = attendanceData.todaySummary?.totalRecorded ?? 0
      const totalStudents = attendanceData.todaySummary?.totalStudents ?? 0
      const avg7 = attendanceData.periodAverages?.last7Days?.toFixed(1) ?? '—'
      const avg30 = attendanceData.periodAverages?.last30Days?.toFixed(1) ?? '—'
      const atRiskCount = attendanceData.atRiskStudents?.length ?? 0
      return (
        <>
          <em className="not-italic text-[rgb(var(--accent-academics-text))]">{formatNumber(recorded)} of {formatNumber(totalStudents)} {t('classrooms.card.students')}</em>
          {' '}{t('classrooms.context.recordedToday')}. {t('classrooms.context.sevenDayAverage')}{' '}
          <em className="not-italic text-[rgb(var(--accent-enrollment-text))]">{avg7}%</em>
          {' '}{t('classrooms.context.vsThirtyDay')}{' '}
          <em className="not-italic text-[rgb(var(--accent-attendance-text))]">{avg30}%</em>
          .{atRiskCount > 0 && (
            <>{' '}<em className="not-italic text-[rgb(var(--accent-finance-text))]">{formatNumber(atRiskCount)} {t('classrooms.card.students')}</em> {t('classrooms.context.flaggedBelowAttendance')}.</>
          )}
        </>
      )
    }

    return null
  }, [activeTab, overviewStats, gradeData, attendanceData, t, formatNumber])

  if (!bannerContent) return null

  return (
    <p className="px-6 pb-3 text-2xs text-[rgb(var(--text-tertiary))] leading-normal">
      {bannerContent}
    </p>
  )
}

// ============================================================================
// CLASSROOMS MODULE (main export)
// ============================================================================

export function ClassroomsModule() {
  const navigate = useNavigate()
  const schedPerms = useResourcePermissions('scheduling')
  const schoolId = useActiveSchoolId() || ''
  const { t, formatDate, formatNumber } = useAcademicsI18n()

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

  return (
    <div className="min-h-full bg-[rgb(var(--background-primary))]">
      {/* Page Header */}
      <div className="border-b border-[rgb(var(--border-primary)/0.35)] bg-[rgb(var(--background-secondary))]">
        <div className="px-6 py-4">
          <ContextBar
            divider={false}
            meta={
              <span>
                {formatDate(new Date(), {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            }
            actions={
              schedPerms.create ? (
                <button
                  onClick={() => navigate({ to: '/classrooms/create' })}
                  aria-label={t('classrooms.actions.newClassroom')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-[9px] transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-enrollment)/0.4)] bg-[rgb(var(--action-primary-bg))] text-[rgb(var(--action-primary-fg))]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {t('classrooms.actions.newClassroom')}
                </button>
              ) : undefined
            }
          />
        </div>

        {/* Context Banner (CLS-003) */}
        <ContextBanner activeTab={activeTab} schoolId={schoolId} />

        {/* Tab Navigation */}
        <div className="px-6">
          <nav
            className="flex overflow-x-auto gap-0 border-b border-[rgb(var(--border-primary)/0.35)]"
            aria-label={t('classrooms.aria.tabs')}
            role="tablist"
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id
              const sig = TAB_SIGNATURE[tab.id]
              return (
                <button
                  key={tab.id}
                  role="tab"
                  id={`tab-${tab.id}`}
                  aria-selected={isActive}
                  aria-controls={`panel-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap flex items-center gap-1.5 px-4 py-2.5 text-sm cursor-pointer transition-colors bg-transparent border-b-2 -mb-px ${
                    isActive
                      ? 'font-semibold text-[rgb(var(--accent-academics-text))] border-[rgb(var(--accent-academics))]'
                      : 'font-medium text-[rgb(var(--text-tertiary))] border-transparent hover:text-[rgb(var(--text-secondary))]'
                  }`}
                >
                  {sig ? (
                    <AnimatedIcon
                      name={sig}
                      icon={tab.icon}
                      size={16}
                      className={isActive ? 'opacity-100' : 'opacity-70'}
                    />
                  ) : (
                    <tab.icon className={`w-4 h-4 ${isActive ? 'opacity-100' : 'opacity-70'}`} />
                  )}
                  {t(tab.labelKey)}
                  {tab.id === 'overview' && sectionCount !== undefined && (
                    <span
                      className={`text-2xs font-semibold py-0.5 px-1.5 rounded-md ${
                        isActive
                          ? 'bg-[rgb(var(--accent-academics)/0.12)] text-[rgb(var(--accent-academics-text))]'
                          : 'bg-[rgb(var(--background-tertiary))] text-[rgb(var(--text-tertiary))]'
                      }`}
                    >
                      {formatNumber(sectionCount)}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content — error-bounded */}
      <div className="p-6 min-h-128" role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
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
