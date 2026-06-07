/**
 * Pure helpers for the Government Reports export surface. Kept in a plain `.ts`
 * module (not the `.tsx` component) so they're unit-testable and don't trip the
 * react-refresh/only-export-components rule.
 */

import type { StatusPillVariant } from '@edforge/ui'
import type {
  ReportingSnapshotStatus,
  ReportingTemplateId,
} from './government-reports.types'

/** Human label for a template id. */
export const TEMPLATE_LABELS: Record<ReportingTemplateId, string> = {
  IEMIS_NPL_CEHRD_FLASH_I: 'Flash I — Enrollment census',
  IEMIS_NPL_CEHRD_FLASH_II: 'Flash II — Outcomes & attendance',
}

export const TEMPLATE_OPTIONS: { value: ReportingTemplateId; label: string }[] = [
  { value: 'IEMIS_NPL_CEHRD_FLASH_I', label: TEMPLATE_LABELS.IEMIS_NPL_CEHRD_FLASH_I },
  { value: 'IEMIS_NPL_CEHRD_FLASH_II', label: TEMPLATE_LABELS.IEMIS_NPL_CEHRD_FLASH_II },
]

/** Operator-facing label for a snapshot status. */
export function statusLabel(status: ReportingSnapshotStatus): string {
  switch (status) {
    case 'generating':
      return 'Generating'
    case 'generated':
      return 'Ready'
    case 'submitted':
      return 'Submitted'
    case 'verified':
      return 'Verified'
    case 'failed':
      return 'Failed'
  }
}

/** Map a snapshot status onto a StatusPill colour variant. */
export function statusVariant(status: ReportingSnapshotStatus): StatusPillVariant {
  switch (status) {
    case 'generating':
      return 'pending'
    case 'generated':
      return 'upcoming'
    case 'submitted':
      return 'excused'
    case 'verified':
      return 'paid'
    case 'failed':
      return 'overdue'
  }
}

/** Statuses whose CSV artifact exists and can be downloaded. */
const DOWNLOADABLE: ReadonlySet<ReportingSnapshotStatus> = new Set([
  'generated',
  'submitted',
  'verified',
])

export function canDownload(status: ReportingSnapshotStatus, dryRun?: boolean): boolean {
  return !dryRun && DOWNLOADABLE.has(status)
}

/** `generating` is the only non-terminal state — the UI polls while in it. */
export function isInProgress(status: ReportingSnapshotStatus): boolean {
  return status === 'generating'
}

/** Operators mark a generated report "submitted" after the manual portal upload. */
export function canMarkSubmitted(status: ReportingSnapshotStatus, dryRun?: boolean): boolean {
  return !dryRun && status === 'generated'
}

/** Operators mark a submitted report "verified" once IEMIS acknowledges it. */
export function canMarkVerified(status: ReportingSnapshotStatus, dryRun?: boolean): boolean {
  return !dryRun && status === 'submitted'
}

/**
 * Derive the 4-digit Bikram Sambat year the backend expects (`academicYearBs`)
 * from an academic year's display name. PABSON years are named with the BS year
 * embedded — "2083" or "2083-2084" — so the first 4-digit run is the BS year.
 * Returns null when no BS year can be extracted (non-PABSON / Gregorian names),
 * in which case the UI falls back to manual entry.
 */
export function extractBsYear(academicYearName: string): string | null {
  const match = academicYearName.match(/\d{4}/)
  return match ? match[0] : null
}

/** A 4-digit Bikram Sambat year, e.g. "2083". Matches the backend regex. */
export function isValidBsYear(year: string): boolean {
  return /^\d{4}$/.test(year.trim())
}

/**
 * Trigger a browser download of a presigned URL via a transient anchor. We use
 * a top-level navigation (anchor click), NOT fetch(), because the reports
 * staging bucket has no CORS rule — a fetch() would be blocked, but a
 * navigation/download is not subject to CORS.
 */
export function triggerBrowserDownload(url: string, fileName: string): void {
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
}
