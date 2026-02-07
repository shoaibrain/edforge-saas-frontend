/**
 * Grades & Assessments Module
 *
 * Unified gradebook management with two tabs:
 * - Gradebook: Section-based grade viewing and bulk entry
 * - Grading Policies: Policy CRUD management
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GraduationCap,
  BookCheck,
  Settings,
  Plus,
  Lock,
} from 'lucide-react'
import { useActiveSchoolId } from '../../stores/app.store'
import { useGradesStore } from '../../stores/grades.store'
import { useSections, flattenSectionPages, useSectionRoster } from '../../hooks'
import { useCurrentAcademicYear, useGradingPeriods } from '../../hooks'
import { useSectionGrades } from '../../hooks/useGrades'
import { GradebookGrid } from '../../components/grades/GradebookGrid'
import { GradingPolicyList } from '../../components/grades/GradingPolicyList'
import { BulkGradeModal } from '../../components/grades/BulkGradeModal'
import { FinalizationWizard } from '../../components/grades/FinalizationWizard'

// ============================================================================
// TYPES
// ============================================================================

type GradesTab = 'gradebook' | 'policies'

// ============================================================================
// TAB CONFIG
// ============================================================================

const tabs = [
  { id: 'gradebook' as const, label: 'Gradebook', icon: BookCheck },
  { id: 'policies' as const, label: 'Grading Policies', icon: Settings },
]

// ============================================================================
// GRADES MODULE
// ============================================================================

export function GradesModule() {
  const [activeTab, setActiveTab] = useState<GradesTab>('gradebook')
  const schoolId = useActiveSchoolId() || ''
  const selectedSectionId = useGradesStore((s) => s.selectedSectionId)
  const setSelectedSectionId = useGradesStore((s) => s.setSelectedSectionId)
  const selectedTermId = useGradesStore((s) => s.selectedTermId)
  const setSelectedTermId = useGradesStore((s) => s.setSelectedTermId)

  const [showBulkModal, setShowBulkModal] = useState(false)
  const [showFinalize, setShowFinalize] = useState(false)

  // Academic year & terms
  const { data: currentYear } = useCurrentAcademicYear(schoolId)
  const { data: gradingPeriods } = useGradingPeriods(
    schoolId,
    currentYear?.yearId || '',
    !!currentYear?.yearId
  )

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
    { schoolId, termId: selectedTermId || undefined },
    !!selectedSectionId && !!schoolId
  )

  // Section roster (for bulk grade modal)
  const { data: roster } = useSectionRoster({
    sectionId: selectedSectionId || '',
    schoolId,
    enabled: !!selectedSectionId && !!schoolId && showBulkModal,
  })

  // Find selected section info
  const selectedSection = sections.find((s) => s.sectionId === selectedSectionId)

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
          <nav className="flex items-center space-x-1 border-b border-border-primary relative" aria-label="Grades tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
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
      <div className="p-6 min-h-[500px]">
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
                {/* Section & Term Selectors */}
                <div className="flex items-center gap-4 flex-wrap">
                  <div>
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
                  </div>

                  {gradingPeriods && gradingPeriods.length > 0 && (
                    <div>
                      <select
                        value={selectedTermId ?? ''}
                        onChange={(e) => setSelectedTermId(e.target.value || null)}
                        className="px-3 py-2.5 bg-surface-secondary border border-border-secondary rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      >
                        <option value="">All Terms</option>
                        {gradingPeriods.map((gp: { periodId: string; name: string }) => (
                          <option key={gp.periodId} value={gp.periodId}>
                            {gp.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {selectedSectionId && (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowBulkModal(true)}
                        className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-teal-500 hover:bg-teal-600 rounded-lg transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Record Grades
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowFinalize(true)}
                        className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 dark:text-amber-400 rounded-lg transition-colors"
                      >
                        <Lock className="w-4 h-4" />
                        Finalize Grades
                      </button>
                    </>
                  )}
                </div>

                {/* Gradebook Content */}
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
                    isLoading={gradesLoading}
                  />
                )}
              </div>
            )}

            {activeTab === 'policies' && <GradingPolicyList />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bulk Grade Modal */}
      {showBulkModal && selectedSectionId && selectedSection && (
        <BulkGradeModal
          open={showBulkModal}
          onClose={() => setShowBulkModal(false)}
          students={roster?.students ?? []}
          sectionId={selectedSectionId}
          courseId={selectedSection.courseId}
          schoolId={schoolId}
          termId={selectedTermId || ''}
          academicYearId={currentYear?.yearId || ''}
          teacherId={selectedSection.primaryTeacherId}
        />
      )}

      {/* Finalization Wizard */}
      {showFinalize && selectedSectionId && (
        <FinalizationWizard
          open={showFinalize}
          onClose={() => setShowFinalize(false)}
          sectionId={selectedSectionId}
          schoolId={schoolId}
          termId={selectedTermId || ''}
        />
      )}
    </div>
  )
}

export default GradesModule
