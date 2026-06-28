/**
 * Step4Review — summary card + per-student expandable preview + grand total
 * + bulk-preview banner (showing duplicate skip count from the BE).
 *
 * The Generate button lives in the wizard's footer; this component only
 * renders the read-only confirmation surface.
 */

import { useMemo, useState } from 'react'
import { ChevronDown, Users, FileText, Calendar, Shield, AlertTriangle, Loader2, Info, UserPlus, AlertCircle } from 'lucide-react'
import type { UseQueryResult } from '@tanstack/react-query'
import { useCurrency } from '@edforge/types/use-currency'
import { useFinanceSettings } from '../../../layouts/FinanceLayout'
import { computeBatch } from './compute'
import type {
  ComputedInvoice,
  CustomLine,
  FeeStructure,
  SelectedFeesMap,
  StudentSearchResult,
  WizardDetails,
} from './types'
import type { BulkPreviewResponse } from '@edforge/finance-services'

export interface Step4ReviewProps {
  students: StudentSearchResult[]
  fees: FeeStructure[]
  selectedFees: SelectedFeesMap
  customLines: CustomLine[]
  details: WizardDetails
  previewQuery: UseQueryResult<BulkPreviewResponse>
  schoolCode?: string
}

export function Step4Review({
  students,
  fees,
  selectedFees,
  customLines,
  details,
  previewQuery,
}: Step4ReviewProps) {
  const settings = useFinanceSettings()
  const { format: formatCurrency } = useCurrency(settings)
  const batch = useMemo(
    () => computeBatch(students, fees, selectedFees, customLines, {
      skipZeroTotal: details.skipZeroTotal,
    }),
    [students, fees, selectedFees, customLines, details.skipZeroTotal],
  )
  const billableRows = batch.perStudent.filter(p => details.skipZeroTotal ? p.total > 0 : true)
  const skippedZero = batch.zeroCount

  const selectedFeeObjs = fees.filter(f => selectedFees[f.id])
  const customCount = customLines.filter(l => l.name || l.amount).length
  const grades = useMemo(
    () => [...new Set(students.map(s => s.currentGradeLevel))].sort(),
    [students],
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr,300px] gap-6">
      <div className="space-y-4">
        <p className="text-sm text-[rgb(var(--text-secondary))]">
          Verify everything below. {billableRows.length} invoice
          {billableRows.length === 1 ? '' : 's'} will be generated
          {skippedZero > 0 && details.skipZeroTotal && (
            <span className="text-[rgb(var(--text-tertiary))]">
              {' '}({skippedZero} skipped — zero total)
            </span>
          )}
          .
        </p>

        {/* Summary card */}
        <div className="border border-[rgb(var(--border-primary))] rounded-md bg-[rgb(var(--background-primary))]">
          <SummaryRow icon={Users} label="Recipients">
            {students.length} students · {grades.length} grade{grades.length === 1 ? '' : 's'}
          </SummaryRow>
          <SummaryRow icon={FileText} label="Fee structures">
            <div className="space-y-1">
              {selectedFeeObjs.map(f => (
                <div key={f.id} className="flex justify-between gap-3 text-xs">
                  <span className="text-[rgb(var(--text-primary))]">{f.name}</span>
                  <span className="text-[rgb(var(--text-tertiary))] font-mono whitespace-nowrap">
                    {formatCurrency(f.amount)}
                  </span>
                </div>
              ))}
              {customLines.filter(l => l.name || l.amount).map(cl => (
                <div key={cl.id} className="flex justify-between gap-3 text-xs">
                  <span className="text-[rgb(var(--text-primary))]">
                    {cl.name || 'Custom line item'}
                  </span>
                  <span className="text-[rgb(var(--text-tertiary))] font-mono whitespace-nowrap">
                    {formatCurrency(Number(cl.amount) || 0)}
                  </span>
                </div>
              ))}
              {selectedFeeObjs.length === 0 && customCount === 0 && (
                <span className="text-xs text-[rgb(var(--text-tertiary))]">No fees selected.</span>
              )}
            </div>
          </SummaryRow>
          <SummaryRow icon={Calendar} label="Period">
            <div>
              {details.billingPeriod || '—'} · {details.academicYear}
              <div className="text-[11px] text-[rgb(var(--text-tertiary))] font-mono whitespace-nowrap mt-0.5">
                Issue {details.issueDate || '—'} · Due {details.dueDate || '—'}
              </div>
            </div>
          </SummaryRow>
        </div>

        {/* Per-student preview */}
        {details.showPreview && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[rgb(var(--text-secondary))]">
                Per-student preview
              </span>
              <span className="text-[11px] text-[rgb(var(--text-tertiary))]">
                tap a row to expand
              </span>
            </div>
            <div className="space-y-1.5">
              {billableRows.map(inv => (
                <PerStudentRow key={inv.studentId} inv={inv} />
              ))}
              {billableRows.length === 0 && (
                <div className="text-center py-6 text-sm text-[rgb(var(--text-tertiary))] border border-dashed border-[rgb(var(--border-primary))] rounded-md">
                  No billable students. {skippedZero > 0 && 'All projected totals are 0.'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Grand total + preview banner */}
      <aside className="space-y-3">
        <div className="p-4 rounded-md border border-[rgb(var(--accent-strong))] bg-[rgb(var(--accent-soft))]/30 space-y-3">
          <Row label="Invoices" value={billableRows.length} bold />
          <Row
            label="Avg / student"
            value={formatCurrency(billableRows.length ? batch.billableTotal / billableRows.length : 0)}
            mono
          />
          <hr className="border-[rgb(var(--accent-strong))]/30" />
          <Row
            label="Grand total"
            value={formatCurrency(batch.billableTotal)}
            mono
            big
          />
        </div>

        <BulkPreviewBanner previewQuery={previewQuery} />

        <div className="flex items-start gap-2 p-3 rounded-md border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] text-[11px] text-[rgb(var(--text-secondary))] leading-relaxed">
          <Shield className="w-3.5 h-3.5 text-[rgb(var(--text-tertiary))] flex-shrink-0 mt-0.5" />
          <span>
            Posts to the General Ledger on issue. Notifications send per
            guardian channel preferences.
          </span>
        </div>
      </aside>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Bulk-preview banner — duplicate count + segment counters from BE
// ---------------------------------------------------------------------------

function BulkPreviewBanner({
  previewQuery,
}: {
  previewQuery: UseQueryResult<BulkPreviewResponse>
}) {
  if (previewQuery.isLoading || previewQuery.isFetching) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-md border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] text-xs text-[rgb(var(--text-tertiary))]">
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Resolving server preview…
      </div>
    )
  }
  if (previewQuery.isError) {
    return (
      <div className="flex items-start gap-2 p-3 rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/30 text-xs text-amber-800 dark:text-amber-200">
        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
        <span>
          Server preview unavailable — generate will still work, but duplicate /
          segment counts won&apos;t be shown.
        </span>
      </div>
    )
  }
  const data = previewQuery.data
  if (!data) return null
  return (
    <div className="p-3 rounded-md border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] space-y-2 text-xs">
      <div className="font-semibold text-[rgb(var(--text-secondary))]">Server preview</div>
      <PreviewRow icon={Info} label="Duplicate skip">
        {data.duplicateCount > 0 ? (
          <span className="text-amber-700 dark:text-amber-200">{data.duplicateCount}</span>
        ) : (
          <span className="text-[rgb(var(--text-tertiary))]">0</span>
        )}
      </PreviewRow>
      <PreviewRow icon={AlertTriangle} label="Has balance due">
        {fmtCounter(data.studentsWithBalance)}
      </PreviewRow>
      <PreviewRow icon={UserPlus} label="New admissions">
        {fmtCounter(data.studentsNewAdmission)}
      </PreviewRow>
      <PreviewRow icon={Info} label="Not billed this period">
        {fmtCounter(data.studentsNotBilledThisPeriod)}
      </PreviewRow>
      <div className="text-[10px] text-[rgb(var(--text-tertiary))] pt-1 border-t border-[rgb(var(--border-primary))]">
        Estimated duration ≈ {data.estimatedDurationSec}s
      </div>
    </div>
  )
}

function fmtCounter(n: number | undefined): React.ReactNode {
  if (n === undefined) return <span className="text-[rgb(var(--text-tertiary))]">—</span>
  return <span className="text-[rgb(var(--text-primary))] tabular-nums">{n}</span>
}

// ---------------------------------------------------------------------------
// Per-student row (expandable)
// ---------------------------------------------------------------------------

function PerStudentRow({ inv }: { inv: ComputedInvoice }) {
  const settings = useFinanceSettings()
  const { format: formatCurrency } = useCurrency(settings)
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-[rgb(var(--border-primary))] rounded-md bg-[rgb(var(--background-primary))]">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setOpen(!open)
          }
        }}
        className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-[rgb(var(--background-secondary))]"
      >
        <div className="flex-1 min-w-0">
          <div className="text-sm text-[rgb(var(--text-primary))] truncate">
            {inv.studentName}
          </div>
          <div className="text-[11px] text-[rgb(var(--text-tertiary))]">
            {gradeLabel(inv.gradeLevel)} · {inv.lines.length} line item{inv.lines.length === 1 ? '' : 's'}
          </div>
        </div>
        <span className="text-sm font-mono font-semibold text-[rgb(var(--text-primary))] whitespace-nowrap">
          {formatCurrency(inv.total)}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-[rgb(var(--text-tertiary))] transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </div>
      {open && (
        <table className="w-full text-xs border-t border-[rgb(var(--border-primary))]">
          <tbody>
            {inv.lines.map(line => (
              <tr key={line.key}>
                <td className="px-3 py-1.5 text-[rgb(var(--text-secondary))]">
                  {line.name}
                  {line.isCustom && (
                    <span className="ml-1.5 text-[10px] px-1 py-0 rounded bg-[rgb(var(--background-secondary))] text-[rgb(var(--text-tertiary))]">
                      custom
                    </span>
                  )}
                </td>
                <td className="px-3 py-1.5 text-right font-mono text-[rgb(var(--text-secondary))]">
                  {formatCurrency(line.base)}
                  {line.discount > 0 && (
                    <span className="ml-1.5 text-[rgb(var(--accent-strong))]">
                      −{formatCurrency(line.discount)}
                    </span>
                  )}
                </td>
              </tr>
            ))}
            <tr className="border-t border-[rgb(var(--border-primary))]">
              <td className="px-3 py-1.5 font-semibold text-[rgb(var(--text-primary))]">
                Invoice total
              </td>
              <td className="px-3 py-1.5 text-right font-mono font-semibold text-[rgb(var(--text-primary))]">
                {formatCurrency(inv.total)}
              </td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Atoms
// ---------------------------------------------------------------------------

function SummaryRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 px-3 py-2.5 border-b border-[rgb(var(--border-primary))] last:border-b-0">
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-[rgb(var(--background-secondary))] text-[rgb(var(--text-tertiary))] flex-shrink-0">
        <Icon className="w-3.5 h-3.5" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-medium uppercase tracking-wider text-[rgb(var(--text-tertiary))]">
          {label}
        </div>
        <div className="text-sm text-[rgb(var(--text-primary))] mt-0.5">{children}</div>
      </div>
    </div>
  )
}

function Row({
  label,
  value,
  mono,
  bold,
  big,
}: {
  label: string
  value: string | number
  mono?: boolean
  bold?: boolean
  big?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-xs ${bold ? 'font-semibold' : ''} text-[rgb(var(--text-secondary))]`}>
        {label}
      </span>
      <span
        className={[
          mono ? 'font-mono' : '',
          big ? 'text-lg font-bold' : 'text-sm font-semibold',
          'text-[rgb(var(--text-primary))] tabular-nums',
        ].join(' ')}
      >
        {value}
      </span>
    </div>
  )
}

function PreviewRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="inline-flex items-center gap-1.5 text-[rgb(var(--text-secondary))]">
        <Icon className="w-3 h-3 text-[rgb(var(--text-tertiary))]" /> {label}
      </span>
      {children}
    </div>
  )
}

function gradeLabel(g: string): string {
  if (!g) return 'Unknown'
  return /^\d+$/.test(g) ? `Grade ${g}` : g
}
