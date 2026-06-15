/**
 * Enrollment Module — V2
 *
 * Two-tab interface with V2 design language:
 * - Registration (primary, default) — New student wizard
 * - Enrollment Records (secondary) — View, search, withdraw, transfer
 *
 * V2 changes:
 * - Tab order reversed: registration first
 * - V2 header with page icon, cancel button, academic year dropdown
 * - Context banner below header
 * - Academic year progress strip in content area
 * - URL tab param support (?tab=new | ?tab=records)
 */

import { useState, useMemo, useCallback } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { useResourcePermissions } from '@edforge/abac'
import { Tabs } from '@edforge/ui'
import {
  UserPlus,
  Download,
  Lock,
  Calendar,
  X,
} from 'lucide-react'
import { useActiveSchoolId } from '../../stores/app.store'
import {
  useEnrollmentStore,
  useEnrollmentFilters,
  useEnrollmentFilterActions,
} from '../../stores/enrollment.store'
import { useCurrentAcademicYear, useAcademicYears } from '../../hooks'
import {
  useEnrollments,
  flattenEnrollmentPages,
  useEnrollmentSummary,
  useMarkNoShow,
  useCloseAcademicYear,
} from '../../hooks/useEnrollments'
import { getEnrollmentExportUrl } from '../../services/academics.service'
import { downloadAuthenticatedFile } from '../../lib/download'
import { toast } from 'sonner'
import { RegistrationWizard } from '../../components/students/registration'
import { EnrollmentDashboard } from '../../components/enrollment/EnrollmentDashboard'
import { EnrollmentTable } from '../../components/enrollment/EnrollmentTable'
import { WithdrawalModal } from '../../components/enrollment/WithdrawalModal'
import { TransferModal } from '../../components/enrollment/TransferModal'
import type { EnrollmentResponseDto } from '../../services/academics.service'

// ============================================================================
// TYPES
// ============================================================================

type EnrollmentTab = 'registration' | 'dashboard'

// ============================================================================
// YEAR PROGRESS BAR (inline)
// ============================================================================

function YearProgressBar({ startDate, endDate }: { startDate: string; endDate: string }) {
  const progress = useMemo(() => {
    const start = new Date(startDate).getTime()
    const end = new Date(endDate).getTime()
    const now = Date.now()
    if (now <= start) return 0
    if (now >= end) return 100
    return Math.round(((now - start) / (end - start)) * 100)
  }, [startDate, endDate])

  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 rounded-full overflow-hidden bg-[rgb(var(--background-tertiary))]">
        <div
          // allow-presentation-style: data-driven progress bar width
          className="h-full rounded-full bg-[rgb(var(--accent-enrollment))]"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-xs text-[rgb(var(--text-tertiary))]">
        {progress}%
      </span>
    </div>
  )
}

// ============================================================================
// ENROLLMENT MODULE
// ============================================================================

export function EnrollmentModule() {
  const navigate = useNavigate()
  // URL-synced active tab (deep-linkable; legacy ?tab=new|records mapped in route)
  const { tab } = useSearch({ from: '/students/enrollment' })
  const activeTab: EnrollmentTab = tab ?? 'registration'
  const setActiveTab = useCallback(
    (next: EnrollmentTab) => {
      navigate({ to: '/students/enrollment', search: { tab: next }, replace: true })
    },
    [navigate],
  )
  const schoolId = useActiveSchoolId() || ''

  // ABAC: check enrollment permissions
  const enrollPerms = useResourcePermissions('enrollment')
  const selectedYearId = useEnrollmentStore((s) => s.selectedYearId)
  const setSelectedYearId = useEnrollmentStore((s) => s.setSelectedYearId)
  const filters = useEnrollmentFilters()
  const filterActions = useEnrollmentFilterActions()

  // Withdrawal / Transfer modals
  const [withdrawTarget, setWithdrawTarget] = useState<EnrollmentResponseDto | null>(null)
  const [transferTarget, setTransferTarget] = useState<EnrollmentResponseDto | null>(null)

  // No-Show & Close Year mutations
  const markNoShowMutation = useMarkNoShow()
  const closeYearMutation = useCloseAcademicYear()

  // Academic years
  const { data: currentYear } = useCurrentAcademicYear(schoolId)
  const { data: academicYears } = useAcademicYears(schoolId)
  const activeYearId = selectedYearId || currentYear?.yearId || ''

  // Resolve the active year object for dashboard context
  const activeYearObj = useMemo(() => {
    if (!academicYears || !activeYearId) return null
    return academicYears.find((y) => y.yearId === activeYearId) ?? null
  }, [academicYears, activeYearId])

  // Enrollments
  const {
    data: enrollmentsData,
    isLoading: enrollmentsLoading,
    hasNextPage,
    fetchNextPage,
  } = useEnrollments({
    schoolId,
    yearId: activeYearId,
    filters: {
      gradeLevel: filters.gradeLevel || undefined,
      status: filters.status || undefined,
    },
    enabled: !!schoolId && !!activeYearId,
  })

  const enrollments = useMemo(
    () => flattenEnrollmentPages(enrollmentsData),
    [enrollmentsData]
  )

  // Summary
  const { data: summary, isLoading: summaryLoading } = useEnrollmentSummary({
    schoolId,
    yearId: activeYearId,
    enabled: !!schoolId && !!activeYearId,
  })

  // Derived stats
  const activeCount = summary?.byStatus?.enrolled ?? summary?.byStatus?.active ?? 0
  const gradeLevelCount = Object.keys(summary?.byGradeLevel || {}).length

  // Handlers
  const handleMarkNoShow = useCallback((enrollment: EnrollmentResponseDto) => {
    const studentName = (enrollment as Record<string, unknown>).studentName || 'this student'
    if (!window.confirm(`Mark ${studentName} as no-show? This will withdraw the enrollment.`)) return
    markNoShowMutation.mutate({
      schoolId,
      yearId: activeYearId,
      studentId: enrollment.studentId,
    })
  }, [schoolId, activeYearId, markNoShowMutation])

  const handleExportCSV = useCallback(async () => {
    if (!schoolId || !activeYearId) return
    try {
      const url = getEnrollmentExportUrl(schoolId, activeYearId)
      await downloadAuthenticatedFile(url, `enrollments-${activeYearId}.csv`)
    } catch (error) {
      console.error('[Export] CSV export failed:', error)
      toast.error('Export Failed', {
        description: error instanceof Error ? error.message : 'Could not download the file.',
      })
    }
  }, [schoolId, activeYearId])

  const handleCloseYear = useCallback(() => {
    if (!activeYearObj) return
    const yearName = activeYearObj.name
    if (!window.confirm(
      `Close all open enrollments for ${yearName}? This will mark all enrolled students as graduated for this year. This action cannot be undone.`
    )) return
    closeYearMutation.mutate({
      schoolId,
      yearId: activeYearId,
      lastDayOfSchool: activeYearObj.endDate,
    })
  }, [schoolId, activeYearId, activeYearObj, closeYearMutation])

  const handleCancelEnrollment = useCallback(() => {
    navigate({ to: '/students' })
  }, [navigate])

  // Tab definitions (registration first)
  const tabItems = useMemo(() => {
    const items: { id: EnrollmentTab; label: string; count?: number }[] = [
      { id: 'registration', label: 'Registration' },
    ]
    items.push({
      id: 'dashboard',
      label: 'Enrollment records',
      count: summary?.totalEnrolled ?? undefined,
    })
    return items
  }, [summary?.totalEnrolled])

  return (
    <div className="min-h-full">
      {/* V2 Page Header */}
      <div className="px-6 py-4 border-b border-[rgb(var(--border-primary)/0.35)] bg-[rgb(var(--background-secondary))]">
        <div className="flex items-center justify-between">
          {/* Left: Icon + Title */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center rounded-lg bg-[rgb(var(--accent-enrollment)/0.1)]" style={{ width: 32, height: 32 }}>
              <UserPlus className="w-4 h-4 text-[rgb(var(--accent-enrollment-text))]" />
            </div>
            <h1 className="font-semibold text-lg tracking-[-0.3px] text-[rgb(var(--text-primary))]">
              Enroll student
            </h1>
          </div>

          {/* Right: Cancel + Year Selector */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancelEnrollment}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-[8px] transition-colors hover:opacity-80 bg-transparent border border-[rgb(var(--border-primary)/0.35)] text-[rgb(var(--text-tertiary))]"
            >
              <X className="w-3 h-3" />
              Cancel enrollment
            </button>

            {activeTab === 'dashboard' && academicYears && academicYears.length > 0 && (
              <>
                <select
                  value={activeYearId}
                  onChange={(e) => setSelectedYearId(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-[8px] focus:outline-none bg-[rgb(var(--background-secondary))] border border-[rgb(var(--border-primary)/0.35)] text-[rgb(var(--text-secondary))]"
                >
                  {academicYears.map((year: { yearId: string; name: string; status: string }) => (
                    <option key={year.yearId} value={year.yearId}>
                      {year.name}{year.status === 'planning' ? ' (Planning)' : year.status === 'completed' ? ' (Completed)' : ''}
                    </option>
                  ))}
                </select>
                {enrollPerms.view && (
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-[8px] transition-colors hover:opacity-80 bg-transparent border border-[rgb(var(--border-primary)/0.35)] text-[rgb(var(--text-tertiary))]"
                    title="Export enrollments as CSV"
                  >
                    <Download className="w-3 h-3" />
                    Export
                  </button>
                )}
                {enrollPerms.edit && activeYearObj?.status === 'completed' && (
                  <button
                    type="button"
                    onClick={handleCloseYear}
                    disabled={closeYearMutation.isPending}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-[8px] transition-colors disabled:opacity-50 bg-[rgb(var(--accent-attendance)/0.08)] border border-[rgb(var(--accent-attendance)/0.2)] text-[rgb(var(--accent-attendance-text))]"
                    title="Close all open enrollments for this year"
                  >
                    <Lock className="w-3 h-3" />
                    {closeYearMutation.isPending ? 'Closing...' : 'Close Year'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Context Banner */}
        {!summaryLoading && (
          <p className="mt-2 text-2xs text-[rgb(var(--text-tertiary))]">
            Registering a new student
            {activeYearObj ? ` · Academic year ${activeYearObj.name}` : ''}
            {summary ? ` · ${summary.totalEnrolled ?? 0} students currently enrolled` : ''}
          </p>
        )}
      </div>

      {/* Tabs — shared @edforge/ui primitive (house standard, accessible) */}
      <div className="px-6 bg-[rgb(var(--background-secondary))]">
        <Tabs
          aria-label="Enrollment tabs"
          value={activeTab}
          onChange={(value) => setActiveTab(value as EnrollmentTab)}
          tabs={tabItems.filter((tab) => tab.id !== 'registration' || enrollPerms.create)}
        />
      </div>

      {/* Tab Content */}
      <div className="p-6 min-h-128">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {activeTab === 'dashboard' && (
              <div className="space-y-4">
                {/* Academic Year Progress Strip */}
                {activeYearObj && (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[10px] px-3.5 py-3 bg-[rgb(var(--background-tertiary)/0.5)] border border-[rgb(var(--border-primary)/0.35)]">
                    <Calendar className="w-3.5 h-3.5 text-[rgb(var(--accent-enrollment-text))]" />
                    <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-[rgb(var(--accent-enrollment)/0.1)] text-[rgb(var(--accent-enrollment-text))]">
                      {activeYearObj.name}
                    </span>
                    <YearProgressBar
                      startDate={activeYearObj.startDate}
                      endDate={activeYearObj.endDate}
                    />
                    <div className="ml-auto flex items-center gap-3 text-xs text-[rgb(var(--text-tertiary))]">
                      <span>
                        <strong className="text-[rgb(var(--text-primary))]">{summary?.totalEnrolled ?? '--'}</strong> enrolled
                      </span>
                      <span>
                        <strong className="text-[rgb(var(--text-primary))]">{activeCount}</strong> active
                      </span>
                      <span>
                        <strong className="text-[rgb(var(--text-primary))]">{gradeLevelCount}</strong> grade levels
                      </span>
                    </div>
                  </div>
                )}

                <EnrollmentDashboard
                  isLoading={summaryLoading}
                  activeYear={activeYearObj}
                />
                <EnrollmentTable
                  enrollments={enrollments}
                  isLoading={enrollmentsLoading}
                  hasMore={hasNextPage}
                  onLoadMore={() => fetchNextPage()}
                  searchTerm={filters.searchTerm}
                  onSearchChange={filterActions.setSearchTerm}
                  gradeLevel={filters.gradeLevel}
                  onGradeLevelChange={filterActions.setGradeLevel}
                  statusFilter={filters.status}
                  onStatusChange={filterActions.setStatus}
                  onWithdraw={enrollPerms.edit ? setWithdrawTarget : undefined}
                  onTransfer={enrollPerms.edit ? setTransferTarget : undefined}
                  onMarkNoShow={enrollPerms.edit ? handleMarkNoShow : undefined}
                  schoolId={schoolId || null}
                />
              </div>
            )}

            {activeTab === 'registration' && <RegistrationWizard />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Withdrawal Modal */}
      {withdrawTarget && (
        <WithdrawalModal
          open={!!withdrawTarget}
          onClose={() => setWithdrawTarget(null)}
          enrollment={withdrawTarget}
          schoolId={schoolId}
          yearId={activeYearId}
        />
      )}

      {/* Transfer Modal */}
      {transferTarget && (
        <TransferModal
          open={!!transferTarget}
          onClose={() => setTransferTarget(null)}
          enrollment={transferTarget}
          schoolId={schoolId}
          yearId={activeYearId}
        />
      )}
    </div>
  )
}

export default EnrollmentModule
