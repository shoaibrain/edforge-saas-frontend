/**
 * Organization Settings Page
 *
 * Displays the education organization hierarchy tree with SEA → LEA → School structure.
 * Includes quick actions for creating orgs and stats overview.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2,
  Landmark,
  School,
  Plus,
  GraduationCap,
  Briefcase,
  Network,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@edforge/ui'
import { usePermission } from '@edforge/abac'
import { useOrganizationHierarchy, useStateEducationAgency } from '@/hooks/useEducationOrgs'
import {
  SettingsPageHeader,
  SettingsSkeleton,
  SettingsEmptyState,
  staggerChildren,
  fadeInUp,
} from '@/components/settings/SettingsShared'
import { OrganizationHierarchyTree } from '@/components/settings/OrganizationHierarchyTree'
import { OrphanedSchoolsBanner } from '@/components/settings/OrphanedSchoolsBanner'
import type { HierarchyNode } from '@aibrains/shared-types'

// ============================================================================
// STAT CARD
// ============================================================================

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  delay = 0,
}: {
  icon: LucideIcon
  label: string
  value: number | string
  color: string
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.08, type: 'spring', stiffness: 300, damping: 25 }}
      className="flex items-center gap-3 p-4 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))]"
    >
      <div className={`p-2.5 rounded-lg ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-[rgb(var(--text-primary))]">{value}</p>
        <p className="text-xs text-[rgb(var(--text-tertiary))]">{label}</p>
      </div>
    </motion.div>
  )
}

// ============================================================================
// TAB BUTTON
// ============================================================================

type TabId = 'hierarchy' | 'details'

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
          ? 'text-teal-600 dark:text-teal-400'
          : 'text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))]'
      }`}
      role="tab"
      aria-selected={isActive}
    >
      {label}
      {isActive && (
        <motion.div
          layoutId="org-tab-indicator"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-500 rounded-full"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
    </button>
  )
}

// ============================================================================
// EMPTY STATE (No Hierarchy)
// ============================================================================

function OrgEmptyState() {
  const canManage = usePermission('manage', 'education-organizations')

  return (
    <div className="relative min-h-[calc(100vh-300px)] flex flex-col">
      {/* Gradient background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl" />
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
            <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-teal-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
              <Network className="w-14 h-14 text-white" strokeWidth={1.5} />
            </div>
            <motion.div
              className="absolute inset-0 rounded-2xl border-2 border-indigo-400/40"
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
            <Button className="gap-2 bg-gradient-to-r from-indigo-500 to-teal-600 hover:from-indigo-600 hover:to-teal-700 shadow-lg shadow-indigo-500/25">
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

  const {
    data: hierarchy,
    isLoading: hierarchyLoading,
    isError: hierarchyError,
  } = useOrganizationHierarchy()

  const { data: sea } = useStateEducationAgency()

  // Compute stats from hierarchy
  const stats = {
    totalOrgs: 0,
    activeSchools: 0,
    students: 0,
    staff: 0,
  }

  if (hierarchy) {
    const countOrgs = (node: HierarchyNode) => {
      stats.totalOrgs++
      if (node.type === 'school') stats.activeSchools++
      if (node.studentCount) stats.students += node.studentCount
      if (node.staffCount) stats.staff += node.staffCount
      node.children?.forEach(countOrgs)
    }
    if (hierarchy.sea) countOrgs(hierarchy.sea)
    hierarchy.educationServiceCenters?.forEach(countOrgs)
    hierarchy.unassigned?.forEach((s) => {
      stats.totalOrgs++
      stats.activeSchools++
      if (s.studentCount) stats.students += s.studentCount
      if (s.staffCount) stats.staff += s.staffCount
    })
  }

  const hasNoData =
    !hierarchyLoading &&
    !hierarchy?.sea &&
    (!hierarchy?.educationServiceCenters || hierarchy.educationServiceCenters.length === 0) &&
    (!hierarchy?.unassigned || hierarchy.unassigned.length === 0)

  if (hasNoData && !hierarchyError) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <OrgEmptyState />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerChildren}
        className="space-y-6"
      >
        {/* Header */}
        <SettingsPageHeader
          title="Organization Structure"
          description="Manage your education organization hierarchy — SEA, Districts, Service Centers, and Schools"
          icon={Building2}
          action={
            canManage ? (
              <div className="flex items-center gap-2">
                {!sea && (
                  <Button size="sm" variant="ghost" className="gap-1.5">
                    <Landmark className="w-4 h-4" />
                    Set Up SEA
                  </Button>
                )}
                <Button size="sm" variant="ghost" className="gap-1.5">
                  <Plus className="w-4 h-4" />
                  Add District
                </Button>
                <Button size="sm" variant="ghost" className="gap-1.5">
                  <Plus className="w-4 h-4" />
                  Add Service Center
                </Button>
              </div>
            ) : undefined
          }
        />

        {/* Stats Bar */}
        {!hierarchyLoading && !hasNoData && (
          <motion.div variants={fadeInUp} className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={Building2} label="Total Orgs" value={stats.totalOrgs} color="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" delay={0} />
            <StatCard icon={School} label="Active Schools" value={stats.activeSchools} color="bg-teal-500/10 text-teal-600 dark:text-teal-400" delay={1} />
            <StatCard icon={GraduationCap} label="Students" value={stats.students.toLocaleString()} color="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" delay={2} />
            <StatCard icon={Briefcase} label="Staff" value={stats.staff.toLocaleString()} color="bg-amber-500/10 text-amber-600 dark:text-amber-400" delay={3} />
          </motion.div>
        )}

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
              {hierarchyLoading ? (
                <SettingsSkeleton rows={6} showHeader={false} />
              ) : hierarchy ? (
                <OrganizationHierarchyTree
                  sea={hierarchy.sea}
                  educationServiceCenters={hierarchy.educationServiceCenters || []}
                  unassigned={hierarchy.unassigned || []}
                />
              ) : null}
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
                <div className="p-5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))]">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-indigo-500/10">
                      <Landmark className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))]">
                        State Education Agency
                      </h3>
                      <p className="text-xs text-[rgb(var(--text-tertiary))]">Root organization</p>
                    </div>
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
                          className="font-medium text-teal-600 dark:text-teal-400 hover:underline"
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
                      <Button size="sm" className="gap-1.5">
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
    </div>
  )
}
