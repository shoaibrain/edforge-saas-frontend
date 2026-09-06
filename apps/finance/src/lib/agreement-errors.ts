/**
 * Readers for the family-billing 409s. Each reads the backend wire envelope
 * (see api-validation-errors.ts) and returns a typed view the UI can act on.
 */

import { extractApiErrorBody, extractApiErrorCode } from './api-validation-errors'

/**
 * FB-3.10 — 409 `AGREEMENT_ACTIVE` body from the single-generate path. Emitted
 * ONLY by POST /finance/schools/:s/invoices when an active agreement covers the
 * student for the requested fee types. Bulk-generate records per-student
 * failures in its job result instead, so the override dialog attaches to the
 * single modal only.
 */
export interface AgreementActiveError {
  code: 'AGREEMENT_ACTIVE'
  message?: string
  agreementId: string
  // Optional: the read-time guard includes it; the lock-backstop
  // (concurrent-generate) 409 omits it. Gate the dialog on agreementId only.
  existingInvoiceId?: string
  coveredFeeTypes?: string[]
}

export function parseAgreementActive(err: unknown): AgreementActiveError | null {
  const resp = (err as { response?: { status?: number } } | undefined)?.response
  if (resp?.status !== 409) return null
  const data = extractApiErrorBody(err) as Partial<AgreementActiveError> | null
  if (data?.code !== 'AGREEMENT_ACTIVE' || !data.agreementId) return null
  return {
    code: 'AGREEMENT_ACTIVE',
    message: data.message,
    agreementId: data.agreementId,
    existingInvoiceId: data.existingInvoiceId,
    coveredFeeTypes: data.coveredFeeTypes ?? [],
  }
}

export type ConflictKind = 'openInvoices' | 'overlap' | null

/** Classify an activate 409 by its domain code. */
export function conflictKindFromError(err: unknown): ConflictKind {
  const code = extractApiErrorCode(err)
  if (code === 'CONFLICTING_OPEN_INVOICES') return 'openInvoices'
  if (code === 'AGREEMENT_OVERLAP') return 'overlap'
  return null
}

/** One conflicting open invoice off the 409 CONFLICTING_OPEN_INVOICES body. */
export interface OpenInvoiceConflict {
  invoiceId: string
  invoiceNumber: string
  grandTotal: number
  matchedFeeTypes: string[]
}

export function openInvoiceConflictsFromError(err: unknown): OpenInvoiceConflict[] {
  // Backend throws ConflictException({ code, message, conflicts }) — the
  // count is the length of `conflicts`; each entry identifies the invoice.
  const conflicts = extractApiErrorBody(err)?.conflicts
  if (!Array.isArray(conflicts)) return []
  return conflicts
    .filter(
      (c): c is Record<string, unknown> => !!c && typeof c === 'object',
    )
    .map((c) => ({
      invoiceId: typeof c.invoiceId === 'string' ? c.invoiceId : '',
      invoiceNumber: typeof c.invoiceNumber === 'string' ? c.invoiceNumber : '',
      grandTotal: typeof c.grandTotal === 'number' ? c.grandTotal : 0,
      matchedFeeTypes: Array.isArray(c.matchedFeeTypes)
        ? c.matchedFeeTypes.map(String)
        : [],
    }))
}
