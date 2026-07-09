/**
 * Step 2 — Terms.
 *
 * Agreement type (fixed_total / per_student), covered fee types, billing
 * frequency, effective dates, and the per-member amounts. For fixed_total the
 * allocation sum is shown live against the total so the operator sees a
 * mismatch before the review step.
 */

import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { Select } from '@edforge/ui'
import { useTranslation } from '@edforge/i18n'
import { useCurrency } from '@edforge/types/use-currency'
import type { AgreementType } from '@edforge/types'
import { useFinanceSettings } from '../../../layouts/FinanceLayout'
import { UuidBadge } from '@edforge/archetype'
import {
  BILLING_FREQUENCIES,
  parseAmount,
  type WizardMember,
} from './wizard-types'

interface Step2Props {
  members: WizardMember[]
  agreementType: AgreementType
  coveredFeeTypes: string[]
  billingFrequency: string
  totalAmount: string
  allocation: Record<string, string>
  lines: Record<string, { amount: string; feeType: string }>
  effectiveFrom: string
  effectiveTo: string
  onChange: (
    patch: Partial<{
      agreementType: AgreementType
      coveredFeeTypes: string[]
      billingFrequency: string
      totalAmount: string
      allocation: Record<string, string>
      lines: Record<string, { amount: string; feeType: string }>
      effectiveFrom: string
      effectiveTo: string
    }>,
  ) => void
}

const inputClass =
  'w-full rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-primary))] px-3 py-2 text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)]'
const labelClass =
  'mb-1 block text-sm font-medium text-[rgb(var(--text-secondary))]'

export function Step2Terms({
  members,
  agreementType,
  coveredFeeTypes,
  billingFrequency,
  totalAmount,
  allocation,
  lines,
  effectiveFrom,
  effectiveTo,
  onChange,
}: Step2Props) {
  const { t } = useTranslation('payments')
  const settings = useFinanceSettings()
  const { format } = useCurrency(settings)
  const [feeTypeDraft, setFeeTypeDraft] = useState('')

  const addFeeType = () => {
    const v = feeTypeDraft.trim()
    if (!v || coveredFeeTypes.includes(v)) {
      setFeeTypeDraft('')
      return
    }
    onChange({ coveredFeeTypes: [...coveredFeeTypes, v] })
    setFeeTypeDraft('')
  }
  const removeFeeType = (v: string) =>
    onChange({ coveredFeeTypes: coveredFeeTypes.filter((f) => f !== v) })

  const setAllocation = (studentId: string, amount: string) =>
    onChange({ allocation: { ...allocation, [studentId]: amount } })
  const setLine = (
    studentId: string,
    patch: Partial<{ amount: string; feeType: string }>,
  ) =>
    onChange({
      lines: {
        ...lines,
        [studentId]: {
          amount: lines[studentId]?.amount ?? '',
          feeType: lines[studentId]?.feeType ?? '',
          ...patch,
        },
      },
    })

  const allocationSum = members.reduce(
    (acc, m) => acc + parseAmount(allocation[m.studentId]),
    0,
  )
  const total = parseAmount(totalAmount)
  const mismatch = total > 0 && Math.abs(allocationSum - total) > 0.001

  const typeOptions = [
    { value: 'fixed_total', label: t('agreement.type.fixed_total') },
    { value: 'per_student', label: t('agreement.type.per_student') },
  ]
  const freqOptions = BILLING_FREQUENCIES.map((f) => ({
    value: f,
    label: t(`agreement.wizard.frequency.${f}`),
  }))

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className={labelClass}>
            {t('agreement.wizard.terms.agreementType')}
          </label>
          <Select
            size="sm"
            options={typeOptions}
            value={agreementType}
            onChange={(v) =>
              onChange({ agreementType: (v ?? 'fixed_total') as AgreementType })
            }
          />
        </div>
        <div>
          <label className={labelClass}>
            {t('agreement.wizard.terms.billingFrequency')}
          </label>
          <Select
            size="sm"
            options={freqOptions}
            value={billingFrequency}
            onChange={(v) => onChange({ billingFrequency: v ?? 'monthly' })}
          />
        </div>
      </div>

      {/* Covered fee types */}
      <div>
        <label className={labelClass}>
          {t('agreement.wizard.terms.coveredFeeTypes')}
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={feeTypeDraft}
            onChange={(e) => setFeeTypeDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addFeeType()
              }
            }}
            placeholder={t('agreement.wizard.terms.coveredFeeTypesPlaceholder')}
            className={inputClass}
          />
          <button
            type="button"
            onClick={addFeeType}
            className="flex items-center gap-1 rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] px-3 py-2 text-sm text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--background-tertiary))]"
          >
            <Plus className="h-4 w-4" />
            {t('agreement.wizard.terms.addFeeType')}
          </button>
        </div>
        {coveredFeeTypes.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {coveredFeeTypes.map((f) => (
              <span
                key={f}
                className="inline-flex items-center gap-1 rounded-full bg-[rgb(var(--background-secondary))] px-2.5 py-1 text-xs text-[rgb(var(--text-secondary))]"
              >
                {f}
                <button
                  type="button"
                  onClick={() => removeFeeType(f)}
                  className="text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))]"
                  aria-label={t('agreement.wizard.family.remove')}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Amounts */}
      {agreementType === 'fixed_total' ? (
        <div className="space-y-3">
          <div className="max-w-xs">
            <label className={labelClass}>
              {t('agreement.wizard.terms.totalAmount')}
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={totalAmount}
              onChange={(e) => onChange({ totalAmount: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className={labelClass}>
                {t('agreement.wizard.terms.allocation')}
              </span>
              <span
                className={
                  mismatch
                    ? 'text-xs font-medium text-[rgb(var(--state-danger-fg))]'
                    : 'text-xs text-[rgb(var(--text-tertiary))]'
                }
              >
                {format(allocationSum, { decimals: 0 })} /{' '}
                {format(total, { decimals: 0 })}
              </span>
            </div>
            <p className="mb-2 text-xs text-[rgb(var(--text-tertiary))]">
              {t('agreement.wizard.terms.allocationHint')}
            </p>
            <ul className="space-y-1.5">
              {members.map((m) => (
                <li key={m.studentId} className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-[rgb(var(--text-primary))]">
                      {m.studentName}
                    </div>
                    <div className="text-2xs text-[rgb(var(--text-tertiary))]">
                      <UuidBadge value={m.studentId} />
                    </div>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={allocation[m.studentId] ?? ''}
                    onChange={(e) => setAllocation(m.studentId, e.target.value)}
                    className={`${inputClass} w-32`}
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div>
          <span className={labelClass}>{t('agreement.wizard.terms.lines')}</span>
          <ul className="mt-1 space-y-1.5">
            {members.map((m) => (
              <li key={m.studentId} className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-[rgb(var(--text-primary))]">
                    {m.studentName}
                  </div>
                  <div className="text-2xs text-[rgb(var(--text-tertiary))]">
                    <UuidBadge value={m.studentId} />
                  </div>
                </div>
                <input
                  type="text"
                  value={lines[m.studentId]?.feeType ?? ''}
                  onChange={(e) => setLine(m.studentId, { feeType: e.target.value })}
                  placeholder={t('agreement.wizard.terms.feeTypeOptional')}
                  className={`${inputClass} w-40`}
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={lines[m.studentId]?.amount ?? ''}
                  onChange={(e) => setLine(m.studentId, { amount: e.target.value })}
                  className={`${inputClass} w-32`}
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Effective dates */}
      <div className="grid max-w-md grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>
            {t('agreement.wizard.terms.effectiveFrom')}
          </label>
          <input
            type="date"
            value={effectiveFrom}
            onChange={(e) => onChange({ effectiveFrom: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>
            {t('agreement.wizard.terms.effectiveTo')}
          </label>
          <input
            type="date"
            value={effectiveTo}
            onChange={(e) => onChange({ effectiveTo: e.target.value })}
            className={inputClass}
          />
        </div>
      </div>
    </div>
  )
}
