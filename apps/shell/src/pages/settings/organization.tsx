/**
 * Organization Settings Page
 *
 * Displays the education organization hierarchy tree with SEA → LEA → School structure.
 * Includes quick actions for creating orgs and stats overview.
 */

import { useState, useCallback, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2,
  Landmark,
  School,
  Plus,
  Network,
  AlertTriangle,
} from 'lucide-react'
import { Button, Modal, ModalFooter } from '@edforge/ui'
import { usePermission } from '@edforge/abac'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { extractApiErrorMessage } from '@edforge/api-client'
import { apiPatch } from '@/lib/api'
import {
  useOrganizationHierarchy,
  useStateEducationAgency,
  useDeleteLea,
  useDeleteEsc,
  edOrgKeys,
} from '@/hooks/useEducationOrgs'
import {
  SettingsPageHeader,
  SettingsSkeleton,
  SettingsEmptyState,
  staggerChildren,
  fadeInUp,
} from '@/components/settings/SettingsShared'
import { ErrorBoundary } from '@/components/layout/ErrorBoundary'
import { OrganizationHierarchyTree } from '@/components/settings/OrganizationHierarchyTree'
import type { TreeNodeAction } from '@/components/settings/OrganizationHierarchyTree'
import { OrphanedSchoolsBanner } from '@/components/settings/OrphanedSchoolsBanner'
import { SEASetupForm } from '@/components/settings/SEASetupForm'
import { LEAForm } from '@/components/settings/LEAForm'
import { ESCForm } from '@/components/settings/ESCForm'
import { OrgNetworkManager } from '@/components/settings/OrgNetworkManager'
import { OrgSetupOnboarding } from '@/components/settings/OrgSetupOnboarding'
import { QuickSchoolReassign } from '@/components/settings/QuickSchoolReassign'
import { SchoolAssignmentManager } from '@/components/settings/SchoolAssignmentManager'
import { useModalState } from '@/hooks/useModalState'
import type { HierarchyNode } from '@aibrains/shared-types'

// ============================================================================
// ============================================================================
// TAB BUTTON
// ============================================================================

type TabId = 'hierarchy' | 'networks' | 'details'

function TabButton({
  id,
  label,
  activeTab,
  onSelect,
}: {
  id: TabId
  label: string
  activeTab: TabId
  onSelect: (id: TabId) => void
}) {
  const isActive = activeTab === id

  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={`relative px-4 py-2 text-sm font-medium transition-colors ${
        isActive
          ? 'text-[rgb(var(--action-secondary-fg))] '
          : 'text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))]'
      }`}
      role="tab"
      aria-selected={isActive}
    >
      {label}
      {isActive && (
        <motion.div
          layoutId="org-tab-indicator"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-[rgb(var(--action-primary-bg))] rounded-full"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
    </button>
  )
}

// ============================================================================
// DELETE CONFIRMATION MODAL
// ============================================================================

function DeleteEdOrgModal({
  open,
  onClose,
  node,
}: {
  open: boolean
  onClose: () => void
  node: HierarchyNode | null
}) {
  const [confirmText, setConfirmText] = useState('')
  const deleteLeaMutation = useDeleteLea()
  const deleteEscMutation = useDeleteEsc()

  if (!node) return null

  const isLea = node.type === 'localEducationAgency'
  const schoolCount = node.schoolCount || 0
  const requiresTyping = isLea && schoolCount > 0
  const entityLabel = isLea ? 'District' : 'Service Center'
  const isPending = deleteLeaMutation.isPending || deleteEscMutation.isPending
  const canConfirm = !requiresTyping || confirmText === node.name

  const handleDelete = () => {
    if (!canConfirm) return
    const mutation = isLea ? deleteLeaMutation : deleteEscMutation
    mutation.mutate(node.id, {
      onSuccess: () => {
        setConfirmText('')
        onClose()
      },
    })
  }

  const handleClose = () => {
    setConfirmText('')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={`Delete ${entityLabel}`}
      description={`Are you sure you want to delete "${node.name}"?`}
      size="md"
    >
      <div className="space-y-4 py-2">
        <div className="flex items-start gap-3 p-3 rounded-lg bg-[rgb(var(--state-danger-bg)/0.18)]0/10 border border-[rgb(var(--state-danger-border)/0.35)]">
          <AlertTriangle className="w-5 h-5 text-[rgb(var(--state-danger-fg))] shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-[rgb(var(--state-danger-fg))] dark:text-[rgb(var(--state-danger-fg))]">This action cannot be undone.</p>
            {isLea && schoolCount > 0 && (
              <p className="mt-1 text-[rgb(var(--text-secondary))]">
                This district has <strong>{schoolCount}</strong> {schoolCount === 1 ? 'school' : 'schools'} that will become unassigned.
              </p>
            )}
          </div>
        </div>

        {requiresTyping && (
          <div>
            <label className="block text-sm text-[rgb(var(--text-secondary))] mb-1.5">
              Type <strong>{node.name}</strong> to confirm:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={node.name}
              className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-tertiary))] text-sm text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)] focus:border-[rgb(var(--state-danger-border))] transition-colors"
            />
          </div>
        )}
      </div>

      <ModalFooter>
        <Button variant="outline" onClick={handleClose} disabled={isPending}>
          Cancel
        </Button>
        <Button
          variant="danger"
          onClick={handleDelete}
          disabled={!canConfirm || isPending}
          isLoading={isPending}
        >
          Delete {entityLabel}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

// ============================================================================
// EMPTY STATE (No Hierarchy)
// ============================================================================

function OrgEmptyState({ onSetupSea }: { onSetupSea?: () => void }) {
  const canManage = usePermission('manage', 'education-organizations')

  return (
    <div className="relative min-h-[calc(100vh-300px)] flex flex-col">
      {/* Gradient background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[rgb(var(--state-info-bg)/0.12)] rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[rgb(var(--action-primary-bg))]/5 rounded-full blur-3xl" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* Animated icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative mb-8"
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="relative"
          >
            <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-[rgb(var(--state-info-fg))] via-[rgb(var(--state-info-fg))] to-[rgb(var(--action-primary-bg))] flex items-center justify-center shadow-2xl shadow-indigo-500/30">
              <Network className="w-14 h-14 text-[rgb(var(--action-primary-fg))]" strokeWidth={1.5} />
            </div>
            <motion.div
              className="absolute inset-0 rounded-2xl border-2 border-[rgb(var(--state-info-border)/0.40)]"
              animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut' }}
            />
          </motion.div>

          {/* Orbiting org type icons */}
          {[
            { Icon: Landmark, color: 'rgb(99, 102, 241)', angle: 0 },
            { Icon: Building2, color: 'rgb(20, 184, 166)', angle: 120 },
            { Icon: School, color: 'rgb(6, 182, 212)', angle: 240 },
          ].map(({ Icon, color, angle }, i) => (
            <motion.div
              key={i}
              className="absolute w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: `${color}20`, left: '50%', top: '50%' }}
              animate={{
                x: [
                  Math.cos(((angle) * Math.PI) / 180) * 70,
                  Math.cos(((angle + 180) * Math.PI) / 180) * 70,
                  Math.cos(((angle + 360) * Math.PI) / 180) * 70,
                ],
                y: [
                  Math.sin(((angle) * Math.PI) / 180) * 70,
                  Math.sin(((angle + 180) * Math.PI) / 180) * 70,
                  Math.sin(((angle + 360) * Math.PI) / 180) * 70,
                ],
                opacity: [0.6, 1, 0.6],
              }}
              transition={{ duration: 10, repeat: Infinity, ease: 'linear', delay: i * 0.5 }}
            >
              <Icon className="w-4 h-4" style={{ color }} />
            </motion.div>
          ))}
        </motion.div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="text-center max-w-lg mb-8"
        >
          <h2 className="text-2xl font-semibold text-[rgb(var(--text-primary))] mb-3 tracking-tight">
            Build your organization hierarchy
          </h2>
          <p className="text-[rgb(var(--text-secondary))] leading-relaxed">
            Set up your State Education Agency, add districts (LEAs) and service centers (ESCs), then
            organize your schools under them for Ed-Fi compliant reporting.
          </p>
        </motion.div>

        {/* CTA */}
        {canManage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <Button
              onClick={onSetupSea}
              className="gap-2 bg-gradient-to-r from-[rgb(var(--state-info-fg))] to-[rgb(var(--action-primary-bg))] hover:from-[rgb(var(--state-info-fg))] hover:to-[rgb(var(--action-primary-bg-hover))] shadow-lg shadow-indigo-500/25"
            >
              <Landmark className="w-4 h-4" />
              Set Up State Agency
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// ORGANIZATION SETTINGS PAGE
// ============================================================================

export default function OrganizationSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('hierarchy')
  const canManage = usePermission('manage', 'education-organizations')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showAllSchoolsManager, setShowAllSchoolsManager] = useState(false)

  // Modal state for each entity type
  const seaModal = useModalState<null>()
  const leaModal = useModalState<{ id: string; seaId?: string; escId?: string }>()
  const escModal = useModalState<{ id: string }>()
  const deleteModal = useModalState<HierarchyNode>()
  const schoolReassignModal = useModalState<{ 
    schoolId: string
    schoolName: string
    currentLeaId?: string | null
    currentLeaName?: string | null
  }>()

  const {
    data: hierarchy,
    isLoading: hierarchyLoading,
    isError: hierarchyError,
  } = useOrganizationHierarchy()

  const { data: sea } = useStateEducationAgency()

  // Unassign school mutation
  const unassignSchoolMutation = useMutation({
    mutationFn: async (schoolId: string) => {
      await apiPatch(`/schools/${schoolId}`, { localEducationAgencyId: null })
    },
    onSuccess: (_, schoolId) => {
      queryClient.invalidateQueries({ queryKey: edOrgKeys.hierarchy() })
      queryClient.invalidateQueries({ queryKey: ['schools'] })
      queryClient.invalidateQueries({ queryKey: ['schools', schoolId] })
      toast.success('School unassigned from district')
    },
    onError: (error: Error) => {
      toast.error(extractApiErrorMessage(error))
    },
  })

  // Handle tree node actions
  const handleNodeAction = useCallback(
    (action: TreeNodeAction, node: HierarchyNode) => {
      switch (action) {
        case 'view-details':
          if (node.type === 'school') {
            navigate({ to: '/settings/organization/schools/$schoolId', params: { schoolId: node.id }, search: { tab: undefined } })
          } else {
            const orgType = node.type === 'stateEducationAgency'
              ? 'sea'
              : node.type === 'localEducationAgency'
              ? 'lea'
              : 'esc'
            // Route will be registered in Task 2.5
            navigate({ to: `/settings/organization/${orgType}/${node.id}` as string })
          }
          break
        case 'edit':
          if (node.type === 'stateEducationAgency') {
            seaModal.openEdit(null)
          } else if (node.type === 'localEducationAgency') {
            leaModal.openEdit({ id: node.id })
          } else if (node.type === 'educationServiceCenter') {
            escModal.openEdit({ id: node.id })
          }
          break
        case 'add-child':
          // LEA → add school with pre-selected LEA
          if (node.type === 'localEducationAgency') {
            navigate({ to: '/settings/organization/schools/new', search: { leaId: node.id } })
          }
          break
        case 'delete':
          deleteModal.openDelete(node)
          break
        case 'change-district':
          if (node.type === 'school') {
            // Note: We don't have direct access to parent LEA info from the node
            // The modal will handle fetching current assignment if needed
            schoolReassignModal.openEdit({
              schoolId: node.id,
              schoolName: node.name,
              currentLeaId: undefined,
              currentLeaName: undefined,
            })
          }
          break
        case 'unassign-school':
          if (node.type === 'school') {
            // Confirm before unassigning
            if (window.confirm(`Unassign "${node.name}" from its district?\n\nThe school will move to the unassigned schools list.`)) {
              unassignSchoolMutation.mutate(node.id)
            }
          }
          break
      }
    },
    [navigate, seaModal, leaModal, escModal, deleteModal, schoolReassignModal, unassignSchoolMutation]
  )

  // Extract all schools from hierarchy for bulk management
  const allSchools = useMemo(() => {
    if (!hierarchy) return []
    const schools: HierarchyNode[] = []
    
    const extractSchools = (node: HierarchyNode) => {
      if (node.type === 'school') {
        schools.push(node)
      }
      if (node.children) {
        node.children.forEach(extractSchools)
      }
    }
    
    // Extract from SEA tree
    if (hierarchy.sea) {
      extractSchools(hierarchy.sea)
    }
    
    // Extract from ESCs
    hierarchy.educationServiceCenters?.forEach(extractSchools)
    
    // Include unassigned schools
    hierarchy.unassigned?.forEach((school) => schools.push(school))
    
    return schools
  }, [hierarchy])

  // Compute stats from hierarchy
  const stats = { totalOrgs: 0, activeSchools: 0 }

  if (hierarchy) {
    const countOrgs = (node: HierarchyNode) => {
      stats.totalOrgs++
      if (node.type === 'school') stats.activeSchools++
      node.children?.forEach(countOrgs)
    }
    if (hierarchy.sea) countOrgs(hierarchy.sea)
    hierarchy.educationServiceCenters?.forEach(countOrgs)
    hierarchy.unassigned?.forEach(() => { stats.totalOrgs++; stats.activeSchools++ })
  }

  const hasNoData =
    !hierarchyLoading &&
    !hierarchy?.sea &&
    (!hierarchy?.educationServiceCenters || hierarchy.educationServiceCenters.length === 0) &&
    (!hierarchy?.unassigned || hierarchy.unassigned.length === 0)

  if (hasNoData && !hierarchyError) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <OrgEmptyState onSetupSea={seaModal.openCreate} />

        {/* Guided Onboarding */}
        <OrgSetupOnboarding
          onSetupSea={seaModal.openCreate}
          onCreateLea={leaModal.openCreate}
          onAddSchool={() => navigate({ to: '/settings/organization/schools/new' as string })}
        />

        {/* SEA Form (still needed in empty state) */}
        <SEASetupForm
          open={seaModal.isOpen}
          onClose={seaModal.close}
          existingSea={seaModal.mode === 'edit' ? sea : undefined}
        />

        {/* LEA Form (create mode - for onboarding step 2) */}
        <LEAForm
          open={leaModal.isOpen && leaModal.mode !== 'edit'}
          onClose={leaModal.close}
          mode="create"
          defaultSeaId={sea?.id}
        />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerChildren}
        className="space-y-8"
      >
        {/* Header */}
        <SettingsPageHeader
          title="Organization Structure"
          description={
            !hierarchyLoading && !hasNoData
              ? `${stats.totalOrgs} organizations · ${stats.activeSchools} schools`
              : 'Manage your education organization hierarchy'
          }
          icon={Building2}
          action={
            canManage ? (
              <div className="flex items-center gap-1 p-1 rounded-lg bg-[rgb(var(--background-secondary))] border border-[rgb(var(--border-primary))]">
                {!sea ? (
                  <Button size="sm" variant="ghost" className="gap-1.5 rounded-md" onClick={seaModal.openCreate}>
                    <Landmark className="w-3.5 h-3.5" />
                    Set Up SEA
                  </Button>
                ) : (
                  <Button size="sm" variant="ghost" className="gap-1.5 rounded-md" onClick={() => seaModal.openEdit(null)}>
                    <Landmark className="w-3.5 h-3.5" />
                    Edit SEA
                  </Button>
                )}
                <div className="w-px h-5 bg-[rgb(var(--border-primary))]" />
                <Button size="sm" variant="ghost" className="gap-1.5 rounded-md" onClick={leaModal.openCreate}>
                  <Plus className="w-3.5 h-3.5" />
                  District
                </Button>
                <Button size="sm" variant="ghost" className="gap-1.5 rounded-md" onClick={escModal.openCreate}>
                  <Plus className="w-3.5 h-3.5" />
                  Service Center
                </Button>
                {stats.activeSchools > 0 && (
                  <>
                    <div className="w-px h-5 bg-[rgb(var(--border-primary))]" />
                    <Button size="sm" variant="ghost" className="gap-1.5 rounded-md" onClick={() => setShowAllSchoolsManager(true)}>
                      <Network className="w-3.5 h-3.5" />
                      Assignments
                    </Button>
                  </>
                )}
              </div>
            ) : undefined
          }
        />

        {/* Orphaned Schools Banner */}
        {hierarchy && hierarchy.unassigned && hierarchy.unassigned.length > 0 && (
          <motion.div variants={fadeInUp}>
            <OrphanedSchoolsBanner
              orphanedSchools={hierarchy.unassigned}
            />
          </motion.div>
        )}

        {/* Tabs */}
        <motion.div variants={fadeInUp}>
          <div className="flex items-center border-b border-[rgb(var(--border-primary))]" role="tablist">
            <TabButton id="hierarchy" label="Hierarchy" activeTab={activeTab} onSelect={setActiveTab} />
            <TabButton id="networks" label="Networks" activeTab={activeTab} onSelect={setActiveTab} />
            <TabButton id="details" label="Details" activeTab={activeTab} onSelect={setActiveTab} />
          </div>
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'hierarchy' && (
            <motion.div
              key="hierarchy"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <ErrorBoundary>
                {hierarchyLoading ? (
                  <SettingsSkeleton rows={6} showHeader={false} />
                ) : hierarchy ? (
                  <OrganizationHierarchyTree
                    sea={hierarchy.sea}
                    educationServiceCenters={hierarchy.educationServiceCenters || []}
                    unassigned={hierarchy.unassigned || []}
                    onNodeAction={canManage ? handleNodeAction : undefined}
                  />
                ) : null}
              </ErrorBoundary>
            </motion.div>
          )}

          {activeTab === 'networks' && (
            <motion.div
              key="networks"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <ErrorBoundary>
                <OrgNetworkManager />
              </ErrorBoundary>
            </motion.div>
          )}

          {activeTab === 'details' && (
            <motion.div
              key="details"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* SEA Summary Card */}
              {sea ? (
                <div className="p-5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))]">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-[rgb(var(--state-info-bg)/0.18)]">
                      <Landmark className="w-5 h-5 text-[rgb(var(--state-info-fg))] " />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))]">
                        State Education Agency
                      </h3>
                      <p className="text-xs text-[rgb(var(--text-tertiary))]">Root organization</p>
                    </div>
                    {canManage && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="ml-auto gap-1.5"
                        onClick={() => seaModal.openEdit(null)}
                      >
                        Edit
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-[rgb(var(--text-tertiary))]">Name</p>
                      <p className="font-medium text-[rgb(var(--text-primary))]">{sea.nameOfInstitution}</p>
                    </div>
                    <div>
                      <p className="text-[rgb(var(--text-tertiary))]">Ed-Fi ID</p>
                      <p className="font-medium text-[rgb(var(--text-primary))] font-mono">{sea.stateEducationAgencyId}</p>
                    </div>
                    <div>
                      <p className="text-[rgb(var(--text-tertiary))]">Status</p>
                      <p className="font-medium text-[rgb(var(--text-primary))]">{sea.operationalStatusDescriptor}</p>
                    </div>
                    {sea.webSite && (
                      <div>
                        <p className="text-[rgb(var(--text-tertiary))]">Website</p>
                        <a
                          href={sea.webSite}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-[rgb(var(--action-secondary-fg))]  hover:underline"
                        >
                          {sea.webSite}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <SettingsEmptyState
                  icon={Landmark}
                  title="No State Education Agency"
                  description="Set up your SEA to establish the root of your organization hierarchy."
                  action={
                    canManage ? (
                      <Button size="sm" className="gap-1.5" onClick={seaModal.openCreate}>
                        <Plus className="w-4 h-4" />
                        Set Up SEA
                      </Button>
                    ) : undefined
                  }
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ================================================================ */}
      {/* FORM MODALS                                                      */}
      {/* ================================================================ */}

      {/* SEA Form */}
      <SEASetupForm
        open={seaModal.isOpen}
        onClose={seaModal.close}
        existingSea={seaModal.mode === 'edit' ? sea : undefined}
      />

      {/* LEA Form (create & edit modes) */}
      <LEAForm
        open={leaModal.isOpen}
        onClose={leaModal.close}
        mode={leaModal.mode === 'edit' ? 'edit' : 'create'}
        editId={leaModal.mode === 'edit' ? leaModal.data?.id : undefined}
        defaultSeaId={sea?.id}
      />

      {/* ESC Form */}
      <ESCForm
        open={escModal.isOpen}
        onClose={escModal.close}
        mode={escModal.mode === 'edit' ? 'edit' : 'create'}
        editId={escModal.mode === 'edit' ? escModal.data?.id : undefined}
      />

      {/* School Reassignment Modal */}
      {schoolReassignModal.data && (
        <QuickSchoolReassign
          open={schoolReassignModal.isOpen}
          onClose={schoolReassignModal.close}
          schoolId={schoolReassignModal.data.schoolId}
          schoolName={schoolReassignModal.data.schoolName}
          currentLeaId={schoolReassignModal.data.currentLeaId}
          currentLeaName={schoolReassignModal.data.currentLeaName}
        />
      )}

      {/* Delete Confirmation */}
      <DeleteEdOrgModal
        open={deleteModal.mode === 'delete'}
        onClose={deleteModal.close}
        node={deleteModal.data}
      />

      {/* All Schools Assignment Manager */}
      <SchoolAssignmentManager
        open={showAllSchoolsManager}
        onClose={() => setShowAllSchoolsManager(false)}
        schools={allSchools}
        mode="all"
      />
    </div>
  )
}
