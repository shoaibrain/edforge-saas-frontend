/**
 * FeeStructureForm
 *
 * Create/edit form for fee structures using react-hook-form + zod.
 */

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { FeeStructure, FeeType, FeeFrequency, TaxType } from '@edforge/types'
import { Button } from '@edforge/ui'
import { X } from 'lucide-react'

const FEE_TYPES: FeeType[] = [
  'tuition', 'admission', 'exam', 'transport', 'library',
  'lab', 'hostel', 'uniform', 'miscellaneous', 'custom',
]

const FEE_TYPE_LABELS: Record<string, string> = {
  tuition: 'Tuition',
  admission: 'Admission',
  exam: 'Exam',
  transport: 'Transport',
  library: 'Library',
  lab: 'Lab',
  hostel: 'Hostel',
  uniform: 'Uniform',
  miscellaneous: 'Miscellaneous',
  custom: 'Custom',
}

const FREQUENCIES: FeeFrequency[] = ['one_time', 'monthly', 'quarterly', 'annual']

const FREQUENCY_LABELS: Record<string, string> = {
  one_time: 'One Time',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  annual: 'Annual',
}

const TAX_TYPES: TaxType[] = ['none', 'PAN', 'VAT']

const feeStructureSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(255).optional(),
  feeType: z.enum(['tuition', 'admission', 'exam', 'transport', 'library', 'lab', 'hostel', 'uniform', 'miscellaneous', 'custom']),
  amount: z.number().min(0, 'Amount must be positive').max(10_000_000),
  frequency: z.enum(['one_time', 'monthly', 'quarterly', 'annual']),
  taxRate: z.number().min(0).max(100).optional(),
  taxType: z.enum(['none', 'PAN', 'VAT']).optional(),
  gradeLevels: z.string().optional(),
  effectiveFrom: z.string().min(1, 'Effective date is required'),
  effectiveTo: z.string().optional(),
  academicYear: z.string().min(1, 'Academic year is required'),
})

type FormData = z.infer<typeof feeStructureSchema>

interface FeeStructureFormProps {
  feeStructure?: FeeStructure | null
  academicYear: string
  onSubmit: (data: FormData) => void
  onClose: () => void
  isSubmitting?: boolean
}

export function FeeStructureForm({
  feeStructure,
  academicYear,
  onSubmit,
  onClose,
  isSubmitting,
}: FeeStructureFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(feeStructureSchema),
    defaultValues: feeStructure
      ? {
          name: feeStructure.name,
          description: feeStructure.description ?? '',
          feeType: feeStructure.feeType,
          amount: feeStructure.amount,
          frequency: feeStructure.frequency,
          taxRate: feeStructure.taxRate,
          taxType: feeStructure.taxType,
          gradeLevels: feeStructure.gradeLevels.join(', '),
          effectiveFrom: feeStructure.effectiveFrom.split('T')[0],
          effectiveTo: feeStructure.effectiveTo?.split('T')[0] ?? '',
          academicYear: feeStructure.academicYear,
        }
      : {
          feeType: 'tuition',
          frequency: 'annual',
          taxRate: 0,
          taxType: 'none',
          amount: 0,
          effectiveFrom: new Date().toISOString().split('T')[0],
          academicYear,
        },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg mx-4 bg-[rgb(var(--bg-primary))] rounded-2xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgb(var(--border-primary))]">
          <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
            {feeStructure ? 'Edit Fee Structure' : 'Add Fee Structure'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[rgb(var(--bg-tertiary))] transition-colors"
          >
            <X className="w-5 h-5 text-[rgb(var(--text-tertiary))]" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Name */}
          <Field label="Name" error={errors.name?.message}>
            <input
              {...register('name')}
              className="input-field"
              placeholder="e.g. Annual Tuition Fee"
            />
          </Field>

          {/* Description */}
          <Field label="Description" error={errors.description?.message}>
            <input
              {...register('description')}
              className="input-field"
              placeholder="Optional description"
            />
          </Field>

          {/* Type + Frequency */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Type" error={errors.feeType?.message}>
              <select {...register('feeType')} className="input-field">
                {FEE_TYPES.map((ft) => (
                  <option key={ft} value={ft}>
                    {FEE_TYPE_LABELS[ft]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Frequency" error={errors.frequency?.message}>
              <select {...register('frequency')} className="input-field">
                {FREQUENCIES.map((freq) => (
                  <option key={freq} value={freq}>
                    {FREQUENCY_LABELS[freq]}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {/* Amount + Tax */}
          <div className="grid grid-cols-3 gap-4">
            <Field label="Amount" error={errors.amount?.message}>
              <input
                {...register('amount', { valueAsNumber: true })}
                type="number"
                min="0"
                step="0.01"
                className="input-field"
                placeholder="0.00"
              />
            </Field>
            <Field label="Tax Type" error={errors.taxType?.message}>
              <select {...register('taxType')} className="input-field">
                {TAX_TYPES.map((tt) => (
                  <option key={tt} value={tt}>{tt === 'none' ? 'None' : tt}</option>
                ))}
              </select>
            </Field>
            <Field label="Tax Rate (%)" error={errors.taxRate?.message}>
              <input
                {...register('taxRate', { valueAsNumber: true })}
                type="number"
                min="0"
                max="100"
                step="0.1"
                className="input-field"
                placeholder="0"
              />
            </Field>
          </div>

          {/* Grade Levels */}
          <Field label="Grade Levels" error={errors.gradeLevels?.message}>
            <input
              {...register('gradeLevels')}
              className="input-field"
              placeholder="e.g. 1, 2, 3 (leave empty for all grades)"
            />
          </Field>

          {/* Effective dates */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Effective From" error={errors.effectiveFrom?.message}>
              <input {...register('effectiveFrom')} type="date" className="input-field" />
            </Field>
            <Field label="Effective To" error={errors.effectiveTo?.message}>
              <input {...register('effectiveTo')} type="date" className="input-field" />
            </Field>
          </div>

          {/* Academic year (hidden but submitted) */}
          <input {...register('academicYear')} type="hidden" />
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-[rgb(var(--border-primary))]">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <style>{`
        .input-field {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border-radius: 0.5rem;
          border: 1px solid rgb(var(--border-primary));
          background: rgb(var(--bg-primary));
          color: rgb(var(--text-primary));
          font-size: 0.875rem;
          transition: border-color 0.15s;
        }
        .input-field:focus {
          outline: none;
          border-color: rgb(20, 184, 166);
          box-shadow: 0 0 0 2px rgba(20, 184, 166, 0.2);
        }
      `}</style>
    </div>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  )
}
