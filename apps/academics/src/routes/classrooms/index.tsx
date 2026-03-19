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
} from 'lucide-react'
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
import type { SectionResponseDto } from '@aibrains/shared-types'
import { ClassroomCardGrid } from '../../components/classrooms/ClassroomCardGrid'
import { CreateMenu } from '../../components/classrooms/CreateMenu'

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

// ============================================================================
// TYPES
// ============================================================================

type ClassroomTabId = 'overview' | 'gradebook' | 'policies' | 'attendance'

const TABS: { id: ClassroomTabId; label: string; icon: typeof School }[] = [
  { id: 'overview', label: 'Overview', icon: School },
  { id: 'gradebook', label: 'Gradebook', icon: BookCheck },
  { id: 'policies', label: 'Grading Policies', icon: Settings },
  { id: 'attendance', label: 'Attendance', icon: ClipboardCheck },
]

const VALID_TABS = new Set<string>(TABS.map((t) => t.id))

// ============================================================================
// STATS SUMMARY STRIP (compact single-row)
// ============================================================================

function StatsSummaryStrip({
  stats,
  total,
}: {
  stats: { totalSections: number; totalEnrolled: number; utilization: number; uniqueTeachers: number }
  total: number | undefined
}) {
  const items = [
    { label: 'Total Classes', value: total ?? stats.totalSections, primary: true },
    { label: 'Students', value: stats.totalEnrolled },
    { label: 'Utilization', value: `${stats.utilization}%` },
    { label: 'Teachers', value: stats.uniqueTeachers },
  ]

  return (
    <div className="flex items-center gap-0 bg-surface-primary rounded-xl border border-border-primary overflow-x-auto">
      {items.map((item, i) => (
        <div key={item.label} className="flex items-center">
          {i > 0 && <div className="w-px h-8 bg-border-secondary" />}
          <div className={`px-5 py-3 ${i === 0 ? 'pl-5' : ''}`}>
            <p className="text-xs text-text-tertiary">{item.label}</p>
            <p className={`font-semibold text-text-primary ${item.primary ? 'text-lg' : 'text-base'}`}>
              {item.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// OVERVIEW TAB (class cards / list with stats and filters)
// ============================================================================

function OverviewTab() {
  const schoolId = useActiveSchoolId() || ''
  const navigate = useNavigate()
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
      searchTerm: filters.searchTerm || undefined,
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

  const handleNavigateToDetail = (section: SectionResponseDto) => {
    navigate({ to: `/classrooms/${section.sectionId}` })
  }

  const handleNavigateToEdit = (section: SectionResponseDto) => {
    navigate({ to: `/classrooms/${section.sectionId}/edit` })
  }

  return (
    <div className="space-y-6">
      {/* Stats Summary Strip */}
      <StatsSummaryStrip
        stats={stats}
        total={total}
      />

      {/* Filters + View Toggle */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <SectionFilters schoolId={schoolId} totalResults={total} />
        </div>
        <div className="flex items-center gap-1 bg-surface-secondary rounded-lg p-0.5 flex-shrink-0 self-start">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-surface-primary shadow-sm text-text-primary' : 'text-text-tertiary hover:text-text-secondary'}`}
            aria-label="Grid view"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-surface-primary shadow-sm text-text-primary' : 'text-text-tertiary hover:text-text-secondary'}`}
            aria-label="List view"
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
        />
      )}
    </div>
  )
}

// ============================================================================
// GRADEBOOK TAB (Grade Analytics + Grade Recording)
// ============================================================================

function GradebookTab() {
  const schoolId = useActiveSchoolId() || ''
  const navigate = useNavigate()
  const gradePerms = useResourcePermissions('grades')
  const [analyticsCollapsed, setAnalyticsCollapsed] = useState(false)

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
    return (
      <div className="bg-caramel-50/40 dark:bg-caramel-500/8 rounded-xl border border-caramel-300/25 dark:border-caramel-400/15 p-12 text-center">
        <GraduationCap className="w-12 h-12 mx-auto text-golden-400 mb-4" />
        <h4 className="text-lg font-medium text-text-primary mb-2">No Academic Year Configured</h4>
        <p className="text-text-secondary max-w-md mx-auto">Set up an academic year in school settings before recording grades.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Grade Analytics (collapsible) */}
      <div>
        <button
          type="button"
          onClick={() => setAnalyticsCollapsed(!analyticsCollapsed)}
          className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors mb-3"
        >
          <BarChart3 className="w-4 h-4" />
          Grade Analytics
          <ChevronDown className={`w-4 h-4 transition-transform ${analyticsCollapsed ? '-rotate-90' : ''}`} />
        </button>
        {!analyticsCollapsed && (
          <GradeOverview
            schoolId={schoolId}
            academicYearId={currentYear.yearId}
            policyWeights={defaultPolicy?.categoryWeights}
          />
        )}
      </div>

      {/* Divider */}
      {!analyticsCollapsed && <div className="border-t border-border-secondary" />}

      {/* Section & Term Selectors */}
      <div className="flex items-center gap-3 flex-wrap">
        {!sectionsLoading && sections.length === 0 ? (
          <div className="px-3 py-2 text-sm text-text-tertiary bg-surface-secondary border border-border-secondary rounded-lg min-w-[250px]">
            No sections assigned. Contact your administrator.
          </div>
        ) : (
          <select
            value={selectedSectionId ?? ''}
            onChange={(e) => setSelectedSectionId(e.target.value || null)}
            disabled={sectionsLoading}
            className="px-3 py-2 bg-surface-secondary border border-border-secondary rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20 min-w-[250px]"
          >
            <option value="">Select a section...</option>
            {sections.map((s) => (
              <option key={s.sectionId} value={s.sectionId}>
                {s.courseName || s.courseCode || 'Section'} - {s.sectionNumber}
              </option>
            ))}
          </select>
        )}

        {gradingPeriods && gradingPeriods.length > 0 && (
          <select
            value={selectedTermId ?? ''}
            onChange={(e) => setSelectedTermId(e.target.value || null)}
            className="px-3 py-2 bg-surface-secondary border border-border-secondary rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="">Select grading period...</option>
            {gradingPeriods.map((gp: { periodId: string; name: string }) => (
              <option key={gp.periodId} value={gp.periodId}>{gp.name}</option>
            ))}
          </select>
        )}

        {selectedSectionId && (
          <>
            <div className="w-px h-6 bg-border-primary/30" />
            {hasGradingPeriods && !selectedTermId && (
              <span className="text-xs text-caramel-300">Select a grading period</span>
            )}
            {gradePerms.create && (
              <button
                type="button"
                onClick={() => setShowBulkModal(true)}
                disabled={!effectiveTermId || !currentYear?.yearId}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-teal-50 bg-teal-500 hover:bg-teal-600 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="w-3.5 h-3.5" />
                Record
              </button>
            )}
            {gradePerms.edit && (
              <button
                type="button"
                onClick={() => setShowFinalize(true)}
                disabled={!effectiveTermId || !currentYear?.yearId}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-text-secondary border border-border-primary rounded-lg hover:bg-surface-tertiary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Lock className="w-3.5 h-3.5" />
                Finalize
              </button>
            )}
          </>
        )}
      </div>

      {/* Warnings */}
      {hasNoPolicies && selectedSectionId && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-caramel-50/40 dark:bg-caramel-500/8 border border-caramel-300/25 dark:border-caramel-400/15">
          <AlertTriangle className="w-6 h-6 text-golden-400 flex-shrink-0" />
          <div>
            <p className="text-sm text-text-primary font-medium">No grading policy configured</p>
            <p className="text-xs text-text-secondary mt-0.5">
              Grades will use simple averaging without letter grades or category weights.
            </p>
          </div>
        </div>
      )}
      {hasNoDefaultPolicy && selectedSectionId && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-cyan-50/30 dark:bg-cyan-500/8 border border-cyan-300/25 dark:border-cyan-400/15">
          <AlertTriangle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-text-primary font-medium">No default grading policy set</p>
            <p className="text-xs text-text-secondary mt-0.5">
              You have {policies?.length} grading {policies?.length === 1 ? 'policy' : 'policies'}, but none is marked as default.
            </p>
          </div>
        </div>
      )}

      {/* Gradebook Content */}
      {!selectedSectionId ? (
        <div className="bg-surface-secondary rounded-xl border border-border-secondary p-12 text-center">
          <GraduationCap className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
          <h4 className="text-lg font-medium text-text-primary mb-2">Select a Class Section</h4>
          <p className="text-text-secondary max-w-md mx-auto">Choose a section from the dropdown to view and manage student grades.</p>
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
      {showBulkModal && selectedSectionId && selectedSection && effectiveTermId && currentYear?.yearId && (
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
      {showAssignmentEditor && selectedSectionId && selectedSection && effectiveTermId && currentYear?.yearId && (
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
    <div className="min-h-full">
      {/* Page Header */}
      <div className="border-b border-border-secondary bg-surface-secondary/50">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">
                Classrooms
              </h1>
              <p className="text-sm text-text-secondary mt-0.5">
                Manage your classes, grades, and attendance in one place
              </p>
            </div>
            {schedPerms.create && (
              <CreateMenu onCreateSection={() => navigate({ to: '/classrooms/create' })} />
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6">
          <nav className="flex gap-1 overflow-x-auto" aria-label="Classrooms tabs" role="tablist">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  role="tab"
                  id={`tab-${tab.id}`}
                  aria-selected={isActive}
                  aria-controls={`panel-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'text-text-primary'
                      : 'text-text-tertiary hover:text-text-secondary'
                  }`}
                >
                  <tab.icon className={`w-4 h-4 ${isActive ? 'text-teal-500' : 'opacity-70'}`} />
                  {tab.label}
                  {isActive && (
                    <motion.div
                      layoutId="classroomTab"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-teal-500 rounded-t-full"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content — error-bounded */}
      <div className="p-6 min-h-[500px]" role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'overview' && (
              <TabErrorBoundary tabName="Overview">
                <OverviewTab />
              </TabErrorBoundary>
            )}

            {activeTab === 'gradebook' && (
              <TabErrorBoundary tabName="Gradebook">
                <GradebookTab />
              </TabErrorBoundary>
            )}

            {activeTab === 'policies' && (
              <TabErrorBoundary tabName="Grading Policies">
                <GradingPolicyList />
              </TabErrorBoundary>
            )}

            {activeTab === 'attendance' && (
              <TabErrorBoundary tabName="Attendance Board">
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
