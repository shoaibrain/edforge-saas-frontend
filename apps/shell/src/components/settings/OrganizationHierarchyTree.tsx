/**
 * Organization Hierarchy Tree
 *
 * Interactive tree visualization for SEA → ESC → LEA → Schools.
 * Supports expand/collapse, search/filter, keyboard nav, and accessibility.
 */

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/react'
import {
  ChevronRight,
  Building2,
  Landmark,
  School,
  MapPin,
  Search,
  ChevronsUpDown,
  ChevronsDownUp,
  GraduationCap,
  Briefcase,
  MoreHorizontal,
  Eye,
  Pencil,
  Plus,
  Trash2,
  X,
  ArrowRightLeft,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@edforge/ui'
import { cn } from '@/lib/utils'
import type { HierarchyNode } from '@aibrains/shared-types'
import { SettingsSkeleton, SettingsEmptyState } from './SettingsShared'

// ============================================================================
// ACTION TYPES
// ============================================================================

export type TreeNodeAction = 'edit' | 'view-details' | 'add-child' | 'delete' | 'change-district' | 'unassign-school'

// ============================================================================
// CONSTANTS
// ============================================================================

const ORG_TYPE_CONFIG: Record<
  string,
  { label: string; icon: LucideIcon; color: string; bgColor: string; borderColor: string }
> = {
  stateEducationAgency: {
    label: 'SEA',
    icon: Landmark,
    color: 'text-[rgb(var(--state-info-fg))] ',
    bgColor: 'bg-[rgb(var(--state-info-bg)/0.18)]',
    borderColor: 'border-[rgb(var(--state-info-border)/0.35)]',
  },
  localEducationAgency: {
    label: 'LEA',
    icon: Building2,
    color: 'text-[rgb(var(--action-secondary-fg))] ',
    bgColor: 'bg-[rgb(var(--action-primary-bg))]/10',
    borderColor: 'border-[rgb(var(--border-focus)/0.35)]',
  },
  educationServiceCenter: {
    label: 'ESC',
    icon: MapPin,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
  },
  school: {
    label: 'School',
    icon: School,
    color: 'text-[rgb(var(--state-info-fg))] ',
    bgColor: 'bg-[rgb(var(--state-info-bg)/0.18)]',
    borderColor: 'border-[rgb(var(--state-info-border)/0.35)]',
  },
}

const STATUS_CONFIG: Record<string, { dot: string; label: string }> = {
  Active: { dot: 'bg-[rgb(var(--state-success-fg))]', label: 'Active' },
  active: { dot: 'bg-[rgb(var(--state-success-fg))]', label: 'Active' },
  Setup: { dot: 'bg-amber-500', label: 'Setup' },
  setup: { dot: 'bg-amber-500', label: 'Setup' },
  Inactive: { dot: 'bg-[rgb(var(--text-tertiary))]', label: 'Inactive' },
  inactive: { dot: 'bg-[rgb(var(--text-tertiary))]', label: 'Inactive' },
  Suspended: { dot: 'bg-[rgb(var(--state-warning-bg)/0.18)]0', label: 'Suspended' },
  suspended: { dot: 'bg-[rgb(var(--state-warning-bg)/0.18)]0', label: 'Suspended' },
  Closed: { dot: 'bg-[rgb(var(--state-danger-bg)/0.18)]0', label: 'Closed' },
  closed: { dot: 'bg-[rgb(var(--state-danger-bg)/0.18)]0', label: 'Closed' },
  Added: { dot: 'bg-[rgb(var(--state-info-bg)/0.18)]0', label: 'Added' },
  added: { dot: 'bg-[rgb(var(--state-info-bg)/0.18)]0', label: 'Added' },
  New: { dot: 'bg-violet-500', label: 'New' },
  new: { dot: 'bg-violet-500', label: 'New' },
}

const springTransition = { type: 'spring' as const, stiffness: 300, damping: 25 }

// ============================================================================
// TYPE BADGE
// ============================================================================

function TypeBadge({ type }: { type: string }) {
  const config = ORG_TYPE_CONFIG[type] || {
    label: type,
    icon: Building2,
    color: 'text-[rgb(var(--text-secondary))] dark:text-[rgb(var(--text-tertiary))]',
    bgColor: 'bg-[rgb(var(--background-tertiary))]0/10',
    borderColor: 'border-[rgb(var(--border-secondary))]',
  }
  const Icon = config.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wider border',
        config.bgColor,
        config.color,
        config.borderColor
      )}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  )
}

// ============================================================================
// STATUS DOT
// ============================================================================

function StatusDot({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || { dot: 'bg-[rgb(var(--text-tertiary))]', label: status }

  return (
    <span className="inline-flex items-center gap-1.5" title={config.label}>
      <span className={cn('w-2 h-2 rounded-full', config.dot)} />
      <span className="text-xs text-[rgb(var(--text-tertiary))]">{config.label}</span>
    </span>
  )
}

// ============================================================================
// COUNT PILL
// ============================================================================

function CountPill({ icon: Icon, count, label }: { icon: LucideIcon; count?: number; label: string }) {
  if (count === undefined || count === null) return null
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs text-[rgb(var(--text-tertiary))] bg-[rgb(var(--background-tertiary))]"
      title={`${count} ${label}`}
    >
      <Icon className="w-3 h-3" />
      {count}
    </span>
  )
}

// ============================================================================
// TREE NODE ACTION MENU
// ============================================================================

function TreeNodeActionMenu({
  node,
  onAction,
}: {
  node: HierarchyNode
  onAction: (action: TreeNodeAction, node: HierarchyNode) => void
}) {
  const actions: { action: TreeNodeAction; label: string; icon: LucideIcon; destructive?: boolean }[] = []

  // All types can view details
  actions.push({ action: 'view-details', label: 'View Details', icon: Eye })

  // SEA, LEA, ESC can be edited (not schools — managed on their own page)
  if (node.type !== 'school') {
    actions.push({ action: 'edit', label: 'Edit', icon: Pencil })
  }

  // Schools can change district or be unassigned
  if (node.type === 'school') {
    actions.push({ action: 'change-district', label: 'Change District', icon: ArrowRightLeft })
    actions.push({ action: 'unassign-school', label: 'Unassign from District', icon: X, destructive: true })
  }

  // LEA can add schools
  if (node.type === 'localEducationAgency') {
    actions.push({ action: 'add-child', label: 'Add School', icon: Plus })
  }

  // LEA and ESC can be deleted (not SEA, not schools from here)
  if (node.type === 'localEducationAgency' || node.type === 'educationServiceCenter') {
    actions.push({ action: 'delete', label: 'Delete', icon: Trash2, destructive: true })
  }

  return (
    <Menu as="div" className="relative">
      <MenuButton
        className="p-1 rounded-md hover:bg-[rgb(var(--background-tertiary))] opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <MoreHorizontal className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
      </MenuButton>

      <MenuItems
        anchor="bottom end"
        transition
        className="z-50 w-52 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-primary))] shadow-lg focus:outline-none overflow-hidden origin-top-right transition duration-100 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
      >
        <div className="py-1">
          {actions.map(({ action, label, icon: Icon, destructive }) => (
            <MenuItem key={action}>
              {({ focus }) => (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onAction(action, node)
                  }}
                  className={cn(
                    'flex items-center gap-2 w-full px-3 py-2 text-sm',
                    focus && 'bg-[rgb(var(--background-tertiary))]',
                    destructive
                      ? 'text-[rgb(var(--state-danger-fg))] dark:text-[rgb(var(--state-danger-fg))]'
                      : 'text-[rgb(var(--text-secondary))]'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              )}
            </MenuItem>
          ))}
        </div>
      </MenuItems>
    </Menu>
  )
}

// ============================================================================
// TREE NODE
// ============================================================================

interface TreeNodeProps {
  node: HierarchyNode
  depth: number
  expandedIds: Set<string>
  onToggle: (id: string) => void
  searchTerm: string
  onNodeAction?: (action: TreeNodeAction, node: HierarchyNode) => void
}

function TreeNode({ node, depth, expandedIds, onToggle, searchTerm, onNodeAction }: TreeNodeProps) {
  const isExpanded = expandedIds.has(node.id)
  const hasChildren = node.children && node.children.length > 0
  const config = ORG_TYPE_CONFIG[node.type]

  // Auto-collapse large groups by default (handled in parent)
  const matchesSearch =
    !searchTerm ||
    node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (node.edfiId !== undefined && String(node.edfiId).includes(searchTerm))

  // Check if any descendant matches
  const descendantMatches = useMemo(() => {
    if (!searchTerm) return true
    const checkDescendants = (n: HierarchyNode): boolean => {
      if (n.name.toLowerCase().includes(searchTerm.toLowerCase())) return true
      return n.children?.some(checkDescendants) ?? false
    }
    return checkDescendants(node)
  }, [node, searchTerm])

  if (searchTerm && !matchesSearch && !descendantMatches) return null

  return (
    <div role="treeitem" aria-expanded={hasChildren ? isExpanded : undefined}>
      {/* Node Row */}
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ ...springTransition, delay: depth * 0.02 }}
        className={cn(
          'group flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer',
          'hover:bg-[rgb(var(--background-tertiary))] transition-colors',
          searchTerm && matchesSearch && 'bg-[rgb(var(--action-primary-bg))]/5'
        )}
        style={{ paddingLeft: `${depth * 24 + 12}px` }}
        onClick={() => hasChildren && onToggle(node.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            if (hasChildren) onToggle(node.id)
          }
        }}
        tabIndex={0}
        role="button"
        aria-label={`${node.name} - ${config?.label || node.type}`}
      >
        {/* Expand/Collapse Arrow */}
        <div className="w-5 h-5 flex items-center justify-center shrink-0">
          {hasChildren ? (
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={springTransition}
            >
              <ChevronRight className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
            </motion.div>
          ) : (
            <div className="w-1 h-1 rounded-full bg-[rgb(var(--text-tertiary))] opacity-40" />
          )}
        </div>

        {/* Type Badge */}
        <TypeBadge type={node.type} />

        {/* Name */}
        <span className="text-sm font-medium text-[rgb(var(--text-primary))] truncate flex-1" title={node.name}>
          {node.name}
        </span>

        {/* Ed-Fi ID */}
        {node.edfiId !== undefined && (
          <span className="text-xs text-[rgb(var(--text-tertiary))] font-mono opacity-0 group-hover:opacity-100 transition-opacity">
            #{node.edfiId}
          </span>
        )}

        {/* Status */}
        <StatusDot status={node.status} />

        {/* Count Pills */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <CountPill icon={School} count={node.schoolCount} label="schools" />
          <CountPill icon={GraduationCap} count={node.studentCount} label="students" />
          <CountPill icon={Briefcase} count={node.staffCount} label="staff" />
        </div>

        {/* Action Menu */}
        {onNodeAction && (
          <TreeNodeActionMenu node={node} onAction={onNodeAction} />
        )}
      </motion.div>

      {/* Children */}
      <AnimatePresence initial={false}>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            role="group"
          >
            {node.children.map((child) => (
              <TreeNode
                key={child.id}
                node={child}
                depth={depth + 1}
                expandedIds={expandedIds}
                onToggle={onToggle}
                searchTerm={searchTerm}
                onNodeAction={onNodeAction}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================================================
// ORGANIZATION HIERARCHY TREE (Main Component)
// ============================================================================

export interface OrganizationHierarchyTreeProps {
  sea: HierarchyNode | null
  educationServiceCenters: HierarchyNode[]
  unassigned: HierarchyNode[]
  isLoading?: boolean
  onNodeAction?: (action: TreeNodeAction, node: HierarchyNode) => void
}

export function OrganizationHierarchyTree({
  sea,
  educationServiceCenters,
  unassigned,
  isLoading,
  onNodeAction,
}: OrganizationHierarchyTreeProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    // Auto-expand top-level nodes (SEA + LEAs under SEA)
    const initial = new Set<string>()
    if (sea) {
      initial.add(sea.id)
      sea.children?.forEach((child) => {
        // Expand LEAs but collapse schools under them if > 20
        initial.add(child.id)
      })
    }
    educationServiceCenters.forEach((esc) => initial.add(esc.id))
    return initial
  })

  const toggleNode = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const expandAll = useCallback(() => {
    const allIds = new Set<string>()
    const collect = (node: HierarchyNode) => {
      allIds.add(node.id)
      node.children?.forEach(collect)
    }
    if (sea) collect(sea)
    educationServiceCenters.forEach(collect)
    unassigned.forEach(collect)
    setExpandedIds(allIds)
  }, [sea, educationServiceCenters, unassigned])

  const collapseAll = useCallback(() => {
    setExpandedIds(new Set())
  }, [])

  const totalNodes = useMemo(() => {
    let count = 0
    const countNodes = (node: HierarchyNode) => {
      count++
      node.children?.forEach(countNodes)
    }
    if (sea) countNodes(sea)
    educationServiceCenters.forEach(countNodes)
    unassigned.forEach(() => count++)
    return count
  }, [sea, educationServiceCenters, unassigned])

  const allExpandableIds = useMemo(() => {
    const ids = new Set<string>()
    const collect = (node: HierarchyNode) => {
      if (node.children?.length) { ids.add(node.id); node.children.forEach(collect) }
    }
    if (sea) collect(sea)
    educationServiceCenters.forEach(collect)
    return ids
  }, [sea, educationServiceCenters])

  const isAllExpanded = useMemo(() => {
    if (allExpandableIds.size === 0) return false
    for (const id of allExpandableIds) { if (!expandedIds.has(id)) return false }
    return true
  }, [allExpandableIds, expandedIds])

  if (isLoading) {
    return <SettingsSkeleton rows={5} showHeader={false} />
  }

  if (!sea && educationServiceCenters.length === 0 && unassigned.length === 0) {
    return (
      <SettingsEmptyState
        icon={Building2}
        title="No organization hierarchy"
        description="Set up your State Education Agency to get started building your organizational structure."
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--text-tertiary))]" />
          <input
            type="text"
            placeholder="Search organizations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(
              'w-full pl-9 pr-3 py-2 text-sm rounded-lg',
              'bg-[rgb(var(--background-secondary))] border border-[rgb(var(--border-primary))]',
              'text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))]',
              'focus:outline-none focus:border-[rgb(var(--border-focus))] focus:ring-1 focus:ring-[rgb(var(--border-focus)/0.35)]',
              'transition-colors'
            )}
            aria-label="Search organizations"
          />
        </div>

        {/* Expand/Collapse Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={isAllExpanded ? collapseAll : expandAll}
          title={isAllExpanded ? 'Collapse All' : 'Expand All'}
        >
          {isAllExpanded
            ? <ChevronsDownUp className="w-4 h-4" />
            : <ChevronsUpDown className="w-4 h-4" />}
        </Button>

        {/* Count */}
        <span className="text-xs text-[rgb(var(--text-tertiary))]">
          {totalNodes} {totalNodes === 1 ? 'organization' : 'organizations'}
        </span>
      </div>

      {/* Tree */}
      <div
        role="tree"
        aria-label="Organization hierarchy"
        className="rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] p-2"
      >
        {/* SEA + Children */}
        {sea && (
          <TreeNode
            node={sea}
            depth={0}
            expandedIds={expandedIds}
            onToggle={toggleNode}
            searchTerm={searchTerm}
            onNodeAction={onNodeAction}
          />
        )}

        {/* ESCs */}
        {educationServiceCenters.length > 0 && (
          <>
            {sea && (
              <div className="my-2 mx-3 border-t border-[rgb(var(--border-primary))]" />
            )}
            <div className="px-3 py-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--text-tertiary))]">
                Education Service Centers
              </span>
            </div>
            {educationServiceCenters.map((esc) => (
              <TreeNode
                key={esc.id}
                node={esc}
                depth={0}
                expandedIds={expandedIds}
                onToggle={toggleNode}
                searchTerm={searchTerm}
                onNodeAction={onNodeAction}
              />
            ))}
          </>
        )}

        {/* Unassigned Schools */}
        {unassigned.length > 0 && (
          <>
            <div className="my-2 mx-3 border-t border-[rgb(var(--border-primary))]" />
            <div className="px-3 py-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Unassigned Schools ({unassigned.length})
              </span>
            </div>
            {unassigned.map((school) => (
              <TreeNode
                key={school.id}
                node={school}
                depth={0}
                expandedIds={expandedIds}
                onToggle={toggleNode}
                searchTerm={searchTerm}
                onNodeAction={onNodeAction}
              />
            ))}
          </>
        )}
      </div>
    </div>
  )
}

export default OrganizationHierarchyTree
