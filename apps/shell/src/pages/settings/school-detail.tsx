/**
 * School Detail Page — V2 Redesign
 *
 * 4-tab architecture: Configuration | Academic Setup | Structure | Audit Log
 * URL-based tab routing via ?tab= search param.
 * Locale-aware defaults via useLocaleDefaults().
 */

import { useState, useMemo } from 'react'
import { useParams, useNavigate, useSearch } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Settings,
  Building2,
  Trash2,
  AlertTriangle,
  X,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  PauseCircle,
  Lock,
  Power,
  ArrowRight,
} from 'lucide-react'
import { Menu, MenuButton, MenuItems, MenuItem, Transition } from '@headlessui/react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth.store'
import { can } from '@edforge/abac'
import { tenantService } from '@/services/tenant.service'
import { edOrgKeys } from '@/hooks/useEducationOrgs'
// useBellSchedules / useAcademicSessions / useCalendarStats removed in S0.7 —
// the setup checklist now reads `GET /schools/:id/activation-requirements`
// instead of duplicating the gate logic client-side.
import type { School as SchoolType, SchoolStatus } from '@edforge/types'
import { Button } from '@edforge/ui'

// V2 Tab components
import ConfigurationTab from './tabs/ConfigurationTab'
import AcademicSetupTab from './tabs/AcademicSetupTab'
import StructureTab from './tabs/StructureTab'
import AuditLogTab from './tabs/AuditLogTab'
import { IemisCodeBadge } from '@/components/settings/IemisCodeBadge'

// ============================================================================
// CONSTANTS
// ============================================================================

const SCHOOL_TYPE_LABELS: Record<string, string> = {
  elementary: 'Elementary',
  middle: 'Middle School',
  high: 'High School',
  k12: 'K-12',
  charter: 'Charter',
  private: 'Private',
  vocational: 'Vocational',
  special_education: 'Special Ed',
}

// ============================================================================
// SCHOOL STATUS CONFIG
// ============================================================================

const SCHOOL_STATUS_CONFIG: Record<SchoolStatus, {
  icon: typeof Settings
  color: string
  bg: string
  borderColor: string
  dot: string
  label: string
}> = {
  setup: {
    icon: Settings,
    color: 'text-[#EF9F27]',
    bg: 'bg-[rgba(239,159,39,0.1)]',
    borderColor: 'border-[rgba(239,159,39,0.2)]',
    dot: 'bg-[#EF9F27]',
    label: 'Setup Mode',
  },
  active: {
    icon: CheckCircle2,
    color: 'text-[#1D9E75]',
    bg: 'bg-[rgba(29,158,117,0.1)]',
    borderColor: 'border-[rgba(29,158,117,0.2)]',
    dot: 'bg-[#1D9E75]',
    label: 'Active',
  },
  inactive: {
    icon: XCircle,
    color: 'text-[rgb(var(--text-tertiary))]',
    bg: 'bg-[rgba(255,255,255,0.06)]',
    borderColor: 'border-[rgba(255,255,255,0.08)]',
    dot: 'bg-[rgb(var(--text-tertiary))]',
    label: 'Inactive',
  },
  suspended: {
    icon: PauseCircle,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20',
    dot: 'bg-orange-500',
    label: 'Suspended',
  },
  closed: {
    icon: Lock,
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
    dot: 'bg-red-500',
    label: 'Closed',
  },
}

const STATUS_ACTIONS: Record<SchoolStatus, { label: string; targetStatus: SchoolStatus; color: string }[]> = {
  setup: [{ label: 'Activate School', targetStatus: 'active', color: 'text-[#1D9E75]' }],
  active: [
    { label: 'Suspend School', targetStatus: 'suspended', color: 'text-orange-600' },
    { label: 'Deactivate School', targetStatus: 'inactive', color: 'text-red-600' },
  ],
  suspended: [{ label: 'Reactivate School', targetStatus: 'active', color: 'text-[#1D9E75]' }],
  inactive: [{ label: 'Reactivate School', targetStatus: 'active', color: 'text-[#1D9E75]' }],
  closed: [],
}

// ============================================================================
// V2 TAB CONFIG
// ============================================================================

type SchoolTab = 'config' | 'academic-setup' | 'structure' | 'audit-log'

const TABS: { id: SchoolTab; label: string; emoji: string }[] = [
  { id: 'config', label: 'Configuration', emoji: '⚙️' },
  { id: 'academic-setup', label: 'Academic Setup', emoji: '📅' },
  { id: 'structure', label: 'Structure', emoji: '🏛️' },
  { id: 'audit-log', label: 'Audit Log', emoji: '🛡️' },
]

const VALID_TABS = new Set<string>(['config', 'academic-setup', 'structure', 'audit-log'])

// ============================================================================
// SETUP TASKS
// ============================================================================

interface SetupTask {
  id: string
  label: string
  tab: SchoolTab
  completed: boolean
}

/**
 * S0.7 — backend-driven setup checklist.
 *
 * Reads `GET /schools/:id/activation-requirements`, which returns exactly
 * the same checklist the backend's `setup → active` gate enforces. The
 * UI and backend can no longer disagree on what "complete setup" means.
 *
 * Replaces 5 client-side queries (academicYears, departments, bell,
 * sessions, calendar-stats) + a hand-coded completion table with a single
 * API call. PABSON schools see 4 tasks (AY, terms, bell, calendar);
 * GENERIC schools see 1 task (AY).
 *
 * `_school` is retained in the signature for source-compat with the
 * previous hook — present for any future client-side check on identity
 * fields. Not currently read.
 */
function useSetupTasks(_school: SchoolType | undefined, schoolId: string) {
  const { data, isLoading } = useQuery({
    queryKey: ['activationRequirements', schoolId],
    queryFn: () => tenantService.getActivationRequirements(schoolId),
    enabled: !!schoolId,
    // Short stale window — this drives the "Activate School" button and
    // changes whenever the operator finishes a setup task.
    staleTime: 30 * 1000,
  })

  return useMemo(() => {
    const requirements = data?.requirements ?? []
    const tasks: SetupTask[] = requirements.map(r => ({
      id: r.key,
      label: r.label,
      // All four V1 PABSON requirements live under the Academic Setup tab.
      // Future archetypes that gate on structure-tab resources (e.g. a
      // theoretical 'departments_min' rule) would add a tab mapping here.
      tab: 'academic-setup' as SchoolTab,
      completed: r.met,
    }))
    return {
      tasks,
      completedCount: tasks.filter(t => t.completed).length,
      totalCount: tasks.length,
      canActivate: data?.canActivate ?? false,
      archetype: data?.archetype,
      isLoading,
    }
  }, [data, isLoading])
}

// ============================================================================
// DELETE CONFIRMATION MODAL
// ============================================================================

interface DeleteSchoolModalProps {
  school: SchoolType
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isDeleting: boolean
}

function DeleteSchoolModal({ school, isOpen, onClose, onConfirm, isDeleting }: DeleteSchoolModalProps) {
  const [confirmText, setConfirmText] = useState('')

  if (!isOpen) return null

  const canDelete = confirmText === school.name

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md bg-[rgb(var(--surface-primary))] rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-[rgb(var(--border-primary))]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-rust-500/10">
              <AlertTriangle className="w-5 h-5 text-rust-500" />
            </div>
            <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">Delete School</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[rgb(var(--surface-secondary))] text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {school.status === 'setup' ? (
            <>
              <p className="text-sm text-[rgb(var(--text-secondary))]">
                This will <strong className="text-[rgb(var(--text-primary))]">permanently remove</strong> the school and all associated data. This cannot be undone.
              </p>
              <ul className="space-y-2 text-sm text-[rgb(var(--text-secondary))]">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rust-500" />
                  School entity and configuration will be permanently deleted
                </li>
              </ul>
            </>
          ) : (
            <>
              <p className="text-sm text-[rgb(var(--text-secondary))]">
                This will <strong className="text-[rgb(var(--text-primary))]">deactivate</strong> the school. It can be reactivated later by an administrator.
              </p>
              <ul className="space-y-2 text-sm text-[rgb(var(--text-secondary))]">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  School will be set to Inactive status
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Academic operations will be suspended
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1D9E75]" />
                  Can be reactivated from the school detail page
                </li>
              </ul>
            </>
          )}

          <div className="pt-2">
            <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
              Type <strong className="text-[rgb(var(--text-primary))]">{school.name}</strong> to confirm
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={school.name}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] text-sm text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-rust-500/40 focus:border-rust-500 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))]">
          <Button variant="ghost" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            disabled={!canDelete || isDeleting}
            isLoading={isDeleting}
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            Delete School
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

// ============================================================================
// SCHOOL AVATAR
// ============================================================================

function SchoolAvatar({ name }: { name: string }) {
  // Generate a consistent gradient from the school name
  const initial = name.charAt(0).toUpperCase()
  return (
    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1a3a5c] to-[#378ADD] flex items-center justify-center text-white text-lg font-extrabold flex-shrink-0 border border-[rgba(55,138,221,0.2)]">
      {initial}
    </div>
  )
}

// ============================================================================
// SETUP PROGRESS BANNER
// ============================================================================

interface SetupBannerProps {
  tasks: SetupTask[]
  completedCount: number
  totalCount: number
  onTaskClick: (tab: SchoolTab) => void
  onActivate: () => void
  isActivating: boolean
}

function SetupProgressBanner({ tasks, completedCount, totalCount, onTaskClick, onActivate, isActivating }: SetupBannerProps) {
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <div className="rounded-xl border border-[rgba(239,159,39,0.14)] bg-[rgba(239,159,39,0.05)] p-4">
      <div className="flex gap-3.5 items-start">
        <div className="w-8 h-8 rounded-lg bg-[rgba(239,159,39,0.12)] flex items-center justify-center flex-shrink-0 text-sm">
          ⚙️
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[13px] font-semibold text-[rgb(var(--text-primary))] mb-0.5">
            Complete school setup before activating
          </h3>
          <p className="text-[11px] text-[rgb(var(--text-tertiary))] mb-3 leading-relaxed">
            Configure your school's academic structure so EdForge can track attendance, grades, and scheduling correctly.
          </p>

          {/* Progress bar */}
          <div className="mb-2.5">
            <div className="h-[3px] bg-[rgba(255,255,255,0.06)] rounded-full mb-1">
              <div
                className="h-full bg-[#EF9F27] rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-[10px] text-[rgb(var(--text-tertiary))]">
              {completedCount} of {totalCount} setup tasks complete
            </p>
          </div>

          {/* Step chips */}
          <div className="flex flex-wrap gap-1.5">
            {tasks.map((task) => (
              <button
                key={task.id}
                onClick={() => onTaskClick(task.tab)}
                className={`
                  inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium
                  border transition-all cursor-pointer
                  ${task.completed
                    ? 'bg-[rgba(29,158,117,0.08)] text-[#1D9E75] border-[rgba(29,158,117,0.2)]'
                    : 'bg-[rgba(255,255,255,0.03)] text-[rgb(var(--text-tertiary))] border-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.06)] hover:text-[rgb(var(--text-secondary))]'
                  }
                `}
              >
                <span className="text-[10px]">{task.completed ? '✓' : '○'}</span>
                {task.label}
              </button>
            ))}
          </div>
        </div>

        {/* Activate CTA */}
        <button
          onClick={onActivate}
          disabled={isActivating}
          className="flex-shrink-0 self-center bg-[#1D9E75] text-white text-xs font-medium px-3.5 py-2 rounded-lg flex items-center gap-1.5 hover:opacity-90 transition-opacity disabled:opacity-50 whitespace-nowrap"
        >
          ✓ Activate School <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SchoolDetailPage() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // URL params
  const params = useParams({ strict: false }) as { schoolId?: string }
  const schoolId = params.schoolId || 'school-001'

  // URL-based tab routing
  const search = useSearch({ strict: false }) as { tab?: string }
  const rawTab = search.tab || 'config'
  const activeTab: SchoolTab = VALID_TABS.has(rawTab) ? (rawTab as SchoolTab) : 'config'

  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // Permission Check
  if (!user) return null

  const isTenantAdmin = user.globalRole === 'TenantAdmin'

  const hasPermission = can(user, {
    action: 'view',
    resource: 'settings:school',
    schoolId: schoolId,
  })

  // Fetch School Data
  const {
    data: school,
    isLoading,
  } = useQuery({
    queryKey: ['school', schoolId],
    queryFn: () => tenantService.getSchool(schoolId),
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => tenantService.deleteSchool(schoolId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] })
      queryClient.removeQueries({ queryKey: ['school', schoolId] })
      queryClient.invalidateQueries({ queryKey: edOrgKeys.hierarchy() })
      toast.success('School deleted successfully')
      navigate({ to: '/settings/organization' })
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || 'Failed to delete school'
      toast.error(message)
    },
  })

  // Status transition mutation
  const statusMutation = useMutation({
    mutationFn: (newStatus: SchoolStatus) => tenantService.transitionSchoolStatus(schoolId, newStatus),
    onSuccess: (updatedSchool) => {
      queryClient.invalidateQueries({ queryKey: ['school', schoolId] })
      queryClient.invalidateQueries({ queryKey: ['schools'] })
      queryClient.invalidateQueries({ queryKey: edOrgKeys.hierarchy() })
      toast.success(
        updatedSchool.status === 'active'
          ? 'School activated successfully'
          : `School status updated to ${updatedSchool.status}`
      )
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error?.message || 'Failed to update school status')
    },
  })

  // Setup tasks
  const { tasks: setupTasks, completedCount, totalCount } = useSetupTasks(school, schoolId)

  // Tab badge counts
  const pendingAcademicTasks = setupTasks.filter(t => t.tab === 'academic-setup' && !t.completed).length
  const pendingStructureTasks = setupTasks.filter(t => t.tab === 'structure' && !t.completed).length

  // Tab navigation
  const switchTab = (tab: SchoolTab) => {
    navigate({
      search: { tab } as any,
      replace: true,
    })
  }

  const displaySchool = school

  if (isLoading) {
    return (
      <div className="mx-auto px-6 py-6">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-[rgb(var(--surface-secondary))] rounded-xl" />
            <div className="space-y-2">
              <div className="h-5 w-48 bg-[rgb(var(--surface-secondary))] rounded-lg" />
              <div className="h-3 w-32 bg-[rgb(var(--surface-secondary))] rounded" />
            </div>
          </div>
          <div className="h-20 bg-[rgb(var(--surface-secondary))] rounded-xl" />
          <div className="h-10 bg-[rgb(var(--surface-secondary))] rounded-lg" />
          <div className="h-64 bg-[rgb(var(--surface-secondary))] rounded-xl" />
        </div>
      </div>
    )
  }

  if (!hasPermission) {
    return <AccessDenied message="You don't have permission to view this school's settings." />
  }

  if (!displaySchool) {
    return (
      <div className="mx-auto px-6 py-6">
        <div className="text-center text-[rgb(var(--text-tertiary))]">
          School not found or could not be loaded.
        </div>
      </div>
    )
  }

  const statusCfg = SCHOOL_STATUS_CONFIG[displaySchool.status] || SCHOOL_STATUS_CONFIG.setup

  return (
    <div className="min-h-full">
      <div className="mx-auto px-6 py-5 space-y-4">

        {/* ── School Header ── */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <SchoolAvatar name={displaySchool.name} />
            <div>
              <h1 className="text-xl font-bold text-[rgb(var(--text-primary))] tracking-tight leading-tight">
                {displaySchool.name}
              </h1>
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                {/* Code chip */}
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-md border border-[rgba(255,255,255,0.09)] text-[rgb(var(--text-tertiary))]">
                  {displaySchool.code}
                </span>
                {/* IEMIS Code chip (S1.11) — renders only for PABSON schools
                    that have an emisSchoolCode set. */}
                <IemisCodeBadge code={displaySchool.emisSchoolCode} />
                {/* Type chip */}
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-md border border-[rgba(255,255,255,0.09)] text-[rgb(var(--text-tertiary))]">
                  {SCHOOL_TYPE_LABELS[displaySchool.type || ''] || displaySchool.type || 'School'}
                </span>
                {/* Status chip */}
                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${statusCfg.bg} ${statusCfg.color} ${statusCfg.borderColor}`}>
                  <span className={`w-[5px] h-[5px] rounded-full ${statusCfg.dot}`} />
                  {statusCfg.label}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {isTenantAdmin && (
              <Menu as="div" className="relative">
                <MenuButton className="w-8 h-8 rounded-lg border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.04)] text-[rgb(var(--text-tertiary))] hover:bg-[rgba(255,255,255,0.08)] hover:text-[rgb(var(--text-secondary))] transition-all flex items-center justify-center">
                  <MoreHorizontal className="w-4 h-4" />
                </MenuButton>
                <Transition
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <MenuItems className="absolute right-0 z-50 mt-1 w-56 origin-top-right rounded-xl bg-[rgb(var(--surface-primary))] border border-[rgb(var(--border-primary))] shadow-lg focus:outline-none overflow-hidden">
                    <div className="py-1">
                      {STATUS_ACTIONS[displaySchool.status]?.map((action) => (
                        <MenuItem key={action.targetStatus}>
                          {({ active }) => (
                            <button
                              onClick={() => statusMutation.mutate(action.targetStatus)}
                              disabled={statusMutation.isPending}
                              className={`flex items-center w-full px-3 py-2.5 text-sm ${action.color} ${active ? 'bg-[rgb(var(--surface-secondary))]' : ''} disabled:opacity-50`}
                            >
                              <Power className="w-4 h-4 mr-2.5" />
                              {action.label}
                            </button>
                          )}
                        </MenuItem>
                      ))}
                      {(STATUS_ACTIONS[displaySchool.status]?.length ?? 0) > 0 && (
                        <div className="border-t border-[rgb(var(--border-primary))] my-1" />
                      )}
                      {displaySchool.status !== 'closed' && (
                        <MenuItem>
                          {({ active }) => (
                            <button
                              onClick={() => setShowDeleteModal(true)}
                              className={`flex items-center w-full px-3 py-2.5 text-sm text-red-600 ${active ? 'bg-red-50 dark:bg-red-500/10' : ''}`}
                            >
                              <Trash2 className="w-4 h-4 mr-2.5" />
                              {displaySchool.status === 'setup' ? 'Delete School' : 'Deactivate School'}
                            </button>
                          )}
                        </MenuItem>
                      )}
                    </div>
                  </MenuItems>
                </Transition>
              </Menu>
            )}

            {/* S0 polish: the in-header `Activate School` button was a duplicate
                of the `✓ Activate School` button inside SetupProgressBanner —
                both rendered simultaneously when status === 'setup'. The banner
                button is contextually correct (sits inside the setup checklist
                with the gating tasks alongside). The header CTA was redundant.
                Status transitions away from `active` (active → suspended/closed)
                still go through the "..." menu dropdown. */}
          </div>
        </div>

        {/* ── Setup Progress Banner ── */}
        {displaySchool.status !== 'active' && (
          <SetupProgressBanner
            tasks={setupTasks}
            completedCount={completedCount}
            totalCount={totalCount}
            onTaskClick={switchTab}
            onActivate={() => statusMutation.mutate('active')}
            isActivating={statusMutation.isPending}
          />
        )}

        {/* ── Tab Bar ── */}
        <div className="border-b border-[rgba(255,255,255,0.06)]">
          <div className="flex gap-0.5 overflow-x-auto -mb-px">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id
              // Badge logic
              let badge: { count: number; variant: 'amber' | 'green' } | null = null
              if (tab.id === 'academic-setup' && pendingAcademicTasks > 0) {
                badge = { count: pendingAcademicTasks, variant: 'amber' }
              } else if (tab.id === 'structure' && pendingStructureTasks > 0) {
                badge = { count: pendingStructureTasks, variant: 'amber' }
              }

              return (
                <button
                  key={tab.id}
                  onClick={() => switchTab(tab.id)}
                  className={`
                    relative px-4 py-2.5 text-xs font-medium transition-colors whitespace-nowrap outline-none
                    flex items-center gap-1.5
                    ${isActive
                      ? 'text-[#378ADD] border-b-2 border-[#378ADD]'
                      : 'text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))] border-b-2 border-transparent'
                    }
                  `}
                >
                  <span>{tab.emoji}</span>
                  {tab.label}
                  {badge && (
                    <span className={`
                      text-[9px] font-semibold px-1.5 py-px rounded-full border
                      ${badge.variant === 'amber'
                        ? 'bg-[rgba(239,159,39,0.12)] text-[#EF9F27] border-[rgba(239,159,39,0.2)]'
                        : 'bg-[rgba(29,158,117,0.1)] text-[#1D9E75] border-[rgba(29,158,117,0.2)]'
                      }
                    `}>
                      {badge.count} pending
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Content Area ── */}
        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {activeTab === 'config' && (
                <ConfigurationTab schoolId={schoolId} school={displaySchool} />
              )}
              {activeTab === 'academic-setup' && (
                <AcademicSetupTab schoolId={schoolId} school={displaySchool} />
              )}
              {activeTab === 'structure' && (
                <StructureTab schoolId={schoolId} />
              )}
              {activeTab === 'audit-log' && (
                <AuditLogTab schoolId={schoolId} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && displaySchool && (
          <DeleteSchoolModal
            school={displaySchool}
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={() => deleteMutation.mutate()}
            isDeleting={deleteMutation.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================================================
// ACCESS DENIED COMPONENT
// ============================================================================

function AccessDenied({ message }: { message: string }) {
  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-24"
      >
        <div className="p-4 rounded-full bg-rust-500/10 inline-flex mb-6">
          <Building2 className="w-10 h-10 text-rust-500" />
        </div>
        <h2 className="text-2xl font-bold text-[rgb(var(--text-primary))] mb-3">Access Denied</h2>
        <p className="text-[rgb(var(--text-tertiary))] max-w-md mx-auto">{message}</p>
      </motion.div>
    </div>
  )
}
