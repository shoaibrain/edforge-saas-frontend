/**
 * Fee Structures Configuration Page
 *
 * Admin page for configuring fee types and amounts.
 * Route: /finance/configuration/fee-structures
 *
 * Production fixes:
 *  - Fetches academic years from identity service for academicYearId
 *  - Fetches school gradeRange for dynamic grade level chips
 *  - Improved error handling with specific error messages in toasts
 */

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { FeeStructure } from '@edforge/types'
import { formatNPRCompact } from '@edforge/types'
import { apiGet } from '@edforge/api-client'
import type { AxiosError } from '@edforge/api-client'
import { Button, StatCard, WidgetErrorBoundaryV2 } from '@edforge/ui'
import { Plus, AlertTriangle, DollarSign, Layers, Settings2, TrendingUp } from 'lucide-react'
import { useAppStore } from '../../stores/app.store'
import {
  useFeeStructures,
  useCreateFeeStructure,
  useUpdateFeeStructure,
  useDeleteFeeStructure,
} from '@edforge/finance-services'
import { FeeStructureList } from '../../components/configuration/FeeStructureList'
import { FeeStructureForm } from '../../components/configuration/FeeStructureForm'
import type { FeeStructureFormData, AcademicYearOption } from '../../components/configuration/FeeStructureForm'
import { FinancePageHeader, FinanceInfoBanner, FinanceFilterChips } from '../../components/shared'

/* ------------------------------------------------------------------ */
/*  API response types                                                 */
/* ------------------------------------------------------------------ */

interface AcademicYearApiItem {
  yearId?: string
  academicYearId?: string
  id?: string
  name: string
  status: string
  isCurrent?: boolean
}

interface SchoolApiResponse {
  gradeRange?: { start: string; end: string }
  [key: string]: unknown
}

/* ------------------------------------------------------------------ */
/*  Constants & Helpers                                                */
/* ------------------------------------------------------------------ */

/** Canonical grade ordering (mirrors @aibrains/shared-types ORDERED_GRADES) */
const ORDERED_GRADES = [
  'PK', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12',
] as const

function extractApiErrorMessage(error: unknown): string | null {
  const axiosErr = error as AxiosError<{ message?: string; errors?: Array<{ message?: string }> }>
  const data = axiosErr?.response?.data
  if (!data) return null
  if (data.message) return data.message
  if (data.errors?.length) {
    return data.errors.map((e) => e.message).filter(Boolean).join('; ')
  }
  return null
}

function gradeRangeToOptions(start: string, end: string): string[] {
  const startIdx = ORDERED_GRADES.indexOf(start as typeof ORDERED_GRADES[number])
  const endIdx = ORDERED_GRADES.indexOf(end as typeof ORDERED_GRADES[number])
  if (startIdx === -1 || endIdx === -1 || startIdx > endIdx) return [...ORDERED_GRADES]
  return ORDERED_GRADES.slice(startIdx, endIdx + 1) as unknown as string[]
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function FeeStructuresPage() {
  const schoolId = useAppStore((s) => s.activeSchoolId)

  const [showForm, setShowForm] = useState(false)
  const [editingFee, setEditingFee] = useState<FeeStructure | null>(null)
  const [deletingFee, setDeletingFee] = useState<FeeStructure | null>(null)
  const [activeFilter, setActiveFilter] = useState<'' | 'active' | 'inactive'>('')

  const { data: feeStructures, isLoading, isError } = useFeeStructures(schoolId ?? '')
  const createMutation = useCreateFeeStructure(schoolId ?? '')
  const updateMutation = useUpdateFeeStructure(schoolId ?? '')
  const deleteMutation = useDeleteFeeStructure(schoolId ?? '')

  const filteredFeeStructures = useMemo(() => {
    const list = feeStructures ?? []
    if (activeFilter === 'active') return list.filter(f => f.isActive !== false)
    if (activeFilter === 'inactive') return list.filter(f => f.isActive === false)
    return list
  }, [feeStructures, activeFilter])

  const kpi = useMemo(() => {
    const list = feeStructures ?? []
    const totalStructures = list.length
    const autoApplyCount = list.filter(f => f.autoApplyOnEnrollment).length
    const feeTypes = new Set(list.map(f => f.feeType)).size
    const maxFee = list.reduce((max, f) => Math.max(max, f.amount || 0), 0)
    return { totalStructures, autoApplyCount, feeTypes, maxFee }
  }, [feeStructures])

  // Fetch academic years for the school
  const { data: academicYearsRaw } = useQuery({
    queryKey: ['academicYears', schoolId],
    queryFn: () => apiGet<{ items: AcademicYearApiItem[] } | AcademicYearApiItem[]>(
      `/schools/${schoolId}/academic-years`,
    ),
    enabled: !!schoolId,
    staleTime: 10 * 60 * 1000,
  })

  const academicYears: AcademicYearOption[] = useMemo(() => {
    const items = Array.isArray(academicYearsRaw)
      ? academicYearsRaw
      : academicYearsRaw?.items ?? []
    return items.map((ay) => ({
      id: ay.yearId || ay.academicYearId || ay.id || '',
      name: ay.name,
      status: ay.status,
      isCurrent: ay.isCurrent,
    }))
  }, [academicYearsRaw])

  // Fetch school details for grade range
  const { data: schoolData } = useQuery({
    queryKey: ['school', schoolId],
    queryFn: () => apiGet<SchoolApiResponse>(`/schools/${schoolId}`),
    enabled: !!schoolId,
    staleTime: 10 * 60 * 1000,
  })

  const gradeOptions = useMemo(() => {
    if (schoolData?.gradeRange) {
      return gradeRangeToOptions(schoolData.gradeRange.start, schoolData.gradeRange.end)
    }
    return [...ORDERED_GRADES] as string[]
  }, [schoolData])

  // Resolve academic year name from ID
  const getAcademicYearName = (yearId: string): string => {
    const year = academicYears.find((y) => y.id === yearId)
    return year?.name ?? ''
  }

  const handleCreate = async (data: FeeStructureFormData) => {
    try {
      await createMutation.mutateAsync({
        name: data.name,
        description: data.description,
        feeType: data.feeType,
        amount: data.amount,
        currency: 'NPR',
        taxRate: data.taxRate || 0,
        taxType: data.taxType || 'none',
        frequency: data.frequency,
        gradeLevels: data.gradeLevels ?? [],
        autoApplyOnEnrollment: data.autoApplyOnEnrollment,
        proRateOnMidTermEntry: data.proRateOnMidTermEntry,
        effectiveFrom: data.effectiveFrom,
        effectiveTo: data.effectiveTo || undefined,
        academicYear: getAcademicYearName(data.academicYearId),
        academicYearId: data.academicYearId,
      })
      toast.success('Fee structure created')
      setShowForm(false)
    } catch (error) {
      const msg = extractApiErrorMessage(error)
      toast.error(msg || 'Failed to create fee structure')
    }
  }

  const handleUpdate = async (data: FeeStructureFormData) => {
    if (!editingFee) return
    try {
      await updateMutation.mutateAsync({
        id: editingFee.id,
        data: {
          name: data.name,
          description: data.description,
          amount: data.amount,
          taxRate: data.taxRate || 0,
          taxType: data.taxType || 'none',
          frequency: data.frequency,
          gradeLevels: data.gradeLevels ?? [],
          effectiveFrom: data.effectiveFrom,
          effectiveTo: data.effectiveTo || undefined,
        },
      })
      toast.success('Fee structure updated')
      setEditingFee(null)
    } catch (error) {
      const msg = extractApiErrorMessage(error)
      toast.error(msg || 'Failed to update fee structure')
    }
  }

  const handleDelete = async () => {
    if (!deletingFee) return
    try {
      await deleteMutation.mutateAsync(deletingFee.id)
      toast.success('Fee structure deleted')
      setDeletingFee(null)
    } catch (error) {
      const msg = extractApiErrorMessage(error)
      toast.error(msg || 'Failed to delete fee structure')
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
      <div className="p-6 space-y-6">
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
    <div data-v2 className="p-6 space-y-5">
      {/* Header */}
      <FinancePageHeader
        icon={Settings2}
        title="Fee Structures"
        subtitle="Configure the fee types and amounts for your school."
        accentColor="rgba(127, 119, 221, 0.12)"
        iconColor="#7F77DD"
        actions={
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-[7px] transition-colors hover:opacity-90"
            style={{
              background: 'var(--v2-brand-primary)',
              color: '#fff',
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Fee Structure
          </button>
        }
      />

      {/* Info Banner */}
      <FinanceInfoBanner
        variant="info"
        message="Fee structures with auto-apply on enrollment will automatically generate obligations when a student is enrolled."
      />

      {/* KPI Grid */}
      <WidgetErrorBoundaryV2>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Structures"
            value={String(kpi.totalStructures)}
            icon={Layers}
            accentColor="rgba(127, 119, 221, 0.12)"
            iconColor="#7F77DD"
            barColor="#7F77DD"
            valueColor="#7F77DD"
            loading={isLoading}
          />
          <StatCard
            label="Auto-Apply"
            value={String(kpi.autoApplyCount)}
            icon={TrendingUp}
            accentColor="rgba(29, 158, 117, 0.12)"
            iconColor="#1D9E75"
            barColor="#1D9E75"
            loading={isLoading}
          />
          <StatCard
            label="Fee Types"
            value={String(kpi.feeTypes)}
            icon={DollarSign}
            accentColor="rgba(55, 138, 221, 0.12)"
            iconColor="#378ADD"
            barColor="#378ADD"
            loading={isLoading}
          />
          <StatCard
            label="Max Fee"
            value={formatNPRCompact(kpi.maxFee)}
            icon={AlertTriangle}
            accentColor="rgba(239, 159, 39, 0.12)"
            iconColor="#EF9F27"
            barColor="#EF9F27"
            loading={isLoading}
          />
        </div>
      </WidgetErrorBoundaryV2>

      {/* Filter Chips */}
      <FinanceFilterChips
        options={[
          { label: 'All', value: '' },
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
        ]}
        value={activeFilter}
        onChange={(v) => setActiveFilter(v as '' | 'active' | 'inactive')}
        accentColor="#7F77DD"
      />

      {/* List */}
      <FeeStructureList
        feeStructures={filteredFeeStructures}
        isLoading={isLoading}
        onEdit={(fee) => setEditingFee(fee)}
        onDelete={(fee) => setDeletingFee(fee)}
      />

      {/* Create form modal */}
      {showForm && (
        <FeeStructureForm
          academicYears={academicYears}
          gradeOptions={gradeOptions}
          onSubmit={handleCreate}
          onClose={() => setShowForm(false)}
          isSubmitting={createMutation.isPending}
        />
      )}

      {/* Edit form modal */}
      {editingFee && (
        <FeeStructureForm
          feeStructure={editingFee}
          academicYears={academicYears}
          gradeOptions={gradeOptions}
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
      <div className="w-full max-w-sm mx-4 p-6 bg-[rgb(var(--surface-primary))] rounded-2xl shadow-xl">
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
