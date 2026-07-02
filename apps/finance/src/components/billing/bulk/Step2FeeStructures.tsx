/**
 * Step2FeeStructures — pick fee structures + apply per-fee discount % +
 * add ad-hoc custom line items. Live rail shows the projected grand total
 * (computed client-side from the selected fees + custom lines + the
 * resolved recipient set).
 *
 * Phase 1 honors fee.gradeLevels for coverage chips ("Applies to all 86" /
 * "62 of 86 · 24 skipped"). Other scope rules (transportOnly etc.) wait
 * for Phase 2.
 */

import { Plus, X, Percent, Check, AlertTriangle, Ban, ChevronDown } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '@edforge/ui'
import { useTranslation } from '@edforge/i18n'
import { useCurrency } from '@edforge/types/use-currency'
import { useFinanceSettings } from '../../../layouts/FinanceLayout'
import { computeBatch, coverageOf } from './compute'
import type {
  CustomLine,
  FeeStructure,
  SelectedFeesMap,
  StudentSearchResult,
} from './types'

type Translate = (key: string, options?: Record<string, unknown>) => string

export interface Step2FeeStructuresProps {
  students: StudentSearchResult[]
  fees: FeeStructure[]
  selectedFees: SelectedFeesMap
  setSelectedFees: (next: SelectedFeesMap) => void
  customLines: CustomLine[]
  setCustomLines: (next: CustomLine[]) => void
}

export function Step2FeeStructures({
  students,
  fees,
  selectedFees,
  setSelectedFees,
  customLines,
  setCustomLines,
}: Step2FeeStructuresProps) {
  const { t } = useTranslation('payments')
  const settings = useFinanceSettings()
  const { format: formatCurrency } = useCurrency(settings)
  const batch = useMemo(
    () => computeBatch(students, fees, selectedFees, customLines),
    [students, fees, selectedFees, customLines],
  )
  const feeCount = Object.keys(selectedFees).length
  const customCount = customLines.filter(l => l.name || l.amount).length

  // Group fees by feeType for a slightly tidier list (tuition / admission /
  // exam / etc). Operator sees one accordion per group.
  const groups = useMemo(() => groupByFeeType(fees), [fees])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-6">
      <div className="space-y-4">
        <p className="text-sm text-[rgb(var(--text-secondary))]">
          {t('bulkGenerate.step2.coverageIntro', { count: students.length })}
        </p>

        {groups.map(group => (
          <FeeGroup
            key={group.type}
            group={group}
            students={students}
            selectedFees={selectedFees}
            setSelectedFees={setSelectedFees}
            t={t}
          />
        ))}

        <CustomLineItems
          customLines={customLines}
          setCustomLines={setCustomLines}
          t={t}
        />
      </div>

      {/* Live rail */}
      <aside className="space-y-3 p-4 border border-[rgb(var(--border-primary))] rounded-md bg-[rgb(var(--background-secondary))] h-fit sticky top-2">
        <div>
          <div className={/* allow-arbitrary-spacing: dense bulk-wizard label; pre-token-sweep */ "text-[11px] uppercase tracking-wider text-[rgb(var(--text-tertiary))]"}>
            {t('bulkGenerate.step2.estimatedGrandTotal')}
          </div>
          <div className="text-2xl font-mono font-semibold text-[rgb(var(--text-primary))] mt-0.5">
            {formatCurrency(batch.billableTotal)}
          </div>
          <div className="text-xs font-mono text-[rgb(var(--text-tertiary))] mt-0.5">
            {t('bulkGenerate.step2.avgPerStudent', {
              amount: formatCurrency(batch.avgPerStudent),
            })}
          </div>
        </div>

        <div className="space-y-1.5 text-xs">
          <RailRow label={t('bulkGenerate.step2.students')} value={students.length} />
          <RailRow label={t('bulkGenerate.step2.feeStructures')} value={feeCount} />
          <RailRow label={t('bulkGenerate.step2.customLines')} value={customCount} />
          <hr className="my-2 border-[rgb(var(--border-primary))]" />
          <RailRow
            label={t('bulkGenerate.step2.grossSubtotal')}
            value={formatCurrency(batch.perStudent.reduce((s, p) => s + p.subtotal, 0))}
            mono
          />
          <RailRow
            label={t('bulkGenerate.step2.feeDiscounts')}
            value={`−${formatCurrency(batch.perStudent.reduce((s, p) => s + p.discountTotal, 0))}`}
            mono
            tone="accent"
          />
        </div>

        {batch.zeroCount > 0 && (
          <div className={/* allow-arbitrary-spacing: dense bulk-wizard note; pre-token-sweep */ "flex items-start gap-2 p-2 rounded bg-[rgb(var(--background-primary))] border border-[rgb(var(--border-primary))] text-[11px] text-[rgb(var(--text-secondary))]"}>
            <AlertTriangle className="w-3.5 h-3.5 text-[rgb(var(--accent-strong))] flex-shrink-0 mt-0.5" />
            <span>
              {t('bulkGenerate.step2.zeroTotalWarning', { count: batch.zeroCount })}
            </span>
          </div>
        )}
      </aside>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Fee group accordion
// ---------------------------------------------------------------------------

interface FeeGroupShape {
  type: string
  fees: FeeStructure[]
}

function groupByFeeType(fees: FeeStructure[]): FeeGroupShape[] {
  const m = new Map<string, FeeStructure[]>()
  for (const f of fees) {
    const t = f.feeType || 'other'
    const arr = m.get(t) ?? []
    arr.push(f)
    m.set(t, arr)
  }
  return [...m.entries()]
    .map(([type, fs]) => ({ type, fees: fs }))
    .sort((a, b) => a.type.localeCompare(b.type))
}

function FeeGroup({
  group,
  students,
  selectedFees,
  setSelectedFees,
  t,
}: {
  group: FeeGroupShape
  students: StudentSearchResult[]
  selectedFees: SelectedFeesMap
  setSelectedFees: (next: SelectedFeesMap) => void
  t: Translate
}) {
  const [open, setOpen] = useState(true)
  const selN = group.fees.filter(f => selectedFees[f.id]).length
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
        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
      >
        <div className="flex-1 min-w-0 text-sm font-medium text-[rgb(var(--text-primary))] capitalize">
          {formatFeeType(group.type, t)}
        </div>
        <span className="text-xs px-2 py-0.5 rounded-md bg-[rgb(var(--background-secondary))] text-[rgb(var(--text-secondary))] tabular-nums">
          {selN} / {group.fees.length}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-[rgb(var(--text-tertiary))] transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </div>
      {open && (
        <div className="divide-y divide-[rgb(var(--border-primary))] border-t border-[rgb(var(--border-primary))]">
          {group.fees.map(fee => (
            <FeeRow
              key={fee.id}
              fee={fee}
              students={students}
              selectedFees={selectedFees}
              setSelectedFees={setSelectedFees}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function FeeRow({
  fee,
  students,
  selectedFees,
  setSelectedFees,
}: {
  fee: FeeStructure
  students: StudentSearchResult[]
  selectedFees: SelectedFeesMap
  setSelectedFees: (next: SelectedFeesMap) => void
}) {
  const { t } = useTranslation('payments')
  const settings = useFinanceSettings()
  const { format: formatCurrency } = useCurrency(settings)
  const sel = !!selectedFees[fee.id]
  const cov = coverageOf(fee, students)
  const total = students.length
  const zero = total > 0 && cov === 0
  const full = total > 0 && cov === total
  const disc = selectedFees[fee.id]?.discountPct ?? 0

  const toggle = () => {
    if (zero) return
    const next = { ...selectedFees }
    if (sel) delete next[fee.id]
    else next[fee.id] = { discountPct: 0 }
    setSelectedFees(next)
  }

  const setDisc = (n: number) => {
    const v = Math.max(0, Math.min(100, n))
    setSelectedFees({ ...selectedFees, [fee.id]: { discountPct: v } })
  }

  return (
    <div
      className={[
        'flex items-start gap-3 px-3 py-2.5',
        zero ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
        sel ? 'bg-[rgb(var(--accent-soft))]/30' : '',
      ].join(' ')}
      onClick={toggle}
    >
      <span
        className={[
          'inline-flex items-center justify-center w-4 h-4 rounded border mt-0.5',
          sel
            ? /* allow-hardcoded-color: contrast tick on filled accent checkbox */ 'bg-[rgb(var(--accent-strong))] border-[rgb(var(--accent-strong))] text-white'
            : 'border-[rgb(var(--border-primary))] bg-[rgb(var(--background-primary))]',
        ].join(' ')}
      >
        {sel && <Check className="w-3 h-3" strokeWidth={3} />}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-[rgb(var(--text-primary))]">{fee.name}</div>
        {fee.description && (
          <div className="text-xs text-[rgb(var(--text-tertiary))] mt-0.5">
            {fee.description}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
          <span className={/* allow-arbitrary-spacing: dense bulk-wizard chip; pre-token-sweep */ "text-[10px] px-1.5 py-0.5 rounded bg-[rgb(var(--background-secondary))] text-[rgb(var(--text-secondary))] capitalize"}>
            {t(`feeStructure.frequencies.${fee.frequency}`, {
              defaultValue: fee.frequency,
            })}
          </span>
          {fee.gradeLevels && fee.gradeLevels.length > 0 && (
            <span className={/* allow-arbitrary-spacing: dense bulk-wizard chip; pre-token-sweep */ "text-[10px] px-1.5 py-0.5 rounded bg-[rgb(var(--background-secondary))] text-[rgb(var(--text-secondary))]"}>
              {t('bulkGenerate.common.gradesList', { grades: fee.gradeLevels.join(', ') })}
            </span>
          )}
          <CoverageChip full={full} zero={zero} cov={cov} total={total} />
        </div>
      </div>
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <div className="text-sm font-mono text-[rgb(var(--text-secondary))] whitespace-nowrap">
          {formatCurrency(fee.amount)}
        </div>
        {sel && (
          <div
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-primary))]"
            title={t('bulkGenerate.step2.perFeeDiscount')}
          >
            <Percent className="w-3 h-3 text-[rgb(var(--text-tertiary))]" />
            <input
              type="number"
              min={0}
              max={100}
              value={disc}
              onChange={(e) => setDisc(Number(e.target.value) || 0)}
              className="w-12 bg-transparent text-xs text-right outline-none tabular-nums"
            />
          </div>
        )}
      </div>
    </div>
  )
}

function CoverageChip({
  full,
  zero,
  cov,
  total,
}: {
  full: boolean
  zero: boolean
  cov: number
  total: number
}) {
  const { t } = useTranslation('payments')
  if (full) {
    return (
      <span className={/* allow-arbitrary-spacing: dense bulk-wizard status chip; pre-token-sweep */ "inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-[rgb(var(--accent-soft))] text-[rgb(var(--accent-strong))]"}>
        <Check className="w-2.5 h-2.5" /> {t('bulkGenerate.step2.appliesToAll', { count: total })}
      </span>
    )
  }
  if (zero) {
    return (
      <span className={/* allow-arbitrary-spacing allow-hardcoded-color: dense inline danger chip; semantic danger tokens pending design-system sweep */ "inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-200"}>
        <Ban className="w-2.5 h-2.5" /> {t('bulkGenerate.step2.appliesToZero')}
      </span>
    )
  }
  return (
    <span className={/* allow-arbitrary-spacing: dense bulk-wizard status chip; pre-token-sweep */ "inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-200"}>
      <AlertTriangle className="w-2.5 h-2.5" />
      {t('bulkGenerate.step2.partialCoverage', {
        covered: cov,
        total,
        skipped: total - cov,
      })}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Custom line items
// ---------------------------------------------------------------------------

function CustomLineItems({
  customLines,
  setCustomLines,
  t,
}: {
  customLines: CustomLine[]
  setCustomLines: (next: CustomLine[]) => void
  t: Translate
}) {
  const add = () =>
    setCustomLines([
      ...customLines,
      { id: `cl-${Date.now()}-${customLines.length}`, name: '', amount: '' },
    ])
  const update = (idx: number, patch: Partial<CustomLine>) => {
    const next = [...customLines]
    next[idx] = { ...next[idx], ...patch }
    setCustomLines(next)
  }
  const remove = (idx: number) =>
    setCustomLines(customLines.filter((_, i) => i !== idx))

  return (
    <div className="border border-[rgb(var(--border-primary))] rounded-md bg-[rgb(var(--background-primary))]">
      <div className="flex items-center gap-3 px-3 py-2.5">
        <div className="flex-1 min-w-0 text-sm font-medium text-[rgb(var(--text-primary))]">
          {t('bulkGenerate.step2.customLineItems')}
        </div>
        <span className="text-xs px-2 py-0.5 rounded-md bg-[rgb(var(--background-secondary))] text-[rgb(var(--text-secondary))] tabular-nums">
          {customLines.length} / 10
        </span>
        <Button
          variant="ghost"
          onClick={add}
          disabled={customLines.length >= 10}
          className="text-xs"
        >
          <Plus className="w-3 h-3 mr-1" /> {t('bulkGenerate.step2.addLine')}
        </Button>
      </div>
      {customLines.length === 0 ? (
        <div className="px-3 py-2.5 text-xs text-[rgb(var(--text-tertiary))] border-t border-[rgb(var(--border-primary))]">
          {t('bulkGenerate.step2.customLineHelp')}
        </div>
      ) : (
        <div className="divide-y divide-[rgb(var(--border-primary))] border-t border-[rgb(var(--border-primary))]">
          {customLines.map((line, i) => (
            <div key={line.id} className="flex items-center gap-2 px-3 py-2">
              <input
                type="text"
                placeholder={t('bulkGenerate.step2.customLinePlaceholder')}
                value={line.name}
                onChange={(e) => update(i, { name: e.target.value })}
                className="flex-1 text-sm bg-transparent text-[rgb(var(--text-primary))] outline-none border-0 focus:outline-none"
              />
              <input
                type="number"
                placeholder="0"
                value={line.amount}
                onChange={(e) => update(i, { amount: e.target.value })}
                className="w-28 text-sm font-mono text-right bg-[rgb(var(--background-secondary))] border border-[rgb(var(--border-primary))] rounded px-2 py-1 outline-none focus:ring-2 focus:ring-[rgb(var(--accent-strong))] focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => remove(i)}
                className="p-1 rounded hover:bg-[rgb(var(--background-secondary))] text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))]"
                aria-label={t('bulkGenerate.step2.removeLine')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function formatFeeType(type: string, t: Translate): string {
  return t(`feeStructure.types.${type}`, {
    defaultValue: type.replace(/_/g, ' '),
  })
}

// ---------------------------------------------------------------------------
// Rail atom
// ---------------------------------------------------------------------------

function RailRow({
  label,
  value,
  mono,
  tone,
}: {
  label: string
  value: string | number
  mono?: boolean
  tone?: 'accent'
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[rgb(var(--text-secondary))]">{label}</span>
      <span
        className={[
          mono ? 'font-mono' : '',
          tone === 'accent' ? 'text-[rgb(var(--accent-strong))]' : 'text-[rgb(var(--text-primary))]',
          'tabular-nums',
        ].join(' ')}
      >
        {value}
      </span>
    </div>
  )
}
