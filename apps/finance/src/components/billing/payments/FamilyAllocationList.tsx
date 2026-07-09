/**
 * FamilyAllocationList
 *
 * Presentational, fully controlled list for the family (multi-invoice)
 * manual-payment mode. Lists every open invoice across a family's siblings,
 * grouped by student, each row with an editable amount input prefilled from
 * the server's suggested allocation. Renders a running allocated total vs the
 * family's total due. The page owns `allocations` state and validation — this
 * component only renders and reports edits via `onChange`.
 */

import { useMemo } from 'react'
import { useTranslation } from '@edforge/i18n'
import { UuidBadge } from '@edforge/archetype'
import type { FamilyOpenInvoicesResponse } from '@edforge/types'

type OpenInvoice = FamilyOpenInvoicesResponse['openInvoices'][number]
type SuggestedAllocation = FamilyOpenInvoicesResponse['suggestedAllocation']

interface FamilyAllocationListProps {
  openInvoices: readonly OpenInvoice[]
  suggestedAllocation: SuggestedAllocation
  /** Controlled allocation map: invoiceId → raw amount input string. */
  allocations: Record<string, string>
  onChange: (invoiceId: string, value: string) => void
  format: (amount: number) => string
}

function parseAmount(raw: string | undefined): number {
  const parsed = parseFloat(raw ?? '')
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

export function FamilyAllocationList({
  openInvoices,
  suggestedAllocation,
  allocations,
  onChange,
  format,
}: FamilyAllocationListProps) {
  const { t } = useTranslation('payments')

  const groups = useMemo(() => {
    const byStudent = new Map<
      string,
      { studentName: string; invoices: OpenInvoice[] }
    >()
    for (const inv of openInvoices) {
      const existing = byStudent.get(inv.studentId)
      if (existing) {
        existing.invoices.push(inv)
      } else {
        byStudent.set(inv.studentId, {
          studentName: inv.studentName,
          invoices: [inv],
        })
      }
    }
    return Array.from(byStudent.entries()).map(([studentId, g]) => ({
      studentId,
      ...g,
    }))
  }, [openInvoices])

  const totalDue = useMemo(
    () => openInvoices.reduce((sum, inv) => sum + inv.amountDue, 0),
    [openInvoices],
  )

  const allocatedTotal = useMemo(
    () =>
      openInvoices.reduce(
        (sum, inv) => sum + parseAmount(allocations[inv.invoiceId]),
        0,
      ),
    [openInvoices, allocations],
  )

  const suggestedById = useMemo(() => {
    const m = new Map<string, number>()
    for (const s of suggestedAllocation) m.set(s.invoiceId, s.amount)
    return m
  }, [suggestedAllocation])

  if (openInvoices.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-[rgb(var(--text-tertiary))]">
        {t('recordPayment.family.noOpenInvoices')}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.studentId} className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[rgb(var(--text-primary))]">
              {group.studentName}
            </span>
            <span className="text-xs text-[rgb(var(--text-tertiary))]">
              <UuidBadge value={group.studentId} />
            </span>
          </div>
          {group.invoices.map((inv) => {
            const suggested = suggestedById.get(inv.invoiceId)
            const exceeds = parseAmount(allocations[inv.invoiceId]) > inv.amountDue
            return (
              <div
                key={inv.invoiceId}
                className="flex items-start gap-3 px-3 py-2.5 rounded-lg border border-[rgb(var(--border-primary))]"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-[rgb(var(--text-primary))] truncate">
                    {inv.invoiceNumber}
                  </div>
                  <div className="text-xs text-[rgb(var(--text-secondary))]">
                    {t('recordPayment.family.amountDue', {
                      amount: format(inv.amountDue),
                    })}
                    {suggested != null && suggested > 0 && (
                      <span className="ml-2 text-[rgb(var(--text-tertiary))]">
                        {t('recordPayment.family.suggested', {
                          amount: format(suggested),
                        })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-32 flex-shrink-0">
                  <label className="sr-only" htmlFor={`alloc-${inv.invoiceId}`}>
                    {t('recordPayment.family.allocationLabel', {
                      invoice: inv.invoiceNumber,
                    })}
                  </label>
                  <input
                    id={`alloc-${inv.invoiceId}`}
                    type="number"
                    inputMode="decimal"
                    min="0"
                    max={inv.amountDue}
                    step="0.01"
                    value={allocations[inv.invoiceId] ?? ''}
                    onChange={(e) => onChange(inv.invoiceId, e.target.value)}
                    placeholder="0.00"
                    aria-invalid={exceeds}
                    className={`w-full px-2.5 py-1.5 text-sm text-right border rounded-lg bg-[rgb(var(--background-primary))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 ${
                      exceeds
                        ? 'border-[rgb(var(--state-danger-border))] focus:ring-[rgb(var(--state-danger-border)/0.35)]'
                        : 'border-[rgb(var(--border-primary))] focus:ring-[rgb(var(--border-focus)/0.35)]'
                    }`}
                  />
                  {exceeds && (
                    <p className="mt-1 text-2xs text-right text-[rgb(var(--state-danger-fg))]">
                      {t('recordPayment.family.allocation.exceedsBalance', {
                        balance: format(inv.amountDue),
                      })}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ))}

      <div className="bg-[rgb(var(--background-secondary))] rounded-lg p-4 space-y-1.5">
        <div className="flex justify-between text-sm text-[rgb(var(--text-secondary))]">
          <span>{t('recordPayment.family.totalDue')}</span>
          <span className="font-medium text-[rgb(var(--text-primary))]">
            {format(totalDue)}
          </span>
        </div>
        <div className="flex justify-between text-sm font-semibold text-[rgb(var(--text-primary))] border-t border-[rgb(var(--border-primary))] pt-2">
          <span>{t('recordPayment.family.allocatedTotal')}</span>
          <span>{format(allocatedTotal)}</span>
        </div>
      </div>
    </div>
  )
}
