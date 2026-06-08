/**
 * Grades & Assessments Module
 *
 * Unified gradebook management with three tabs:
 * - Overview: School-wide grade analytics and at-risk students
 * - Gradebook: Section-based grade viewing, inline editing, and bulk entry
 * - Grading Policies: Policy CRUD management
 */

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { useResourcePermissions } from '@edforge/abac'
import {
  GraduationCap,
  BookCheck,
  BarChart3,
  Settings,
  Plus,
  Lock,
  AlertTriangle,
  Calendar,
  RefreshCw,
} from 'lucide-react'
import { useActiveSchoolId } from '../../stores/app.store'
import { useGradesStore } from '../../stores/grades.store'
import { useSections, flattenSectionPages, useSectionRoster } from '../../hooks'
import { useCurrentAcademicYear, useGradingPeriods } from '../../hooks'
import { useSectionGrades, useGradingPolicies } from '../../hooks/useGrades'
import { GradebookGrid } from '../../components/grades/GradebookGrid'
import { GradingPolicyList } from '../../components/grades/GradingPolicyList'
import { BulkGradeModal } from '../../components/grades/BulkGradeModal'
import { FinalizationWizard } from '../../components/grades/FinalizationWizard'
import { AssignmentEditor } from '../../components/grades/AssignmentEditor'
import { GradeOverview } from './overview'
import { NoCurrentAcademicYearEmptyState } from '../../components/common'

// ============================================================================
// TYPES
// ============================================================================

type GradesTab = 'overview' | 'gradebook' | 'policies'

// ============================================================================
// TAB CONFIG
// ============================================================================

const tabs = [
  { id: 'overview' as const, label: 'Overview', icon: BarChart3 },
  { id: 'gradebook' as const, label: 'Gradebook', icon: BookCheck },
  { id: 'policies' as const, label: 'Grading Policies', icon: Settings },
]

// ============================================================================
// GRADES MODULE
// ============================================================================

export function GradesModule() {
  const [activeTab, setActiveTab] = useState<GradesTab>('overview')
  const navigate = useNavigate()
  const schoolId = useActiveSchoolId() || ''

  // ABAC: check what this user can do with grades
  const gradePerms = useResourcePermissions('grades')
  const selectedSectionId = useGradesStore((s) => s.selectedSectionId)
  const setSelectedSectionId = useGradesStore((s) => s.setSelectedSectionId)
  const selectedTermId = useGradesStore((s) => s.selectedTermId)
  const setSelectedTermId = useGradesStore((s) => s.setSelectedTermId)

  const [showBulkModal, setShowBulkModal] = useState(false)
  const [showFinalize, setShowFinalize] = useState(false)
  const [showAssignmentEditor, setShowAssignmentEditor] = useState(false)

  // Academic year & terms
  const { data: currentYear } = useCurrentAcademicYear(schoolId)
  const { data: gradingPeriods } = useGradingPeriods(
    schoolId,
    currentYear?.yearId || '',
    !!currentYear?.yearId
  )

  // Determine if grading periods are available
  const hasGradingPeriods = !!gradingPeriods && gradingPeriods.length > 0

  // Auto-set term to academic year when no grading periods exist
  useEffect(() => {
    if (!hasGradingPeriods && currentYear?.yearId && !selectedTermId) {
      setSelectedTermId(currentYear.yearId)
    }
  }, [hasGradingPeriods, currentYear?.yearId, selectedTermId, setSelectedTermId])

  // Effective term ID: selected term, or academic year as fallback
  const effectiveTermId = selectedTermId || (hasGradingPeriods ? null : currentYear?.yearId) || null

  // Sections
  const { data: sectionsData, isLoading: sectionsLoading } = useSections({
    schoolId,
    filters: { isActive: true, academicYearId: currentYear?.yearId },
    enabled: !!schoolId,
  })
  const sections = useMemo(() => flattenSectionPages(sectionsData), [sectionsData])

  // Auto-select first section when sections load and nothing is selected
  useEffect(() => {
    if (!selectedSectionId && sections.length > 0 && sections.length <= 5) {
      setSelectedSectionId(sections[0].sectionId)
    }
  }, [sections, selectedSectionId, setSelectedSectionId])

  // Section grades
  const { data: gradebook, isLoading: gradesLoading } = useSectionGrades(
    selectedSectionId || '',
    { schoolId, termId: effectiveTermId || undefined },
    !!selectedSectionId && !!schoolId
  )

  // Section roster (always loaded when section selected)
  const { data: roster } = useSectionRoster({
    sectionId: selectedSectionId || '',
    schoolId,
    enabled: !!selectedSectionId && !!schoolId,
  })

  // Grading policies — fetch to get default policy categories
  const { data: policies } = useGradingPolicies(schoolId)
  const defaultPolicy = useMemo(
    () => policies?.find((p) => p.isDefault),
    [policies]
  )
  const policyCategories = useMemo(
    () => defaultPolicy?.categoryWeights?.map((c) => ({
      id: c.categoryId,
      label: c.categoryName,
    })) ?? [],
    [defaultPolicy]
  )
  const hasNoPolicies = policies !== undefined && policies.length === 0
  const hasNoDefaultPolicy = policies !== undefined && policies.length > 0 && !defaultPolicy

  // Find selected section info
  const selectedSection = sections.find((s) => s.sectionId === selectedSectionId)

  // Check if any grades are finalized (to disable editing)
  const hasAllFinalized = useMemo(() => {
    const grades = gradebook?.grades ?? []
    return grades.length > 0 && grades.every((g) => g.isFinal)
  }, [gradebook])

  const handleViewReportCard = useCallback(
    (studentId: string, studentName: string) => {
      navigate({
        to: '/classrooms/report-card',
        search: { studentId, studentName },
      })
    },
    [navigate]
  )

  // Sprint 1 / Ticket 1.5: page-level gate. All hooks above remain defensive
  // (`!!currentYear?.yearId` guards each query), but downstream UI is
  // meaningless without a current AY — empty section selectors, no term
  // chips, etc. Render the shared empty state instead.
  if (!currentYear?.yearId) {
    return (
      <div className="p-6">
        <NoCurrentAcademicYearEmptyState />
      </div>
    )
  }

  return (
    <div className="min-h-full">
      {/* Page Header */}
      <div className="border-b border-border-secondary bg-surface-secondary/50">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                <GraduationCap className="w-6 h-6 text-[rgb(var(--state-warning-fg))]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text-primary">
                  Grades & Assessments
                </h1>
                <p className="text-text-secondary mt-0.5">
                  Manage gradebook, record grades, and configure grading policies
                </p>
              </div>
            </div>
            {currentYear?.name && (
              <div className="flex items-center gap-4 text-text-tertiary">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="text-xs">{currentYear.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="text-xs">Updated just now</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6">
          <nav className="flex items-center space-x-1 border-b border-border-primary relative" aria-label="Grades tabs" role="tablist">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={activeTab === tab.id}
                aria-controls={`panel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-text-primary'
                    : 'text-text-tertiary hover:text-text-secondary'
                }`}
              >
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-[rgb(var(--action-secondary-fg))]' : 'opacity-70'}`} />
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="grades-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-[rgb(var(--state-info-bg)/0.18)]0 rounded-t-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6 min-h-[500px]" role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {activeTab === 'gradebook' && (
              <div className="space-y-6">
                {/* Section & Term Selectors + Actions */}
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
                      className="px-3 py-2 bg-surface-secondary border border-border-secondary rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)] min-w-[250px]"
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
                      className="px-3 py-2 bg-surface-secondary border border-border-secondary rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)]"
                    >
                      <option value="">Select grading period...</option>
                      {gradingPeriods.map((gp: { periodId: string; name: string }) => (
                        <option key={gp.periodId} value={gp.periodId}>
                          {gp.name}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Actions — adjacent to selectors */}
                  {selectedSectionId && (
                    <>
                      <div className="w-px h-6 bg-border-primary/30" />
                      {hasGradingPeriods && !selectedTermId && (
                        <span className="text-xs text-caramel-300">
                          Select a grading period
                        </span>
                      )}
                      {gradePerms.create && (
                        <button
                          type="button"
                          onClick={() => setShowBulkModal(true)}
                          disabled={!effectiveTermId || !currentYear?.yearId}
                          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-teal-50 bg-[rgb(var(--state-info-bg)/0.18)]0 hover:bg-[rgb(var(--action-primary-bg-hover))] rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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

                {/* No Grading Policy Warning */}
                {hasNoPolicies && selectedSectionId && (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-caramel-50/40 dark:bg-caramel-500/8 border border-caramel-300/25 dark:border-caramel-400/15">
                    <AlertTriangle className="w-6 h-6 text-golden-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-text-primary font-medium">No grading policy configured</p>
                      <p className="text-xs text-text-secondary mt-0.5">
                        Grades will use simple averaging without letter grades or category weights.{' '}
                        <button
                          type="button"
                          onClick={() => setActiveTab('policies')}
                          className="text-golden-400 hover:text-golden-300 font-medium hover:underline transition-colors"
                        >
                          Create a policy
                        </button>
                      </p>
                    </div>
                  </div>
                )}

                {/* No Default Policy Warning */}
                {hasNoDefaultPolicy && selectedSectionId && (
                  <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-cyan-50/30 dark:bg-[rgb(var(--state-info-fg))]/8 border border-cyan-300/25 dark:border-cyan-400/15">
                    <AlertTriangle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-text-primary font-medium">No default grading policy set</p>
                      <p className="text-xs text-text-secondary mt-0.5">
                        You have {policies?.length} grading {policies?.length === 1 ? 'policy' : 'policies'}, but none is marked as default.{' '}
                        <button
                          type="button"
                          onClick={() => setActiveTab('policies')}
                          className="text-cyan-400 hover:text-cyan-300 font-medium hover:underline transition-colors"
                        >
                          Set a default policy
                        </button>
                      </p>
                    </div>
                  </div>
                )}

                {/* Gradebook Content. The earlier function-level
                    `!currentYear?.yearId` guard short-circuits the entire
                    render to <NoCurrentAcademicYearEmptyState/>, so the
                    inline no-AY branch this ternary used to carry was
                    dead code and was removed. */}
                {!selectedSectionId ? (
                  <div className="bg-surface-secondary rounded-xl border border-border-secondary p-12 text-center">
                    <GraduationCap className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
                    <h4 className="text-lg font-medium text-text-primary mb-2">
                      Select a Class Section
                    </h4>
                    <p className="text-text-secondary max-w-md mx-auto">
                      Choose a section from the dropdown to view and manage student grades.
                    </p>
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
                    academicYearId={currentYear.yearId}
                    teacherId={selectedSection?.primaryTeacherId}
                    disabled={hasAllFinalized || !effectiveTermId || !gradePerms.edit}
                    onAddAssignment={gradePerms.create && effectiveTermId ? () => setShowAssignmentEditor(true) : undefined}
                    onViewReportCard={handleViewReportCard}
                  />
                )}
              </div>
            )}

            {activeTab === 'overview' && (
              currentYear?.yearId ? (
                <GradeOverview
                  schoolId={schoolId}
                  academicYearId={currentYear.yearId}
                  policyWeights={defaultPolicy?.categoryWeights}
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-surface-primary rounded-xl border border-border-secondary p-5 animate-pulse">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-surface-hover rounded-lg" />
                        <div className="space-y-2">
                          <div className="h-3 w-16 bg-surface-hover rounded" />
                          <div className="h-6 w-12 bg-surface-hover rounded" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {activeTab === 'policies' && <GradingPolicyList />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bulk Grade Modal — only open when term is available */}
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

      {/* Assignment Editor — only open when term is available */}
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

      {/* Finalization Wizard — only open when term is available */}
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

export default GradesModule
