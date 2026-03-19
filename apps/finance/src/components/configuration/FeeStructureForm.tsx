/**
 * FeeStructureForm
 *
 * Create/edit form for fee structures using react-hook-form + zod.
 *
 * Sprint 2 improvements:
 *  - Fixed modal overlay (z-50, backdrop click, Escape key)
 *  - Multi-select grade-level chips with "All Grades" toggle
 *  - Inline validation errors, amount/tax bounds, date cross-validation
 *
 * Production fixes:
 *  - Academic year selector (dropdown fetched from identity service)
 *  - Dynamic grade levels from school's gradeRange configuration
 *  - academicYearId (UUID) sent alongside academicYear display name
 */

import { useEffect, useCallback } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { FeeStructure, FeeType, FeeFrequency, TaxType } from '@edforge/types'
import { Button } from '@edforge/ui'
import { X } from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface AcademicYearOption {
  id: string
  name: string
  status: string
  isCurrent?: boolean
}

/* ------------------------------------------------------------------ */
/*  Zod schema                                                         */
/* ------------------------------------------------------------------ */

const feeStructureSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or fewer'),
    description: z.string().max(255, 'Description must be 255 characters or fewer').optional(),
    feeType: z.enum([
      'tuition', 'admission', 'exam', 'transport', 'library',
      'lab', 'hostel', 'uniform', 'miscellaneous', 'custom',
    ]),
    amount: z
      .number({ invalid_type_error: 'Amount is required' })
      .min(0, 'Amount must be 0 or more')
      .max(10_000_000, 'Amount cannot exceed 10,000,000'),
    frequency: z.enum(['one_time', 'monthly', 'quarterly', 'annual']),
    taxRate: z
      .number()
      .min(0, 'Tax rate must be 0 or more')
      .max(100, 'Tax rate cannot exceed 100%')
      .optional(),
    taxType: z.enum(['none', 'PAN', 'VAT']).optional(),
    gradeLevels: z.array(z.string()),
    effectiveFrom: z.string().min(1, 'Effective date is required'),
    effectiveTo: z.string().optional(),
    academicYearId: z.string().min(1, 'Academic year is required'),
    autoApplyOnEnrollment: z.boolean().optional(),
    proRateOnMidTermEntry: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.effectiveTo && data.effectiveFrom) {
        return data.effectiveTo > data.effectiveFrom
      }
      return true
    },
    {
      message: 'Effective To must be after Effective From',
      path: ['effectiveTo'],
    },
  )

export type FeeStructureFormData = z.infer<typeof feeStructureSchema>

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface FeeStructureFormProps {
  feeStructure?: FeeStructure | null
  academicYears: AcademicYearOption[]
  gradeOptions: string[]
  onSubmit: (data: FeeStructureFormData) => void
  onClose: () => void
  isSubmitting?: boolean
}

export function FeeStructureForm({
  feeStructure,
  academicYears,
  gradeOptions,
  onSubmit,
  onClose,
  isSubmitting,
}: FeeStructureFormProps) {
  const defaultAcademicYearId = feeStructure?.academicYearId
    ?? academicYears.find((y) => y.isCurrent)?.id
    ?? academicYears.find((y) => y.status === 'active')?.id
    ?? academicYears[0]?.id
    ?? ''

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid },
  } = useForm<FeeStructureFormData>({
    resolver: zodResolver(feeStructureSchema),
    mode: 'onChange',
    defaultValues: feeStructure
      ? {
          name: feeStructure.name,
          description: feeStructure.description ?? '',
          feeType: feeStructure.feeType,
          amount: feeStructure.amount,
          frequency: feeStructure.frequency,
          taxRate: feeStructure.taxRate,
          taxType: feeStructure.taxType,
          gradeLevels: feeStructure.gradeLevels ?? [],
          effectiveFrom: feeStructure.effectiveFrom.split('T')[0],
          effectiveTo: feeStructure.effectiveTo?.split('T')[0] ?? '',
          academicYearId: defaultAcademicYearId,
          autoApplyOnEnrollment: feeStructure.autoApplyOnEnrollment ?? false,
          proRateOnMidTermEntry: feeStructure.proRateOnMidTermEntry ?? false,
        }
      : {
          name: '',
          description: '',
          feeType: 'tuition',
          frequency: 'annual',
          taxRate: 0,
          taxType: 'none',
          amount: 0,
          gradeLevels: [],
          effectiveFrom: new Date().toISOString().split('T')[0],
          effectiveTo: '',
          academicYearId: defaultAcademicYearId,
          autoApplyOnEnrollment: false,
          proRateOnMidTermEntry: true,
        },
  })

  /* --- Escape key handler --- */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose],
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  /* --- Backdrop click --- */
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-lg mx-4 bg-[rgb(var(--surface-primary))] rounded-2xl shadow-xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgb(var(--border-primary))] flex-shrink-0">
          <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
            {feeStructure ? 'Edit Fee Structure' : 'Add Fee Structure'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[rgb(var(--surface-tertiary))] transition-colors"
          >
            <X className="w-5 h-5 text-[rgb(var(--text-tertiary))]" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
          {/* Name */}
          <Field label="Name" error={errors.name?.message}>
            <input
              {...register('name')}
              className="input"
              placeholder="e.g. Annual Tuition Fee"
            />
          </Field>

          {/* Description */}
          <Field label="Description" error={errors.description?.message}>
            <input
              {...register('description')}
              className="input"
              placeholder="Optional description"
            />
          </Field>

          {/* Academic Year */}
          <Field label="Academic Year" error={errors.academicYearId?.message}>
            {academicYears.length > 0 ? (
              <select {...register('academicYearId')} className="input">
                {academicYears.map((ay) => (
                  <option key={ay.id} value={ay.id}>
                    {ay.name}{ay.isCurrent ? ' (Current)' : ay.status === 'planning' ? ' (Planning)' : ''}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-[rgb(var(--text-tertiary))] py-2">
                No academic years configured. Please create one in School Settings first.
              </p>
            )}
          </Field>

          {/* Type + Frequency */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Type" error={errors.feeType?.message}>
              <select {...register('feeType')} className="input">
                {FEE_TYPES.map((ft) => (
                  <option key={ft} value={ft}>
                    {FEE_TYPE_LABELS[ft]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Frequency" error={errors.frequency?.message}>
              <select {...register('frequency')} className="input">
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
                max="10000000"
                step="0.01"
                className="input"
                placeholder="0.00"
              />
            </Field>
            <Field label="Tax Type" error={errors.taxType?.message}>
              <select {...register('taxType')} className="input">
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
                className="input"
                placeholder="0"
              />
            </Field>
          </div>

          {/* Grade Levels — chip multi-select */}
          <Controller
            name="gradeLevels"
            control={control}
            render={({ field }) => (
              <GradeLevelChips
                value={field.value}
                onChange={field.onChange}
                gradeOptions={gradeOptions}
                error={errors.gradeLevels?.message}
              />
            )}
          />

          {/* Enrollment & Pro-Rate Settings */}
          <div className="space-y-3 p-3 rounded-lg bg-[rgb(var(--surface-tertiary))]">
            <p className="text-xs font-medium text-[rgb(var(--text-secondary))]">Enrollment Settings</p>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('autoApplyOnEnrollment')}
                className="w-4 h-4 rounded border-[rgb(var(--border-primary))] text-teal-600 focus:ring-teal-500"
              />
              <span className="text-sm text-[rgb(var(--text-primary))]">Auto-apply on enrollment</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('proRateOnMidTermEntry')}
                className="w-4 h-4 rounded border-[rgb(var(--border-primary))] text-teal-600 focus:ring-teal-500"
              />
              <span className="text-sm text-[rgb(var(--text-primary))]">Pro-rate on mid-term entry</span>
            </label>
            <p className="text-xs text-[rgb(var(--text-tertiary))]">
              When enabled, fees are automatically calculated proportionally for students enrolling mid-term.
            </p>
          </div>

          {/* Effective dates */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Effective From" error={errors.effectiveFrom?.message}>
              <input {...register('effectiveFrom')} type="date" className="input" />
            </Field>
            <Field label="Effective To" error={errors.effectiveTo?.message}>
              <input {...register('effectiveTo')} type="date" className="input" />
            </Field>
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-[rgb(var(--border-primary))] flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting || !isValid}
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  GradeLevelChips                                                    */
/* ------------------------------------------------------------------ */

function GradeLevelChips({
  value,
  onChange,
  gradeOptions,
  error,
}: {
  value: string[]
  onChange: (val: string[]) => void
  gradeOptions: string[]
  error?: string
}) {
  const allSelected = value.length === 0

  const toggleGrade = (grade: string) => {
    if (value.includes(grade)) {
      onChange(value.filter((g) => g !== grade))
    } else {
      onChange([...value, grade])
    }
  }

  const toggleAll = () => {
    onChange([])
  }

  return (
    <Field label="Grade Levels" error={error}>
      <div className="flex flex-wrap gap-2">
        {/* All Grades toggle */}
        <button
          type="button"
          onClick={toggleAll}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
            allSelected
              ? 'bg-teal-600 text-white border-teal-600'
              : 'bg-transparent text-[rgb(var(--text-secondary))] border-[rgb(var(--border-primary))] hover:border-teal-400'
          }`}
        >
          All Grades
        </button>

        {gradeOptions.map((grade) => {
          const isSelected = !allSelected && value.includes(grade)
          return (
            <button
              key={grade}
              type="button"
              onClick={() => {
                if (allSelected) {
                  // Switching from "All" to specific: select all EXCEPT this one
                  onChange(gradeOptions.filter((g) => g !== grade))
                } else {
                  toggleGrade(grade)
                }
              }}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-transparent text-[rgb(var(--text-secondary))] border-[rgb(var(--border-primary))] hover:border-blue-400'
              }`}
            >
              {grade}
            </button>
          )
        })}
      </div>
    </Field>
  )
}

/* ------------------------------------------------------------------ */
/*  Field helper                                                       */
/* ------------------------------------------------------------------ */

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
