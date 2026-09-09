/**
 * Step4Review — summary card + per-student expandable preview + grand total
 * + bulk-preview banner (showing duplicate skip count from the BE).
 *
 * The Generate button lives in the wizard's footer; this component only
 * renders the read-only confirmation surface.
 */

import { useMemo, useState } from 'react'
import { ChevronDown, Users, FileText, FileX, Calendar, Shield, ShieldAlert, AlertTriangle, Loader2, Info, UserPlus, AlertCircle } from 'lucide-react'
import type { UseQueryResult } from '@tanstack/react-query'
import { useTranslation } from '@edforge/i18n'
import { useCurrency } from '@edforge/types/use-currency'
import { useFinanceSettings } from '../../../layouts/FinanceLayout'
import { BillingSourceChip, type BillingSource } from '../../shared'
import { computeBatch } from './compute'
import type { StudentAgreementPricing } from './types'
import type {
  ComputedInvoice,
  CustomLine,
  FeeStructure,
  SelectedFeesMap,
  StudentSearchResult,
  WizardDetails,
} from './types'
import type { BulkPreviewResponse } from '@edforge/finance-services'

type Translate = (key: string, options?: Record<string, unknown>) => string

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
  const { t } = useTranslation('payments')
  const settings = useFinanceSettings()
  const { format: formatCurrency } = useCurrency(settings)
  // #465 — the server preview says what each student's agreement replaces
  // and for how much. Without it the projection prices agreement-covered
  // students at catalog rates and the operator confirms a total that will
  // never be billed. Absent (preview still loading, or the backend omitted
  // it) falls back to catalog pricing, which is the previous behaviour.
  const agreementsByStudent = useMemo(() => {
    const map: Record<string, StudentAgreementPricing> = {}
    for (const p of previewQuery.data?.students ?? []) {
      // `agreementBlocked` can arrive with neither suppression nor an amount:
      // the once-per-term guard fires on the agreement having priced the term,
      // not on the operator having picked a fee the agreement covers. Since
      // #363 that flag removes the student from the batch, so it has to be
      // enough on its own to land here.
      if (p.suppressedFeeStructureIds?.length || p.agreementAmount || p.agreementBlocked) {
        map[p.studentId] = {
          billingSource: p.billingSource,
          suppressedFeeStructureIds: p.suppressedFeeStructureIds,
          agreementAmount: p.agreementAmount,
          agreementBlocked: p.agreementBlocked,
        }
      }
    }
    return map
  }, [previewQuery.data?.students])

  const batch = useMemo(
    () => computeBatch(students, fees, selectedFees, customLines, {
      skipZeroTotal: details.skipZeroTotal,
      agreements: agreementsByStudent,
    }),
    [students, fees, selectedFees, customLines, details.skipZeroTotal, agreementsByStudent],
  )
  // #363 — the panel counted and priced every projected student while the
  // wizard footer read the server's `eligibleCount`. The two had no reason to
  // agree, and on the live batch they didn't: a NPR 20,000 total quoted from
  // exactly the students the server rejects. Anything the server will not bill
  // leaves the counted set here, so the panel and the footer describe the same
  // batch by construction.
  //
  // The server's own two per-batch exclusions:
  //
  //  - `agreementBlocked` is per student and authoritative — use it directly.
  //  - shoaibrain/edforge#477's no-applicable-fee skip is reported only as a
  //    count, never as a list. The `who` therefore comes from the client's own
  //    projection: `computeStudentInvoice` drops inapplicable fees through the
  //    same grade rule the server applies, so a student left with no
  //    fee-structure line is one of them. `noApplicableFeesCount` gates it —
  //    the server stays the authority on WHETHER any exist, and against a
  //    backend older than #477 (or one whose applicability pass degraded) the
  //    client must not invent an exclusion the generate path won't make.
  //
  // `duplicateCount` is the remaining gap: the server excludes duplicates from
  // `eligibleCount` but returns no per-student duplicate flag, so a batch with
  // duplicates still over-counts here by that many.
  const notBillable = useMemo(() => {
    const serverSkipsInapplicable = (previewQuery.data?.noApplicableFeesCount ?? 0) > 0
    return (inv: ComputedInvoice) =>
      agreementsByStudent[inv.studentId]?.agreementBlocked === true ||
      (serverSkipsInapplicable && !inv.lines.some(l => l.feeStructureId))
  }, [previewQuery.data?.noApplicableFeesCount, agreementsByStudent])

  const eligibleRows = batch.perStudent.filter(p => !notBillable(p))
  const billableRows = eligibleRows.filter(p => details.skipZeroTotal ? p.total > 0 : true)
  const billableTotal = billableRows.reduce((sum, p) => sum + p.total, 0)
  // Only students the server still intends to bill can be "skipped — zero
  // total"; the ones it already dropped are reported by their own reason row,
  // so the counts partition the batch instead of describing it twice.
  const skippedZero = eligibleRows.filter(p => p.total === 0).length

  // Excluded students stay on screen: the per-student badge is the only place
  // the reason is named for a specific name, and hiding them would trade one
  // unexplained number for another.
  const billableIds = new Set(billableRows.map(p => p.studentId))
  const previewRows = batch.perStudent.filter(
    p => billableIds.has(p.studentId) || agreementsByStudent[p.studentId]?.agreementBlocked,
  )

  const selectedFeeObjs = fees.filter(f => selectedFees[f.id])
  const customCount = customLines.filter(l => l.name || l.amount).length
  const grades = useMemo(
    () => [...new Set(students.map(s => s.currentGradeLevel))].sort(),
    [students],
  )

  // FB-3.10 — per-student billing source from the server preview (best-effort;
  // undefined until the preview resolves or when the BE omits `perStudent`).
  const billingSourceByStudent = useMemo(() => {
    const map = new Map<string, BillingSource>()
    for (const p of previewQuery.data?.students ?? []) {
      map.set(p.studentId, p.billingSource)
    }
    return map
  }, [previewQuery.data?.students])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr,300px] gap-6">
      <div className="space-y-4">
        <p className="text-sm text-[rgb(var(--text-secondary))]">
          {t('bulkGenerate.step4.verifyIntro', { count: billableRows.length })}
          {skippedZero > 0 && details.skipZeroTotal && (
            <span className="text-[rgb(var(--text-tertiary))]">
              {' '}
              {t('bulkGenerate.step4.skippedZeroParenthetical', {
                count: skippedZero,
              })}
            </span>
          )}
          .
        </p>

        {/* Summary card */}
        <div className="border border-[rgb(var(--border-primary))] rounded-md bg-[rgb(var(--background-primary))]">
          <SummaryRow icon={Users} label={t('bulkGenerate.step4.recipients')}>
            {t('bulkGenerate.step4.recipientSummary', {
              studentCount: students.length,
              studentLabel: t(
                students.length === 1
                  ? 'bulkGenerate.common.student'
                  : 'bulkGenerate.common.student_plural',
              ),
              gradeCount: grades.length,
              gradeLabel: t(
                grades.length === 1
                  ? 'bulkGenerate.common.grade'
                  : 'bulkGenerate.common.grade_plural',
              ),
            })}
          </SummaryRow>
          <SummaryRow icon={FileText} label={t('bulkGenerate.step4.feeStructures')}>
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
                    {cl.name || t('bulkGenerate.step2.customLineFallback')}
                  </span>
                  <span className="text-[rgb(var(--text-tertiary))] font-mono whitespace-nowrap">
                    {formatCurrency(Number(cl.amount) || 0)}
                  </span>
                </div>
              ))}
              {selectedFeeObjs.length === 0 && customCount === 0 && (
                <span className="text-xs text-[rgb(var(--text-tertiary))]">
                  {t('bulkGenerate.step4.noFeesSelected')}
                </span>
              )}
            </div>
          </SummaryRow>
          <SummaryRow icon={Calendar} label={t('bulkGenerate.step4.period')}>
            <div>
              {details.billingPeriod || '—'} · {details.academicYear}
              <div className={/* allow-arbitrary-spacing: dense bulk-wizard mono metadata; pre-token-sweep */ "text-[11px] text-[rgb(var(--text-tertiary))] font-mono whitespace-nowrap mt-0.5"}>
                {t('bulkGenerate.step4.dueOn', {
                  dueDate: details.dueDate || '—',
                })}
              </div>
            </div>
          </SummaryRow>
        </div>

        {/* Per-student preview */}
        {details.showPreview && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className={/* allow-arbitrary-spacing: dense bulk-wizard label; pre-token-sweep */ "text-[11px] font-semibold uppercase tracking-wider text-[rgb(var(--text-secondary))]"}>
                {t('bulkGenerate.step4.perStudentPreview')}
              </span>
              <span className={/* allow-arbitrary-spacing: dense bulk-wizard metadata; pre-token-sweep */ "text-[11px] text-[rgb(var(--text-tertiary))]"}>
                {t('bulkGenerate.step4.tapToExpand')}
              </span>
            </div>
            <div className="space-y-1.5">
              {previewRows.map(inv => (
                <PerStudentRow
                  key={inv.studentId}
                  inv={inv}
                  billingSource={billingSourceByStudent.get(inv.studentId)}
                  agreementBlocked={agreementsByStudent[inv.studentId]?.agreementBlocked}
                />
              ))}
              {previewRows.length === 0 && (
                <div className="text-center py-6 text-sm text-[rgb(var(--text-tertiary))] border border-dashed border-[rgb(var(--border-primary))] rounded-md">
                  {t('bulkGenerate.step4.noBillableStudents')}
                  {skippedZero > 0 && ` ${t('bulkGenerate.step4.allProjectedZero')}`}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Grand total + preview banner */}
      <aside className="space-y-3">
        <div className="p-4 rounded-md border border-[rgb(var(--accent-strong))] bg-[rgb(var(--accent-soft))]/30 space-y-3">
          <Row label={t('bulkGenerate.step4.invoices')} value={billableRows.length} bold />
          <Row
            label={t('bulkGenerate.step4.avgPerStudent')}
            value={formatCurrency(billableRows.length ? billableTotal / billableRows.length : 0)}
            mono
          />
          <hr className="border-[rgb(var(--accent-strong))]/30" />
          <Row
            label={t('bulkGenerate.step4.grandTotal')}
            value={formatCurrency(billableTotal)}
            mono
            big
          />
        </div>

        <BulkPreviewBanner previewQuery={previewQuery} />

        <div className={/* allow-arbitrary-spacing: dense bulk-wizard note; pre-token-sweep */ "flex items-start gap-2 p-3 rounded-md border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] text-[11px] text-[rgb(var(--text-secondary))] leading-relaxed"}>
          <Shield className="w-3.5 h-3.5 text-[rgb(var(--text-tertiary))] flex-shrink-0 mt-0.5" />
          <span>{t('bulkGenerate.step4.postingNotice')}</span>
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
  const { t } = useTranslation('payments')
  if (previewQuery.isLoading || previewQuery.isFetching) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-md border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] text-xs text-[rgb(var(--text-tertiary))]">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        {t('bulkGenerate.step4.resolvingServerPreview')}
      </div>
    )
  }
  if (previewQuery.isError) {
    return (
      <div className="flex items-start gap-2 p-3 rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/30 text-xs text-amber-800 dark:text-amber-200">
        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
        <span>{t('bulkGenerate.step4.serverPreviewUnavailable')}</span>
      </div>
    )
  }
  const data = previewQuery.data
  if (!data) return null
  return (
    <div className="p-3 rounded-md border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] space-y-2 text-xs">
      <div className="font-semibold text-[rgb(var(--text-secondary))]">
        {t('bulkGenerate.step4.serverPreview')}
      </div>
      <PreviewRow icon={Info} label={t('bulkGenerate.step4.duplicateSkip')}>
        {data.duplicateCount > 0 ? (
          <span className="text-amber-700 dark:text-amber-200">{data.duplicateCount}</span>
        ) : (
          <span className="text-[rgb(var(--text-tertiary))]">0</span>
        )}
      </PreviewRow>
      {/*
        #465 — the once-per-term agreement guard excludes these students from
        the eligible count, but it is NOT a duplicate: the reason differs and
        the server reports it separately. Without this row the operator reads
        "Duplicate skip: 0" beside a footer offering to generate nothing, and
        has no way to learn why.
      */}
      {(data.agreementBlockedCount ?? 0) > 0 && (
        <PreviewRow icon={ShieldAlert} label={t('bulkGenerate.step4.agreementBlocked')}>
          <span className="text-amber-700 dark:text-amber-200">
            {data.agreementBlockedCount}
          </span>
        </PreviewRow>
      )}
      {/*
        shoaibrain/edforge#477 — a third, distinct reason a student leaves the
        batch: their grade is outside every selected fee structure, so there is
        nothing to bill them and generation skips them. Kept as its own row for
        the same reason the agreement row is: an operator who reads it folded
        into "Duplicate skip" learns the wrong thing about their selection.
      */}
      {(data.noApplicableFeesCount ?? 0) > 0 && (
        <PreviewRow icon={FileX} label={t('bulkGenerate.step4.noApplicableFees')}>
          <span className="text-amber-700 dark:text-amber-200">
            {data.noApplicableFeesCount}
          </span>
        </PreviewRow>
      )}
      <PreviewRow icon={AlertTriangle} label={t('bulkGenerate.step4.hasBalanceDue')}>
        {fmtCounter(data.studentsWithBalance)}
      </PreviewRow>
      <PreviewRow icon={UserPlus} label={t('bulkGenerate.step4.newAdmissions')}>
        {fmtCounter(data.studentsNewAdmission)}
      </PreviewRow>
      <PreviewRow icon={Info} label={t('bulkGenerate.step4.notBilledThisPeriod')}>
        {fmtCounter(data.studentsNotBilledThisPeriod)}
      </PreviewRow>
      <div className={/* allow-arbitrary-spacing: dense bulk-wizard footnote; pre-token-sweep */ "text-[10px] text-[rgb(var(--text-tertiary))] pt-1 border-t border-[rgb(var(--border-primary))]"}>
        {t('bulkGenerate.step4.estimatedDuration', {
          seconds: data.estimatedDurationSec,
        })}
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

function PerStudentRow({
  inv,
  billingSource,
  agreementBlocked,
}: {
  inv: ComputedInvoice
  billingSource?: BillingSource
  /** #465 — this student's agreement already priced an invoice this term. */
  agreementBlocked?: boolean
}) {
  const { t } = useTranslation('payments')
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
          <div className={/* allow-arbitrary-spacing: dense bulk-wizard metadata; pre-token-sweep */ "text-[11px] text-[rgb(var(--text-tertiary))]"}>
            {gradeLabel(inv.gradeLevel, t)} · {t('bulkGenerate.step4.lineItemCount', {
              count: inv.lines.length,
            })}
          </div>
        </div>
        {agreementBlocked && (
          <span
            className={/* allow-arbitrary-spacing: dense bulk-wizard badge; pre-token-sweep */ "text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200 whitespace-nowrap"}
          >
            {t('bulkGenerate.step4.agreementBlockedBadge')}
          </span>
        )}
        {billingSource && <BillingSourceChip source={billingSource} />}
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
                  {line.isAgreement
                    ? t('bulkGenerate.step4.agreementLine')
                    : line.name || t('bulkGenerate.step2.customLineFallback')}
                  {line.isSuppressed && (
                    <span className={/* allow-arbitrary-spacing: dense bulk-wizard chip; pre-token-sweep */ "ml-1.5 text-[10px] px-1 py-0 rounded bg-[rgb(var(--background-secondary))] text-[rgb(var(--text-tertiary))]"}>
                      {t('bulkGenerate.step4.replacedBadge')}
                    </span>
                  )}
                  {line.isCustom && (
                    <span className={/* allow-arbitrary-spacing: dense bulk-wizard chip; pre-token-sweep */ "ml-1.5 text-[10px] px-1 py-0 rounded bg-[rgb(var(--background-secondary))] text-[rgb(var(--text-tertiary))]"}>
                      {t('bulkGenerate.step4.customBadge')}
                    </span>
                  )}
                </td>
                <td
                  className={
                    line.isSuppressed
                      ? 'px-3 py-1.5 text-right font-mono line-through text-[rgb(var(--text-disabled))]'
                      : 'px-3 py-1.5 text-right font-mono text-[rgb(var(--text-secondary))]'
                  }
                >
                  {formatCurrency(line.base)}
                </td>
              </tr>
            ))}
            <tr className="border-t border-[rgb(var(--border-primary))]">
              <td className="px-3 py-1.5 font-semibold text-[rgb(var(--text-primary))]">
                {t('bulkGenerate.step4.invoiceTotal')}
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
        <div className={/* allow-arbitrary-spacing: dense bulk-wizard label; pre-token-sweep */ "text-[11px] font-medium uppercase tracking-wider text-[rgb(var(--text-tertiary))]"}>
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

function gradeLabel(g: string, t: Translate): string {
  if (!g) return t('bulkGenerate.common.unknown')
  return /^\d+$/.test(g) ? t('bulkGenerate.common.gradeLabel', { grade: g }) : g
}
