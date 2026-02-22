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
import {
  GraduationCap,
  BookCheck,
  BarChart3,
  Settings,
  Plus,
  Lock,
  AlertTriangle,
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
        to: '/grades/report-card',
        search: { studentId, studentName },
      })
    },
    [navigate]
  )

  return (
    <div className="min-h-full">
      {/* Page Header */}
      <div className="border-b border-border-secondary bg-surface-secondary/50">
        <div className="px-6 py-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
              <GraduationCap className="w-6 h-6 text-amber-600 dark:text-amber-400" />
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
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-teal-500' : 'opacity-70'}`} />
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="grades-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-teal-500 rounded-t-full"
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
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  {/* Selectors */}
                  <div className="flex items-center gap-3">
                    <select
                      value={selectedSectionId ?? ''}
                      onChange={(e) => setSelectedSectionId(e.target.value || null)}
                      disabled={sectionsLoading}
                      className="px-3 py-2.5 bg-surface-secondary border border-border-secondary rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20 min-w-[250px]"
                    >
                      <option value="">Select a section...</option>
                      {sections.map((s) => (
                        <option key={s.sectionId} value={s.sectionId}>
                          {s.courseName || s.courseCode || 'Section'} - {s.sectionNumber}
                        </option>
                      ))}
                    </select>

                    {gradingPeriods && gradingPeriods.length > 0 && (
                      <select
                        value={selectedTermId ?? ''}
                        onChange={(e) => setSelectedTermId(e.target.value || null)}
                        className="px-3 py-2.5 bg-surface-secondary border border-border-secondary rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      >
                        <option value="">Select grading period...</option>
                        {gradingPeriods.map((gp: { periodId: string; name: string }) => (
                          <option key={gp.periodId} value={gp.periodId}>
                            {gp.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Actions — require both section and term */}
                  {selectedSectionId && (
                    <div className="flex items-center gap-2">
                      {hasGradingPeriods && !selectedTermId && (
                        <span className="text-xs text-amber-600 dark:text-amber-400 mr-1">
                          Select a grading period to record grades
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowBulkModal(true)}
                        disabled={!effectiveTermId || !currentYear?.yearId}
                        className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-teal-500 hover:bg-teal-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-4 h-4" />
                        Record Grades
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowFinalize(true)}
                        disabled={!effectiveTermId || !currentYear?.yearId}
                        className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 dark:text-amber-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Lock className="w-4 h-4" />
                        Finalize Grades
                      </button>
                    </div>
                  )}
                </div>

                {/* No Grading Policy Warning */}
                {hasNoPolicies && selectedSectionId && (
                  <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                    <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-text-primary font-medium">No grading policy configured</p>
                      <p className="text-xs text-text-secondary mt-0.5">
                        Grades will use simple averaging without letter grades or category weights.{' '}
                        <button
                          type="button"
                          onClick={() => setActiveTab('policies')}
                          className="text-teal-600 dark:text-teal-400 font-medium hover:underline"
                        >
                          Create a policy
                        </button>
                      </p>
                    </div>
                  </div>
                )}

                {/* No Default Policy Warning */}
                {hasNoDefaultPolicy && selectedSectionId && (
                  <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
                    <AlertTriangle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-text-primary font-medium">No default grading policy set</p>
                      <p className="text-xs text-text-secondary mt-0.5">
                        You have {policies?.length} grading {policies?.length === 1 ? 'policy' : 'policies'}, but none is marked as default.{' '}
                        <button
                          type="button"
                          onClick={() => setActiveTab('policies')}
                          className="text-teal-600 dark:text-teal-400 font-medium hover:underline"
                        >
                          Set a default policy
                        </button>
                      </p>
                    </div>
                  </div>
                )}

                {/* Gradebook Content */}
                {!currentYear?.yearId ? (
                  <div className="bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-200 dark:border-amber-500/20 p-12 text-center">
                    <GraduationCap className="w-12 h-12 mx-auto text-amber-500 mb-4" />
                    <h4 className="text-lg font-medium text-text-primary mb-2">
                      No Academic Year Configured
                    </h4>
                    <p className="text-text-secondary max-w-md mx-auto">
                      Set up an academic year in school settings before recording grades.
                    </p>
                  </div>
                ) : !selectedSectionId ? (
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
                    schoolId={schoolId}
                    termId={effectiveTermId || ''}
                    academicYearId={currentYear?.yearId}
                    teacherId={selectedSection?.primaryTeacherId}
                    disabled={hasAllFinalized || !effectiveTermId}
                    onAddAssignment={effectiveTermId ? () => setShowAssignmentEditor(true) : undefined}
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
