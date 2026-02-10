/**
 * Orphaned Schools Banner
 *
 * Shows a warning banner when schools are not assigned to any LEA.
 * Includes a modal for bulk-assigning schools to districts.
 */

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  School,
  Building2,
  ArrowRight,
  Check,
  X,
} from 'lucide-react'
import { Button } from '@edforge/ui'
import { usePermission } from '@edforge/abac'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { apiPatch } from '@/lib/api'
import { useLocalEducationAgencies, edOrgKeys } from '@/hooks/useEducationOrgs'
import type { HierarchyNode } from '@aibrains/shared-types'

// ============================================================================
// TYPES
// ============================================================================

interface SchoolAssignment {
  schoolId: string
  schoolName: string
  leaId: string | null
}

// ============================================================================
// ORPHANED SCHOOLS BANNER
// ============================================================================

export interface OrphanedSchoolsBannerProps {
  orphanedSchools: HierarchyNode[]
}

export function OrphanedSchoolsBanner({ orphanedSchools }: OrphanedSchoolsBannerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const canManage = usePermission('manage', 'education-organizations')

  if (orphanedSchools.length === 0) return null

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'flex items-center gap-3 p-4 rounded-xl border',
          'bg-amber-500/5 border-amber-500/20'
        )}
      >
        <div className="p-2 rounded-lg bg-amber-500/10">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
            {orphanedSchools.length} {orphanedSchools.length === 1 ? 'school is' : 'schools are'} not
            assigned to a district
          </p>
          <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-0.5">
            Assign schools to a Local Education Agency (LEA) for proper Ed-Fi reporting.
          </p>
        </div>
        {canManage && (
          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10"
            onClick={() => setIsModalOpen(true)}
          >
            Assign Schools
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </motion.div>

      {/* Assignment Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <AssignSchoolsModal
            orphanedSchools={orphanedSchools}
            onClose={() => setIsModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}

// ============================================================================
// ASSIGN SCHOOLS MODAL
// ============================================================================

function AssignSchoolsModal({
  orphanedSchools,
  onClose,
}: {
  orphanedSchools: HierarchyNode[]
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const { data: leasData } = useLocalEducationAgencies()
  const leas = leasData?.items || []

  const [assignments, setAssignments] = useState<SchoolAssignment[]>(
    orphanedSchools.map((s) => ({ schoolId: s.id, schoolName: s.name, leaId: null }))
  )

  const assignMutation = useMutation({
    mutationFn: async (schoolAssignments: SchoolAssignment[]) => {
      const toAssign = schoolAssignments.filter((a) => a.leaId)
      await Promise.all(
        toAssign.map((a) =>
          apiPatch(`/schools/${a.schoolId}`, { localEducationAgencyId: a.leaId })
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
      toast.error(error.message || 'Failed to assign schools')
    },
  })

  const updateAssignment = useCallback((schoolId: string, leaId: string | null) => {
    setAssignments((prev) =>
      prev.map((a) => (a.schoolId === schoolId ? { ...a, leaId } : a))
    )
  }, [])

  const assignedCount = assignments.filter((a) => a.leaId).length

  const handleSubmit = () => {
    if (assignedCount === 0) {
      toast.error('Select at least one district assignment')
      return
    }
    assignMutation.mutate(assignments)
  }

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
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
          'w-full max-w-2xl max-h-[80vh] overflow-hidden',
          'rounded-2xl border border-[rgb(var(--border-primary))]',
          'bg-[rgb(var(--surface-primary))] shadow-2xl'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[rgb(var(--border-primary))]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <School className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                Assign Schools to Districts
              </h2>
              <p className="text-sm text-[rgb(var(--text-tertiary))]">
                Select a district (LEA) for each unassigned school
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[rgb(var(--surface-tertiary))] transition-colors"
          >
            <X className="w-5 h-5 text-[rgb(var(--text-tertiary))]" />
          </button>
        </div>

        {/* Table */}
        <div className="overflow-y-auto max-h-[50vh] p-6">
          {leas.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="w-10 h-10 text-[rgb(var(--text-tertiary))] mx-auto mb-3" />
              <p className="text-sm text-[rgb(var(--text-secondary))]">
                No districts available. Create a Local Education Agency first.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {assignments.map((assignment) => (
                <div
                  key={assignment.schoolId}
                  className={cn(
                    'flex items-center gap-4 p-3 rounded-xl border transition-colors',
                    assignment.leaId
                      ? 'border-teal-500/20 bg-teal-500/5'
                      : 'border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))]'
                  )}
                >
                  {/* School name */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <School className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                    <span className="text-sm font-medium text-[rgb(var(--text-primary))] truncate">
                      {assignment.schoolName}
                    </span>
                  </div>

                  {/* Arrow */}
                  <ArrowRight className="w-4 h-4 text-[rgb(var(--text-tertiary))] shrink-0" />

                  {/* LEA Dropdown */}
                  <select
                    value={assignment.leaId || ''}
                    onChange={(e) =>
                      updateAssignment(assignment.schoolId, e.target.value || null)
                    }
                    className={cn(
                      'w-48 px-3 py-2 text-sm rounded-lg border',
                      'bg-[rgb(var(--surface-secondary))] border-[rgb(var(--border-primary))]',
                      'text-[rgb(var(--text-primary))]',
                      'focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30'
                    )}
                  >
                    <option value="">Select district...</option>
                    {leas.map((lea) => (
                      <option key={lea.id} value={lea.id}>
                        {lea.nameOfInstitution}
                      </option>
                    ))}
                  </select>

                  {/* Check indicator */}
                  {assignment.leaId && (
                    <Check className="w-4 h-4 text-teal-500 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-[rgb(var(--border-primary))]">
          <span className="text-sm text-[rgb(var(--text-tertiary))]">
            {assignedCount} of {assignments.length} schools assigned
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={assignedCount === 0 || assignMutation.isPending}
              isLoading={assignMutation.isPending}
            >
              Assign {assignedCount > 0 ? `${assignedCount} Schools` : 'Schools'}
            </Button>
          </div>
        </div>
      </motion.div>
    </>
  )
}

export default OrphanedSchoolsBanner
