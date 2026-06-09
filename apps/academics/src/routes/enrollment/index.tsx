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
import { useNavigate } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { useResourcePermissions } from '@edforge/abac'
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

function getInitialTab(): EnrollmentTab {
  try {
    const params = new URLSearchParams(window.location.search)
    const tab = params.get('tab')
    if (tab === 'records') return 'dashboard'
    if (tab === 'new') return 'registration'
  } catch {
    // SSR or error — fall through
  }
  return 'registration'
}

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
      <div
        className="w-20 h-1.5 rounded-full overflow-hidden"
        style={{ background: 'rgba(255, 255, 255, 0.06)' }}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${progress}%`, background: '#1D9E75' }}
        />
      </div>
      <span className="text-xs" style={{ color: 'rgb(var(--text-tertiary))' }}>
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
  const [activeTab, setActiveTab] = useState<EnrollmentTab>(getInitialTab)
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
      <div
        className="px-6 py-4"
        style={{
          borderBottom: '1px solid rgb(var(--border-primary) / 0.35)',
          background: 'rgb(var(--background-secondary))',
        }}
      >
        <div className="flex items-center justify-between">
          {/* Left: Icon + Title */}
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center"
              style={{
                width: 32,
                height: 32,
                background: 'rgba(29, 158, 117, 0.1)',
                borderRadius: 8,
              }}
            >
              <UserPlus className="w-4 h-4" style={{ color: '#1D9E75' }} />
            </div>
            <h1
              className="font-semibold"
              style={{
                fontSize: 18,
                color: 'rgb(var(--text-primary))',
                letterSpacing: '-0.3px',
              }}
            >
              Enroll student
            </h1>
          </div>

          {/* Right: Cancel + Year Selector */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancelEnrollment}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-[8px] transition-colors hover:opacity-80"
              style={{
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#7a8099',
              }}
            >
              <X className="w-3 h-3" />
              Cancel enrollment
            </button>

            {activeTab === 'dashboard' && academicYears && academicYears.length > 0 && (
              <>
                <select
                  value={activeYearId}
                  onChange={(e) => setSelectedYearId(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-[8px] focus:outline-none"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: 'rgb(var(--text-secondary))',
                  }}
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
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-[8px] transition-colors hover:opacity-80"
                    style={{
                      background: 'transparent',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'rgb(var(--text-tertiary))',
                    }}
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
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-[8px] transition-colors disabled:opacity-50"
                    style={{
                      background: 'rgba(239, 159, 39, 0.08)',
                      border: '1px solid rgba(239, 159, 39, 0.2)',
                      color: '#EF9F27',
                    }}
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
          <p
            className="mt-2"
            style={{ fontSize: 11, color: 'rgb(var(--text-tertiary))' }}
          >
            Registering a new student
            {activeYearObj ? ` · Academic year ${activeYearObj.name}` : ''}
            {summary ? ` · ${summary.totalEnrolled ?? 0} students currently enrolled` : ''}
          </p>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="px-6" style={{ background: 'rgb(var(--background-secondary))' }}>
        <nav className="flex items-center gap-1" aria-label="Enrollment tabs">
          {tabItems
            .filter((tab) => tab.id !== 'registration' || enrollPerms.create)
            .map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="relative flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors"
                  style={{
                    color: isActive ? '#1D9E75' : '#5a6070',
                    borderBottom: isActive ? '2px solid #1D9E75' : '2px solid transparent',
                  }}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span
                      className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                      style={{
                        background: isActive ? 'rgba(29, 158, 117, 0.12)' : 'rgba(255, 255, 255, 0.06)',
                        color: isActive ? '#1D9E75' : 'rgb(var(--text-tertiary))',
                      }}
                    >
                      {tab.count}
                    </span>
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="enrollment-tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full"
                      style={{ background: '#1D9E75' }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
              )
            })}
        </nav>
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
                  <div
                    className="flex flex-wrap items-center gap-x-4 gap-y-2"
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: 10,
                      padding: '12px 14px',
                    }}
                  >
                    <Calendar className="w-3.5 h-3.5" style={{ color: '#1D9E75' }} />
                    <span
                      className="text-xs font-medium px-2 py-0.5"
                      style={{
                        background: 'rgba(29, 158, 117, 0.1)',
                        color: '#1D9E75',
                        borderRadius: 6,
                      }}
                    >
                      {activeYearObj.name}
                    </span>
                    <YearProgressBar
                      startDate={activeYearObj.startDate}
                      endDate={activeYearObj.endDate}
                    />
                    <div className="ml-auto flex items-center gap-3 text-xs" style={{ color: 'rgb(var(--text-tertiary))' }}>
                      <span>
                        <strong style={{ color: 'rgb(var(--text-primary))' }}>{summary?.totalEnrolled ?? '--'}</strong> enrolled
                      </span>
                      <span>
                        <strong style={{ color: 'rgb(var(--text-primary))' }}>{activeCount}</strong> active
                      </span>
                      <span>
                        <strong style={{ color: 'rgb(var(--text-primary))' }}>{gradeLevelCount}</strong> grade levels
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
