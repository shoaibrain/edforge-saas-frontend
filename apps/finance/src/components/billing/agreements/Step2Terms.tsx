/**
 * Step 2 — Terms.
 *
 * Agreement type (fixed_total / per_student), covered fee types (multi-select
 * over the backend feeTypeEnum — freeform entry is impossible), billing
 * frequency, effective dates, notes, and the amounts. For fixed_total the
 * allocation sum is shown live against the total; for per_student the editor
 * is the full (member × covered feeType) matrix the backend F1 invariant
 * requires.
 */

import { Select } from '@edforge/ui'
import { useTranslation } from '@edforge/i18n'
import { useCurrency } from '@edforge/types/use-currency'
import type { AgreementType, FeeType, FeeFrequency } from '@edforge/types'
import { useFinanceSettings } from '../../../layouts/FinanceLayout'
import { UuidBadge } from '@edforge/archetype'
import { FEE_TYPES, feeTypeLabel } from '../../shared/fee-types'
import {
  BILLING_FREQUENCIES,
  AMOUNT_SUM_TOLERANCE,
  MAX_NOTES_LENGTH,
  cellKey,
  parseAmount,
  type WizardMember,
} from './wizard-types'

interface Step2Props {
  members: WizardMember[]
  agreementType: AgreementType
  coveredFeeTypes: FeeType[]
  billingFrequency: FeeFrequency
  totalAmount: string
  allocation: Record<string, string>
  cells: Record<string, string>
  effectiveFrom: string
  effectiveTo: string
  notes: string
  onChange: (
    patch: Partial<{
      agreementType: AgreementType
      coveredFeeTypes: FeeType[]
      billingFrequency: FeeFrequency
      totalAmount: string
      allocation: Record<string, string>
      cells: Record<string, string>
      effectiveFrom: string
      effectiveTo: string
      notes: string
    }>,
  ) => void
}

const inputClass =
  'w-full rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-primary))] px-3 py-2 text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)]'
// Amount inputs sit next to a flexible label column — fixed width, never
// w-full, so the student/fee-type label cannot collapse under the input.
const amountInputClass =
  'w-32 flex-none rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-primary))] px-3 py-2 text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)]'
const labelClass =
  'mb-1 block text-sm font-medium text-[rgb(var(--text-secondary))]'

export function Step2Terms({
  members,
  agreementType,
  coveredFeeTypes,
  billingFrequency,
  totalAmount,
  allocation,
  cells,
  effectiveFrom,
  effectiveTo,
  notes,
  onChange,
}: Step2Props) {
  const { t } = useTranslation('payments')
  const settings = useFinanceSettings()
  const { format } = useCurrency(settings)

  const toggleFeeType = (feeType: FeeType) =>
    onChange({
      coveredFeeTypes: coveredFeeTypes.includes(feeType)
        ? coveredFeeTypes.filter((f) => f !== feeType)
        : [...coveredFeeTypes, feeType],
    })

  const setAllocation = (studentId: string, amount: string) =>
    onChange({ allocation: { ...allocation, [studentId]: amount } })
  const setCell = (studentId: string, feeType: FeeType, amount: string) =>
    onChange({ cells: { ...cells, [cellKey(studentId, feeType)]: amount } })

  const allocationSum = members.reduce(
    (acc, m) => acc + parseAmount(allocation[m.studentId]),
    0,
  )
  const total = parseAmount(totalAmount)
  const mismatch =
    total > 0 && Math.abs(allocationSum - total) > AMOUNT_SUM_TOLERANCE

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
            onChange={(v) =>
              onChange({ billingFrequency: (v ?? 'monthly') as FeeFrequency })
            }
          />
        </div>
      </div>

      {/* Covered fee types — multi-select over the backend enum */}
      <div>
        <label className={labelClass}>
          {t('agreement.wizard.terms.coveredFeeTypes')}
        </label>
        <p className="mb-2 text-xs text-[rgb(var(--text-tertiary))]">
          {t('agreement.wizard.terms.coveredFeeTypesHint')}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {FEE_TYPES.map((feeType) => {
            const selected = coveredFeeTypes.includes(feeType)
            return (
              <button
                key={feeType}
                type="button"
                onClick={() => toggleFeeType(feeType)}
                aria-pressed={selected}
                className={[
                  'rounded-full border px-2.5 py-1 text-xs transition-colors',
                  selected
                    ? 'border-[rgb(var(--accent-strong)/0.4)] bg-[rgb(var(--accent-soft))] font-medium text-[rgb(var(--accent-strong))]'
                    : 'border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--background-tertiary))]',
                ].join(' ')}
              >
                {feeTypeLabel(t, feeType)}
              </button>
            )
          })}
        </div>
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
              min="0.01"
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
                  <div className="min-w-32 flex-1">
                    <div className="truncate text-sm text-[rgb(var(--text-primary))]">
                      {m.studentName}
                    </div>
                    <div className="text-2xs text-[rgb(var(--text-tertiary))]">
                      <UuidBadge value={m.studentId} />
                    </div>
                  </div>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={allocation[m.studentId] ?? ''}
                    onChange={(e) => setAllocation(m.studentId, e.target.value)}
                    className={amountInputClass}
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div>
          <span className={labelClass}>{t('agreement.wizard.terms.lines')}</span>
          <p className="mb-2 text-xs text-[rgb(var(--text-tertiary))]">
            {t('agreement.wizard.terms.matrixHint')}
          </p>
          {coveredFeeTypes.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[rgb(var(--border-primary))] px-3 py-6 text-center text-xs text-[rgb(var(--text-tertiary))]">
              {t('agreement.wizard.terms.selectFeeTypesFirst')}
            </p>
          ) : (
            <ul className="space-y-2">
              {members.map((m) => (
                <li
                  key={m.studentId}
                  className="rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] p-3"
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-medium text-[rgb(var(--text-primary))]">
                      {m.studentName}
                    </span>
                    <span className="text-2xs text-[rgb(var(--text-tertiary))]">
                      <UuidBadge value={m.studentId} />
                    </span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {coveredFeeTypes.map((feeType) => (
                      <div
                        key={feeType}
                        className="flex items-center justify-between gap-3"
                      >
                        <span className="min-w-24 flex-1 truncate text-sm text-[rgb(var(--text-secondary))]">
                          {feeTypeLabel(t, feeType)}
                        </span>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={cells[cellKey(m.studentId, feeType)] ?? ''}
                          onChange={(e) =>
                            setCell(m.studentId, feeType, e.target.value)
                          }
                          aria-label={`${m.studentName} — ${feeTypeLabel(t, feeType)}`}
                          className={amountInputClass}
                        />
                      </div>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
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

      {/* Notes (optional, ≤500) */}
      <div>
        <label className={labelClass}>{t('agreement.wizard.terms.notes')}</label>
        <textarea
          value={notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder={t('agreement.wizard.terms.notesPlaceholder')}
          maxLength={MAX_NOTES_LENGTH}
          rows={3}
          className={`${inputClass} resize-none`}
        />
      </div>
    </div>
  )
}
