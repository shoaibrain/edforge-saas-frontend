/**
 * OrgNetworkManager
 *
 * DataTable-based list of Education Organization Networks with CRUD actions
 * and inline member management via an expandable detail panel.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Network,
  Plus,
  Pencil,
  Trash2,
  Users,
  ChevronDown,
  ChevronRight,
  UserPlus,
  X,
  AlertTriangle,
} from 'lucide-react'
import { Button, Modal, ModalFooter, Select, TanstackDataTable, createActionsColumn, type ColumnDef } from '@edforge/ui'
import { usePermission } from '@edforge/abac'
import { useTranslation } from '@edforge/i18n'
import type { NetworkResponseDto, NetworkAssociationResponseDto } from '@aibrains/shared-types'
import {
  useNetworks,
  useDeleteNetwork,
  useNetworkMembers,
  useAddNetworkMember,
  useRemoveNetworkMember,
  useLocalEducationAgencies,
  useEducationServiceCenters,
} from '@/hooks/useEducationOrgs'
import { useModalState } from '@/hooks/useModalState'
import { OrgNetworkForm } from './OrgNetworkForm'

// ============================================================================
// PURPOSE BADGE
// ============================================================================

const purposeColors: Record<string, string> = {
  Collaborative:
    'bg-[rgb(var(--state-info-bg)/0.18)]0/10 text-[rgb(var(--state-info-fg))] dark:text-[rgb(var(--state-info-fg))]',
  Disciplinary:
    'bg-[rgb(var(--state-danger-bg)/0.18)]0/10 text-[rgb(var(--state-danger-fg))] dark:text-[rgb(var(--state-danger-fg))]',
  Governance: 'bg-[rgb(var(--state-info-bg)/0.18)] text-[rgb(var(--state-info-fg))] ',
  'Shared Services': 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  Other: 'bg-[rgb(var(--background-tertiary))]0/10 text-[rgb(var(--text-secondary))] ',
}

function PurposeBadge({ purpose }: { purpose: string }) {
  const { t } = useTranslation('settings')
  const color = purposeColors[purpose] || purposeColors.Other
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {t(`organization.descriptors.networkPurpose.${purpose}`, {
        defaultValue: purpose,
      })}
    </span>
  )
}

// ============================================================================
// STATUS BADGE
// ============================================================================

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation('settings')
  const isActive = status === 'Active'
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${isActive ? 'bg-[rgb(var(--state-success-bg)/0.18)] text-[rgb(var(--state-success-fg))] ' : 'bg-[rgb(var(--background-tertiary))]0/10 text-[rgb(var(--text-secondary))] '}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-[rgb(var(--state-success-fg))]' : 'bg-[rgb(var(--text-tertiary))]'}`}
      />
      {t(`organization.status.${status}`, { defaultValue: status })}
    </span>
  )
}

// ============================================================================
// MEMBER PANEL
// ============================================================================

function MemberPanel({ network }: { network: NetworkResponseDto }) {
  const { t } = useTranslation('settings')
  const { data: membersData, isLoading } = useNetworkMembers(network.id)
  const addMemberMutation = useAddNetworkMember()
  const removeMemberMutation = useRemoveNetworkMember()
  const canManage = usePermission('manage', 'education-organizations')

  const { data: leas } = useLocalEducationAgencies()
  const { data: escs } = useEducationServiceCenters()

  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedOrgId, setSelectedOrgId] = useState('')
  const [selectedOrgType, setSelectedOrgType] = useState<'localEducationAgency' | 'educationServiceCenter'>(
    'localEducationAgency',
  )

  const members = membersData?.items || []

  // Build org options from LEAs and ESCs, excluding already-added members
  const memberOrgIds = new Set(members.map((m) => m.memberEducationOrganizationId))
  const leaOptions = (leas?.items || []).filter((l) => !memberOrgIds.has(l.id))
  const escOptions = (escs?.items || []).filter((e) => !memberOrgIds.has(e.id))

  const handleAddMember = () => {
    if (!selectedOrgId) return
    addMemberMutation.mutate(
      {
        networkId: network.id,
        data: {
          networkId: network.id,
          memberEducationOrganizationId: selectedOrgId,
          memberType: selectedOrgType,
          beginDate: new Date().toISOString().split('T')[0],
        },
      },
      {
        onSuccess: () => {
          setShowAddForm(false)
          setSelectedOrgId('')
        },
      },
    )
  }

  const handleRemoveMember = (member: NetworkAssociationResponseDto) => {
    removeMemberMutation.mutate({ networkId: network.id, memberId: member.id })
  }

  return (
    <div className="px-4 pb-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
          <span className="text-sm font-medium text-[rgb(var(--text-primary))]">
            {t('organization.networks.members.title', {
              count: members.length,
            })}
          </span>
        </div>
        {canManage && !showAddForm && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1 text-xs"
            onClick={() => setShowAddForm(true)}
          >
            <UserPlus className="w-3.5 h-3.5" />
            {t('organization.networks.members.addMember')}
          </Button>
        )}
      </div>

      {/* Add Member Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col sm:flex-row sm:items-end gap-3 p-3 rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))]"
          >
            <Select
              label={t('organization.networks.members.type')}
              className="sm:w-48"
              value={selectedOrgType}
              onChange={(v) => {
                setSelectedOrgType((v ?? 'localEducationAgency') as 'localEducationAgency' | 'educationServiceCenter')
                setSelectedOrgId('')
              }}
              options={[
                {
                  value: 'localEducationAgency',
                  label: t('organization.networks.members.districtOption'),
                },
                {
                  value: 'educationServiceCenter',
                  label: t('organization.networks.members.serviceCenterOption'),
                },
              ]}
            />
            <Select
              label={t('organization.networks.members.organization')}
              className="flex-1"
              placeholder={t('organization.networks.members.selectOrganization')}
              value={selectedOrgId || null}
              onChange={(v) => setSelectedOrgId(v ?? '')}
              options={
                selectedOrgType === 'localEducationAgency'
                  ? leaOptions.map((l) => ({
                      value: l.id,
                      label: l.nameOfInstitution,
                    }))
                  : escOptions.map((e) => ({
                      value: e.id,
                      label: e.nameOfInstitution,
                    }))
              }
            />
            <Button
              size="sm"
              onClick={handleAddMember}
              disabled={!selectedOrgId || addMemberMutation.isPending}
              isLoading={addMemberMutation.isPending}
            >
              {t('organization.networks.members.add')}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              aria-label={t('organization.networks.members.cancelAddAria')}
              onClick={() => {
                setShowAddForm(false)
                setSelectedOrgId('')
              }}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Member List */}
      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-10 rounded-lg bg-[rgb(var(--background-tertiary))] animate-pulse" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <p className="text-sm text-[rgb(var(--text-tertiary))] py-2">{t('organization.networks.members.empty')}</p>
      ) : (
        <div className="space-y-1">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[rgb(var(--background-tertiary))] transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-[rgb(var(--text-primary))]">{member.memberName}</span>
                <span className="text-xs text-[rgb(var(--text-tertiary))] capitalize">
                  {member.memberType === 'localEducationAgency' ? 'LEA' : 'ESC'}
                </span>
                <span className="text-xs text-[rgb(var(--text-tertiary))]">
                  {t('organization.networks.members.since', {
                    date: member.beginDate,
                  })}
                </span>
              </div>
              {canManage && (
                <button
                  type="button"
                  onClick={() => handleRemoveMember(member)}
                  disabled={removeMemberMutation.isPending}
                  aria-label={t('organization.networks.members.removeAria', {
                    name: member.memberName,
                  })}
                  className="p-1 rounded text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--state-danger-fg))] hover:bg-[rgb(var(--state-danger-bg)/0.18)]0/10 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// DELETE CONFIRMATION
// ============================================================================

function DeleteNetworkModal({
  open,
  onClose,
  network,
}: {
  open: boolean
  onClose: () => void
  network: NetworkResponseDto | null
}) {
  const { t } = useTranslation('settings')
  const deleteMutation = useDeleteNetwork()

  if (!network) return null

  const handleDelete = () => {
    deleteMutation.mutate(network.id, {
      onSuccess: () => onClose(),
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('organization.networks.delete.title')}
      description={t('organization.networks.delete.description', {
        name: network.nameOfInstitution,
      })}
      size="md"
    >
      <div className="py-2">
        <div className="flex items-start gap-3 p-3 rounded-lg bg-[rgb(var(--state-danger-bg)/0.18)]0/10 border border-[rgb(var(--state-danger-border)/0.35)]">
          <AlertTriangle className="w-5 h-5 text-[rgb(var(--state-danger-fg))] shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-[rgb(var(--state-danger-fg))] dark:text-[rgb(var(--state-danger-fg))]">
              {t('organization.delete.irreversible')}
            </p>
            <p className="mt-1 text-[rgb(var(--text-secondary))]">
              {t('organization.networks.delete.memberAssociationsRemoved')}
            </p>
          </div>
        </div>
      </div>

      <ModalFooter>
        <Button variant="outline" onClick={onClose} disabled={deleteMutation.isPending}>
          {t('organization.actions.cancel')}
        </Button>
        <Button variant="danger" onClick={handleDelete} isLoading={deleteMutation.isPending}>
          {t('organization.networks.delete.confirm')}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function OrgNetworkManager() {
  const { t } = useTranslation('settings')
  const canManage = usePermission('manage', 'education-organizations')
  const { data: networksData, isLoading } = useNetworks()
  const formModal = useModalState<{ id: string }>()
  const deleteModal = useModalState<NetworkResponseDto>()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const networks = networksData?.items || []

  const toggleExpanded = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  const columns: ColumnDef<NetworkResponseDto, unknown>[] = [
    {
      id: 'expand',
      header: '',
      size: 40,
      enableSorting: false,
      cell: ({ row }) => {
        const item = row.original
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              toggleExpanded(item.id)
            }}
            aria-label={
              expandedId === item.id
                ? t('organization.networks.members.collapseAria')
                : t('organization.networks.members.expandAria')
            }
            aria-expanded={expandedId === item.id}
            className="p-1 rounded hover:bg-[rgb(var(--background-tertiary))] transition-colors"
          >
            {expandedId === item.id ? (
              <ChevronDown className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
            ) : (
              <ChevronRight className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
            )}
          </button>
        )
      },
    },
    {
      accessorKey: 'nameOfInstitution',
      header: t('organization.networks.table.networkName'),
      enableSorting: true,
      cell: ({ row }) => {
        const item = row.original
        return (
          <div>
            <p className="text-sm font-medium text-[rgb(var(--text-primary))]">{item.nameOfInstitution}</p>
            {item.shortNameOfInstitution && (
              <p className="text-xs text-[rgb(var(--text-tertiary))]">{item.shortNameOfInstitution}</p>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'networkPurposeDescriptor',
      header: t('organization.networks.table.purpose'),
      enableSorting: true,
      cell: ({ row }) => <PurposeBadge purpose={row.original.networkPurposeDescriptor} />,
    },
    {
      accessorKey: 'operationalStatusDescriptor',
      header: t('organization.fields.status'),
      enableSorting: true,
      cell: ({ row }) => <StatusBadge status={row.original.operationalStatusDescriptor} />,
    },
    {
      accessorKey: 'educationOrganizationNetworkId',
      header: t('organization.fields.edFiId'),
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-sm font-mono text-[rgb(var(--text-secondary))]">
          {row.original.educationOrganizationNetworkId}
        </span>
      ),
    },
    ...(canManage
      ? [
          createActionsColumn<NetworkResponseDto>({
            cell: ({ row }) => {
              const item = row.original
              return (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      formModal.openEdit({ id: item.id })
                    }}
                    aria-label={t('organization.networks.actions.editAria', {
                      name: item.nameOfInstitution,
                    })}
                    className="p-1.5 rounded-lg text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--action-secondary-fg))] hover:bg-[rgb(var(--action-primary-bg))]/10 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteModal.openDelete(item)
                    }}
                    aria-label={t('organization.networks.actions.deleteAria', {
                      name: item.nameOfInstitution,
                    })}
                    className="p-1.5 rounded-lg text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--state-danger-fg))] hover:bg-[rgb(var(--state-danger-bg)/0.18)]0/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            },
          }),
        ]
      : []),
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Network className="w-5 h-5 text-[rgb(var(--text-tertiary))]" />
          <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))]">{t('organization.networks.title')}</h3>
          <span className="text-xs text-[rgb(var(--text-tertiary))]">({networks.length})</span>
        </div>
        {canManage && (
          <Button size="sm" className="gap-1.5" onClick={formModal.openCreate}>
            <Plus className="w-4 h-4" />
            {t('organization.networks.actions.create')}
          </Button>
        )}
      </div>

      {/* DataTable */}
      <TanstackDataTable<NetworkResponseDto>
        columns={columns}
        data={networks}
        getRowId={(row) => row.id}
        isLoading={isLoading}
        tableId="settings.org-networks"
        enableSorting={true}
        pagination={{ pageSize: 20 }}
        maxHeight="calc(100vh - 15rem)"
        emptyState={{
          icon: <Network className="w-10 h-10" />,
          title: t('organization.networks.empty.title'),
          description: t('organization.networks.empty.description'),
          action: canManage
            ? {
                label: t('organization.networks.actions.create'),
                onClick: formModal.openCreate,
              }
            : undefined,
        }}
        onRowClick={(item) => toggleExpanded(item.id)}
      />

      {/* Expanded Member Panel */}
      <AnimatePresence>
        {expandedId && networks.find((n) => n.id === expandedId) && (
          <motion.div
            key={expandedId}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] overflow-hidden"
          >
            <div className="px-4 pt-3 pb-1 border-b border-[rgb(var(--border-primary))]">
              <p className="text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase tracking-wider">
                {t('organization.networks.members.membersOf', {
                  name: networks.find((n) => n.id === expandedId)?.nameOfInstitution,
                })}
              </p>
            </div>
            <MemberPanel network={networks.find((n) => n.id === expandedId)!} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form Modal */}
      <OrgNetworkForm
        open={formModal.isOpen}
        onClose={formModal.close}
        mode={formModal.mode === 'edit' ? 'edit' : 'create'}
        editId={formModal.mode === 'edit' ? formModal.data?.id : undefined}
      />

      {/* Delete Confirmation */}
      <DeleteNetworkModal open={deleteModal.mode === 'delete'} onClose={deleteModal.close} network={deleteModal.data} />
    </div>
  )
}

export default OrgNetworkManager
