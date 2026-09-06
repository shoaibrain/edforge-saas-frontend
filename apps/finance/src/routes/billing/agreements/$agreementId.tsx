/**
 * Agreement Detail Page (FB-2.8)
 *
 * Route: /finance/agreements/:agreementId (finance router basepath `/finance`).
 * Shows the agreement terms (fixed_total allocation vs per_student lines),
 * status history, and the version list. Header actions Activate / Cancel are
 * gated by lifecycle status and confirmed via dialogs.
 *
 * Activation may 409 with CONFLICTING_OPEN_INVOICES — the dialog surfaces the
 * conflict and offers an "acknowledge & activate" retry that resends with
 * acknowledgeOpenInvoices: true. AGREEMENT_OVERLAP is unresolvable and surfaces
 * as a terminal error.
 */

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import { Button, Skeleton, StatusBadge } from '@edforge/ui'
import { UuidBadge } from '@edforge/archetype'
import { ArrowLeft, AlertTriangle, Loader2, X, Check } from 'lucide-react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useTranslation } from '@edforge/i18n'
import type { Agreement, AgreementVersion } from '@edforge/types'
import { useCurrency } from '@edforge/types/use-currency'
import {
  useAgreement,
  useAgreementVersions,
  useActivateAgreement,
  useCancelAgreement,
} from '@edforge/finance-services'
import { useAppStore } from '../../../stores/app.store'
import { useFinanceSettings } from '../../../layouts/FinanceLayout'
import { formatDateDual } from '../../../utils/format-date'
import { FinanceStatusChip } from '../../../components/shared'
import { feeTypeLabel } from '../../../components/shared/fee-types'
import { extractApiMessage } from '../../../lib/api-validation-errors'
import {
  conflictKindFromError,
  openInvoiceConflictsFromError,
  type ConflictKind,
  type OpenInvoiceConflict,
} from '../../../lib/agreement-errors'

export default function AgreementDetailPage() {
  const navigate = useNavigate()
  const { agreementId } = useParams({ strict: false }) as { agreementId: string }
  const schoolId = useAppStore((s) => s.activeSchoolId)
  const settings = useFinanceSettings()
  const { format } = useCurrency(settings)
  const { t } = useTranslation('payments')

  const {
    data: agreement,
    isLoading,
    isPending,
    error,
    refetch,
  } = useAgreement(schoolId ?? '', agreementId)
  const { data: versions } = useAgreementVersions(schoolId ?? '', agreementId)

  const activateMutation = useActivateAgreement(schoolId ?? '')
  const cancelMutation = useCancelAgreement(schoolId ?? '')

  const [showActivate, setShowActivate] = useState(false)
  const [showCancel, setShowCancel] = useState(false)

  const handleActivate = async (acknowledgeOpenInvoices?: boolean) => {
    if (!agreement) return
    try {
      await activateMutation.mutateAsync({
        agreementId,
        data: { version: agreement.version, acknowledgeOpenInvoices },
      })
      toast.success(t('agreement.activateDialog.success'))
      setShowActivate(false)
    } catch (err) {
      // Conflict branches keep the dialog open so the operator can acknowledge
      // (open invoices) or read the terminal reason (overlap). Non-conflict
      // errors toast + close.
      const kind = conflictKindFromError(err)
      if (kind) throw err
      toast.error(extractApiMessage(err) ?? t('agreement.activateDialog.failed'))
      setShowActivate(false)
    }
  }

  const handleCancel = async (reason: string) => {
    if (!agreement) return
    try {
      await cancelMutation.mutateAsync({
        agreementId,
        data: { version: agreement.version, reason: reason || undefined },
      })
      toast.success(t('agreement.cancelDialog.success'))
      setShowCancel(false)
    } catch (err) {
      toast.error(extractApiMessage(err) ?? t('agreement.cancelDialog.failed'))
    }
  }

  if (isLoading || isPending) {
    return <AgreementDetailSkeleton />
  }

  if (error || !agreement) {
    const status = (error as { response?: { status?: number } } | undefined)
      ?.response?.status
    const messageKey =
      status === 403
        ? 'agreement.detail.error.forbidden'
        : status === 404
          ? 'agreement.detail.error.notFound'
          : 'error.failedToLoad'
    return (
      <div className="py-16 text-center">
        <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-[rgb(var(--state-danger-fg))]" />
        <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
          {t(messageKey)}
        </p>
        <p className="mt-2 text-xs text-[rgb(var(--text-tertiary))]">
          <UuidBadge value={agreementId} />
        </p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => navigate({ to: '/agreements' })}
            className="rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] px-4 py-2 text-sm font-medium text-[rgb(var(--text-primary))] transition-colors hover:bg-[rgb(var(--background-tertiary))]"
          >
            {t('agreement.detail.back')}
          </button>
          <button
            type="button"
            onClick={() => void refetch()}
            className="rounded-lg bg-[rgb(var(--action-primary-bg))] px-4 py-2 text-sm font-medium text-[rgb(var(--action-primary-fg))] transition-colors hover:bg-[rgb(var(--action-primary-bg-hover))]"
          >
            {t('actions.retry')}
          </button>
        </div>
      </div>
    )
  }

  const canActivate = agreement.status === 'draft'
  const canCancel =
    agreement.status === 'draft' || agreement.status === 'active'

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-6">
      <button
        onClick={() => navigate({ to: '/agreements' })}
        className="flex items-center gap-1.5 text-sm text-[rgb(var(--text-secondary))] transition-colors hover:text-[rgb(var(--text-primary))]"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('agreement.detail.back')}
      </button>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-[rgb(var(--text-primary))]">
              {agreement.title}
            </h2>
            <FinanceStatusChip status={agreement.status} />
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[rgb(var(--text-tertiary))]">
            <span>
              <UuidBadge value={agreement.id} />
            </span>
            <span>{t('agreement.version', { version: agreement.version })}</span>
            <span>
              {t('agreement.effectivePeriod', {
                from: formatDateDual(agreement.effectiveFrom, settings),
                to: formatDateDual(agreement.effectiveTo, settings),
              })}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canActivate && (
            <Button onClick={() => setShowActivate(true)}>
              {t('agreement.activate')}
            </Button>
          )}
          {canCancel && (
            <Button variant="outline" onClick={() => setShowCancel(true)}>
              {t('agreement.cancel')}
            </Button>
          )}
        </div>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0 space-y-4">
          <AgreementSummaryCard agreement={agreement} t={t} />
          <AgreementTermsCard agreement={agreement} format={format} t={t} />
          {agreement.notes && (
            <section className="rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-primary))] px-4 py-3">
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-[rgb(var(--text-tertiary))]">
                {t('agreement.detail.notes')}
              </h3>
              <p className="text-sm leading-relaxed text-[rgb(var(--text-secondary))]">
                {agreement.notes}
              </p>
            </section>
          )}
          <AgreementStatusHistoryCard
            agreement={agreement}
            settings={settings}
            t={t}
          />
        </div>
        <AgreementVersionsCard
          versions={versions ?? []}
          currentVersion={agreement.version}
          settings={settings}
          t={t}
        />
      </div>

      <AnimatePresence>
        {showActivate && (
          <ActivateAgreementDialog
            isPending={activateMutation.isPending}
            onActivate={handleActivate}
            onClose={() => setShowActivate(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCancel && (
          <CancelAgreementDialog
            title={agreement.title}
            isPending={cancelMutation.isPending}
            onConfirm={handleCancel}
            onClose={() => setShowCancel(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================================================
// SUMMARY / PAYER / MEMBERS
// ============================================================================

function AgreementSummaryCard({
  agreement,
  t,
}: {
  agreement: Agreement
  t: (k: string, o?: Record<string, unknown>) => string
}) {
  return (
    <section className="rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-primary))] p-4">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
        <Field label={t('agreement.payer')}>
          <span className="text-[rgb(var(--text-primary))]">
            {agreement.payer.name}
          </span>
          {agreement.payer.phone && (
            <span className="block text-xs text-[rgb(var(--text-tertiary))]">
              {agreement.payer.phone}
            </span>
          )}
          {agreement.payer.email && (
            <span className="block text-xs text-[rgb(var(--text-tertiary))]">
              {agreement.payer.email}
            </span>
          )}
        </Field>
        <Field label={t('agreement.list.type')}>
          <span className="text-[rgb(var(--text-primary))]">
            {t(`agreement.type.${agreement.agreementType}`)}
          </span>
        </Field>
        <Field label={t('agreement.billingFrequency')}>
          <span className="text-[rgb(var(--text-primary))]">
            {t(`agreement.wizard.frequency.${agreement.billingFrequency}`, {
              defaultValue: agreement.billingFrequency,
            })}
          </span>
        </Field>
        <Field label={t('agreement.coveredFeeTypes')}>
          <span className="text-[rgb(var(--text-primary))]">
            {agreement.coveredFeeTypes
              .map((ft) => feeTypeLabel(t, ft))
              .join(', ') || '—'}
          </span>
        </Field>
        <Field label={t('agreement.students')}>
          <span className="text-[rgb(var(--text-primary))]">
            {t('agreement.list.studentCount', {
              count: agreement.studentIds.length,
            })}
          </span>
        </Field>
      </dl>
    </section>
  )
}

function Field({
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
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  )
}

// ============================================================================
// TERMS
// ============================================================================

function AgreementTermsCard({
  agreement,
  format,
  t,
}: {
  agreement: Agreement
  format: (n: number, o?: { decimals?: number }) => string
  t: (k: string, o?: Record<string, unknown>) => string
}) {
  const { terms } = agreement
  return (
    <section className="rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-primary))] p-4">
      <h3 className="mb-3 text-sm font-semibold text-[rgb(var(--text-primary))]">
        {t('agreement.detail.terms')}
      </h3>
      {terms.agreementType === 'fixed_total' ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-[rgb(var(--background-secondary))] px-3 py-2">
            <span className="text-sm text-[rgb(var(--text-secondary))]">
              {t('agreement.detail.totalAmount')}
            </span>
            <span className="text-sm font-semibold text-[rgb(var(--text-primary))]">
              {format(terms.totalAmount, { decimals: 0 })}
            </span>
          </div>
          <div>
            <h4 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[rgb(var(--text-tertiary))]">
              {t('agreement.detail.allocation')}
            </h4>
            <ul className="divide-y divide-[rgb(var(--border-primary))]">
              {terms.allocation.map((a) => (
                <li
                  key={a.studentId}
                  className="flex items-center justify-between py-1.5 text-sm"
                >
                  <span className="text-[rgb(var(--text-secondary))]">
                    <UuidBadge value={a.studentId} />
                  </span>
                  <span className="font-medium text-[rgb(var(--text-primary))]">
                    {format(a.amount, { decimals: 0 })}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div>
          <h4 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[rgb(var(--text-tertiary))]">
            {t('agreement.detail.perStudentLines')}
          </h4>
          <ul className="divide-y divide-[rgb(var(--border-primary))]">
            {terms.lines.map((line, i) => (
              <li
                key={`${line.studentId}-${i}`}
                className="flex items-center justify-between py-1.5 text-sm"
              >
                <span className="min-w-0 text-[rgb(var(--text-secondary))]">
                  <UuidBadge value={line.studentId} />
                  {line.feeType && (
                    <span className="ml-2 text-xs text-[rgb(var(--text-tertiary))]">
                      {feeTypeLabel(t, line.feeType)}
                    </span>
                  )}
                </span>
                <span className="font-medium text-[rgb(var(--text-primary))]">
                  {format(line.amount, { decimals: 0 })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

// ============================================================================
// STATUS HISTORY
// ============================================================================

function AgreementStatusHistoryCard({
  agreement,
  settings,
  t,
}: {
  agreement: Agreement
  settings: Parameters<typeof formatDateDual>[1]
  t: (k: string, o?: Record<string, unknown>) => string
}) {
  const history = agreement.statusHistory ?? []
  return (
    <section className="rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-primary))] p-4">
      <h3 className="mb-3 text-sm font-semibold text-[rgb(var(--text-primary))]">
        {t('agreement.detail.statusHistory')}
      </h3>
      {history.length === 0 ? (
        <p className="text-xs text-[rgb(var(--text-tertiary))]">
          {t('agreement.detail.noStatusHistory')}
        </p>
      ) : (
        <ol className="space-y-2.5">
          {history.map((h, i) => (
            <li key={`${h.changedAt}-${i}`} className="flex items-start gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-[rgb(var(--accent-strong))]" />
              <div className="min-w-0 text-sm">
                <span className="text-[rgb(var(--text-primary))]">
                  {t('agreement.detail.transition', {
                    from: t(`status.${h.from}`, { defaultValue: h.from }),
                    to: t(`status.${h.to}`, { defaultValue: h.to }),
                  })}
                </span>
                <span className="ml-2 text-xs text-[rgb(var(--text-tertiary))]">
                  {formatDateDual(h.changedAt, settings)}
                </span>
                {h.reason && (
                  <p className="text-xs text-[rgb(var(--text-tertiary))]">
                    {h.reason}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

// ============================================================================
// VERSIONS
// ============================================================================

function AgreementVersionsCard({
  versions,
  currentVersion,
  settings,
  t,
}: {
  versions: AgreementVersion[]
  currentVersion: number
  settings: Parameters<typeof formatDateDual>[1]
  t: (k: string, o?: Record<string, unknown>) => string
}) {
  const sorted = (Array.isArray(versions) ? [...versions] : []).sort(
    (a, b) => b.version - a.version,
  )
  return (
    <aside className="rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-primary))] p-4">
      <h3 className="mb-3 text-sm font-semibold text-[rgb(var(--text-primary))]">
        {t('agreement.detail.versions')}
      </h3>
      {sorted.length === 0 ? (
        <p className="text-xs text-[rgb(var(--text-tertiary))]">
          {t('agreement.detail.noVersions')}
        </p>
      ) : (
        <ul className="space-y-2">
          {sorted.map((v) => (
            <li
              key={v.version}
              className="flex items-center justify-between rounded-lg bg-[rgb(var(--background-secondary))] px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[rgb(var(--text-primary))]">
                    {t('agreement.version', { version: v.version })}
                  </span>
                  {v.version === currentVersion && (
                    <StatusBadge tone="info" size="sm">
                      {t('agreement.detail.currentVersion')}
                    </StatusBadge>
                  )}
                </div>
                <span className="text-xs text-[rgb(var(--text-tertiary))]">
                  {formatDateDual(v.effectiveFrom, settings)}
                </span>
              </div>
              <FinanceStatusChip status={v.status} />
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}

// ============================================================================
// ACTIVATE DIALOG (with 409 CONFLICTING_OPEN_INVOICES handling)
// ============================================================================

function ActivateAgreementDialog({
  isPending,
  onActivate,
  onClose,
}: {
  isPending: boolean
  onActivate: (acknowledgeOpenInvoices?: boolean) => Promise<void>
  onClose: () => void
}) {
  const { t } = useTranslation('payments')
  const settings = useFinanceSettings()
  const { format } = useCurrency(settings)
  const [conflict, setConflict] = useState<ConflictKind>(null)
  const [openInvoiceConflicts, setOpenInvoiceConflicts] = useState<
    OpenInvoiceConflict[]
  >([])

  const run = async (ack?: boolean) => {
    try {
      await onActivate(ack)
    } catch (err) {
      const kind = conflictKindFromError(err)
      setConflict(kind)
      if (kind === 'openInvoices') {
        setOpenInvoiceConflicts(openInvoiceConflictsFromError(err))
      }
    }
  }

  return (
    <DialogShell titleId="activate-agreement-title">
      <div className="mb-4 flex items-start gap-3">
        <div className="rounded-full bg-[rgb(var(--state-success-bg)/0.18)] p-2">
          <Check className="h-5 w-5 text-[rgb(var(--state-success-fg))]" />
        </div>
        <div>
          <h3
            id="activate-agreement-title"
            className="text-base font-semibold text-[rgb(var(--text-primary))]"
          >
            {t('agreement.activateDialog.title')}
          </h3>
          <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
            {t('agreement.activateDialog.description')}
          </p>
        </div>
      </div>

      {conflict === 'openInvoices' && (
        <div className="mb-4 rounded-lg border border-[rgb(var(--state-warning-border))] bg-[rgb(var(--state-warning-bg)/0.14)] px-3 py-2 text-sm text-[rgb(var(--text-secondary))]">
          {t('agreement.conflict.openInvoices', {
            count: openInvoiceConflicts.length,
          })}
          {openInvoiceConflicts.length > 0 && (
            <ul className="mt-2 space-y-1 border-t border-[rgb(var(--state-warning-border)/0.4)] pt-2">
              {openInvoiceConflicts.map((c, i) => (
                <li
                  key={c.invoiceId || i}
                  className="flex items-center justify-between gap-3 text-xs"
                >
                  <span className="min-w-0 truncate">
                    <span className="font-medium text-[rgb(var(--text-primary))]">
                      {c.invoiceNumber}
                    </span>
                    {c.matchedFeeTypes.length > 0 && (
                      <span className="ml-2 text-[rgb(var(--text-tertiary))]">
                        {c.matchedFeeTypes
                          .map((ft) => feeTypeLabel(t, ft))
                          .join(', ')}
                      </span>
                    )}
                  </span>
                  <span className="flex-none font-medium text-[rgb(var(--text-primary))]">
                    {format(c.grandTotal, { decimals: 0 })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {conflict === 'overlap' && (
        <div className="mb-4 rounded-lg border border-[rgb(var(--state-danger-border))] bg-[rgb(var(--state-danger-bg)/0.14)] px-3 py-2 text-sm text-[rgb(var(--state-danger-fg))]">
          {t('agreement.conflict.overlap')}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} disabled={isPending}>
          {t('actions.cancel')}
        </Button>
        {conflict === 'overlap' ? null : conflict === 'openInvoices' ? (
          <Button onClick={() => void run(true)} disabled={isPending}>
            {isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            {t('agreement.conflict.acknowledge')}
          </Button>
        ) : (
          <Button onClick={() => void run(false)} disabled={isPending}>
            {isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            {t('agreement.activateDialog.confirm')}
          </Button>
        )}
      </div>
    </DialogShell>
  )
}

// ============================================================================
// CANCEL DIALOG
// ============================================================================

function CancelAgreementDialog({
  title,
  isPending,
  onConfirm,
  onClose,
}: {
  title: string
  isPending: boolean
  onConfirm: (reason: string) => void
  onClose: () => void
}) {
  const { t } = useTranslation('payments')
  const [reason, setReason] = useState('')

  return (
    <DialogShell titleId="cancel-agreement-title">
      <div className="mb-4 flex items-start gap-3">
        <div className="rounded-full bg-[rgb(var(--state-danger-bg)/0.18)] p-2">
          <AlertTriangle className="h-5 w-5 text-[rgb(var(--state-danger-fg))]" />
        </div>
        <div>
          <h3
            id="cancel-agreement-title"
            className="text-base font-semibold text-[rgb(var(--text-primary))]"
          >
            {t('agreement.cancelDialog.title')}
          </h3>
          <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
            {title} — {t('agreement.cancelDialog.description')}
          </p>
        </div>
      </div>

      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-[rgb(var(--text-secondary))]">
          {t('agreement.cancelDialog.reason')}
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t('agreement.cancelDialog.reasonPlaceholder')}
          maxLength={500}
          rows={3}
          className="w-full resize-none rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-primary))] px-3 py-2 text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)]"
          autoFocus
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} disabled={isPending}>
          {t('agreement.cancelDialog.keep')}
        </Button>
        <Button
          onClick={() => onConfirm(reason.trim())}
          disabled={isPending}
          className="bg-[rgb(var(--action-danger-bg))] text-[rgb(var(--action-primary-fg))] hover:brightness-95"
        >
          {isPending ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <X className="mr-1.5 h-4 w-4" />
          )}
          {t('agreement.cancelDialog.confirm')}
        </Button>
      </div>
    </DialogShell>
  )
}

function DialogShell({
  titleId,
  children,
}: {
  titleId: string
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgb(var(--background-overlay)/0.40)]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md rounded-xl bg-[rgb(var(--background-primary))] p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        {children}
      </motion.div>
    </div>
  )
}

function AgreementDetailSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-4 p-6" aria-busy="true">
      <Skeleton className="h-4 w-32" />
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  )
}
