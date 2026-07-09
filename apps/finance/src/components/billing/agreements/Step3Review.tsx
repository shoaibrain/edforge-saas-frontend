/**
 * Step 3 — Review.
 *
 * Read-only summary of the wizard state before submit. Amounts are resolved
 * through the same currency formatter used across finance.
 */

import { useTranslation } from '@edforge/i18n'
import { useCurrency } from '@edforge/types/use-currency'
import { UuidBadge } from '@edforge/archetype'
import { useFinanceSettings } from '../../../layouts/FinanceLayout'
import { formatDateDual } from '../../../utils/format-date'
import { parseAmount, type WizardState } from './wizard-types'

export function Step3Review({ state }: { state: WizardState }) {
  const { t } = useTranslation('payments')
  const settings = useFinanceSettings()
  const { format } = useCurrency(settings)

  return (
    <div className="space-y-4">
      <Card title={t('agreement.wizard.review.familySection')}>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
          <Item label={t('agreement.wizard.family.title')}>{state.title}</Item>
          <Item label={t('agreement.payer')}>
            {state.payerName}
            {state.payerPhone && (
              <span className="block text-xs text-[rgb(var(--text-tertiary))]">
                {state.payerPhone}
              </span>
            )}
            {state.payerEmail && (
              <span className="block text-xs text-[rgb(var(--text-tertiary))]">
                {state.payerEmail}
              </span>
            )}
          </Item>
          <Item label={t('agreement.wizard.terms.effectiveFrom')}>
            {t('agreement.effectivePeriod', {
              from: formatDateDual(state.effectiveFrom, settings),
              to: formatDateDual(state.effectiveTo, settings),
            })}
          </Item>
        </dl>
      </Card>

      <Card title={t('agreement.wizard.review.termsSection')}>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
          <Item label={t('agreement.list.type')}>
            {t(`agreement.type.${state.agreementType}`)}
          </Item>
          <Item label={t('agreement.billingFrequency')}>
            {t(`agreement.wizard.frequency.${state.billingFrequency}`, {
              defaultValue: state.billingFrequency,
            })}
          </Item>
          <Item label={t('agreement.coveredFeeTypes')}>
            {state.coveredFeeTypes.join(', ') || '—'}
          </Item>
          {state.agreementType === 'fixed_total' && (
            <Item label={t('agreement.detail.totalAmount')}>
              {format(parseAmount(state.totalAmount), { decimals: 0 })}
            </Item>
          )}
        </dl>
      </Card>

      <Card title={t('agreement.wizard.review.membersSection')}>
        <ul className="divide-y divide-[rgb(var(--border-primary))]">
          {state.members.map((m) => {
            const amount =
              state.agreementType === 'fixed_total'
                ? parseAmount(state.allocation[m.studentId])
                : parseAmount(state.lines[m.studentId]?.amount)
            const feeType =
              state.agreementType === 'per_student'
                ? state.lines[m.studentId]?.feeType
                : undefined
            return (
              <li
                key={m.studentId}
                className="flex items-center justify-between py-1.5 text-sm"
              >
                <div className="min-w-0">
                  <span className="text-[rgb(var(--text-primary))]">
                    {m.studentName}
                  </span>
                  {feeType && (
                    <span className="ml-2 text-xs text-[rgb(var(--text-tertiary))]">
                      {feeType}
                    </span>
                  )}
                  <span className="ml-2 text-2xs text-[rgb(var(--text-tertiary))]">
                    <UuidBadge value={m.studentId} />
                  </span>
                </div>
                <span className="font-medium text-[rgb(var(--text-primary))]">
                  {format(amount, { decimals: 0 })}
                </span>
              </li>
            )
          })}
        </ul>
      </Card>
    </div>
  )
}

function Card({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-primary))] p-4">
      <h3 className="mb-3 text-sm font-semibold text-[rgb(var(--text-primary))]">
        {title}
      </h3>
      {children}
    </section>
  )
}

function Item({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="min-w-0">
      <dt className="mb-0.5 text-xs font-medium uppercase tracking-wide text-[rgb(var(--text-tertiary))]">
        {label}
      </dt>
      <dd className="min-w-0 break-words text-[rgb(var(--text-primary))]">
        {children}
      </dd>
    </div>
  )
}
