/**
 * finance-job-adapter — Sprint F.5 (PR #266 review fix-up).
 *
 * Normalizes the Sprint D/F `FinanceJobRow` shape (nested `counters.*`
 * + `output.*` sub-objects) into the D1-D4 `AsyncBulkJobResult` shape
 * (flat counters, top-level error string) so the shared
 * `AsyncJobProgress` component can render both without needing to know
 * which backend job framework produced the row.
 *
 * Why two shapes exist:
 *   - `AsyncBulkJob` (finance D1-D4): send-notifications family
 *     (bulk-send-receipt / bulk-send-statement / bulk-send-reminder /
 *     bulk-void-payment / bulk-adjust-balance). Per-record dispatch;
 *     one input row → one outcome row. Flat counters make sense.
 *   - `FinanceJob` (Sprint D/F): render-heavy-work family
 *     (bulk-invoice-generate / bulk-invoice-pdf-export /
 *     bulk-receipt-pdf-export). Emits a single ZIP or merged PDF
 *     artifact; `output` sub-object carries the presigned URL. Nested
 *     counters + output make sense at the entity level.
 *
 * Both frameworks stay distinct on the backend (different DDB entity
 * types, different worker classes, different lifecycle contracts). The
 * frontend just presents them consistently via this adapter.
 */

import type { AsyncBulkJobResult } from '@edforge/finance-services'
import type { FinanceJobRow } from '@edforge/finance-services'

/**
 * Project a `FinanceJobRow` onto the `AsyncBulkJobResult` shape.
 *
 * Fields mapped:
 *   - `counters.requested` → `totalRecords`
 *   - `counters.succeeded/failed/skipped` → flat
 *   - `errors[0].message` → `error` (AsyncBulkJobProgress surfaces the
 *     top-level error string on `status === 'failed'`; the FinanceJob
 *     errors array carries per-invoice failures which are already
 *     reflected in `counters.failed`)
 *   - `createdAt / updatedAt / startedAt / completedAt` → passthrough
 *
 * Fields intentionally NOT mapped (bulk-PDF-export-specific chrome):
 *   - `output.zipKey / zipUrl / urlExpiresAt` — the drawer renders the
 *     download link BELOW the progress block, not inside it
 *   - `failedInvoiceIds`, `failedStudentIds` — for future "retry failed
 *     only" affordance; AsyncBulkJobResult has a `failures[]` sibling
 *     but the shape differs enough to keep them separate for V1
 */
export function financeJobToAsyncBulkJob(
  job: FinanceJobRow,
): AsyncBulkJobResult {
  return {
    jobId: job.jobId,
    status: job.status,
    totalRecords: job.counters.requested,
    succeeded: job.counters.succeeded,
    failed: job.counters.failed,
    skipped: job.counters.skipped,
    error: job.errors?.[0]?.message,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  }
}
