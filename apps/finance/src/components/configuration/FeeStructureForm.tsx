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

import { useState, useRef, useEffect, useCallback } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { FeeStructure, FeeType, FeeFrequency, TaxType } from '@edforge/types'
import { Button, Select } from '@edforge/ui'
import { useTranslation } from '@edforge/i18n'
import { ChevronDown, X } from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const FEE_TYPES: FeeType[] = [
  'tuition', 'admission', 'exam', 'transport', 'library',
  'lab', 'hostel', 'uniform', 'miscellaneous', 'custom',
]

const FREQUENCIES: FeeFrequency[] = ['one_time', 'monthly', 'quarterly', 'annual']

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
    name: z.string().min(1, 'nameRequired').max(100, 'nameMax'),
    description: z.string().max(255, 'descriptionMax').optional(),
    feeType: z.enum([
      'tuition', 'admission', 'exam', 'transport', 'library',
      'lab', 'hostel', 'uniform', 'miscellaneous', 'custom',
    ]),
    amount: z
      .number({ invalid_type_error: 'amountRequired' })
      .min(0, 'amountMin')
      .max(10_000_000, 'amountMax'),
    frequency: z.enum(['one_time', 'monthly', 'quarterly', 'annual']),
    taxRate: z
      .number()
      .min(0, 'taxRateMin')
      .max(100, 'taxRateMax')
      .optional(),
    taxType: z.enum(['none', 'PAN', 'VAT']).optional(),
    gradeLevels: z.array(z.string()),
    effectiveFrom: z.string().min(1, 'effectiveFromRequired'),
    effectiveTo: z.string().optional(),
    academicYearId: z.string().min(1, 'academicYearRequired'),
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
      message: 'effectiveToAfterFrom',
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
  currency?: string
  calendarSystem?: 'gregorian' | 'bikram_sambat'
  enableDualDateDisplay?: boolean
}

export function FeeStructureForm({
  feeStructure,
  academicYears,
  gradeOptions,
  onSubmit,
  onClose,
  isSubmitting,
  currency = 'USD',
  calendarSystem = 'gregorian',
  enableDualDateDisplay = false,
}: FeeStructureFormProps) {
  const { t } = useTranslation('payments')

  const validationError = (message?: string) =>
    message ? t(`feeStructure.validation.${message}`, { defaultValue: message }) : undefined
  const feeTypeLabel = (feeType: FeeType) =>
    t(`feeStructure.types.${feeType}`, { defaultValue: feeType })
  const frequencyLabel = (frequency: FeeFrequency) =>
    t(`feeStructure.frequencies.${frequency}`, { defaultValue: frequency })
  const taxTypeLabel = (taxType: TaxType) =>
    taxType === 'none' ? t('feeStructure.taxTypes.none') : taxType
  const academicYearLabel = (academicYear: AcademicYearOption) => {
    const statusLabel = academicYear.isCurrent
      ? t('feeStructure.academicYearStatus.current')
      : academicYear.status === 'planning'
        ? t('feeStructure.academicYearStatus.planning')
        : ''
    return statusLabel ? `${academicYear.name} (${statusLabel})` : academicYear.name
  }

  const defaultAcademicYearId = feeStructure?.academicYearId
    ?? academicYears.find((y) => y.isCurrent)?.id
    ?? academicYears.find((y) => y.status === 'active')?.id
    ?? academicYears[0]?.id
    ?? ''

  const {
    register,
    handleSubmit,
    control,
    watch,
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

  const watchedTaxType = watch('taxType')

  /* --- Escape key handler --- */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose()
    },
    [onClose, isSubmitting],
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  /* --- Backdrop click --- */
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isSubmitting) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgb(var(--background-overlay)/0.50)]"
      onClick={handleBackdropClick}
    >
      <div
        className="w-full max-w-lg mx-4 bg-[rgb(var(--background-primary))] rounded-2xl shadow-xl flex flex-col max-h-[85vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fee-structure-form-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgb(var(--border-primary))] flex-shrink-0">
          <h2 id="fee-structure-form-title" className="text-lg font-semibold text-[rgb(var(--text-primary))]">
            {feeStructure ? t('feeStructure.editFee') : t('feeStructure.addFee')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('feeStructure.closeForm')}
            className="p-1.5 rounded-lg hover:bg-[rgb(var(--background-tertiary))] transition-colors"
          >
            <X className="w-5 h-5 text-[rgb(var(--text-tertiary))]" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-4 space-y-5 overflow-y-auto flex-1">

          {/* ── Basic Info ── */}
          <SectionHeader title={t('feeStructure.sections.basicInfo')} />

          <Field label={t('feeStructure.fields.name')} error={validationError(errors.name?.message)}>
            <input
              {...register('name')}
              className="input"
              placeholder={t('feeStructure.placeholders.name')}
            />
          </Field>

          <Field label={t('feeStructure.fields.description')} error={validationError(errors.description?.message)}>
            <input
              {...register('description')}
              className="input"
              placeholder={t('feeStructure.placeholders.description')}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label={t('feeStructure.fields.type')} error={validationError(errors.feeType?.message)}>
              <Controller
                name="feeType"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onChange={field.onChange}
                    options={FEE_TYPES.map((ft) => ({ value: ft, label: feeTypeLabel(ft) }))}
                  />
                )}
              />
            </Field>
            <Field label={t('feeStructure.fields.academicYear')} error={validationError(errors.academicYearId?.message)}>
              {academicYears.length > 0 ? (
                <Controller
                  name="academicYearId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={t('feeStructure.placeholders.selectYear')}
                      options={academicYears.map((ay) => ({
                        value: ay.id,
                        label: academicYearLabel(ay),
                      }))}
                    />
                  )}
                />
              ) : (
                <p className="text-xs text-[rgb(var(--text-tertiary))] py-2">
                  {t('feeStructure.academicYearStatus.noneConfigured')}
                </p>
              )}
            </Field>
          </div>

          {/* ── Pricing ── */}
          <SectionHeader title={t('feeStructure.sections.pricing')} />

          <div className="grid grid-cols-2 gap-4">
            <Field label={t('feeStructure.fields.amount')} error={validationError(errors.amount?.message)}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[rgb(var(--text-tertiary))] pointer-events-none select-none">
                  {currency}
                </span>
                <input
                  {...register('amount', { valueAsNumber: true })}
                  type="number"
                  min="0"
                  max="10000000"
                  step={currency === 'NPR' ? '1' : '0.01'}
                  className="input ps-12"
                  placeholder={currency === 'NPR' ? '0' : '0.00'}
                />
              </div>
            </Field>
            <Field label={t('feeStructure.fields.frequency')} error={validationError(errors.frequency?.message)}>
              <Controller
                name="frequency"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onChange={field.onChange}
                    options={FREQUENCIES.map((freq) => ({ value: freq, label: frequencyLabel(freq) }))}
                  />
                )}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label={t('feeStructure.fields.taxType')} error={validationError(errors.taxType?.message)}>
              <Controller
                name="taxType"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ?? 'none'}
                    onChange={field.onChange}
                    options={TAX_TYPES.map((tt) => ({ value: tt, label: taxTypeLabel(tt) }))}
                  />
                )}
              />
            </Field>
            {watchedTaxType !== 'none' && (
              <Field label={t('feeStructure.fields.taxRate')} error={validationError(errors.taxRate?.message)}>
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
            )}
          </div>

          {/* ── Scope ── */}
          <SectionHeader title={t('feeStructure.sections.scope')} />

          {/* Grade Levels — multi-select dropdown */}
          <Controller
            name="gradeLevels"
            control={control}
            render={({ field }) => (
              <GradeLevelSelect
                value={field.value}
                onChange={field.onChange}
                gradeOptions={gradeOptions}
                error={validationError(errors.gradeLevels?.message)}
              />
            )}
          />

          {/* ── Enrollment Rules ── */}
          <SectionHeader title={t('feeStructure.sections.enrollmentRules')} />

          <div className="space-y-3 p-3 rounded-lg bg-[rgb(var(--background-tertiary))]">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('autoApplyOnEnrollment')}
                className="w-4 h-4 rounded border-[rgb(var(--border-primary))] text-[rgb(var(--action-secondary-fg))] focus:ring-[rgb(var(--border-focus))]"
              />
              <span className="text-sm text-[rgb(var(--text-primary))]">{t('feeStructure.autoApplyOnEnrollment')}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('proRateOnMidTermEntry')}
                className="w-4 h-4 rounded border-[rgb(var(--border-primary))] text-[rgb(var(--action-secondary-fg))] focus:ring-[rgb(var(--border-focus))]"
              />
              <span className="text-sm text-[rgb(var(--text-primary))]">{t('feeStructure.enrollment.proRateOnMidTermEntry')}</span>
            </label>
            <p className="text-xs text-[rgb(var(--text-tertiary))]">
              {t('feeStructure.enrollment.proRateHelp')}
            </p>
          </div>

          {/* ── Effective Period ── */}
          <SectionHeader title={t('feeStructure.sections.effectivePeriod')} />

          <div className="grid grid-cols-2 gap-4">
            <Field label={t('feeStructure.fields.effectiveFrom')} error={validationError(errors.effectiveFrom?.message)}>
              <input {...register('effectiveFrom')} type="date" className="input" />
            </Field>
            <Field label={t('feeStructure.fields.effectiveTo')} error={validationError(errors.effectiveTo?.message)}>
              <input {...register('effectiveTo')} type="date" className="input" />
            </Field>
          </div>
          {calendarSystem === 'bikram_sambat' && (
            <p className="text-xs text-[rgb(var(--text-tertiary))]">
              {t('feeStructure.dateHelp.gregorianStorage')}
              {enableDualDateDisplay && ` ${t('feeStructure.dateHelp.dualBs')}`}
            </p>
          )}
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-[rgb(var(--border-primary))] flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            {t('actions.cancel')}
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting || !isValid}
          >
            {isSubmitting ? t('actions.saving') : t('actions.save')}
          </Button>
        </div>
      </div>

    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  GradeLevelSelect — multi-select dropdown                           */
/* ------------------------------------------------------------------ */

function GradeLevelSelect({
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
  const { t } = useTranslation('payments')
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // True iff `value` is the same SET as `gradeOptions` — not just same length.
  // Length-equality was wrong: if value contained a code outside gradeOptions
  // (e.g., a saved fee referencing a now-disabled grade level surfaced via
  // the page's union with `editingFee.gradeLevels`), or if value happened to
  // be the same length but a different set, "All Grades" would render or
  // mis-fire. The page guarantees value ⊆ gradeOptions in the happy path,
  // so this check normally collapses to length equality, but the defensive
  // form makes the picker robust to drift.
  const allSelected = (() => {
    if (gradeOptions.length === 0) return false
    const valueSet = new Set(value)
    if (!gradeOptions.every((g) => valueSet.has(g))) return false
    const optSet = new Set(gradeOptions)
    return value.every((v) => optSet.has(v))
  })()

  const toggleGrade = (grade: string) => {
    if (value.includes(grade)) {
      onChange(value.filter((g) => g !== grade))
    } else {
      onChange([...value, grade])
    }
  }

  const toggleAll = () => {
    if (allSelected) {
      onChange([])
    } else {
      onChange([...gradeOptions])
    }
  }

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const displayText = value.length === 0
    ? t('feeStructure.gradeSelect.placeholder')
    : allSelected
      ? t('feeStructure.allGrades')
      : t(
          value.length === 1
            ? 'feeStructure.gradeSelect.selectedCount'
            : 'feeStructure.gradeSelect.selectedCount_plural',
          { count: value.length },
        )

  return (
    <Field label={t('feeStructure.fields.gradeLevels')} error={error}>
      <div className="relative" ref={dropdownRef}>
        {/* Trigger button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="input w-full text-start flex items-center justify-between"
        >
          <span className={value.length === 0 ? 'text-[rgb(var(--text-tertiary))]' : ''}>
            {displayText}
          </span>
          <ChevronDown className={`w-4 h-4 text-[rgb(var(--text-tertiary))] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-20 mt-1 w-full bg-[rgb(var(--background-primary))] border border-[rgb(var(--border-primary))] rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {/* All Grades option */}
            <label className="flex items-center gap-2 px-3 py-2 hover:bg-[rgb(var(--background-secondary))] cursor-pointer border-b border-[rgb(var(--border-primary))]">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="w-3.5 h-3.5 rounded border-[rgb(var(--border-primary))] text-[rgb(var(--action-secondary-fg))] focus:ring-[rgb(var(--border-focus))]"
              />
              <span className="text-sm font-medium text-[rgb(var(--text-primary))]">{t('feeStructure.allGrades')}</span>
            </label>

            {/* Individual grades */}
            {gradeOptions.map((grade) => (
              <label
                key={grade}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-[rgb(var(--background-secondary))] cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={value.includes(grade)}
                  onChange={() => toggleGrade(grade)}
                  className="w-3.5 h-3.5 rounded border-[rgb(var(--border-primary))] text-[rgb(var(--state-info-fg))] focus:ring-[rgb(var(--border-focus))]"
                />
                <span className="text-sm text-[rgb(var(--text-primary))]">{t('feeStructure.gradeSelect.gradeLabel', { grade })}</span>
              </label>
            ))}
          </div>
        )}

        {/* Selected tags */}
        {value.length > 0 && !allSelected && (
          <div className="flex flex-wrap gap-1 mt-2">
            {value.map((grade) => (
              <span
                key={grade}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-[rgb(var(--state-info-bg)/0.18)] text-[rgb(var(--state-info-fg))] border border-[rgb(var(--state-info-border)/0.35)]"
              >
                {grade}
                <button
                  type="button"
                  onClick={() => toggleGrade(grade)}
                  aria-label={t('feeStructure.gradeSelect.removeGradeAria', { grade })}
                  className="hover:text-[rgb(var(--state-info-fg))]"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </Field>
  )
}

/* ------------------------------------------------------------------ */
/*  Section Header helper                                              */
/* ------------------------------------------------------------------ */

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <span className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--text-tertiary))]">
        {title}
      </span>
      <div className="flex-1 h-px bg-[rgb(var(--border-primary))]" />
    </div>
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
      {error && <p className="text-xs text-[rgb(var(--state-danger-fg))] mt-0.5">{error}</p>}
    </div>
  )
}
