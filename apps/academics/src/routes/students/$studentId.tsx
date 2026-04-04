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
import { useResourcePermissions } from '@edforge/abac'
import { useTranslation } from '@edforge/i18n'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RefreshCw,
  User,
  GraduationCap,
  Users,
  BarChart3,
} from 'lucide-react'
import { Button } from '@edforge/ui'
import { useStudentProfile, useStudentProfileActions, useGrantPortalAccess } from '../../hooks'
import { useActiveSchoolId } from '../../stores/app.store'
import { NotFound, PermissionDenied } from '../../components/common'
import {
  ProfileHeader,
  ProfileHeaderSkeleton,
  OverviewTab,
  OverviewTabSkeleton,
  EnrollmentTab,
  FamilyTab,
  ProfileTab,
} from '../../components/students/profile'
import { EnrollExistingStudentModal } from '../../components/enrollment/EnrollExistingStudentModal'
import { EditStudentModal } from '../../components/students/EditStudentModal'
import { AddToSectionModal } from '../../components/students/profile/AddToSectionModal'
import { AddGuardianModal } from '../../components/students/profile/AddGuardianModal'

// ============================================================================
// CONSTANTS
// ============================================================================

type TabId = 'overview' | 'profile' | 'enrollment' | 'family'

const TAB_IDS: { id: TabId; icon: typeof User }[] = [
  { id: 'overview', icon: BarChart3 },
  { id: 'profile', icon: User },
  { id: 'enrollment', icon: GraduationCap },
  { id: 'family', icon: Users },
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
  const { t } = useTranslation('academics')
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
          <User className="w-7 h-7 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-xl font-semibold text-[rgb(var(--text-primary))] mb-2">
          {t('error.failedToLoad')}
        </h2>
        <p className="text-[rgb(var(--text-secondary))] mb-6">
          {t('error.failedToLoadDescription')}
        </p>
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          {t('error.retry')}
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
  const schoolId = useActiveSchoolId()
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const { t } = useTranslation('academics')

  // ABAC: check student permissions
  const studentPerms = useResourcePermissions('students')
  const canEdit = !!studentPerms.edit

  // Actions hook — must be called before any conditional returns (Rules of Hooks)
  const actions = useStudentProfileActions()
  const grantPortalAccess = useGrantPortalAccess()

  // Validate UUID format
  const isValidId = isValidUUID(studentId)

  // Fetch student profile — pass schoolId to avoid "School context required" 403
  const {
    data: student,
    isLoading,
    isError,
    error,
    refetch,
  } = useStudentProfile({
    studentId,
    schoolId: schoolId || undefined,
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
    if (status === 403) {
      return (
        <PermissionDenied
          resource="student profile"
          action="view"
          message={t('error.noPermission')}
          showBackButton
        />
      )
    }
    return <ProfileErrorState onRetry={() => refetch()} />
  }

  // No data
  if (!student) {
    return <NotFound type="student" />
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
            onEdit={canEdit ? actions.openEdit : undefined}
            onEnroll={canEdit ? actions.openEnroll : undefined}
            canEdit={canEdit}
          />
        </div>

        {/* Tab Navigation — aligned with Staff Detail pattern */}
        <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar border-b border-[rgb(var(--border-primary))]">
          {TAB_IDS.map((tab) => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative px-4 py-3 pb-3.5 text-sm transition-colors whitespace-nowrap outline-none
                  ${isActive
                    ? 'text-teal-600 dark:text-teal-400 font-medium'
                    : 'text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))] hover:border-[rgb(var(--border-primary))]'
                  }
                `}
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600 dark:text-teal-400' : 'opacity-70'}`} />
                  {t(`tabs.${tab.id}`)}
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
              {activeTab === 'profile' && (
                <ProfileTab student={student} />
              )}
              {activeTab === 'enrollment' && (
                <EnrollmentTab
                  student={student}
                  onEnroll={canEdit ? actions.openEnroll : undefined}
                  onAddToSection={canEdit ? actions.openAddToSection : undefined}
                />
              )}
              {activeTab === 'family' && (
                <FamilyTab
                  student={student}
                  onAddGuardian={canEdit ? actions.openAddGuardian : undefined}
                  onEditGuardian={canEdit ? actions.openEditGuardian : undefined}
                  onGrantPortalAccess={
                    canEdit
                      ? (guardian) => {
                          if (!guardian.email || !schoolId) return
                          grantPortalAccess.mutate({
                            email: guardian.email,
                            firstName: guardian.firstName,
                            lastName: guardian.lastName,
                            phone: guardian.phone,
                            schoolId,
                            studentId: student.studentId,
                            guardianId: guardian.guardianId,
                          })
                        }
                      : undefined
                  }
                  isGrantingAccess={grantPortalAccess.isPending}
                  canEdit={canEdit}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Modals — only rendered when user has edit permission */}
      {canEdit && (
        <>
          <EnrollExistingStudentModal
            open={actions.enrollModalOpen}
            onClose={() => actions.setEnrollModalOpen(false)}
            student={student}
          />
          <EditStudentModal
            open={actions.editModalOpen}
            onClose={() => actions.setEditModalOpen(false)}
            student={student}
          />
          <AddToSectionModal
            open={actions.addToSectionModalOpen}
            onClose={() => actions.setAddToSectionModalOpen(false)}
            student={student}
          />
          <AddGuardianModal
            open={actions.addGuardianModalOpen}
            onClose={() => actions.setAddGuardianModalOpen(false)}
            student={student}
          />
        </>
      )}
    </div>
  )
}

export default StudentProfilePage
