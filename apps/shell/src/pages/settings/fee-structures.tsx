/**
 * Fee Structures Settings Page
 *
 * Admin page for configuring fee types and amounts.
 * Route: /settings/fee-structures
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import type { FeeStructure } from '@edforge/types'
import { useTranslation } from '@edforge/i18n'
import { Button } from '@edforge/ui'
import { Plus } from 'lucide-react'
import { useAppStore } from '../../stores/app.store'
import { useSettings } from '../../lib/shell-context'
import { tenantService } from '../../services/tenant.service'
import {
  useFeeStructures,
  useCreateFeeStructure,
  useUpdateFeeStructure,
  useDeleteFeeStructure,
} from '@edforge/finance-services'
import { FeeStructureList } from '../../components/payments/FeeStructureList'
import { FeeStructureForm } from '../../components/payments/FeeStructureForm'

export default function FeeStructuresPage() {
  const { t } = useTranslation('payments')
  const schoolId = useAppStore((s) => s.activeSchoolId)
  const settings = useSettings()

  const [showForm, setShowForm] = useState(false)
  const [editingFee, setEditingFee] = useState<FeeStructure | null>(null)
  const [deletingFee, setDeletingFee] = useState<FeeStructure | null>(null)

  const { data: feeStructures, isLoading } = useFeeStructures(schoolId ?? '')
  const { data: academicYears } = useQuery({
    queryKey: ['academicYears', schoolId],
    queryFn: () => tenantService.getAcademicYears(schoolId!),
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
  })
  const activeAcademicYear = academicYears?.find((y) => y.status === 'active') ?? academicYears?.[0]
  const createMutation = useCreateFeeStructure(schoolId ?? '')
  const updateMutation = useUpdateFeeStructure(schoolId ?? '')
  const deleteMutation = useDeleteFeeStructure(schoolId ?? '')

  const handleCreate = async (data: Record<string, unknown>) => {
    try {
      await createMutation.mutateAsync({
        name: data.name as string,
        description: data.description as string,
        feeType: data.feeType as FeeStructure['feeType'],
        amount: data.amount as number,
        currency: settings.currency,
        taxRate: (data.taxRate as number) || 0,
        taxType: (data.taxType as FeeStructure['taxType']) || 'none',
        frequency: data.frequency as FeeStructure['frequency'],
        gradeLevels: (data.gradeLevels as string)
          ? (data.gradeLevels as string).split(',').map((g: string) => g.trim()).filter(Boolean)
          : [],
        effectiveFrom: data.effectiveFrom as string,
        effectiveTo: (data.effectiveTo as string) || undefined,
        academicYear: data.academicYear as string,
        academicYearId: activeAcademicYear?.id ?? '',
      })
      toast.success(t('feeStructure.created'))
      setShowForm(false)
    } catch {
      toast.error(t('error.failedToLoad'))
    }
  }

  const handleUpdate = async (data: Record<string, unknown>) => {
    if (!editingFee) return
    try {
      await updateMutation.mutateAsync({
        id: editingFee.id,
        data: {
          name: data.name as string,
          description: data.description as string,
          amount: data.amount as number,
          taxRate: (data.taxRate as number) || 0,
          taxType: (data.taxType as FeeStructure['taxType']) || 'none',
          frequency: data.frequency as FeeStructure['frequency'],
          gradeLevels: (data.gradeLevels as string)
            ? (data.gradeLevels as string).split(',').map((g: string) => g.trim()).filter(Boolean)
            : [],
          effectiveFrom: data.effectiveFrom as string,
          effectiveTo: (data.effectiveTo as string) || undefined,
        },
      })
      toast.success(t('feeStructure.updated'))
      setEditingFee(null)
    } catch {
      toast.error(t('error.failedToLoad'))
    }
  }

  const handleDelete = async () => {
    if (!deletingFee) return
    try {
      await deleteMutation.mutateAsync(deletingFee.id)
      toast.success(t('feeStructure.deleted'))
      setDeletingFee(null)
    } catch {
      toast.error(t('error.failedToLoad'))
    }
  }

  if (!schoolId) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8 text-center text-[rgb(var(--text-tertiary))]">
        Select a school to manage fee structures.
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">
              {t('feeStructure.title')}
            </h1>
            <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
              {t('feeStructure.description')}
            </p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            {t('feeStructure.addFee')}
          </Button>
        </div>

        {/* List */}
        <FeeStructureList
          feeStructures={feeStructures ?? []}
          isLoading={isLoading}
          onEdit={(fee) => setEditingFee(fee)}
          onDelete={(fee) => setDeletingFee(fee)}
        />
      </motion.div>

      {/* Create form modal */}
      {showForm && (
        <FeeStructureForm
          academicYear={new Date().getFullYear().toString()}
          onSubmit={handleCreate}
          onClose={() => setShowForm(false)}
          isSubmitting={createMutation.isPending}
        />
      )}

      {/* Edit form modal */}
      {editingFee && (
        <FeeStructureForm
          feeStructure={editingFee}
          academicYear={editingFee.academicYear}
          onSubmit={handleUpdate}
          onClose={() => setEditingFee(null)}
          isSubmitting={updateMutation.isPending}
        />
      )}

      {/* Delete confirmation */}
      {deletingFee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgb(var(--background-overlay)/0.40)]">
          <div className="w-full max-w-sm mx-4 p-6 bg-[rgb(var(--bg-primary))] rounded-2xl shadow-xl">
            <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
              {t('feeStructure.deleteFee')}
            </h3>
            <p className="text-sm text-[rgb(var(--text-tertiary))] mt-2">
              {t('feeStructure.deleteConfirmation')}
            </p>
            <p className="text-sm font-medium text-[rgb(var(--text-primary))] mt-2">
              {deletingFee.name}
            </p>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setDeletingFee(null)} className="flex-1">
                {t('actions.cancel')}
              </Button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2 rounded-xl bg-[rgb(var(--action-danger-bg))] text-[rgb(var(--action-primary-fg))] text-sm font-semibold hover:brightness-95 transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending ? '...' : t('feeStructure.deleteFee')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
