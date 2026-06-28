/**
 * Step3InvoiceDetails — billing period, dates, numbering preview, options.
 *
 * The number-prefix preview is FORMAT-only in Phase 1 — no reservation API
 * exists yet (Phase 2.4). Operators see what the numbers will LOOK like so
 * they can sanity-check the format before generate.
 */

import { Eye, Ban, Calendar as CalIcon } from 'lucide-react'
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
  const set = <K extends keyof WizardDetails>(k: K, v: WizardDetails[K]) =>
    setDetails({ ...details, [k]: v })

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-4 max-w-3xl">
      <Field label="Academic year" help="Active year — drives invoice + ledger anchoring.">
        <select
          value={details.academicYear}
          onChange={(e) => set('academicYear', e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-md border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-primary))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-strong))] focus:border-transparent"
        >
          {academicYears.length === 0 && <option value="">No academic years configured</option>}
          {academicYears.map(ay => (
            <option key={ay} value={ay}>{ay}</option>
          ))}
        </select>
      </Field>

      <Field label="Billing period / term" help="Grading-period aligned billing window.">
        <select
          value={details.billingPeriod}
          onChange={(e) => set('billingPeriod', e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-md border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-primary))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-strong))] focus:border-transparent"
        >
          <option value="">— Select —</option>
          <option value="First Term">First Term</option>
          <option value="Second Term">Second Term</option>
          <option value="Third Term">Third Term</option>
          <option value="Fourth Term">Fourth Term</option>
        </select>
      </Field>

      <Field label="Issue date">
        <DateInput value={details.issueDate} onChange={(v) => set('issueDate', v)} />
      </Field>

      <Field label="Due date">
        <DateInput value={details.dueDate} onChange={(v) => set('dueDate', v)} />
      </Field>

      <div className="lg:col-span-2">
        <Field label="Invoice number preview">
          <div className="flex items-center gap-3 px-3 py-2 rounded-md bg-[rgb(var(--background-secondary))] border border-[rgb(var(--border-primary))]">
            <span className="text-sm font-mono text-[rgb(var(--text-primary))] truncate">
              {numberPreview.first} … {numberPreview.last}
            </span>
            <span className="text-xs text-[rgb(var(--text-tertiary))] whitespace-nowrap">
              {studentCount} sequential number{studentCount === 1 ? '' : 's'}
            </span>
          </div>
          <span className="text-[11px] text-[rgb(var(--text-tertiary))] mt-1 block">
            Format only — actual numbers are reserved at generate time. Format:
            INV-<i>{`{school}`}</i>-<i>{`{year}`}</i>-<i>{`{term}`}</i>-<i>{`{seq}`}</i>.
          </span>
        </Field>
      </div>

      <div className="lg:col-span-2">
        <Field label="Note on every invoice" optional>
          <input
            type="text"
            value={details.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="e.g. Please pay at the accounts counter or via eSewa before the due date."
            className="w-full px-3 py-2 text-sm rounded-md border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-primary))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-strong))] focus:border-transparent"
          />
        </Field>
      </div>

      <div className="lg:col-span-2 space-y-2">
        <OptionToggle
          icon={Eye}
          title="Review every invoice before generating"
          subtitle="Show a per-student line-item preview on the next step."
          value={details.showPreview}
          onChange={(v) => set('showPreview', v)}
        />
        <OptionToggle
          icon={Ban}
          title="Skip students whose total comes to zero"
          subtitle="Don't issue zero-amount invoices (e.g. fully-discounted students)."
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
  return (
    <div>
      <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1">
        {label}
        {optional && (
          <span className="ml-1 text-[rgb(var(--text-tertiary))]">(optional)</span>
        )}
      </label>
      {children}
      {help && (
        <span className="block mt-1 text-[11px] text-[rgb(var(--text-tertiary))]">
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
            ? 'bg-[rgb(var(--accent-strong))] text-white'
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
            'inline-block w-4 h-4 rounded-full bg-white transition-transform',
            value ? 'translate-x-4' : 'translate-x-0.5',
          ].join(' ')}
        />
      </span>
    </div>
  )
}
