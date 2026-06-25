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

import { useCallback } from 'react'
import { useParams, useSearch, useNavigate } from '@tanstack/react-router'
import { useResourcePermissions, usePermission } from '@edforge/abac'
import { useTranslation } from '@edforge/i18n'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RefreshCw,
  User,
  GraduationCap,
  Users,
  BarChart3,
  IdCard,
} from 'lucide-react'
import { Button, Tabs, type TabItem } from '@edforge/ui'
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
  DemographicsTab,
} from '../../components/students/profile'
import { EnrollExistingStudentModal } from '../../components/enrollment/EnrollExistingStudentModal'
import { EditStudentModal } from '../../components/students/EditStudentModal'
import { AddToSectionModal } from '../../components/students/profile/AddToSectionModal'
import { AddGuardianModal } from '../../components/students/profile/AddGuardianModal'

// ============================================================================
// CONSTANTS
// ============================================================================

type TabId = 'overview' | 'profile' | 'enrollment' | 'family' | 'demographics'

const TAB_IDS: { id: TabId; icon: typeof User }[] = [
  { id: 'overview', icon: BarChart3 },
  { id: 'profile', icon: User },
  { id: 'enrollment', icon: GraduationCap },
  { id: 'family', icon: Users },
  { id: 'demographics', icon: IdCard },
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
      <div className="max-w-full mx-auto px-6 py-6 space-y-0">
        <div className="pb-6">
          <ProfileHeaderSkeleton />
        </div>
        {/* Tab bar skeleton */}
        <div className="flex items-center space-x-1 border-b border-[rgb(var(--border-primary))]">
          {[80, 100, 70, 85].map((w, i) => (
            <div key={i} className="px-4 py-3">
              <div
                className="h-4 rounded animate-pulse bg-[rgb(var(--background-tertiary))]"
                style={{ width: w }}
              />
            </div>
          ))}
        </div>
        <div className="min-h-128 pt-6">
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
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[rgb(var(--state-danger-bg)/0.18)] flex items-center justify-center">
          <User className="w-7 h-7 text-[rgb(var(--state-danger-fg))]" />
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
  const navigate = useNavigate()
  // URL-synced active tab (deep-linkable / shareable). The route's
  // validateSearch defaults invalid/absent values to undefined → 'overview'.
  const { tab } = useSearch({ from: '/students/$studentId' })
  const activeTab: TabId = tab ?? 'overview'
  const setActiveTab = useCallback(
    (next: TabId) => {
      navigate({ to: '/students/$studentId', params: { studentId }, search: { tab: next }, replace: true })
    },
    [navigate, studentId],
  )
  const { t } = useTranslation('academics')

  // ABAC: check student permissions. Enroll and add-to-classroom hit DIFFERENT
  // backend resources than student edit — enroll = enrollment:create, add-to-
  // classroom = scheduling:edit — so gate them on their own permission, not the
  // student:edit flag (a VicePrincipal can edit students but not create
  // enrollments, and would otherwise 403).
  const studentPerms = useResourcePermissions('students')
  const canEdit = !!studentPerms.edit
  const canEnroll = usePermission('create', 'enrollment')
  const canAddToSection = usePermission('edit', 'scheduling')

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
      <div className="max-w-full mx-auto px-6 py-6 space-y-0">
        {/* Profile Header */}
        <div className="pb-6">
          <ProfileHeader
            student={student}
            onEdit={canEdit ? actions.openEdit : undefined}
            onEnroll={canEnroll ? actions.openEnroll : undefined}
            canEdit={canEdit}
          />
        </div>

        {/* Tabs — shared @edforge/ui primitive (house standard, accessible) */}
        <Tabs
          aria-label="Student profile sections"
          value={activeTab}
          onChange={(value) => setActiveTab(value as TabId)}
          className="overflow-x-auto no-scrollbar"
          tabs={TAB_IDS.map((tab): TabItem => {
            const Icon = tab.icon
            return {
              id: tab.id,
              label: (
                <span className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  {t(`tabs.${tab.id}`)}
                </span>
              ),
            }
          })}
        />

        {/* Tab Content with AnimatePresence */}
        <div className="min-h-128 pt-6">
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
                  onEnroll={canEnroll ? actions.openEnroll : undefined}
                  onAddToSection={canAddToSection ? actions.openAddToSection : undefined}
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
              {activeTab === 'demographics' && (
                <DemographicsTab student={student} canEdit={canEdit} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Modals — each gated on the permission its action actually requires. */}
      {canEnroll && (
        <EnrollExistingStudentModal
          open={actions.enrollModalOpen}
          onClose={() => actions.setEnrollModalOpen(false)}
          student={student}
        />
      )}
      {canEdit && (
        <EditStudentModal
          open={actions.editModalOpen}
          onClose={() => actions.setEditModalOpen(false)}
          student={student}
        />
      )}
      {canAddToSection && (
        <AddToSectionModal
          open={actions.addToSectionModalOpen}
          onClose={() => actions.setAddToSectionModalOpen(false)}
          student={student}
        />
      )}
      {canEdit && (
        <AddGuardianModal
          open={actions.addGuardianModalOpen}
          onClose={() => actions.setAddGuardianModalOpen(false)}
          student={student}
        />
      )}
    </div>
  )
}

export default StudentProfilePage
