/**
 * Quick School Reassign Modal
 *
 * Lightweight modal for single-school reassignment from context menu.
 * Allows changing a school's district assignment or unassigning it entirely.
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { School, ArrowRight, Building2 } from 'lucide-react'
import { Button, Modal, ModalFooter, Select } from '@edforge/ui'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { extractApiErrorMessage } from '@edforge/api-client'
import { useTranslation } from '@edforge/i18n'
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
  const { t } = useTranslation('settings')
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
        toast.success(
          t('organization.quickReassign.toasts.assigned', {
            schoolName,
            districtName: newLea?.nameOfInstitution || t('organization.quickReassign.newDistrictFallback'),
          }),
        )
      } else {
        toast.success(t('organization.quickReassign.toasts.unassigned', { schoolName }))
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
      title={t('organization.quickReassign.title')}
      description={t('organization.quickReassign.description', { schoolName })}
      size="md"
    >
      <div className="space-y-4 py-2">
        {/* Current Assignment Display */}
        {currentLeaName && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-[rgb(var(--background-secondary))] border border-[rgb(var(--border-primary))]">
            <div className="p-2 rounded-lg bg-[rgb(var(--state-info-bg)/0.18)]">
              <School className="w-4 h-4 text-[rgb(var(--state-info-fg))] " />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[rgb(var(--text-tertiary))] uppercase tracking-wider font-medium">
                {t('organization.quickReassign.currentDistrict')}
              </p>
              <p className="text-sm font-medium text-[rgb(var(--text-primary))] truncate">{currentLeaName}</p>
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
                {t('organization.quickReassign.notAssigned')}
              </p>
            </div>
          </div>
        )}

        {/* LEA Selection */}
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
            {t('organization.quickReassign.newAssignment')}
          </label>

          {leas.length === 0 ? (
            <div className="text-center py-6">
              <Building2 className="w-8 h-8 text-[rgb(var(--text-tertiary))] mx-auto mb-2" />
              <p className="text-sm text-[rgb(var(--text-secondary))]">{t('organization.quickReassign.noDistricts')}</p>
            </div>
          ) : (
            <Select
              aria-label={t('organization.quickReassign.newAssignment')}
              options={leas.map((lea) => ({
                value: lea.id,
                label: lea.nameOfInstitution,
              }))}
              value={selectedLeaId || null}
              onChange={(v) => setSelectedLeaId(v ?? '')}
              placeholder={t('organization.quickReassign.noneUnassign')}
              clearable
              disabled={isPending}
            />
          )}

          <p className="mt-1.5 text-xs text-[rgb(var(--text-tertiary))]">{t('organization.quickReassign.noneHelp')}</p>
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
              <div className="flex items-center gap-2 p-3 rounded-lg bg-[rgb(var(--action-primary-bg))]/5 border border-[rgb(var(--border-focus)/0.35)]">
                <ArrowRight className="w-4 h-4 text-[rgb(var(--action-secondary-fg))]  shrink-0" />
                <p className="text-xs text-[rgb(var(--state-info-fg))] ">
                  {selectedLeaId
                    ? t('organization.quickReassign.previewAssigned', {
                        districtName:
                          leas.find((l) => l.id === selectedLeaId)?.nameOfInstitution ||
                          t('organization.quickReassign.newDistrictFallback'),
                      })
                    : t('organization.quickReassign.previewUnassigned')}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ModalFooter>
        <Button variant="ghost" onClick={onClose} disabled={isPending}>
          {t('organization.actions.cancel')}
        </Button>
        <Button onClick={handleSubmit} disabled={!hasChanges || isPending || leas.length === 0} isLoading={isPending}>
          {hasChanges ? t('organization.quickReassign.saveChanges') : t('organization.quickReassign.noChanges')}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default QuickSchoolReassign
