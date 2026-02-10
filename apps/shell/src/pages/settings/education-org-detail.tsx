/**
 * Education Organization Detail Page
 *
 * Detail view for SEA, LEA, or ESC. Route: /settings/organization/$orgType/$orgId
 * Shows identity info, addresses, phones, ID codes, hierarchy, and child orgs.
 */

import { useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Building2,
  Landmark,
  MapPin,
  Phone,
  Hash,
  Network,
  School,
  Pencil,
  Globe,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@edforge/ui'
import { usePermission } from '@edforge/abac'
import {
  useStateEducationAgency,
  useLocalEducationAgency,
  useEducationServiceCenter,
  useOrganizationHierarchy,
} from '@/hooks/useEducationOrgs'
import { useModalState } from '@/hooks/useModalState'
import { SettingsSkeleton, SettingsEmptyState } from '@/components/settings/SettingsShared'
import { SEASetupForm } from '@/components/settings/SEASetupForm'
import { LEAForm } from '@/components/settings/LEAForm'
import { ESCForm } from '@/components/settings/ESCForm'
import type { HierarchyNode } from '@aibrains/shared-types'

// ============================================================================
// TYPES
// ============================================================================

type OrgType = 'sea' | 'lea' | 'esc'
type DetailTab = 'overview' | 'schools' | 'children' | 'accountability'

const ORG_TYPE_META: Record<OrgType, { label: string; fullLabel: string; icon: LucideIcon; color: string; bgColor: string }> = {
  sea: {
    label: 'SEA',
    fullLabel: 'State Education Agency',
    icon: Landmark,
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-500/10',
  },
  lea: {
    label: 'LEA',
    fullLabel: 'Local Education Agency',
    icon: Building2,
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-500/10',
  },
  esc: {
    label: 'ESC',
    fullLabel: 'Education Service Center',
    icon: MapPin,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-500/10',
  },
}

// ============================================================================
// INFO CARD
// ============================================================================

function InfoCard({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: LucideIcon
  children: React.ReactNode
}) {
  return (
    <div className="p-5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))]">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
        <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))]">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function FieldRow({ label, value }: { label: string; value?: string | number | null }) {
  if (value === undefined || value === null || value === '') return null
  return (
    <div>
      <p className="text-xs text-[rgb(var(--text-tertiary))] mb-0.5">{label}</p>
      <p className="text-sm font-medium text-[rgb(var(--text-primary))]">{value}</p>
    </div>
  )
}

// ============================================================================
// CHILD ORG LIST ITEM
// ============================================================================

function ChildOrgItem({ node, onNavigate }: { node: HierarchyNode; onNavigate: (node: HierarchyNode) => void }) {
  const typeColors: Record<string, string> = {
    localEducationAgency: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
    educationServiceCenter: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    school: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
  }
  const typeLabels: Record<string, string> = {
    localEducationAgency: 'LEA',
    educationServiceCenter: 'ESC',
    school: 'School',
  }

  return (
    <button
      onClick={() => onNavigate(node)}
      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[rgb(var(--surface-tertiary))] transition-colors text-left"
    >
      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border ${typeColors[node.type] || ''}`}>
        {typeLabels[node.type] || node.type}
      </span>
      <span className="text-sm font-medium text-[rgb(var(--text-primary))] truncate flex-1">{node.name}</span>
      {node.edfiId !== undefined && (
        <span className="text-[10px] text-[rgb(var(--text-tertiary))] font-mono">#{node.edfiId}</span>
      )}
      <span className={`w-2 h-2 rounded-full ${node.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
    </button>
  )
}

// ============================================================================
// TAB BUTTON
// ============================================================================

function TabButton({
  id,
  label,
  activeTab,
  onSelect,
}: {
  id: DetailTab
  label: string
  activeTab: DetailTab
  onSelect: (id: DetailTab) => void
}) {
  const isActive = activeTab === id
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={`relative px-4 py-2 text-sm font-medium transition-colors ${
        isActive
          ? 'text-teal-600 dark:text-teal-400'
          : 'text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))]'
      }`}
      role="tab"
      aria-selected={isActive}
    >
      {label}
      {isActive && (
        <motion.div
          layoutId="edorg-detail-tab"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-500 rounded-full"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
    </button>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function EducationOrgDetailPage() {
  const navigate = useNavigate()
  const params = useParams({ strict: false }) as { orgType?: string; orgId?: string }
  const orgType = params.orgType as OrgType | undefined
  const orgId = params.orgId || ''

  const [activeTab, setActiveTab] = useState<DetailTab>('overview')
  const canManage = usePermission('manage', 'education-organizations')

  // Modal state for edit forms
  const seaModal = useModalState<null>()
  const leaModal = useModalState<{ id: string }>()
  const escModal = useModalState<{ id: string }>()

  // Fetch data based on org type (only enable the relevant query)
  const { data: sea, isLoading: seaLoading } = useStateEducationAgency(orgType === 'sea')
  const { data: lea, isLoading: leaLoading } = useLocalEducationAgency(orgId, orgType === 'lea')
  const { data: esc, isLoading: escLoading } = useEducationServiceCenter(orgId, orgType === 'esc')
  const { data: hierarchy } = useOrganizationHierarchy()

  // Validate orgType
  if (!orgType || !['sea', 'lea', 'esc'].includes(orgType)) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <SettingsEmptyState
          icon={Building2}
          title="Organization not found"
          description="The organization type is invalid."
          action={
            <Button size="sm" onClick={() => navigate({ to: '/settings/organization' })}>
              Back to Organizations
            </Button>
          }
        />
      </div>
    )
  }

  const meta = ORG_TYPE_META[orgType]
  const isLoading = orgType === 'sea' ? seaLoading : orgType === 'lea' ? leaLoading : escLoading

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <SettingsSkeleton rows={6} showHeader />
      </div>
    )
  }

  // Extract common fields based on type
  const orgData = orgType === 'sea' ? sea : orgType === 'lea' ? lea : esc
  if (!orgData) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <SettingsEmptyState
          icon={Building2}
          title="Organization not found"
          description="The requested organization could not be found."
          action={
            <Button size="sm" onClick={() => navigate({ to: '/settings/organization' })}>
              Back to Organizations
            </Button>
          }
        />
      </div>
    )
  }

  const name = orgData.nameOfInstitution
  const edfiId = orgType === 'sea'
    ? (orgData as typeof sea & object).stateEducationAgencyId
    : orgType === 'lea'
    ? (orgData as typeof lea & object).localEducationAgencyId
    : (orgData as typeof esc & object).educationServiceCenterId
  const status = orgData.operationalStatusDescriptor || 'Active'
  const addresses = orgData.addresses || []
  const telephones = orgData.telephones || []
  const identificationCodes = orgData.identificationCodes || []
  const categories = orgData.categories || []

  // Find this node in hierarchy for children
  const findNode = (node: HierarchyNode, targetId: string): HierarchyNode | null => {
    if (node.id === targetId) return node
    for (const child of node.children || []) {
      const found = findNode(child, targetId)
      if (found) return found
    }
    return null
  }

  let hierarchyNode: HierarchyNode | null = null
  if (hierarchy) {
    if (orgType === 'sea' && hierarchy.sea) {
      hierarchyNode = hierarchy.sea
    } else if (hierarchy.sea) {
      hierarchyNode = findNode(hierarchy.sea, orgId)
    }
    if (!hierarchyNode) {
      for (const escNode of hierarchy.educationServiceCenters || []) {
        if (orgType === 'esc' && escNode.id === orgId) {
          hierarchyNode = escNode
          break
        }
        const found = findNode(escNode, orgId)
        if (found) { hierarchyNode = found; break }
      }
    }
  }

  const childOrgs = hierarchyNode?.children || []
  const schools = childOrgs.filter((c) => c.type === 'school')
  const nonSchoolChildren = childOrgs.filter((c) => c.type !== 'school')

  // For SEA: collect all direct LEAs and ESCs from hierarchy
  const seaDirectChildren: HierarchyNode[] = []
  if (orgType === 'sea' && hierarchy) {
    // LEAs under SEA
    hierarchyNode?.children?.forEach((c) => seaDirectChildren.push(c))
    // ESCs
    hierarchy.educationServiceCenters?.forEach((e) => seaDirectChildren.push(e))
  }

  const handleEdit = () => {
    if (orgType === 'sea') seaModal.openEdit(null)
    else if (orgType === 'lea') leaModal.openEdit({ id: orgId })
    else escModal.openEdit({ id: orgId })
  }

  const handleChildNavigate = (node: HierarchyNode) => {
    if (node.type === 'school') {
      navigate({ to: '/settings/schools/$schoolId', params: { schoolId: node.id } })
    } else {
      const childType = node.type === 'localEducationAgency' ? 'lea' : node.type === 'educationServiceCenter' ? 'esc' : 'sea'
      navigate({ to: `/settings/organization/${childType}/${node.id}` as string })
    }
  }

  // Determine which tabs to show
  const tabs: { id: DetailTab; label: string }[] = [{ id: 'overview', label: 'Overview' }]
  if (orgType === 'lea' && schools.length > 0) {
    tabs.push({ id: 'schools', label: `Schools (${schools.length})` })
  }
  if ((orgType === 'sea' && seaDirectChildren.length > 0) || (orgType !== 'sea' && nonSchoolChildren.length > 0)) {
    tabs.push({ id: 'children', label: 'Child Organizations' })
  }

  const MetaIcon = meta.icon

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate({ to: '/settings/organization' })}
        className="inline-flex items-center gap-1.5 text-sm text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Organizations
      </button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-4"
      >
        <div className={`p-3 rounded-xl ${meta.bgColor}`}>
          <MetaIcon className={`w-6 h-6 ${meta.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border ${meta.bgColor} ${meta.color}`}>
              {meta.label}
            </span>
            <span className="text-[10px] text-[rgb(var(--text-tertiary))] font-mono">#{edfiId}</span>
            <span className="inline-flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              <span className="text-[11px] text-[rgb(var(--text-tertiary))]">{status}</span>
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))] tracking-tight truncate">{name}</h1>
          <p className="text-sm text-[rgb(var(--text-tertiary))] mt-0.5">{meta.fullLabel}</p>
        </div>
        {canManage && (
          <Button size="sm" variant="ghost" className="gap-1.5 shrink-0" onClick={handleEdit}>
            <Pencil className="w-4 h-4" />
            Edit
          </Button>
        )}
      </motion.div>

      {/* Tabs */}
      {tabs.length > 1 && (
        <div className="flex items-center border-b border-[rgb(var(--border-primary))]" role="tablist">
          {tabs.map((tab) => (
            <TabButton key={tab.id} id={tab.id} label={tab.label} activeTab={activeTab} onSelect={setActiveTab} />
          ))}
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Identity */}
          <InfoCard title="Identity" icon={Building2}>
            <div className="grid grid-cols-2 gap-4">
              <FieldRow label="Name" value={name} />
              <FieldRow label="Short Name" value={orgData.shortNameOfInstitution} />
              <FieldRow label="Ed-Fi ID" value={edfiId} />
              <FieldRow label="Operational Status" value={status} />
              {orgData.webSite && (
                <div>
                  <p className="text-xs text-[rgb(var(--text-tertiary))] mb-0.5">Website</p>
                  <a
                    href={orgData.webSite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-teal-600 dark:text-teal-400 hover:underline inline-flex items-center gap-1"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    {orgData.webSite}
                  </a>
                </div>
              )}
              {orgType === 'lea' && (orgData as typeof lea & object).leaCategoryDescriptor && (
                <FieldRow label="LEA Category" value={(orgData as typeof lea & object).leaCategoryDescriptor} />
              )}
              {orgType === 'lea' && (orgData as typeof lea & object).charterStatusDescriptor && (
                <FieldRow label="Charter Status" value={(orgData as typeof lea & object).charterStatusDescriptor} />
              )}
            </div>
          </InfoCard>

          {/* Categories */}
          {categories.length > 0 && (
            <InfoCard title="Categories" icon={Hash}>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-[rgb(var(--surface-tertiary))] text-[rgb(var(--text-secondary))] border border-[rgb(var(--border-primary))]"
                  >
                    {cat.educationOrganizationCategoryDescriptor}
                  </span>
                ))}
              </div>
            </InfoCard>
          )}

          {/* Addresses */}
          {addresses.length > 0 && (
            <InfoCard title="Addresses" icon={MapPin}>
              <div className="space-y-3">
                {addresses.map((addr, i) => (
                  <div key={i} className="p-3 rounded-lg bg-[rgb(var(--surface-tertiary))]">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[rgb(var(--text-tertiary))] mb-1">
                      {addr.addressTypeDescriptor}
                    </p>
                    <p className="text-sm text-[rgb(var(--text-primary))]">
                      {addr.streetNumberName}
                      {addr.apartmentRoomSuiteNumber && `, ${addr.apartmentRoomSuiteNumber}`}
                    </p>
                    <p className="text-sm text-[rgb(var(--text-primary))]">
                      {addr.city}, {addr.stateAbbreviationDescriptor} {addr.postalCode}
                    </p>
                  </div>
                ))}
              </div>
            </InfoCard>
          )}

          {/* Telephones */}
          {telephones.length > 0 && (
            <InfoCard title="Telephones" icon={Phone}>
              <div className="grid grid-cols-2 gap-3">
                {telephones.map((tel, i) => (
                  <div key={i} className="p-3 rounded-lg bg-[rgb(var(--surface-tertiary))]">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[rgb(var(--text-tertiary))] mb-1">
                      {tel.institutionTelephoneNumberTypeDescriptor}
                    </p>
                    <p className="text-sm font-medium text-[rgb(var(--text-primary))]">{tel.telephoneNumber}</p>
                  </div>
                ))}
              </div>
            </InfoCard>
          )}

          {/* Identification Codes */}
          {identificationCodes.length > 0 && (
            <InfoCard title="Identification Codes" icon={Hash}>
              <div className="grid grid-cols-2 gap-3">
                {identificationCodes.map((code, i) => (
                  <div key={i} className="p-3 rounded-lg bg-[rgb(var(--surface-tertiary))]">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[rgb(var(--text-tertiary))] mb-1">
                      {code.educationOrganizationIdentificationSystemDescriptor}
                    </p>
                    <p className="text-sm font-mono font-medium text-[rgb(var(--text-primary))]">{code.identificationCode}</p>
                  </div>
                ))}
              </div>
            </InfoCard>
          )}

          {/* Hierarchy (LEA only) */}
          {orgType === 'lea' && (
            <InfoCard title="Hierarchy" icon={Network}>
              <div className="grid grid-cols-2 gap-4">
                {(orgData as typeof lea & object).stateEducationAgencyId && (
                  <FieldRow label="State Education Agency" value={sea?.nameOfInstitution || (orgData as typeof lea & object).stateEducationAgencyId} />
                )}
                {(orgData as typeof lea & object).educationServiceCenterId && (
                  <FieldRow label="Education Service Center" value={(orgData as typeof lea & object).educationServiceCenterId} />
                )}
                {(orgData as typeof lea & object).parentLocalEducationAgencyId && (
                  <FieldRow label="Parent LEA" value={(orgData as typeof lea & object).parentLocalEducationAgencyId} />
                )}
              </div>
            </InfoCard>
          )}
        </motion.div>
      )}

      {/* Schools Tab (LEA only) */}
      {activeTab === 'schools' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] divide-y divide-[rgb(var(--border-primary))]">
            {schools.length > 0 ? (
              schools.map((s) => <ChildOrgItem key={s.id} node={s} onNavigate={handleChildNavigate} />)
            ) : (
              <div className="p-8 text-center">
                <School className="w-8 h-8 text-[rgb(var(--text-tertiary))] mx-auto mb-2" />
                <p className="text-sm text-[rgb(var(--text-tertiary))]">No schools assigned to this district.</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Child Orgs Tab */}
      {activeTab === 'children' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] divide-y divide-[rgb(var(--border-primary))]">
            {(orgType === 'sea' ? seaDirectChildren : nonSchoolChildren).map((child) => (
              <ChildOrgItem key={child.id} node={child} onNavigate={handleChildNavigate} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Edit Form Modals */}
      {orgType === 'sea' && (
        <SEASetupForm
          open={seaModal.isOpen}
          onClose={seaModal.close}
          existingSea={sea}
        />
      )}
      {orgType === 'lea' && (
        <LEAForm
          open={leaModal.isOpen}
          onClose={leaModal.close}
          mode="edit"
          editId={orgId}
        />
      )}
      {orgType === 'esc' && (
        <ESCForm
          open={escModal.isOpen}
          onClose={escModal.close}
          mode="edit"
          editId={orgId}
        />
      )}
    </div>
  )
}
