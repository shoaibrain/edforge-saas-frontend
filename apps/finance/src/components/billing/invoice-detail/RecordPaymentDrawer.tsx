/**
 * Record Payment drawer (invoice detail).
 *
 * Accessible right drawer (FinanceDrawerShell → ui Drawer → headlessui:
 * focus trap, Esc, portal). Form → optimistic "Recording…" → success panel
 * with the generated receipt number and a View-receipt CTA.
 *
 * Contract notes:
 *  - POST /finance/schools/:schoolId/payments/manual only accepts
 *    cash | bank_transfer | cheque (backend Zod); online-gateway payments
 *    are recorded by the payment flow itself, never manually.
 *  - Form state resets ONLY on the closed→open transition: recording
 *    invalidates the invoice query, which flips `invoice.amountDue` while
 *    the success panel is still showing — resetting on that change would
 *    wipe the panel. Same reason `dueAtSubmit` snapshots the due amount.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import {
  Check,
  FileCheck2,
  Info,
  Landmark,
  Loader2,
  ReceiptText,
  Wallet,
} from 'lucide-react'
import { Button, Input, Textarea, cn } from '@edforge/ui'
import { useTranslation } from '@edforge/i18n'
import type { Invoice, Payment } from '@edforge/types'
import { useRecordManualPayment } from '@edforge/finance-services'
import { useCurrency } from '@edforge/types/use-currency'
import { useFinanceSettings } from '../../../layouts/FinanceLayout'
import { useCurrentUserName } from '../../../hooks/useCurrentUserName'
import { formatDate } from '../../../utils/format-date'
import { FinanceDrawerShell } from '../../shared'
import { bsSubOf } from './invoice-detail-utils'
import {
  MANUAL_PAYMENT_MAX,
  validateRecordPayment,
  type ManualPaymentGateway,
} from './record-payment-validation'

export interface RecordPaymentDrawerProps {
  open: boolean
  onClose: () => void
  invoice: Invoice
  schoolId: string
}

const GATEWAY_ICONS: Record<ManualPaymentGateway, typeof Wallet> = {
  cash: Wallet,
  bank_transfer: Landmark,
  cheque: FileCheck2,
}

const GATEWAY_LABEL_KEYS: Record<ManualPaymentGateway, string> = {
  cash: 'gateway.cash',
  bank_transfer: 'gateway.bankTransfer',
  cheque: 'gateway.cheque',
}

function localIsoToday(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`
}

interface RecordedResult {
  amount: number
  gateway: ManualPaymentGateway
  paidDate: string
  receiptNumber: string | null
  paymentId: string
  /** Due amount still owing after this payment (from the pre-submit snapshot). */
  remainingAfter: number
}

export function RecordPaymentDrawer({
  open,
  onClose,
  invoice,
  schoolId,
}: RecordPaymentDrawerProps) {
  const { t } = useTranslation('payments')
  const navigate = useNavigate()
  const settings = useFinanceSettings()
  const { format } = useCurrency(settings)
  const currentUser = useCurrentUserName()
  const recordPayment = useRecordManualPayment(schoolId)

  const due = invoice.amountDue ?? 0

  const [amountText, setAmountText] = useState('')
  const [gateway, setGateway] = useState<ManualPaymentGateway>('cash')
  const [reference, setReference] = useState('')
  const [paidDate, setPaidDate] = useState(localIsoToday)
  const [note, setNote] = useState('')
  const [result, setResult] = useState<RecordedResult | null>(null)

  // Reset ONLY when the drawer transitions closed→open (see file JSDoc).
  const wasOpen = useRef(false)
  useEffect(() => {
    if (open && !wasOpen.current) {
      setAmountText(due > 0 ? String(due) : '')
      setGateway('cash')
      setReference('')
      setPaidDate(localIsoToday())
      setNote('')
      setResult(null)
    }
    wasOpen.current = open
  }, [open, due])

  const amount = useMemo(() => {
    const n = Number.parseInt(amountText.replace(/[^0-9]/g, ''), 10)
    return Number.isFinite(n) ? n : 0
  }, [amountText])

  const validationError = validateRecordPayment({ amount, amountDue: due, gateway, reference })
  const over = validationError === 'overpayment' || validationError === 'over_cap'
  const valid = validationError === null
  const partial = valid && amount < due
  const dueAtSubmit = useRef(due)
  const bsHint = bsSubOf(paidDate, settings)

  const submit = async () => {
    if (!valid || recordPayment.isPending) return
    dueAtSubmit.current = due
    try {
      const payment: Payment = await recordPayment.mutateAsync({
        invoiceId: invoice.id,
        gateway,
        amount,
        currency: invoice.currency,
        referenceNumber: gateway === 'cash' ? undefined : reference.trim(),
        notes: note.trim() || undefined,
        paidDate,
        idempotencyKey: crypto.randomUUID(),
      })
      const recorded: RecordedResult = {
        amount,
        gateway,
        paidDate,
        receiptNumber: payment.receiptNumber,
        paymentId: payment.id,
        remainingAfter: Math.max(0, dueAtSubmit.current - amount),
      }
      setResult(recorded)
      toast.success(
        recorded.receiptNumber
          ? t('recordPayment.drawer.toastRecorded', { receipt: recorded.receiptNumber })
          : t('recordPayment.recordSuccess'),
        {
          action: {
            label: t('recordPayment.drawer.view'),
            onClick: () =>
              navigate({
                to: '/payments/$paymentId/receipt',
                params: { paymentId: recorded.paymentId },
                search: { invoiceId: invoice.id },
              }),
          },
        }
      )
    } catch {
      toast.error(t('recordPayment.recordFailed'))
    }
  }

  const footer = result ? (
    <>
      <Button variant="ghost" onClick={onClose}>
        {t('recordPayment.drawer.done')}
      </Button>
      <Button
        onClick={() =>
          navigate({
            to: '/payments/$paymentId/receipt',
            params: { paymentId: result.paymentId },
            search: { invoiceId: invoice.id },
          })
        }
      >
        <ReceiptText className="mr-1.5 h-4 w-4" />
        {t('recordPayment.drawer.viewReceipt')}
      </Button>
    </>
  ) : (
    <>
      <Button variant="ghost" onClick={onClose} disabled={recordPayment.isPending}>
        {t('actions.cancel')}
      </Button>
      <Button onClick={() => void submit()} disabled={!valid || recordPayment.isPending}>
        {recordPayment.isPending ? (
          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
        ) : (
          <Wallet className="mr-1.5 h-4 w-4" />
        )}
        {recordPayment.isPending
          ? t('recordPayment.drawer.recording')
          : amount > 0
            ? t('recordPayment.drawer.recordAmount', { amount: format(amount) })
            : t('recordPayment.title')}
      </Button>
    </>
  )

  return (
    <FinanceDrawerShell
      open={open}
      onClose={onClose}
      title={t('recordPayment.title')}
      subtitle={`${invoice.invoiceNumber} · ${invoice.studentName}`}
      icon={<Wallet className="h-5 w-5" />}
      footer={footer}
      closeDisabled={recordPayment.isPending}
    >
      {result ? (
        <SuccessPanel result={result} format={format} settings={settings} t={t} />
      ) : (
        <div className="space-y-5">
          {/* Amount */}
          <div>
            <div className="mb-1.5 flex items-baseline justify-between">
              <label
                htmlFor="record-payment-amount"
                className="text-sm font-medium text-[rgb(var(--text-secondary))]"
              >
                {t('recordPayment.drawer.amountLabel')}
              </label>
              <span className="text-xs text-[rgb(var(--text-tertiary))]">
                {t('recordPayment.drawer.dueHint', { amount: format(due) })}
              </span>
            </div>
            <Input
              id="record-payment-amount"
              inputMode="numeric"
              autoComplete="off"
              prefix={
                <span className="text-xs font-semibold text-[rgb(var(--text-tertiary))]">
                  {invoice.currency}
                </span>
              }
              className="font-mono"
              invalid={over}
              value={amountText}
              onChange={(e) => setAmountText(e.target.value.replace(/[^0-9]/g, ''))}
              aria-label={t('recordPayment.drawer.amountLabel')}
            />
            {validationError === 'overpayment' && (
              <p className="mt-1.5 text-xs text-[rgb(var(--state-danger-fg))]">
                {t('recordPayment.drawer.overpayError', { max: format(due) })}
              </p>
            )}
            {validationError === 'over_cap' && (
              <p className="mt-1.5 text-xs text-[rgb(var(--state-danger-fg))]">
                {t('recordPayment.drawer.overCapError', { max: format(MANUAL_PAYMENT_MAX) })}
              </p>
            )}
            {partial && (
              <p className="mt-1.5 text-xs text-[rgb(var(--text-tertiary))]">
                {t('recordPayment.drawer.partialHint', { amount: format(due - amount) })}
              </p>
            )}
            <div className="mt-2 flex gap-1.5">
              <AmountChip
                label={t('recordPayment.drawer.chipFull')}
                onClick={() => setAmountText(String(due))}
              />
              <AmountChip
                label={t('recordPayment.drawer.chipHalf')}
                onClick={() => setAmountText(String(Math.floor(due / 2)))}
              />
            </div>
          </div>

          {/* Method */}
          <div>
            <p className="mb-1.5 text-sm font-medium text-[rgb(var(--text-secondary))]">
              {t('recordPayment.drawer.methodLabel')}
            </p>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t('recordPayment.drawer.methodLabel')}>
              {(Object.keys(GATEWAY_ICONS) as ManualPaymentGateway[]).map((key) => {
                const IconComp = GATEWAY_ICONS[key]
                const on = gateway === key
                return (
                  <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setGateway(key)}
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-colors',
                      on
                        ? 'border-[rgb(var(--state-success-border))] bg-[rgb(var(--state-success-bg))] text-[rgb(var(--state-success-fg))]'
                        : 'border-[rgb(var(--border-secondary))] bg-[rgb(var(--background-primary))] text-[rgb(var(--text-primary))] hover:border-[rgb(var(--border-strong))]'
                    )}
                  >
                    <IconComp className="h-4 w-4 flex-none" />
                    {t(GATEWAY_LABEL_KEYS[key])}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Reference (non-cash) */}
          {gateway !== 'cash' && (
            <div>
              <div className="mb-1.5 flex items-baseline justify-between">
                <label
                  htmlFor="record-payment-reference"
                  className="text-sm font-medium text-[rgb(var(--text-secondary))]"
                >
                  {t('recordPayment.drawer.referenceLabel')}
                </label>
                <span className="text-xs text-[rgb(var(--text-tertiary))]">
                  {t('recordPayment.drawer.referenceHint', {
                    method: t(GATEWAY_LABEL_KEYS[gateway]),
                  })}
                </span>
              </div>
              <Input
                id="record-payment-reference"
                className="font-mono"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder={
                  gateway === 'bank_transfer'
                    ? t('recordPayment.bankReferencePlaceholder')
                    : t('recordPayment.chequeReferencePlaceholder')
                }
              />
            </div>
          )}

          {/* Date + received by */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="record-payment-date"
                className="mb-1.5 block text-sm font-medium text-[rgb(var(--text-secondary))]"
              >
                {t('recordPayment.drawer.dateLabel')}
              </label>
              <Input
                id="record-payment-date"
                type="date"
                value={paidDate}
                max={localIsoToday()}
                onChange={(e) => setPaidDate(e.target.value)}
              />
              {bsHint && (
                <p className="mt-1 text-xs text-[rgb(var(--text-tertiary))]">BS {bsHint}</p>
              )}
            </div>
            {currentUser && (
              <div>
                <label
                  htmlFor="record-payment-received-by"
                  className="mb-1.5 block text-sm font-medium text-[rgb(var(--text-secondary))]"
                >
                  {t('recordPayment.drawer.receivedBy')}
                </label>
                <Input id="record-payment-received-by" value={currentUser} readOnly />
              </div>
            )}
          </div>

          {/* Note */}
          <div>
            <div className="mb-1.5 flex items-baseline justify-between">
              <label
                htmlFor="record-payment-note"
                className="text-sm font-medium text-[rgb(var(--text-secondary))]"
              >
                {t('recordPayment.drawer.noteLabel')}
              </label>
              <span className="text-xs text-[rgb(var(--text-tertiary))]">
                {t('recordPayment.drawer.noteHint')}
              </span>
            </div>
            <Textarea
              id="record-payment-note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('recordPayment.drawer.notePlaceholder')}
            />
          </div>

          <div className="flex items-start gap-2.5 rounded-lg border border-[rgb(var(--state-info-border)/0.35)] bg-[rgb(var(--state-info-bg)/0.55)] px-3 py-2.5 text-xs leading-relaxed text-[rgb(var(--text-secondary))]">
            <Info className="mt-0.5 h-3.5 w-3.5 flex-none text-[rgb(var(--state-info-fg))]" />
            <span>{t('recordPayment.drawer.infoNote')}</span>
          </div>
        </div>
      )}
    </FinanceDrawerShell>
  )
}

function AmountChip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-[rgb(var(--border-secondary))] bg-[rgb(var(--background-secondary))] px-2.5 py-1 text-xs text-[rgb(var(--text-secondary))] transition-colors hover:border-[rgb(var(--state-success-border))] hover:text-[rgb(var(--state-success-fg))]"
    >
      {label}
    </button>
  )
}

function SuccessPanel({
  result,
  format,
  settings,
  t,
}: {
  result: RecordedResult
  format: (n: number) => string
  settings: ReturnType<typeof useFinanceSettings>
  t: (key: string, options?: Record<string, unknown>) => string
}) {
  return (
    <div className="px-2 pb-1 pt-6 text-center">
      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full border border-[rgb(var(--state-success-border)/0.4)] bg-[rgb(var(--state-success-bg))] text-[rgb(var(--state-success-fg))] motion-safe:animate-fade-in">
        <Check className="h-6 w-6" strokeWidth={2.4} />
      </div>
      <p className="font-mono text-2xl font-semibold tabular-nums tracking-tight text-[rgb(var(--text-primary))]">
        {format(result.amount)}
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-[rgb(var(--text-secondary))]">
        {t('recordPayment.drawer.doneVia', {
          method: t(GATEWAY_LABEL_KEYS[result.gateway]),
          date: formatDate(result.paidDate, settings),
        })}
        <br />
        {result.remainingAfter === 0
          ? t('recordPayment.drawer.donePaidInFull')
          : t('recordPayment.drawer.doneRemains', { amount: format(result.remainingAfter) })}
      </p>
      {result.receiptNumber && (
        <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-[rgb(var(--border-secondary))] bg-[rgb(var(--background-secondary))] px-3.5 py-1.5 font-mono text-xs text-[rgb(var(--text-primary))]">
          <ReceiptText className="h-3.5 w-3.5" />
          {result.receiptNumber}
        </span>
      )}
    </div>
  )
}
