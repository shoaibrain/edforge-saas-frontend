/**
 * Enrollment Module
 *
 * Two-tab interface:
 * - Enrollment Dashboard: View, search, withdraw, and transfer enrolled students
 * - New Student Registration: The existing RegistrationWizard
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useResourcePermissions } from '@edforge/abac'
import {
  Users,
  UserPlus,
  LayoutDashboard,
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
} from '../../hooks/useEnrollments'
import { RegistrationWizard } from '../../components/students/registration'
import { EnrollmentDashboard } from '../../components/enrollment/EnrollmentDashboard'
import { EnrollmentTable } from '../../components/enrollment/EnrollmentTable'
import { WithdrawalModal } from '../../components/enrollment/WithdrawalModal'
import { TransferModal } from '../../components/enrollment/TransferModal'
import type { EnrollmentResponseDto } from '../../services/academics.service'

// ============================================================================
// TYPES
// ============================================================================

type EnrollmentTab = 'dashboard' | 'registration'

const tabs = [
  { id: 'dashboard' as const, label: 'Enrollment Dashboard', icon: LayoutDashboard },
  { id: 'registration' as const, label: 'New Student', icon: UserPlus },
]

// ============================================================================
// ENROLLMENT MODULE
// ============================================================================

export function EnrollmentModule() {
  const [activeTab, setActiveTab] = useState<EnrollmentTab>('dashboard')
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

  return (
    <div className="min-h-full">
      {/* Page Header */}
      <div className="border-b border-border-secondary bg-surface-secondary/50">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text-primary">Student Enrollment</h1>
                <p className="text-text-secondary mt-0.5">
                  Manage enrollment, withdrawals, and transfers
                </p>
              </div>
            </div>

            {/* Academic Year Selector */}
            {activeTab === 'dashboard' && academicYears && academicYears.length > 0 && (
              <select
                value={activeYearId}
                onChange={(e) => setSelectedYearId(e.target.value)}
                className="px-3 py-2 bg-surface-secondary border border-border-secondary rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              >
                {academicYears.map((year: { yearId: string; name: string; status: string }) => (
                  <option key={year.yearId} value={year.yearId}>
                    {year.name}{year.status === 'planning' ? ' (Planning)' : year.status === 'completed' ? ' (Completed)' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6">
          <nav className="flex items-center space-x-1 border-b border-border-primary relative" aria-label="Enrollment tabs">
            {tabs.filter((tab) => tab.id !== 'registration' || enrollPerms.create).map((tab) => (
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
                    layoutId="enrollment-tab-indicator"
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
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <EnrollmentDashboard
                  summary={summary}
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
