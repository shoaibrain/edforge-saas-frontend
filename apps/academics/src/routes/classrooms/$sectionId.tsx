/**
 * Classroom Detail Page
 *
 * Google Classroom-inspired detail view for a single class section.
 * Tabs: Overview, Classwork, People, Progress (Grades + Attendance merged)
 *
 * All tabs are fully functional.
 */

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useSearch, Outlet } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
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
  LayoutDashboard,
  FileText,
  Plus,
  Lock,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'
import { z } from 'zod'
import { useResourcePermissions } from '@edforge/abac'
import { useSection, useUpdateSection, useSectionRoster } from '../../hooks/useSections'
import { useCourse } from '../../hooks/useCourses'
import { useActiveSchoolId } from '../../stores/app.store'
import { getCapacityPercent } from '../../schemas/section.form'
import { getCoverForSubjectArea } from '../../lib/classroom-covers'
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
import { NoCurrentAcademicYearEmptyState } from '../../components/common'

// --- Section-scoped attendance ---
import { SectionAttendanceWrapper } from '../../components/attendance/SectionAttendanceWrapper'
import { useSectionAttendanceRecords } from '../../hooks/useSectionAttendance'

// --- Overview ---
import { ClassroomOverview } from '../../components/classrooms/overview'

// --- Classwork ---
import { ClassworkFeed } from '../../components/classrooms/classwork'

// ============================================================================
// TYPES
// ============================================================================

type ClassroomDetailTab = 'overview' | 'classwork' | 'people' | 'progress'

const TABS: { id: ClassroomDetailTab; label: string; icon: LucideIcon }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'classwork', label: 'Classwork', icon: FileText },
  { id: 'people', label: 'People', icon: Users },
  { id: 'progress', label: 'Progress', icon: TrendingUp },
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
        aria-label="Section actions"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <MoreHorizontal className="w-5 h-5" aria-hidden="true" />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 z-20 mt-1 w-48 rounded-lg bg-surface-primary border border-border-primary shadow-lg py-1" role="menu" aria-label="Section actions">
            <button
              type="button"
              role="menuitem"
              onClick={() => { setIsOpen(false); onEdit() }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
            >
              <Pencil className="w-4 h-4" aria-hidden="true" />
              Edit Section
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => { setIsOpen(false); window.print() }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
            >
              <Printer className="w-4 h-4" aria-hidden="true" />
              Print Roster
            </button>
            <div className="border-t border-border-secondary my-1" role="separator" />
            <button
              type="button"
              role="menuitem"
              onClick={() => { setIsOpen(false); onToggleActive() }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
            >
              {isActive ? <><ToggleLeft className="w-4 h-4" aria-hidden="true" />Deactivate</> : <><ToggleRight className="w-4 h-4" aria-hidden="true" />Activate</>}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

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
      <NoCurrentAcademicYearEmptyState
        variant="subtle"
        secondaryMessage="Set up an academic year before recording grades."
      />
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
            className="px-3 py-2 bg-surface-secondary border border-border-secondary rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)]"
          >
            <option value="">Select grading period...</option>
            {gradingPeriods.map((gp) => {
              const id = gp.termId ?? gp.periodId ?? ''
              return <option key={id} value={id}>{gp.name}</option>
            })}
          </select>
        )}
        {gradePerms.create && (
          <button
            type="button"
            onClick={() => setShowBulkModal(true)}
            disabled={!effectiveTermId}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[rgb(var(--action-primary-fg))] bg-[rgb(var(--state-info-bg)/0.18)]0 hover:bg-[rgb(var(--action-primary-bg-hover))] rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
// PROGRESS SUB-VIEWS
// ============================================================================

type ProgressView = 'overview' | 'gradebook' | 'attendance'

function ProgressOverview({
  sectionId,
  onNavigate,
}: {
  sectionId: string
  onNavigate: (view: ProgressView) => void
}) {
  const schoolId = useActiveSchoolId() || ''
  const today = useMemo(() => new Date().toISOString().split('T')[0], [])
  const { data: roster } = useSectionRoster({ sectionId, schoolId, enabled: !!schoolId })
  const { data: gradebook } = useSectionGrades(sectionId, { schoolId }, !!schoolId)
  const { data: todayRecords } = useSectionAttendanceRecords({
    sectionId,
    schoolId,
    date: today,
    enabled: !!schoolId && !!sectionId,
  })

  const gradeStats = useMemo(() => {
    const grades = gradebook?.grades ?? []
    if (grades.length === 0) return null
    const scored = grades.filter((g) => g.numericGrade != null)
    const avg =
      scored.length > 0 ? scored.reduce((s, g) => s + (g.numericGrade || 0), 0) / scored.length : 0
    const distribution = { A: 0, B: 0, C: 0, D: 0, F: 0 }
    scored.forEach((g) => {
      const n = g.numericGrade || 0
      if (n >= 90) distribution.A++
      else if (n >= 80) distribution.B++
      else if (n >= 70) distribution.C++
      else if (n >= 60) distribution.D++
      else distribution.F++
    })
    return { avg: Math.round(avg * 10) / 10, total: scored.length, distribution }
  }, [gradebook])

  const attendanceStats = useMemo(() => {
    const total = roster?.students?.length ?? 0
    if (total === 0) return null
    const recorded = todayRecords?.length ?? 0
    const present = todayRecords?.filter((r) => r.status === 'present').length ?? 0
    const absent = todayRecords?.filter((r) => r.status === 'absent').length ?? 0
    const late = todayRecords?.filter((r) => r.status === 'late').length ?? 0
    const remote = todayRecords?.filter((r) => r.status === 'remote').length ?? 0
    const rate = total > 0 ? ((present + late + remote) / total) * 100 : 0
    return { total, recorded, present, absent, late, remote, rate }
  }, [roster, todayRecords])

  const distColors: Record<string, string> = {
    A: 'bg-[rgb(var(--state-success-bg)/0.18)]0',
    B: 'bg-[rgb(var(--state-info-fg))]',
    C: 'bg-[rgb(var(--state-warning-fg))]',
    D: 'bg-[rgb(var(--state-warning-fg))]',
    F: 'bg-[rgb(var(--state-danger-bg)/0.18)]0',
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Grade Summary Card */}
      <div className="bg-surface-primary rounded-xl border border-border-primary p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
            Grades
          </h3>
          <button
            type="button"
            onClick={() => onNavigate('gradebook')}
            className="text-xs text-[rgb(var(--action-secondary-fg))] hover:text-[rgb(var(--action-secondary-fg))] font-medium"
          >
            Open Gradebook &rarr;
          </button>
        </div>
        {gradeStats ? (
          <div className="space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-text-primary">{gradeStats.avg}%</span>
              <span className="text-sm text-text-secondary">class average</span>
            </div>
            <div className="flex gap-0.5 h-2.5 rounded-full overflow-hidden bg-surface-secondary">
              {Object.entries(gradeStats.distribution).map(([letter, count]) => {
                const pct =
                  gradeStats.total > 0 ? (count / gradeStats.total) * 100 : 0
                return pct > 0 ? (
                  <div
                    key={letter}
                    className={`${distColors[letter]} transition-all`}
                    style={{ width: `${pct}%` }}
                    title={`${letter}: ${count}`}
                  />
                ) : null
              })}
            </div>
            <div className="flex gap-4 text-xs">
              {Object.entries(gradeStats.distribution).map(([letter, count]) => (
                <div key={letter} className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${distColors[letter]}`} />
                  <span className="text-text-secondary font-medium">{letter}</span>
                  <span className="text-text-tertiary">{count}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <GraduationCap className="w-8 h-8 mx-auto text-text-tertiary mb-2" aria-hidden="true" />
            <p className="text-sm text-text-secondary">No grades recorded yet</p>
          </div>
        )}
      </div>

      {/* Attendance Summary Card */}
      <div className="bg-surface-primary rounded-xl border border-border-primary p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
            Attendance
          </h3>
          <button
            type="button"
            onClick={() => onNavigate('attendance')}
            className="text-xs text-[rgb(var(--action-secondary-fg))] hover:text-[rgb(var(--action-secondary-fg))] font-medium"
          >
            Open Attendance &rarr;
          </button>
        </div>
        {attendanceStats && attendanceStats.recorded > 0 ? (
          <div className="space-y-3">
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-bold ${
                attendanceStats.rate >= 95 ? 'text-[rgb(var(--state-success-fg))]' :
                attendanceStats.rate >= 90 ? 'text-[rgb(var(--state-warning-fg))]' :
                'text-[rgb(var(--state-danger-fg))]'
              }`}>
                {attendanceStats.rate.toFixed(1)}%
              </span>
              <span className="text-sm text-text-secondary">today&apos;s rate</span>
            </div>

            <div className="flex gap-0.5 h-2.5 rounded-full overflow-hidden bg-surface-secondary">
              {attendanceStats.present > 0 && (
                <div className="bg-[rgb(var(--state-success-bg)/0.18)]0 transition-all" style={{ width: `${(attendanceStats.present / attendanceStats.total) * 100}%` }} title={`Present: ${attendanceStats.present}`} />
              )}
              {attendanceStats.late > 0 && (
                <div className="bg-[rgb(var(--state-warning-fg))] transition-all" style={{ width: `${(attendanceStats.late / attendanceStats.total) * 100}%` }} title={`Late: ${attendanceStats.late}`} />
              )}
              {attendanceStats.remote > 0 && (
                <div className="bg-[rgb(var(--state-info-fg))] transition-all" style={{ width: `${(attendanceStats.remote / attendanceStats.total) * 100}%` }} title={`Remote: ${attendanceStats.remote}`} />
              )}
              {attendanceStats.absent > 0 && (
                <div className="bg-[rgb(var(--state-danger-bg)/0.18)]0 transition-all" style={{ width: `${(attendanceStats.absent / attendanceStats.total) * 100}%` }} title={`Absent: ${attendanceStats.absent}`} />
              )}
            </div>

            <div className="flex flex-wrap gap-4 text-xs">
              {[
                { label: 'Present', value: attendanceStats.present, dot: 'bg-[rgb(var(--state-success-bg)/0.18)]0' },
                { label: 'Late', value: attendanceStats.late, dot: 'bg-[rgb(var(--state-warning-fg))]' },
                { label: 'Remote', value: attendanceStats.remote, dot: 'bg-[rgb(var(--state-info-fg))]' },
                { label: 'Absent', value: attendanceStats.absent, dot: 'bg-[rgb(var(--state-danger-bg)/0.18)]0' },
              ].filter(s => s.value > 0).map((s) => (
                <div key={s.label} className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                  <span className="text-text-secondary font-medium">{s.label}</span>
                  <span className="text-text-tertiary">{s.value}</span>
                </div>
              ))}
            </div>

            <p className="text-xs text-text-tertiary">
              {attendanceStats.recorded} of {attendanceStats.total} students recorded today
            </p>
          </div>
        ) : (
          <div className="text-center py-8">
            <ClipboardCheck className="w-8 h-8 mx-auto text-text-tertiary mb-2" aria-hidden="true" />
            {(roster?.students?.length ?? 0) > 0 ? (
              <>
                <p className="text-sm text-text-secondary">
                  {roster?.students?.length} students enrolled
                </p>
                <p className="text-xs text-text-tertiary mt-1">
                  No attendance recorded for today yet
                </p>
              </>
            ) : (
              <p className="text-sm text-text-secondary">No students enrolled yet</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// PROGRESS TAB (merged Grades + Attendance)
// ============================================================================

function ProgressTab({
  sectionId,
  section,
  activeView,
  onViewChange,
}: {
  sectionId: string
  section: any
  activeView: ProgressView
  onViewChange: (view: ProgressView) => void
}) {
  const views: { id: ProgressView; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'gradebook', label: 'Gradebook' },
    { id: 'attendance', label: 'Attendance' },
  ]

  return (
    <div className="space-y-6">
      {/* Segmented control */}
      <div className="flex items-center gap-1 p-1 bg-surface-secondary rounded-lg w-fit" role="tablist" aria-label="Progress views">
        {views.map((v) => (
          <button
            key={v.id}
            type="button"
            role="tab"
            id={`progress-tab-${v.id}`}
            aria-selected={activeView === v.id}
            aria-controls={`progress-panel-${v.id}`}
            onClick={() => onViewChange(v.id)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeView === v.id
                ? 'bg-surface-primary text-text-primary shadow-sm'
                : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Sub-view content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeView}
          role="tabpanel"
          id={`progress-panel-${activeView}`}
          aria-labelledby={`progress-tab-${activeView}`}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.12 }}
        >
          {activeView === 'overview' && (
            <ProgressOverview sectionId={sectionId} onNavigate={onViewChange} />
          )}
          {activeView === 'gradebook' && (
            <SectionGradesTab sectionId={sectionId} section={section} />
          )}
          {activeView === 'attendance' && (
            <SectionAttendanceWrapper sectionId={sectionId} />
          )}
        </motion.div>
      </AnimatePresence>
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

  // Tab state from URL (with redirects for old tab names)
  const search = useSearch({ strict: false }) as { tab?: string; view?: string }
  const rawTab = search?.tab || 'overview'
  let resolvedTab = rawTab
  if (resolvedTab === 'stream') resolvedTab = 'overview'
  if (resolvedTab === 'grades') resolvedTab = 'progress'
  if (resolvedTab === 'attendance') resolvedTab = 'progress'
  const activeTab: ClassroomDetailTab = VALID_TABS.has(resolvedTab) ? (resolvedTab as ClassroomDetailTab) : 'overview'

  // Progress sub-view from URL
  const progressView = search?.view || 'overview'

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

  // Course fetch for subjectArea fallback (sections created before backfill)
  const { data: course } = useCourse({
    courseId: section?.courseId || '',
    schoolId,
    enabled: !!section && !section.subjectArea && !!schoolId,
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
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[rgb(var(--action-primary-fg))] bg-[rgb(var(--action-primary-bg))] rounded-lg hover:bg-[rgb(var(--action-primary-bg-hover))] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Classrooms
          </button>
        </div>
      </div>
    )
  }

  const percent = getCapacityPercent(section.currentEnrollment, section.maxEnrollment)
  const courseCover = getCoverForSubjectArea(section.subjectArea ?? course?.subjectArea)

  return (
    <div className="min-h-full">
      {/* Cover Image Banner Header — compact full bleed */}
      <div className="relative">
        {/* Cover image */}
        <img
          src={courseCover.src}
          alt={courseCover.alt}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Enhanced gradient overlay for better text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-[rgb(var(--background-overlay)/0.70)] via-[rgb(var(--background-overlay)/0.40)] to-[rgb(var(--background-overlay)/0.20)]" />

        {/* Content (positioned above overlay) */}
        <div className="relative px-4 sm:px-8 pt-5 pb-4">
          {/* Top bar: status + actions */}
          <div className="flex items-center justify-end mb-3">
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                section.isActive
                  ? 'bg-[rgb(var(--background-primary)/0.20)] text-[rgb(var(--action-primary-fg))]'
                  : 'bg-[rgb(var(--background-overlay)/0.20)] text-[rgb(var(--action-primary-fg))]/80'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${section.isActive ? 'bg-[rgb(var(--background-secondary))]' : 'bg-[rgb(var(--background-primary)/0.50)]'}`} />
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

          {/* Title + meta on banner — tighter layout */}
          <h1 className="text-2xl font-bold text-[rgb(var(--action-primary-fg))] drop-shadow-sm">
            {section.sectionName || `Section ${section.sectionNumber}`}
          </h1>
          <p className="text-[rgb(var(--action-primary-fg))]/80 text-sm mt-0.5 drop-shadow-sm">
            {section.courseName}
            {section.courseCode && ` (${section.courseCode})`}
            {' · '}
            {section.primaryTeacherName || 'No teacher assigned'}
          </p>

          {/* Compact inline badges: enrollment + room */}
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[rgb(var(--background-primary)/0.15)] text-[rgb(var(--action-primary-fg))]/90">
              <Users className="w-3 h-3" />
              {section.currentEnrollment}/{section.maxEnrollment} students ({percent}%)
            </span>
            {(section.locationRoomNumber || section.roomNumber) && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[rgb(var(--background-primary)/0.15)] text-[rgb(var(--action-primary-fg))]/90">
                <MapPin className="w-3 h-3" />
                {section.locationRoomNumber || section.roomNumber}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border-secondary bg-surface-secondary/50">
        <div className="px-4 sm:px-8">
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
                  <tab.icon className={`w-4 h-4 ${isActive ? 'text-[rgb(var(--action-secondary-fg))]' : 'opacity-70'}`} />
                  {tab.label}
                  {isActive && (
                    <motion.div
                      layoutId="classroomDetailTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[rgb(var(--state-info-bg)/0.18)]0 rounded-t-full"
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
      <div className="px-4 sm:px-8 py-6 min-h-128" role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
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
                <ClassroomOverview
                  sectionId={sectionId}
                  section={section}
                  onNavigateTab={(tab) => {
                    if (tab.startsWith('progress:')) {
                      const view = tab.split(':')[1]
                      navigate({ search: { tab: 'progress', view } as any, replace: true })
                    } else {
                      setActiveTab(tab as ClassroomDetailTab)
                    }
                  }}
                />
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

            {activeTab === 'progress' && (
              <TabErrorBoundary tabName="Progress">
                <ProgressTab
                  sectionId={sectionId}
                  section={section}
                  activeView={progressView as ProgressView}
                  onViewChange={(view) => navigate({ search: { tab: 'progress', view } as any, replace: true })}
                />
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
