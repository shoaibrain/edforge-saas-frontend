/**
 * Step3InvoiceDetails — billing period, dates, numbering preview, options.
 *
 * The number-prefix preview is FORMAT-only in Phase 1 — no reservation API
 * exists yet (Phase 2.4). Operators see what the numbers will LOOK like so
 * they can sanity-check the format before generate.
 */

import { Eye, Ban, Calendar as CalIcon } from 'lucide-react'
import { useTranslation } from '@edforge/i18n'
import type { WizardDetails } from './types'

export interface Step3InvoiceDetailsProps {
  studentCount: number
  details: WizardDetails
  setDetails: (next: WizardDetails) => void
  academicYears: string[]
  numberPreview: { prefix: string; first: string; last: string }
}

export function Step3InvoiceDetails({
  studentCount,
  details,
  setDetails,
  academicYears,
  numberPreview,
}: Step3InvoiceDetailsProps) {
  const { t } = useTranslation('payments')
  const set = <K extends keyof WizardDetails>(k: K, v: WizardDetails[K]) =>
    setDetails({ ...details, [k]: v })

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-4 max-w-3xl">
      <Field
        label={t('bulkGenerate.step3.academicYear')}
        help={t('bulkGenerate.step3.academicYearHelp')}
      >
        <select
          value={details.academicYear}
          onChange={(e) => set('academicYear', e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-md border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-primary))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-strong))] focus:border-transparent"
        >
          {academicYears.length === 0 && (
            <option value="">{t('bulkGenerate.step3.noAcademicYears')}</option>
          )}
          {academicYears.map(ay => (
            <option key={ay} value={ay}>{ay}</option>
          ))}
        </select>
      </Field>

      <Field
        label={t('bulkGenerate.step3.billingPeriod')}
        help={t('bulkGenerate.step3.billingPeriodHelp')}
      >
        <select
          value={details.billingPeriod}
          onChange={(e) => set('billingPeriod', e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-md border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-primary))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-strong))] focus:border-transparent"
        >
          <option value="">{t('bulkGenerate.step3.selectPeriod')}</option>
          <option value="First Term">{t('bulkGenerate.step3.terms.first')}</option>
          <option value="Second Term">{t('bulkGenerate.step3.terms.second')}</option>
          <option value="Third Term">{t('bulkGenerate.step3.terms.third')}</option>
          <option value="Fourth Term">{t('bulkGenerate.step3.terms.fourth')}</option>
        </select>
      </Field>

      <Field label={t('bulkGenerate.step3.dueDate')}>
        <DateInput value={details.dueDate} onChange={(v) => set('dueDate', v)} />
      </Field>

      <div className="lg:col-span-2">
        <Field label={t('bulkGenerate.step3.numberPreview')}>
          <div className="flex items-center gap-3 px-3 py-2 rounded-md bg-[rgb(var(--background-secondary))] border border-[rgb(var(--border-primary))]">
            <span className="text-sm font-mono text-[rgb(var(--text-primary))] truncate">
              {numberPreview.first} … {numberPreview.last}
            </span>
            <span className="text-xs text-[rgb(var(--text-tertiary))] whitespace-nowrap">
              {t('bulkGenerate.step3.sequentialNumbers', { count: studentCount })}
            </span>
          </div>
          <span className={/* allow-arbitrary-spacing: dense bulk-wizard helper text; pre-token-sweep */ "text-[11px] text-[rgb(var(--text-tertiary))] mt-1 block"}>
            {t('bulkGenerate.step3.numberPreviewHelp')}{' '}
            INV-<i>{`{school}`}</i>-<i>{`{year}`}</i>-<i>{`{term}`}</i>-<i>{`{seq}`}</i>.
          </span>
        </Field>
      </div>

      <div className="lg:col-span-2">
        <Field label={t('bulkGenerate.step3.note')} optional>
          <input
            type="text"
            value={details.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder={t('bulkGenerate.step3.notePlaceholder')}
            className="w-full px-3 py-2 text-sm rounded-md border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-primary))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-strong))] focus:border-transparent"
          />
        </Field>
      </div>

      <div className="lg:col-span-2 space-y-2">
        <OptionToggle
          icon={Eye}
          title={t('bulkGenerate.step3.reviewEveryInvoice')}
          subtitle={t('bulkGenerate.step3.reviewEveryInvoiceHelp')}
          value={details.showPreview}
          onChange={(v) => set('showPreview', v)}
        />
        <OptionToggle
          icon={Ban}
          title={t('bulkGenerate.step3.skipZeroTotal')}
          subtitle={t('bulkGenerate.step3.skipZeroTotalHelp')}
          value={details.skipZeroTotal}
          onChange={(v) => set('skipZeroTotal', v)}
        />
      </div>
    </div>
  )
}

function Field({
  label,
  help,
  optional,
  children,
}: {
  label: string
  help?: string
  optional?: boolean
  children: React.ReactNode
}) {
  const { t } = useTranslation('payments')
  return (
    <div>
      <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1">
        {label}
        {optional && (
          <span className="ml-1 text-[rgb(var(--text-tertiary))]">
            {t('bulkGenerate.common.optional')}
          </span>
        )}
      </label>
      {children}
      {help && (
        <span className={/* allow-arbitrary-spacing: dense bulk-wizard helper text; pre-token-sweep */ "block mt-1 text-[11px] text-[rgb(var(--text-tertiary))]"}>
          {help}
        </span>
      )}
    </div>
  )
}

function DateInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <CalIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--text-tertiary))] pointer-events-none" />
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-9 pr-3 py-2 text-sm font-mono rounded-md border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-primary))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-strong))] focus:border-transparent"
      />
    </div>
  )
}

function OptionToggle({
  icon: Icon,
  title,
  subtitle,
  value,
  onChange,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  subtitle: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onChange(!value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onChange(!value)
        }
      }}
      className={[
        'flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors',
        value
          ? 'border-[rgb(var(--accent-strong))] bg-[rgb(var(--accent-soft))]/30'
          : 'border-[rgb(var(--border-primary))] bg-[rgb(var(--background-primary))] hover:bg-[rgb(var(--background-secondary))]',
      ].join(' ')}
    >
      <span
        className={[
          'inline-flex items-center justify-center w-8 h-8 rounded-md flex-shrink-0',
          value
            ? /* allow-hardcoded-color: contrast label on filled accent toggle */ 'bg-[rgb(var(--accent-strong))] text-white'
            : 'bg-[rgb(var(--background-secondary))] text-[rgb(var(--text-tertiary))]',
        ].join(' ')}
      >
        <Icon className="w-4 h-4" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-[rgb(var(--text-primary))]">{title}</div>
        <div className="text-xs text-[rgb(var(--text-tertiary))] mt-0.5">{subtitle}</div>
      </div>
      <span
        className={[
          'inline-flex items-center w-9 h-5 rounded-full flex-shrink-0 transition-colors',
          value ? 'bg-[rgb(var(--accent-strong))]' : 'bg-[rgb(var(--border-primary))]',
        ].join(' ')}
      >
        <span
          className={[
            /* allow-hardcoded-color: toggle knob fill */ 'inline-block w-4 h-4 rounded-full bg-white transition-transform',
            value ? 'translate-x-4' : 'translate-x-0.5',
          ].join(' ')}
        />
      </span>
    </div>
  )
}
