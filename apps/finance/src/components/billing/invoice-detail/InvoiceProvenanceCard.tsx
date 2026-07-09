/**
 * InvoiceProvenanceCard (FB-5.4)
 *
 * "How was this calculated?" disclosure on the invoice detail page. Explains,
 * line by line, whether pricing came from the fee catalog, an active agreement,
 * or a custom line — plus any operator override that bypassed a fee structure
 * at generate time.
 *
 * Fetch gating: `useInvoiceProvenance` starts as soon as both ids are present,
 * so the fetching body (`<ProvenanceBody>`) is mounted ONLY while the
 * disclosure is expanded. Pure-standard invoices (no agreement) never mount the
 * card at all, so they never fetch. This keeps the invoice detail page cheap
 * for the common catalog-billed invoice.
 *
 * Props mirror InvoiceLineItemsCard's `{ invoice, format }` convention, plus
 * `schoolId` for the provenance query.
 */

import { useState } from 'react'
import { ChevronDown, GitBranch, ShieldAlert } from 'lucide-react'
import { UuidBadge } from '@edforge/archetype'
import { useTranslation } from '@edforge/i18n'
import type { Invoice, InvoiceProvenanceLine, ProvenanceLineSource } from '@edforge/types'
import { useInvoiceProvenance } from '@edforge/finance-services'
import { BillingSourceChip, type BillingSource } from '../../shared'

export interface InvoiceProvenanceCardProps {
  schoolId: string
  invoice: Invoice
  format: (amount: number) => string
}

/** Provenance line source → billing-source chip mapping. */
const SOURCE_TO_BILLING: Record<ProvenanceLineSource, BillingSource | null> = {
  fee_structure: 'standard',
  agreement: 'agreement',
  custom: null,
}

export function InvoiceProvenanceCard({ schoolId, invoice, format }: InvoiceProvenanceCardProps) {
  const { t } = useTranslation('payments')
  const [open, setOpen] = useState(false)

  // Only render for agreement-priced invoices; pure-standard invoices carry no
  // interesting provenance and shouldn't pay for the extra fetch.
  const isAgreementPriced = invoice.feeOverrideMode === 'agreement' || !!invoice.agreementId
  if (!isAgreementPriced) return null

  return (
    <section className="overflow-hidden rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-primary))]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 border-b border-[rgb(var(--border-primary))] px-4 py-3 text-left hover:bg-[rgb(var(--background-secondary))]"
      >
        <GitBranch className="h-4 w-4 text-[rgb(var(--text-tertiary))]" />
        <h2 className="text-sm font-semibold text-[rgb(var(--text-primary))]">
          {t('invoiceDetail.provenance.howCalculated')}
        </h2>
        <ChevronDown
          className={`ml-auto h-4 w-4 text-[rgb(var(--text-tertiary))] transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && <ProvenanceBody schoolId={schoolId} invoiceId={invoice.id} format={format} />}
    </section>
  )
}

function ProvenanceBody({
  schoolId,
  invoiceId,
  format,
}: {
  schoolId: string
  invoiceId: string
  format: (amount: number) => string
}) {
  const { t } = useTranslation('payments')
  const { data: provenance, isLoading, isError } = useInvoiceProvenance(schoolId, invoiceId)

  if (isLoading) {
    return (
      <div className="space-y-2 p-4" aria-busy="true">
        <div className="h-4 w-3/4 rounded v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]" />
        <div className="h-4 w-2/3 rounded v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]" />
        <div className="h-4 w-1/2 rounded v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]" />
      </div>
    )
  }

  if (isError || !provenance) {
    return (
      <p className="px-4 py-6 text-center text-sm text-[rgb(var(--text-tertiary))]">
        {t('invoiceDetail.provenance.empty')}
      </p>
    )
  }

  const { lines, overrides } = provenance

  return (
    <div className="space-y-3 p-4">
      <p className="text-xs text-[rgb(var(--text-tertiary))]">
        {t('invoiceDetail.provenance.description')}
      </p>

      {lines.length === 0 ? (
        <p className="py-2 text-sm text-[rgb(var(--text-tertiary))]">
          {t('invoiceDetail.provenance.empty')}
        </p>
      ) : (
        <ul className="space-y-2">
          {lines.map((line) => (
            <ProvenanceLineRow key={line.lineId} line={line} format={format} />
          ))}
        </ul>
      )}

      {overrides && overrides.length > 0 && (
        <div className="mt-3 space-y-2 rounded-lg border border-[rgb(var(--state-warning-border)/0.3)] bg-[rgb(var(--state-warning-bg)/0.25)] p-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[rgb(var(--text-primary))]">
            <ShieldAlert className="h-3.5 w-3.5 text-[rgb(var(--state-warning-fg))]" />
            {t('invoiceDetail.provenance.overridesTitle')}
          </div>
          {overrides.map((ov, idx) => (
            <div key={ov.agreementId + idx} className="space-y-1 text-xs text-[rgb(var(--text-secondary))]">
              <div className="flex items-center gap-2">
                <span className="font-medium text-[rgb(var(--text-primary))]">
                  {ov.agreementTitle ?? t('agreement.title')}
                </span>
                <UuidBadge value={ov.agreementId} />
              </div>
              <p>
                {t('invoiceDetail.provenance.overrideRequested', {
                  count: ov.requestedFeeStructureIds.length,
                })}
              </p>
              {ov.bypassedAt && (
                <p className="text-[rgb(var(--text-tertiary))]">{formatBypassedAt(ov.bypassedAt)}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ProvenanceLineRow({
  line,
  format,
}: {
  line: InvoiceProvenanceLine
  format: (amount: number) => string
}) {
  const { t } = useTranslation('payments')
  const chipSource = SOURCE_TO_BILLING[line.source]
  const suppressed = line.suppressedFeeStructures ?? []

  return (
    <li className="rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] p-3">
      <div className="flex items-start justify-between gap-3">
        <span className="min-w-0 text-sm font-medium text-[rgb(var(--text-primary))]">
          {line.description}
        </span>
        {chipSource ? (
          <BillingSourceChip source={chipSource} />
        ) : (
          <span className="whitespace-nowrap rounded-full bg-[rgb(var(--background-tertiary))] px-2 py-0.5 text-xs font-medium text-[rgb(var(--text-secondary))]">
            {t('invoiceDetail.provenance.source.custom')}
          </span>
        )}
      </div>

      <p className="mt-1 text-xs text-[rgb(var(--text-tertiary))]">
        {line.source === 'agreement' && line.agreementTitle
          ? t('invoiceDetail.provenance.viaAgreement', {
              title: line.agreementTitle,
              version: line.agreementVersion ?? 1,
            })
          : line.source === 'fee_structure' && line.feeStructureName
            ? t('invoiceDetail.provenance.viaFeeStructure', { name: line.feeStructureName })
            : null}
      </p>

      {line.discount && line.discount.amount > 0 && (
        <p className="mt-1 text-xs text-[rgb(var(--accent-strong))]">
          {t('invoiceDetail.provenance.discountFromRule', {
            amount: format(line.discount.amount),
            name: line.discount.ruleName ?? line.discount.reason ?? '—',
          })}
        </p>
      )}

      {suppressed.length > 0 && (
        <div className="mt-2 space-y-1 border-t border-[rgb(var(--border-primary))] pt-2">
          <p className="text-xs font-medium text-[rgb(var(--text-secondary))]">
            {t('invoiceDetail.provenance.suppressed', { count: suppressed.length })}
          </p>
          <ul className="space-y-0.5">
            {suppressed.map((s) => (
              <li key={s.id} className="text-xs text-[rgb(var(--text-tertiary))]">
                {s.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  )
}

/** ISO datetime → locale date string; falls back to the raw value on parse failure. */
function formatBypassedAt(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString()
}
