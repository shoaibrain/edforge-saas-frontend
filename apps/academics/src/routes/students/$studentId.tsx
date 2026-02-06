/**
 * Student Profile Page
 *
 * Dynamic route: /academics/students/:studentId
 *
 * Design aligned with Staff Detail page (apps/people):
 * - Compact header with DiceBear avatar, status dot, metadata row
 * - Framer-motion animated tab bar with sliding underline indicator
 * - AnimatePresence for smooth tab content transitions
 *
 * Sprint 2 - Ticket 2.9: Assemble Student Profile Page
 */

import { useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RefreshCw,
  User,
  GraduationCap,
  Users,
  BookOpen,
} from 'lucide-react'
import { Button } from '@edforge/ui'
import { toast } from 'sonner'
import { useStudentProfile } from '../../hooks'
import { NotFound } from '../../components/common'
import {
  ProfileHeader,
  ProfileHeaderSkeleton,
  OverviewTab,
  OverviewTabSkeleton,
  EnrollmentTab,
  FamilyTab,
  ScheduleTab,
} from '../../components/students/profile'

// ============================================================================
// CONSTANTS
// ============================================================================

type TabId = 'overview' | 'enrollment' | 'family' | 'schedule'

const TABS: { id: TabId; label: string; icon: typeof User }[] = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'enrollment', label: 'Enrollment', icon: GraduationCap },
  { id: 'family', label: 'Family', icon: Users },
  { id: 'schedule', label: 'Schedule', icon: BookOpen },
]

// ============================================================================
// ROUTE PARAMS VALIDATION
// ============================================================================

const studentIdSchema = z.string().uuid('Invalid student ID format')

function isValidUUID(id: string): boolean {
  return studentIdSchema.safeParse(id).success
}

// ============================================================================
// LOADING STATE
// ============================================================================

function ProfileLoadingState() {
  return (
    <div className="min-h-full">
      <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-0">
        <div className="pb-6">
          <ProfileHeaderSkeleton />
        </div>
        {/* Tab bar skeleton */}
        <div className="flex items-center space-x-1 border-b border-[rgb(var(--border-primary))]">
          {[80, 100, 70, 85].map((w, i) => (
            <div key={i} className="px-4 py-3">
              <div
                className="h-4 rounded animate-pulse bg-[rgb(var(--surface-tertiary))]"
                style={{ width: w }}
              />
            </div>
          ))}
        </div>
        <div className="min-h-[500px] pt-6">
          <OverviewTabSkeleton />
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// ERROR STATE
// ============================================================================

function ProfileErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
          <User className="w-7 h-7 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-xl font-semibold text-[rgb(var(--text-primary))] mb-2">
          Failed to Load Profile
        </h2>
        <p className="text-[rgb(var(--text-secondary))] mb-6">
          We couldn&apos;t load this student&apos;s profile. Please try again.
        </p>
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function StudentProfilePage() {
  const params = useParams({ from: '/students/$studentId' })
  const studentId = params.studentId
  const [activeTab, setActiveTab] = useState<TabId>('overview')

  // Validate UUID format
  const isValidId = isValidUUID(studentId)

  // Fetch student profile
  const {
    data: student,
    isLoading,
    isError,
    error,
    refetch,
  } = useStudentProfile({
    studentId,
    enabled: isValidId,
  })

  // Handle invalid UUID
  if (!isValidId) {
    return <NotFound type="student" />
  }

  // Loading state
  if (isLoading) {
    return <ProfileLoadingState />
  }

  // Error state
  if (isError) {
    const status = (error as any)?.response?.status
    if (status === 404) {
      return <NotFound type="student" />
    }
    return <ProfileErrorState onRetry={() => refetch()} />
  }

  // No data
  if (!student) {
    return <NotFound type="student" />
  }

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleEditStudent = () => {
    // TODO: Sprint 2 Ticket 2.10 - Open StudentEditModal
    toast.info('Edit functionality coming soon')
  }

  const handleAddGuardian = () => {
    toast.info('Add guardian coming soon')
  }

  const handleEditGuardian = (_guardianId: string) => {
    toast.info('Edit guardian coming soon')
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-full">
      <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-0">
        {/* Profile Header */}
        <div className="pb-6">
          <ProfileHeader
            student={student}
            onEdit={handleEditStudent}
            canEdit={true}
          />
        </div>

        {/* Tab Navigation — aligned with Staff Detail pattern */}
        <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar border-b border-[rgb(var(--border-primary))]">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap outline-none
                  ${isActive
                    ? 'text-[rgb(var(--text-primary))]'
                    : 'text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))]'
                  }
                `}
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-500' : 'opacity-70'}`} />
                  {tab.label}
                </span>

                {/* Animated underline indicator */}
                {isActive && (
                  <motion.div
                    layoutId="studentProfileTab"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-teal-500 rounded-t-full"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            )
          })}
        </div>

        {/* Tab Content with AnimatePresence */}
        <div className="min-h-[500px] pt-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {activeTab === 'overview' && (
                <OverviewTab student={student} />
              )}
              {activeTab === 'enrollment' && (
                <EnrollmentTab student={student} />
              )}
              {activeTab === 'family' && (
                <FamilyTab
                  student={student}
                  onAddGuardian={handleAddGuardian}
                  onEditGuardian={handleEditGuardian}
                  canEdit={true}
                />
              )}
              {activeTab === 'schedule' && (
                <ScheduleTab student={student} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export default StudentProfilePage
