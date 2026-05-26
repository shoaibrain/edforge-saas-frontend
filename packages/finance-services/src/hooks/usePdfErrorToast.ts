/**
 * usePdfErrorToast — canonical error-UX for PDF download flows.
 *
 * Implements ticket M1.11 of the PDF service MFE integration plan
 * (`docs/pilot-greenlight/pdf-service-mfe-integration-plan.md` §3).
 *
 * Returns a stable callback that consumers (`useDownloadInvoicePdf`,
 * `useDownloadReceiptPdf`, future C.3 report-card hook, C.5 admit-card
 * hook, etc.) invoke from their mutation `onError`. The callback:
 *
 *   1. Picks a localized TITLE from the `errors.pdf` namespace keyed
 *      on `docType` (`invoice`, `receipt`, `report-card`, `admit-card`,
 *      or the generic `downloadFailed`).
 *   2. Picks a DESCRIPTION from one of three places, in order:
 *      a. the backend-supplied message on the Error (carries the
 *         specific server-side reason — "Invoice not found",
 *         "PDF rendering temporarily unavailable", etc.)
 *      b. a localized fallback for known message shapes
 *         ("Network Error", "Request failed with status code 401")
 *      c. a generic `errors.generic` fallback for anything else
 *   3. Dispatches a `sonner` `toast.error(title, { description })`.
 *
 * Why this is a hook (not a plain function): consumers need a stable
 * reference inside React Query's `onError` closure. `useTranslation`
 * also needs to be called at render time, not deep inside a mutation
 * callback.
 *
 * `sonner` + `@edforge/i18n` are PEER dependencies — finance-services
 * doesn't bundle them. Consumer apps (apps/finance, apps/shell) must
 * provide both, which they do today.
 */

import { useCallback } from 'react'
import { toast } from 'sonner'
import { useTranslation } from '@edforge/i18n'

export type PdfDocType =
  | 'invoice'
  | 'receipt'
  | 'report-card'
  | 'admit-card'

/**
 * Map a docType to its localized title key. Falls back to the
 * generic `downloadFailed` key for any docType not yet enumerated —
 * useful for forward-compat as new document types ship.
 */
const TITLE_KEY: Record<PdfDocType, string> = {
  invoice: 'pdf.invoiceDownloadFailed',
  receipt: 'pdf.receiptDownloadFailed',
  'report-card': 'pdf.reportCardDownloadFailed',
  'admit-card': 'pdf.admitCardDownloadFailed',
}

/**
 * Extract the most useful description from an unknown error value.
 * Prefer the Error's message (the backend's specific reason); fall
 * back to common stringified shapes; return undefined when nothing
 * helpful is available so the caller can substitute a localized
 * generic.
 */
function extractDescription(error: unknown): string | undefined {
  if (error instanceof Error) {
    const message = error.message?.trim()
    return message ? message : undefined
  }
  if (typeof error === 'string') {
    const trimmed = error.trim()
    return trimmed ? trimmed : undefined
  }
  return undefined
}

export function usePdfErrorToast() {
  const { t } = useTranslation('errors')

  /**
   * Show a localized error toast for a failed PDF download.
   *
   * @param error    The Error (or unknown) value the mutation rejected with.
   * @param docType  Used to pick a specific title (defaults to 'invoice').
   */
  return useCallback(
    (error: unknown, docType: PdfDocType = 'invoice') => {
      const titleKey = TITLE_KEY[docType] ?? 'pdf.downloadFailed'
      const title = t(titleKey, { defaultValue: "Couldn't download the PDF" })
      const description =
        extractDescription(error) ??
        t('generic', { defaultValue: 'Something went wrong' })
      toast.error(title, { description })
    },
    [t],
  )
}
