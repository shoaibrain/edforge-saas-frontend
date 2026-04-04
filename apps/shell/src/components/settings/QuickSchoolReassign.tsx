/**
 * Quick School Reassign Modal
 *
 * Lightweight modal for single-school reassignment from context menu.
 * Allows changing a school's district assignment or unassigning it entirely.
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { School, ArrowRight, Building2 } from 'lucide-react'
import { Button, Modal, ModalFooter } from '@edforge/ui'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { extractApiErrorMessage } from '@edforge/api-client'
import { cn } from '@/lib/utils'
import { apiPatch } from '@/lib/api'
import { useLocalEducationAgencies, edOrgKeys } from '@/hooks/useEducationOrgs'

// ============================================================================
// TYPES
// ============================================================================

export interface QuickSchoolReassignProps {
  open: boolean
  onClose: () => void
  schoolId: string
  schoolName: string
  currentLeaId?: string | null
  currentLeaName?: string | null
}

// ============================================================================
// COMPONENT
// ============================================================================

export function QuickSchoolReassign({
  open,
  onClose,
  schoolId,
  schoolName,
  currentLeaId,
  currentLeaName,
}: QuickSchoolReassignProps) {
  const queryClient = useQueryClient()
  const { data: leasData } = useLocalEducationAgencies()
  const leas = leasData?.items || []

  const [selectedLeaId, setSelectedLeaId] = useState<string>(currentLeaId || '')

  // Reset selection when modal opens
  useEffect(() => {
    if (open) {
      setSelectedLeaId(currentLeaId || '')
    }
  }, [open, currentLeaId])

  const reassignMutation = useMutation({
    mutationFn: async (leaId: string | null) => {
      await apiPatch(`/schools/${schoolId}`, {
        localEducationAgencyId: leaId || null,
      })
    },
    onSuccess: (_, leaId) => {
      queryClient.invalidateQueries({ queryKey: edOrgKeys.hierarchy() })
      queryClient.invalidateQueries({ queryKey: ['schools'] })
      queryClient.invalidateQueries({ queryKey: ['schools', schoolId] })

      if (leaId) {
        const newLea = leas.find((l) => l.id === leaId)
        toast.success(`${schoolName} assigned to ${newLea?.nameOfInstitution || 'new district'}`)
      } else {
        toast.success(`${schoolName} unassigned from district`)
      }
      onClose()
    },
    onError: (error: Error) => {
      toast.error(extractApiErrorMessage(error))
    },
  })

  const handleSubmit = () => {
    const newLeaId = selectedLeaId || null
    
    // If no change, just close
    if (newLeaId === (currentLeaId || null)) {
      onClose()
      return
    }

    reassignMutation.mutate(newLeaId)
  }

  const hasChanges = selectedLeaId !== (currentLeaId || '')
  const isPending = reassignMutation.isPending

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Change School District"
      description={`Reassign "${schoolName}" to a different district`}
      size="md"
    >
      <div className="space-y-4 py-2">
        {/* Current Assignment Display */}
        {currentLeaName && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-primary))]">
            <div className="p-2 rounded-lg bg-cyan-500/10">
              <School className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[rgb(var(--text-tertiary))] uppercase tracking-wider font-medium">
                Current District
              </p>
              <p className="text-sm font-medium text-[rgb(var(--text-primary))] truncate">
                {currentLeaName}
              </p>
            </div>
          </div>
        )}

        {!currentLeaName && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <School className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                Not currently assigned to any district
              </p>
            </div>
          </div>
        )}

        {/* LEA Selection */}
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
            New District Assignment
          </label>
          
          {leas.length === 0 ? (
            <div className="text-center py-6">
              <Building2 className="w-8 h-8 text-[rgb(var(--text-tertiary))] mx-auto mb-2" />
              <p className="text-sm text-[rgb(var(--text-secondary))]">
                No districts available. Create a Local Education Agency first.
              </p>
            </div>
          ) : (
            <select
              value={selectedLeaId}
              onChange={(e) => setSelectedLeaId(e.target.value)}
              disabled={isPending}
              className={cn(
                'w-full px-3 py-2 rounded-lg border',
                'bg-[rgb(var(--surface-tertiary))] border-[rgb(var(--border-primary))]',
                'text-sm text-[rgb(var(--text-primary))]',
                'focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-colors'
              )}
            >
              <option value="">None (Unassign)</option>
              {leas.map((lea) => (
                <option key={lea.id} value={lea.id}>
                  {lea.nameOfInstitution}
                </option>
              ))}
            </select>
          )}

          <p className="mt-1.5 text-xs text-[rgb(var(--text-tertiary))]">
            Select "None" to remove district assignment
          </p>
        </div>

        {/* Change Preview */}
        <AnimatePresence>
          {hasChanges && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-2 p-3 rounded-lg bg-teal-500/5 border border-teal-500/20">
                <ArrowRight className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                <p className="text-xs text-teal-700 dark:text-teal-300">
                  {selectedLeaId
                    ? `Will be assigned to ${leas.find((l) => l.id === selectedLeaId)?.nameOfInstitution}`
                    : 'Will be unassigned from any district'}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ModalFooter>
        <Button variant="ghost" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!hasChanges || isPending || leas.length === 0}
          isLoading={isPending}
        >
          {hasChanges ? 'Save Changes' : 'No Changes'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default QuickSchoolReassign
