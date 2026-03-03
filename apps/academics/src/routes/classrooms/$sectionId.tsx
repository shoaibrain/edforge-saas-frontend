/**
 * Classroom Detail Page
 *
 * Google Classroom-inspired detail view for a single class section.
 * Tabs: Stream (stub), Classwork (stub), People, Grades, Attendance
 *
 * People, Grades, and Attendance are fully functional using existing components.
 * Stream and Classwork are placeholders until Sprint 4/5.
 */

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useSearch, Outlet } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  BookOpen,
  Users,
  MapPin,
  MoreHorizontal,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Printer,
  AlertCircle,
  ClipboardCheck,
  GraduationCap,
  MessageSquare,
  FileText,
  Plus,
  Lock,
} from 'lucide-react'
import { z } from 'zod'
import { useResourcePermissions } from '@edforge/abac'
import { useSection, useUpdateSection, useSectionRoster } from '../../hooks/useSections'
import { useActiveSchoolId } from '../../stores/app.store'
import { getCapacityPercent } from '../../schemas/section.form'
import { getCoverForCourse } from '../../lib/classroom-covers'
import { SectionRoster } from '../../components/scheduling/SectionRoster'

// --- Grades imports ---
import { useSectionGrades, useGradingPolicies } from '../../hooks/useGrades'
import { useCurrentAcademicYear, useGradingPeriods } from '../../hooks'
import { GradebookGrid } from '../../components/grades/GradebookGrid'
import { BulkGradeModal } from '../../components/grades/BulkGradeModal'
import { FinalizationWizard } from '../../components/grades/FinalizationWizard'
import { AssignmentEditor } from '../../components/grades/AssignmentEditor'

// --- Shared ---
import { TabErrorBoundary } from '../../components/common/TabErrorBoundary'

// --- Section-scoped attendance ---
import { SectionAttendanceWrapper } from '../../components/attendance/SectionAttendanceWrapper'

// --- Stream ---
import { StreamFeed } from '../../components/classrooms/stream'

// --- Classwork ---
import { ClassworkFeed } from '../../components/classrooms/classwork'

// ============================================================================
// TYPES
// ============================================================================

type ClassroomDetailTab = 'stream' | 'classwork' | 'people' | 'grades' | 'attendance'

const TABS: { id: ClassroomDetailTab; label: string; icon: typeof BookOpen }[] = [
  { id: 'stream', label: 'Stream', icon: MessageSquare },
  { id: 'classwork', label: 'Classwork', icon: FileText },
  { id: 'people', label: 'People', icon: Users },
  { id: 'grades', label: 'Grades', icon: GraduationCap },
  { id: 'attendance', label: 'Attendance', icon: ClipboardCheck },
]

const VALID_TABS = new Set<string>(TABS.map((t) => t.id))

// ============================================================================
// LOADING SKELETON
// ============================================================================

function SectionSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-surface-secondary" />
        <div className="space-y-2">
          <div className="h-6 w-48 rounded bg-surface-secondary" />
          <div className="h-4 w-32 rounded bg-surface-secondary" />
        </div>
      </div>
      <div className="h-10 w-64 rounded bg-surface-secondary" />
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 rounded-lg bg-surface-secondary" />
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// ACTIONS DROPDOWN
// ============================================================================

function ActionsDropdown({
  onEdit,
  onToggleActive,
  isActive,
}: {
  onEdit: () => void
  onToggleActive: () => void
  isActive: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-colors"
        aria-label="Actions"
        aria-expanded={isOpen}
      >
        <MoreHorizontal className="w-5 h-5" />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-48 rounded-lg bg-surface-primary border border-border-primary shadow-lg py-1">
            <button
              type="button"
              onClick={() => { setIsOpen(false); onEdit() }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
            >
              <Pencil className="w-4 h-4" />
              Edit Section
            </button>
            <button
              type="button"
              onClick={() => { setIsOpen(false); window.print() }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print Roster
            </button>
            <div className="border-t border-border-secondary my-1" />
            <button
              type="button"
              onClick={() => { setIsOpen(false); onToggleActive() }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
            >
              {isActive ? <><ToggleLeft className="w-4 h-4" />Deactivate</> : <><ToggleRight className="w-4 h-4" />Activate</>}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ============================================================================
// STREAM TAB PLACEHOLDER
// ============================================================================

// ============================================================================
// GRADES TAB (section-scoped)
// ============================================================================

function SectionGradesTab({ sectionId, section }: { sectionId: string; section: any }) {
  const schoolId = useActiveSchoolId() || ''
  const navigate = useNavigate()
  const gradePerms = useResourcePermissions('grades')

  const [selectedTermId, setSelectedTermId] = useState<string | null>(null)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [showFinalize, setShowFinalize] = useState(false)
  const [showAssignmentEditor, setShowAssignmentEditor] = useState(false)

  const { data: currentYear } = useCurrentAcademicYear(schoolId)
  const { data: gradingPeriods } = useGradingPeriods(schoolId, currentYear?.yearId || '', !!currentYear?.yearId)
  const hasGradingPeriods = !!gradingPeriods && gradingPeriods.length > 0

  useEffect(() => {
    if (!hasGradingPeriods && currentYear?.yearId && !selectedTermId) {
      setSelectedTermId(currentYear.yearId)
    }
  }, [hasGradingPeriods, currentYear?.yearId, selectedTermId])

  const effectiveTermId = selectedTermId || (hasGradingPeriods ? null : currentYear?.yearId) || null

  const { data: gradebook, isLoading: gradesLoading } = useSectionGrades(
    sectionId,
    { schoolId, termId: effectiveTermId || undefined },
    !!schoolId
  )

  const { data: roster } = useSectionRoster({ sectionId, schoolId, enabled: !!schoolId })

  const { data: policies } = useGradingPolicies(schoolId)
  const defaultPolicy = useMemo(() => policies?.find((p) => p.isDefault), [policies])
  const policyCategories = useMemo(
    () => defaultPolicy?.categoryWeights?.map((c) => ({ id: c.categoryId, label: c.categoryName })) ?? [],
    [defaultPolicy]
  )

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
      <div className="bg-surface-secondary rounded-xl border border-border-secondary p-12 text-center">
        <GraduationCap className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
        <h4 className="text-lg font-medium text-text-primary mb-2">No Academic Year Configured</h4>
        <p className="text-text-secondary max-w-md mx-auto">Set up an academic year before recording grades.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Term selector + actions */}
      <div className="flex items-center gap-3 flex-wrap">
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
        {gradePerms.create && (
          <button
            type="button"
            onClick={() => setShowBulkModal(true)}
            disabled={!effectiveTermId}
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
            disabled={!effectiveTermId}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-text-secondary border border-border-primary rounded-lg hover:bg-surface-tertiary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Lock className="w-3.5 h-3.5" />
            Finalize
          </button>
        )}
      </div>

      <GradebookGrid
        grades={gradebook?.grades ?? []}
        roster={roster?.students ?? []}
        isLoading={gradesLoading}
        sectionId={sectionId}
        courseId={section?.courseId}
        courseName={section?.courseName}
        schoolId={schoolId}
        termId={effectiveTermId || ''}
        academicYearId={currentYear.yearId}
        teacherId={section?.primaryTeacherId}
        disabled={hasAllFinalized || !effectiveTermId || !gradePerms.edit}
        onAddAssignment={gradePerms.create && effectiveTermId ? () => setShowAssignmentEditor(true) : undefined}
        onViewReportCard={handleViewReportCard}
      />

      {/* Modals */}
      {showBulkModal && effectiveTermId && (
        <BulkGradeModal
          open={showBulkModal}
          onClose={() => setShowBulkModal(false)}
          students={roster?.students ?? []}
          sectionId={sectionId}
          courseId={section?.courseId}
          courseName={section?.courseName}
          schoolId={schoolId}
          termId={effectiveTermId}
          academicYearId={currentYear.yearId}
          teacherId={section?.primaryTeacherId}
          categories={policyCategories}
        />
      )}
      {showAssignmentEditor && effectiveTermId && (
        <AssignmentEditor
          onClose={() => setShowAssignmentEditor(false)}
          sectionId={sectionId}
          courseId={section?.courseId}
          schoolId={schoolId}
          termId={effectiveTermId}
          academicYearId={currentYear.yearId}
          teacherId={section?.primaryTeacherId}
          students={roster?.students ?? []}
          categories={policyCategories}
        />
      )}
      {showFinalize && effectiveTermId && (
        <FinalizationWizard
          open={showFinalize}
          onClose={() => setShowFinalize(false)}
          sectionId={sectionId}
          schoolId={schoolId}
          termId={effectiveTermId}
        />
      )}
    </div>
  )
}

// ============================================================================
// SECTION DETAIL PAGE (main export)
// ============================================================================

export function ClassroomDetailPage() {
  const params = useParams({ strict: false }) as { sectionId?: string }
  const sectionId = params.sectionId || ''
  const navigate = useNavigate()
  const schoolId = useActiveSchoolId() || ''

  // Tab state from URL
  const search = useSearch({ strict: false }) as { tab?: string }
  const rawTab = search?.tab || 'stream'
  const activeTab: ClassroomDetailTab = VALID_TABS.has(rawTab) ? (rawTab as ClassroomDetailTab) : 'stream'

  const setActiveTab = useCallback(
    (tab: ClassroomDetailTab) => {
      navigate({ search: { tab } as any, replace: true })
    },
    [navigate]
  )

  // ABAC
  const schedPerms = useResourcePermissions('scheduling')

  // Validate sectionId
  const isValidId = useMemo(() => {
    try { z.string().uuid().parse(sectionId); return true } catch { return false }
  }, [sectionId])

  const { data: section, isLoading, error } = useSection({
    sectionId,
    schoolId,
    enabled: isValidId && !!schoolId,
  })

  const updateMutation = useUpdateSection()

  const handleToggleActive = async () => {
    if (!section) return
    await updateMutation.mutateAsync({
      sectionId: section.sectionId,
      schoolId,
      data: { isActive: !section.isActive } as any,
    })
  }

  // Loading
  if (isLoading) {
    return <div className="min-h-full p-6"><SectionSkeleton /></div>
  }

  // Not found
  if (!isValidId || error || !section) {
    return (
      <div className="min-h-full flex items-center justify-center p-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
          <h2 className="text-lg font-semibold text-text-primary mb-2">Section Not Found</h2>
          <p className="text-sm text-text-secondary mb-4">
            This section may have been removed or you don't have access.
          </p>
          <button
            type="button"
            onClick={() => navigate({ to: '/classrooms', search: { tab: undefined } })}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-500 rounded-lg hover:bg-teal-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Classrooms
          </button>
        </div>
      </div>
    )
  }

  const percent = getCapacityPercent(section.currentEnrollment, section.maxEnrollment)
  const courseCover = getCoverForCourse(section.courseId)

  return (
    <div className="min-h-full">
      {/* Cover Image Banner Header */}
      <div className="relative">
        {/* Cover image */}
        <img
          src={courseCover.src}
          alt={courseCover.alt}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Content (positioned above overlay) */}
        <div className="relative px-6 py-6">
          {/* Top bar: back + actions */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => navigate({ to: '/classrooms', search: { tab: undefined } })}
              className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Back to classrooms"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                section.isActive
                  ? 'bg-white/20 text-white'
                  : 'bg-black/20 text-white/80'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${section.isActive ? 'bg-white' : 'bg-white/50'}`} />
                {section.isActive ? 'Active' : 'Inactive'}
              </div>
              {schedPerms.edit && (
                <ActionsDropdown
                  onEdit={() => navigate({ to: `/classrooms/${sectionId}/edit` })}
                  onToggleActive={handleToggleActive}
                  isActive={section.isActive}
                />
              )}
            </div>
          </div>

          {/* Title on banner */}
          <div>
            <h1 className="text-2xl font-bold text-white drop-shadow-sm">
              {section.sectionName || `Section ${section.sectionNumber}`}
            </h1>
            <p className="text-white/80 text-sm mt-1 drop-shadow-sm">
              {section.courseName}
              {section.courseCode && ` (${section.courseCode})`}
              {' · '}
              {section.primaryTeacherName || 'No teacher assigned'}
            </p>
          </div>

          {/* Enrollment bar */}
          <div className="mt-4 flex items-center gap-4">
            <div className="flex-1 max-w-xs">
              <div className="flex items-center justify-between text-xs text-white/70 mb-1">
                <span>{section.currentEnrollment} / {section.maxEnrollment} students</span>
                <span>{percent}%</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-white/80 transition-all" style={{ width: `${percent}%` }} />
              </div>
            </div>
            {(section.locationRoomNumber || section.roomNumber) && (
              <div className="flex items-center gap-1.5 text-xs text-white/70">
                <MapPin className="w-3.5 h-3.5" />
                {section.locationRoomNumber || section.roomNumber}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border-secondary bg-surface-secondary/50">
        <div className="px-6">
          <nav className="flex gap-1 overflow-x-auto" aria-label="Classroom tabs" role="tablist">
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
                      layoutId="classroomDetailTab"
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

      {/* Tab Content */}
      <div className="p-6 min-h-[500px]" role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'stream' && (
              <TabErrorBoundary tabName="Stream">
                <StreamFeed sectionId={sectionId} onSwitchTab={(tab) => setActiveTab(tab as ClassroomDetailTab)} />
              </TabErrorBoundary>
            )}

            {activeTab === 'classwork' && (
              <TabErrorBoundary tabName="Classwork">
                <ClassworkFeed sectionId={sectionId} />
              </TabErrorBoundary>
            )}

            {activeTab === 'people' && (
              <TabErrorBoundary tabName="People">
                <SectionRoster section={section} />
              </TabErrorBoundary>
            )}

            {activeTab === 'grades' && (
              <TabErrorBoundary tabName="Grades">
                <SectionGradesTab sectionId={sectionId} section={section} />
              </TabErrorBoundary>
            )}

            {activeTab === 'attendance' && (
              <TabErrorBoundary tabName="Attendance">
                <SectionAttendanceWrapper sectionId={sectionId} />
              </TabErrorBoundary>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Outlet for nested /edit route */}
      <Outlet />
    </div>
  )
}
