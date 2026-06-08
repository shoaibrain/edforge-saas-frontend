/**
 * School Assignment Manager
 *
 * Comprehensive modal for managing school-to-LEA assignments.
 * Supports filtering, search, bulk selection, and reassignment.
 * Can operate in two modes: orphaned-only (legacy) or all schools.
 */

import { useState, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  School,
  Building2,
  Check,
  X,
  Search,
  Filter,
} from 'lucide-react'
import { Button } from '@edforge/ui'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { extractApiErrorMessage } from '@edforge/api-client'
import { cn } from '@/lib/utils'
import { apiPatch } from '@/lib/api'
import { useLocalEducationAgencies, edOrgKeys } from '@/hooks/useEducationOrgs'
import type { HierarchyNode } from '@aibrains/shared-types'

// ============================================================================
// TYPES
// ============================================================================

export interface SchoolAssignmentManagerProps {
  open: boolean
  onClose: () => void
  schools: HierarchyNode[]
  mode?: 'orphaned-only' | 'all'
}

interface SchoolAssignment {
  schoolId: string
  schoolName: string
  currentLeaId: string | null
  newLeaId: string | null
  selected: boolean
}

type FilterType = 'all' | 'unassigned' | string // string for specific LEA ID

// ============================================================================
// COMPONENT
// ============================================================================

export function SchoolAssignmentManager({
  open,
  onClose,
  schools,
  mode = 'all',
}: SchoolAssignmentManagerProps) {
  const queryClient = useQueryClient()
  const { data: leasData } = useLocalEducationAgencies()
  const leas = leasData?.items || []

  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [assignments, setAssignments] = useState<SchoolAssignment[]>([])

  // Initialize assignments from schools when modal opens
  useMemo(() => {
    if (open) {
      setAssignments(
        schools.map((s) => ({
          schoolId: s.id,
          schoolName: s.name,
          // In hierarchy, we don't have direct currentLeaId access
          // This would need to be enhanced to fetch or track parent LEA
          currentLeaId: null,
          newLeaId: null,
          selected: false,
        }))
      )
      setSearchTerm('')
      setFilterType(mode === 'orphaned-only' ? 'unassigned' : 'all')
    }
  }, [open, schools, mode])

  const assignMutation = useMutation({
    mutationFn: async (schoolAssignments: SchoolAssignment[]) => {
      const toAssign = schoolAssignments.filter(
        (a) => a.selected && a.newLeaId !== a.currentLeaId
      )
      await Promise.all(
        toAssign.map((a) =>
          apiPatch(`/schools/${a.schoolId}`, { localEducationAgencyId: a.newLeaId })
        )
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: edOrgKeys.hierarchy() })
      queryClient.invalidateQueries({ queryKey: ['schools'] })
      toast.success('Schools assigned successfully')
      onClose()
    },
    onError: (error: Error) => {
      toast.error(extractApiErrorMessage(error))
    },
  })

  const updateAssignment = useCallback((schoolId: string, leaId: string | null) => {
    setAssignments((prev) =>
      prev.map((a) => (a.schoolId === schoolId ? { ...a, newLeaId: leaId } : a))
    )
  }, [])

  const toggleSelection = useCallback((schoolId: string) => {
    setAssignments((prev) =>
      prev.map((a) => (a.schoolId === schoolId ? { ...a, selected: !a.selected } : a))
    )
  }, [])

  const toggleSelectAll = useCallback(() => {
    const allSelected = filteredAssignments.every((a) => a.selected)
    setAssignments((prev) =>
      prev.map((a) => {
        if (filteredAssignments.find((fa) => fa.schoolId === a.schoolId)) {
          return { ...a, selected: !allSelected }
        }
        return a
      })
    )
  }, [assignments])

  const bulkAssign = useCallback((leaId: string | null) => {
    setAssignments((prev) =>
      prev.map((a) => (a.selected ? { ...a, newLeaId: leaId } : a))
    )
  }, [])

  // Filtered and searched assignments
  const filteredAssignments = useMemo(() => {
    let filtered = assignments

    // Apply filter
    if (filterType === 'unassigned') {
      filtered = filtered.filter((a) => !a.currentLeaId)
    } else if (filterType !== 'all') {
      // Filter by specific LEA
      filtered = filtered.filter((a) => a.currentLeaId === filterType)
    }

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter((a) =>
        a.schoolName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return filtered
  }, [assignments, filterType, searchTerm])

  const selectedCount = filteredAssignments.filter((a) => a.selected).length
  const changedCount = assignments.filter(
    (a) => a.selected && a.newLeaId !== a.currentLeaId
  ).length
  const allFilteredSelected =
    filteredAssignments.length > 0 && filteredAssignments.every((a) => a.selected)

  const handleSubmit = () => {
    if (changedCount === 0) {
      toast.error('No changes to apply')
      return
    }
    assignMutation.mutate(assignments)
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-[rgb(var(--background-overlay)/0.50)] backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className={cn(
          'fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
          'w-full max-w-4xl max-h-[85vh] overflow-hidden',
          'rounded-2xl border border-[rgb(var(--border-primary))]',
          'bg-[rgb(var(--background-primary))] shadow-2xl'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[rgb(var(--border-primary))]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[rgb(var(--state-info-bg)/0.18)]">
              <School className="w-5 h-5 text-[rgb(var(--state-info-fg))] " />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                Manage School Assignments
              </h2>
              <p className="text-sm text-[rgb(var(--text-tertiary))]">
                Assign schools to districts (LEAs) for Ed-Fi reporting
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[rgb(var(--background-tertiary))] transition-colors"
          >
            <X className="w-5 h-5 text-[rgb(var(--text-tertiary))]" />
          </button>
        </div>

        {/* Filters and Search */}
        <div className="flex items-center gap-3 p-4 border-b border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))]">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--text-tertiary))]" />
            <input
              type="text"
              placeholder="Search schools..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(
                'w-full pl-9 pr-3 py-2 text-sm rounded-lg border',
                'bg-[rgb(var(--background-primary))] border-[rgb(var(--border-primary))]',
                'text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))]',
                'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)] focus:border-[rgb(var(--border-focus))]'
              )}
            />
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={cn(
                'px-3 py-2 text-sm rounded-lg border',
                'bg-[rgb(var(--background-primary))] border-[rgb(var(--border-primary))]',
                'text-[rgb(var(--text-primary))]',
                'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)] focus:border-[rgb(var(--border-focus))]'
              )}
            >
              <option value="all">All Schools</option>
              <option value="unassigned">Unassigned Only</option>
              {leas.map((lea) => (
                <option key={lea.id} value={lea.id}>
                  {lea.nameOfInstitution}
                </option>
              ))}
            </select>
          </div>

          {/* Bulk Actions */}
          {selectedCount > 0 && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-[rgb(var(--text-tertiary))]">
                {selectedCount} selected
              </span>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    bulkAssign(e.target.value || null)
                    e.target.value = ''
                  }
                }}
                className={cn(
                  'px-3 py-1.5 text-xs rounded-lg border',
                  'bg-[rgb(var(--action-primary-bg))]/10 border-[rgb(var(--border-focus)/0.35)]',
                  'text-[rgb(var(--state-info-fg))] ',
                  'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)]'
                )}
              >
                <option value="">Bulk Assign To...</option>
                <option value="">None (Unassign)</option>
                {leas.map((lea) => (
                  <option key={lea.id} value={lea.id}>
                    {lea.nameOfInstitution}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-y-auto max-h-[50vh]">
          {leas.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-10 h-10 text-[rgb(var(--text-tertiary))] mx-auto mb-3" />
              <p className="text-sm text-[rgb(var(--text-secondary))]">
                No districts available. Create a Local Education Agency first.
              </p>
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="text-center py-12">
              <School className="w-10 h-10 text-[rgb(var(--text-tertiary))] mx-auto mb-3" />
              <p className="text-sm text-[rgb(var(--text-secondary))]">
                No schools match your filters.
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="sticky top-0 bg-[rgb(var(--background-secondary))] border-b border-[rgb(var(--border-primary))]">
                <tr>
                  <th className="text-left p-3 text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      onChange={toggleSelectAll}
                      className="rounded border-[rgb(var(--border-primary))] text-[rgb(var(--action-secondary-fg))] focus:ring-[rgb(var(--border-focus)/0.35)]"
                    />
                  </th>
                  <th className="text-left p-3 text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase tracking-wider">
                    School Name
                  </th>
                  <th className="text-left p-3 text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase tracking-wider">
                    Current District
                  </th>
                  <th className="text-left p-3 text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase tracking-wider">
                    New Assignment
                  </th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody>
                {filteredAssignments.map((assignment) => {
                  const hasChange = assignment.newLeaId !== assignment.currentLeaId
                  const currentLea = leas.find((l) => l.id === assignment.currentLeaId)

                  return (
                    <tr
                      key={assignment.schoolId}
                      className={cn(
                        'border-b border-[rgb(var(--border-primary))] transition-colors',
                        assignment.selected && 'bg-[rgb(var(--action-primary-bg))]/5',
                        hasChange && 'bg-[rgb(var(--action-primary-bg))]/10'
                      )}
                    >
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={assignment.selected}
                          onChange={() => toggleSelection(assignment.schoolId)}
                          className="rounded border-[rgb(var(--border-primary))] text-[rgb(var(--action-secondary-fg))] focus:ring-[rgb(var(--border-focus)/0.35)]"
                        />
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <School className="w-4 h-4 text-[rgb(var(--state-info-fg))]  shrink-0" />
                          <span className="text-sm font-medium text-[rgb(var(--text-primary))] truncate">
                            {assignment.schoolName}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="text-sm text-[rgb(var(--text-secondary))]">
                          {currentLea?.nameOfInstitution || (
                            <span className="text-amber-600 dark:text-amber-400">Unassigned</span>
                          )}
                        </span>
                      </td>
                      <td className="p-3">
                        <select
                          value={assignment.newLeaId || ''}
                          onChange={(e) =>
                            updateAssignment(assignment.schoolId, e.target.value || null)
                          }
                          disabled={assignMutation.isPending}
                          className={cn(
                            'w-full px-2 py-1.5 text-sm rounded border',
                            'bg-[rgb(var(--background-secondary))] border-[rgb(var(--border-primary))]',
                            'text-[rgb(var(--text-primary))]',
                            'focus:outline-none focus:border-[rgb(var(--border-focus))] focus:ring-1 focus:ring-[rgb(var(--border-focus)/0.35)]',
                            'disabled:opacity-50 disabled:cursor-not-allowed'
                          )}
                        >
                          <option value="">None</option>
                          {leas.map((lea) => (
                            <option key={lea.id} value={lea.id}>
                              {lea.nameOfInstitution}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3 text-center">
                        {hasChange && assignment.selected && (
                          <Check className="w-4 h-4 text-[rgb(var(--action-secondary-fg))] mx-auto" />
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-[rgb(var(--border-primary))]">
          <div className="text-sm text-[rgb(var(--text-tertiary))]">
            {selectedCount > 0 ? (
              <span>
                {selectedCount} selected • {changedCount} changes ready
              </span>
            ) : (
              <span>
                {filteredAssignments.length} of {assignments.length} schools shown
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} disabled={assignMutation.isPending}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={changedCount === 0 || assignMutation.isPending}
              isLoading={assignMutation.isPending}
            >
              Apply Changes {changedCount > 0 && `(${changedCount})`}
            </Button>
          </div>
        </div>
      </motion.div>
    </>
  )
}

export default SchoolAssignmentManager
