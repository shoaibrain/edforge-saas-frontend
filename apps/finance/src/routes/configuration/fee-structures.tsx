/**
 * Fee Structures Configuration Page
 *
 * Admin page for configuring fee types and amounts.
 * Route: /finance/configuration/fee-structures
 *
 * Sprint 2: styled delete dialog, Bikram Sambat year, gradeLevels as array.
 */

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import type { FeeStructure } from '@edforge/types'
import { Button } from '@edforge/ui'
import { Plus, AlertTriangle } from 'lucide-react'
import { useAppStore } from '../../stores/app.store'
import {
  useFeeStructures,
  useCreateFeeStructure,
  useUpdateFeeStructure,
  useDeleteFeeStructure,
} from '@edforge/finance-services'
import { FeeStructureList } from '../../components/configuration/FeeStructureList'
import { FeeStructureForm } from '../../components/configuration/FeeStructureForm'
import { getCurrentBSYear } from '../../utils/bikram-sambat'

export default function FeeStructuresPage() {
  const schoolId = useAppStore((s) => s.activeSchoolId)

  const [showForm, setShowForm] = useState(false)
  const [editingFee, setEditingFee] = useState<FeeStructure | null>(null)
  const [deletingFee, setDeletingFee] = useState<FeeStructure | null>(null)

  const { data: feeStructures, isLoading, isError } = useFeeStructures(schoolId ?? '')
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
        currency: 'NPR',
        taxRate: (data.taxRate as number) || 0,
        taxType: (data.taxType as FeeStructure['taxType']) || 'none',
        frequency: data.frequency as FeeStructure['frequency'],
        gradeLevels: (data.gradeLevels as string[]) ?? [],
        effectiveFrom: data.effectiveFrom as string,
        effectiveTo: (data.effectiveTo as string) || undefined,
        academicYear: data.academicYear as string,
      })
      toast.success('Fee structure created')
      setShowForm(false)
    } catch {
      toast.error('Failed to create fee structure')
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
          gradeLevels: (data.gradeLevels as string[]) ?? [],
          effectiveFrom: data.effectiveFrom as string,
          effectiveTo: (data.effectiveTo as string) || undefined,
        },
      })
      toast.success('Fee structure updated')
      setEditingFee(null)
    } catch {
      toast.error('Failed to update fee structure')
    }
  }

  const handleDelete = async () => {
    if (!deletingFee) return
    try {
      await deleteMutation.mutateAsync(deletingFee.id)
      toast.success('Fee structure deleted')
      setDeletingFee(null)
    } catch {
      toast.error('Failed to delete fee structure')
    }
  }

  if (!schoolId) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8 text-center text-[rgb(var(--text-tertiary))]">
        Select a school to manage fee structures.
      </div>
    )
  }

  if (isError) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="text-center py-16">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-red-400 opacity-60" />
          <p className="text-sm font-medium text-[rgb(var(--text-primary))]">Failed to load fee structures</p>
          <p className="text-xs text-[rgb(var(--text-tertiary))] mt-1">
            Please check your connection and try again.
          </p>
        </div>
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
              Fee Structures
            </h1>
            <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
              Configure the fee types and amounts for your school.
            </p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            Add Fee Structure
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
          academicYear={getCurrentBSYear()}
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

      {/* Styled delete confirmation dialog */}
      {deletingFee && (
        <DeleteConfirmDialog
          feeName={deletingFee.name}
          isPending={deleteMutation.isPending}
          onConfirm={handleDelete}
          onCancel={() => setDeletingFee(null)}
        />
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Delete Confirm Dialog                                              */
/* ------------------------------------------------------------------ */

function DeleteConfirmDialog({
  feeName,
  isPending,
  onConfirm,
  onCancel,
}: {
  feeName: string
  isPending: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isPending) onCancel()
    },
    [onCancel, isPending],
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isPending) onCancel()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-sm mx-4 p-6 bg-[rgb(var(--bg-primary))] rounded-2xl shadow-xl">
        {/* Warning icon */}
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-50 dark:bg-red-500/10">
          <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>

        <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))] text-center">
          Delete Fee Structure
        </h3>

        <p className="text-sm text-[rgb(var(--text-tertiary))] mt-2 text-center">
          Are you sure you want to delete{' '}
          <span className="font-medium text-[rgb(var(--text-primary))]">
            {feeName}
          </span>
          ? This action is irreversible and cannot be undone.
        </p>

        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
            className="flex-1"
          >
            Cancel
          </Button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Deleting...' : 'Confirm Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
