/**
 * Frontend types for the CEHRD IEMIS Flash I/II "Government Reports" export
 * surface. Mirrors the backend contract declared at:
 *   packages/shared-types/src/schemas/identity/reporting-snapshot.schema.ts
 *   server/.../identity/src/external-reporting/reporting-snapshot.controller.ts
 *
 * Duplicated here (rather than imported from @aibrains/shared-types) so the
 * academics MFE bundle stays independent of backend entity shapes and the UI
 * can evolve presentation concerns without forcing a shared-types bump — the
 * same convention the IEMIS *import* flow uses (iemis-import.types.ts).
 */

/** Report templates wired in V1. Reserved ids exist backend-side but aren't shown. */
export type ReportingTemplateId =
  | 'IEMIS_NPL_CEHRD_FLASH_I'
  | 'IEMIS_NPL_CEHRD_FLASH_II'

/** Lifecycle state-machine: generating → generated → submitted → verified (+ failed). */
export type ReportingSnapshotStatus =
  | 'generating'
  | 'generated'
  | 'submitted'
  | 'verified'
  | 'failed'

export interface ReportingSnapshot {
  snapshotId: string
  schoolId: string
  templateId: ReportingTemplateId
  academicYearBs: string
  status: ReportingSnapshotStatus
  s3Key?: string
  rowCount?: number
  generatedAt?: string
  submittedAt?: string
  submittedBy?: string
  verifiedAt?: string
  verifiedBy?: string
  errorCode?: string
  errorSummary?: string
  schemaVersion: string
  dryRun?: boolean
  createdAt: string
  createdBy: string
  updatedAt: string
}

export interface ListReportingSnapshotsResponse {
  snapshots: ReportingSnapshot[]
  count: number
}

export interface ReportingSnapshotError {
  rowIndex: number
  studentId?: string
  field: string
  error: string
}

export interface ReportingSnapshotWarning {
  rowIndex: number
  studentId?: string
  field: string
  message: string
  suggestedRemedy?: string
}

export interface PreflightReportingSnapshotResponse {
  rowCount: number
  errors: ReportingSnapshotError[]
  warnings: ReportingSnapshotWarning[]
  canProceed: boolean
}

export interface ReportingSnapshotDownload {
  url: string
  fileName: string
  s3Key: string
  expiresInSeconds: number
  expiresAt: string
}

export interface CreateReportingSnapshotRequest {
  templateId: ReportingTemplateId
  academicYearBs: string
  schoolId: string
  dryRun?: boolean
}

export interface PreflightReportingSnapshotRequest {
  templateId: ReportingTemplateId
  academicYearBs: string
  schoolId: string
}

export interface ListReportingSnapshotsQuery {
  schoolId: string
  templateId?: ReportingTemplateId
  academicYearBs?: string
  status?: ReportingSnapshotStatus
}
