/**
 * PDF download telemetry — Sprint M1.10.
 *
 * Emits structured `pdf_download_*` events via the Vercel analytics
 * pipeline so operators can answer "how many invoice PDFs were
 * downloaded last week?" / "what's the failure rate on receipt
 * downloads?" without instrumenting each call site.
 *
 * **No dep on `@vercel/analytics`.** The shell app mounts
 * `<Analytics />` at boot (`apps/shell/src/main.tsx`), which installs
 * `window.va` — Vercel's documented escape-hatch global for emitting
 * events from environments that can't import the SDK. Federated MFE
 * modules run in the SAME `window` as shell, so `window.va?.(...)`
 * works the moment any consumer mounts the shell. When the global is
 * absent (vitest, SSR, MFE-running-standalone-dev), every track call
 * is a clean no-op.
 *
 * Naming convention mirrors the existing `apps/shell/src/analytics/
 * landing-events.ts`: snake_case event names, shallow string/number
 * payloads, **no PII** (no invoice numbers, no receipt numbers, no
 * student names, no payment ids). `school_id` is intentionally
 * allowed — it's a tenant-level UUID that doesn't identify a person.
 *
 * Implements ticket M1.10 of the PDF service MFE integration plan
 * (`docs/pilot-greenlight/pdf-service-mfe-integration-plan.md` §3).
 */

import type { PdfDocType } from '../hooks/usePdfErrorToast'

/**
 * Shape of `window.va` as installed by `@vercel/analytics/react`'s
 * `<Analytics />` mount. The `properties` parameter is intentionally
 * `unknown` because that's how `@vercel/analytics` declares it
 * ambiently — apps/shell imports the SDK, which adds its own
 * `Window.va` declaration, and a narrower signature here would
 * cause TS2717 ("Subsequent property declarations must have the
 * same type") when shell typechecks the finance-services source
 * via workspace resolution.
 *
 * The narrowness lives at the CALL SITES below instead (each
 * `track*` helper passes a typed payload literal), so we keep
 * payload-shape safety without conflicting with shell.
 */
type VercelAnalyticsGlobal = (
  event: 'event' | 'beforeSend' | 'pageview',
  properties?: unknown,
) => void

declare global {
  interface Window {
    va?: VercelAnalyticsGlobal
  }
}

/**
 * Coarse classifications for PDF download failures. Picked so dashboards
 * can pivot by class without the value carrying any backend message
 * (which could occasionally leak user-supplied content).
 *
 * The classifier maps known HTTP-shape error messages to these classes;
 * anything unrecognized falls back to `'unknown'`.
 */
type PdfErrorClass =
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'validation'
  | 'server_error'
  | 'network'
  | 'unknown'

/**
 * Classify an error caught in a download hook's `onError` into one of
 * the buckets above. We deliberately rely on string matching against
 * the backend's standard message shapes — the service layer already
 * unwraps blob-wrapped JSON and re-throws with the `message` field.
 *
 * Axios's `Request failed with status code <N>` is the fallback shape
 * when no JSON body was provided.
 */
export function classifyPdfDownloadError(error: unknown): PdfErrorClass {
  if (!(error instanceof Error)) return 'unknown'
  const msg = error.message ?? ''

  if (/status code 401|unauthorized|session expired/i.test(msg)) return 'unauthorized'
  if (/status code 403|forbidden|permission/i.test(msg)) return 'forbidden'
  if (/status code 404|not found/i.test(msg)) return 'not_found'
  if (/status code 4\d\d|validation|invalid/i.test(msg)) return 'validation'
  if (/status code 5\d\d|server error|internal/i.test(msg)) return 'server_error'
  if (/network|fetch|connection|timeout|aborted/i.test(msg)) return 'network'
  return 'unknown'
}

interface TrackProps {
  docType: PdfDocType
  schoolId: string
}

/** Fired when a user triggers a PDF download (mutation kickoff). */
export function trackPdfDownloadStarted(props: TrackProps): void {
  if (typeof window === 'undefined') return
  window.va?.('event', {
    name: 'pdf_download_started',
    doc_type: props.docType,
    school_id: props.schoolId,
  })
}

/** Fired when the PDF Blob is in hand + the anchor click was issued. */
export function trackPdfDownloadSucceeded(
  props: TrackProps & { byteSize: number },
): void {
  if (typeof window === 'undefined') return
  window.va?.('event', {
    name: 'pdf_download_succeeded',
    doc_type: props.docType,
    school_id: props.schoolId,
    byte_size: props.byteSize,
  })
}

/** Fired when the mutation rejects, before the toast surfaces. */
export function trackPdfDownloadFailed(
  props: TrackProps & { error: unknown },
): void {
  if (typeof window === 'undefined') return
  window.va?.('event', {
    name: 'pdf_download_failed',
    doc_type: props.docType,
    school_id: props.schoolId,
    error_class: classifyPdfDownloadError(props.error),
  })
}
