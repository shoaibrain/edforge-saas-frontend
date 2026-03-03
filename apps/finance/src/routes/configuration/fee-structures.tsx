/**
 * Fee Structures Configuration Page
 *
 * Admin page for configuring fee types and amounts.
 * Route: /finance/configuration/fee-structures
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import type { FeeStructure } from '@edforge/types'
import { Button } from '@edforge/ui'
import { Plus } from 'lucide-react'
import { useAppStore } from '../../stores/app.store'
import {
  useFeeStructures,
  useCreateFeeStructure,
  useUpdateFeeStructure,
  useDeleteFeeStructure,
} from '@edforge/finance-services'
import { FeeStructureList } from '../../components/configuration/FeeStructureList'
import { FeeStructureForm } from '../../components/configuration/FeeStructureForm'

export default function FeeStructuresPage() {
  const schoolId = useAppStore((s) => s.activeSchoolId)

  const [showForm, setShowForm] = useState(false)
  const [editingFee, setEditingFee] = useState<FeeStructure | null>(null)
  const [deletingFee, setDeletingFee] = useState<FeeStructure | null>(null)

  const { data: feeStructures, isLoading } = useFeeStructures(schoolId ?? '')
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
        gradeLevels: (data.gradeLevels as string)
          ? (data.gradeLevels as string).split(',').map((g: string) => g.trim()).filter(Boolean)
          : [],
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
          gradeLevels: (data.gradeLevels as string)
            ? (data.gradeLevels as string).split(',').map((g: string) => g.trim()).filter(Boolean)
            : [],
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm mx-4 p-6 bg-[rgb(var(--bg-primary))] rounded-2xl shadow-xl">
            <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
              Delete Fee Structure
            </h3>
            <p className="text-sm text-[rgb(var(--text-tertiary))] mt-2">
              Are you sure you want to delete this fee structure? This action cannot be undone.
            </p>
            <p className="text-sm font-medium text-[rgb(var(--text-primary))] mt-2">
              {deletingFee.name}
            </p>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setDeletingFee(null)} className="flex-1">
                Cancel
              </Button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending ? '...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
