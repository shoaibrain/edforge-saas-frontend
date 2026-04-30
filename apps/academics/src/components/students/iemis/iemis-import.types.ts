/**
 * Frontend types mirroring the backend `IemisRow` + `IemisFinding` + import
 * response shape declared at:
 *   server/application/microservices/academics/src/students/iemis-transform.ts
 *   server/application/microservices/academics/src/students/students.controller.ts#importStudentsIemis
 *
 * We duplicate here (instead of importing from shared-types) to:
 *   a. Keep the academics MFE bundle independent of backend entity shapes.
 *   b. Allow the UI to evolve without forcing shared-types bumps for
 *      presentation concerns (e.g. adding `sourceValue` to a finding for
 *      the error-CSV export is purely a frontend convenience).
 * The cross-repo drift risk is low because (a) backend types are tested
 * and (b) `IemisImportResult` keys are stable.
 */

/**
 * Column names the IEMIS xlsx export provides. Exact strings, including
 * capitalization and spaces, because they appear verbatim in the backend
 * transformer's column sniff.
 */
export const IEMIS_COLUMN_NAMES = [
  'S.N',
  'IEMIS Code',
  'Current School',
  'Student Id',
  'FullName',
  'Gender',
  'Father Name',
  'Mother Name',
  'CurrentClass',
  'Section',
  'Year',
  'Permanent Address',
  'Temporary Address',
  'DOB',
  'Is Transferred',
  'Mother Tongue',
  'Disability Type',
  'Age',
  'Guardian Name',
  'Guardian Contact Number',
] as const

export type IemisColumnName = (typeof IEMIS_COLUMN_NAMES)[number]

/**
 * Columns the backend transformer actively reads. Missing these from the
 * upload is a hard block. The rest (`S.N`, `Section`, `Year`, `Age`,
 * `Current School`, `Mother Tongue`, `Disability Type`, `Is Transferred`)
 * are either ignored or only used for warnings.
 */
export const IEMIS_REQUIRED_COLUMNS: readonly IemisColumnName[] = [
  'Student Id',
  'FullName',
  'Gender',
  'CurrentClass',
  'DOB',
] as const

/**
 * Shape of a single parsed row before the backend transform. Values are
 * `string | number | undefined` because xlsx preserves numeric cells as
 * numbers (e.g. Year=2082, Age=10) and string cells as strings.
 */
export type IemisRow = Partial<Record<IemisColumnName, string | number | undefined>>

/** Severity of a row-level finding. `error` blocks the row; `warn` is informational. */
export type IemisFindingLevel = 'warn' | 'error'

export interface IemisFinding {
  row: number
  field: string
  level: IemisFindingLevel
  message: string
}

export interface IemisDuplicate {
  row: number
  emisStudentId: string
  existingStudentId: string
}

/** Backend response for `POST /academics/students/import/iemis` when dryRun=true.
 *  Real-import (dryRun=false) returns `IemisImportAsyncAck` instead.
 */
export interface IemisImportResult {
  succeeded: number
  failed: number
  skipped: number
  findings: IemisFinding[]
  duplicates: IemisDuplicate[]
}

/**
 * 202 Accepted shape returned by the real-import path (dryRun=false).
 * Client should poll GET /academics/students/import/iemis/jobs/:jobId.
 */
export interface IemisImportAsyncAck {
  jobId: string
  status: 'queued'
  totalRows: number
  schoolId: string
  enrollInAcademicYearId?: string
}

export type IemisImportJobStatus = 'queued' | 'running' | 'succeeded' | 'failed'

/** Full job record returned by `GET /academics/students/import/iemis/jobs/:jobId`. */
export interface IemisImportJob {
  jobId: string
  schoolId: string
  status: IemisImportJobStatus
  totalRows: number
  enrollInAcademicYearId?: string

  studentsCreated: number
  studentsEnrolled: number
  failed: number
  skipped: number

  findings: IemisFinding[]
  findingsTruncated: boolean
  duplicates: IemisDuplicate[]
  duplicatesTruncated: boolean

  startedAt?: string
  completedAt?: string
  durationMs?: number
  error?: string

  createdAt: string
  updatedAt: string
}

/** Backend request body. */
export interface IemisImportRequest {
  students: IemisRow[]
  schoolId: string
  dryRun?: boolean
  /** Optional academic-year-id; when set on dryRun=false, every successfully
   *  created Student also gets a SchoolEnrollment row inside the same async
   *  job. Ignored on dryRun=true.
   */
  enrollInAcademicYearId?: string
}

/**
 * Result of the client-side xlsx parse + column-sniff. Computed before the
 * dry-run call so the user sees upfront whether the file shape is acceptable.
 */
export interface IemisParseResult {
  /** File name as selected (for display only). */
  fileName: string
  /** Total row count (excluding header). */
  rowCount: number
  /** Parsed row dicts, shape-matched to `IemisColumnName` keys. */
  rows: IemisRow[]
  /** Column header names as they appeared in the sheet. */
  detectedColumns: string[]
  /** Subset of `IEMIS_COLUMN_NAMES` that matched (case-insensitive). */
  mappedColumns: IemisColumnName[]
  /** IEMIS columns not found in the sheet. */
  missingColumns: IemisColumnName[]
  /** Columns in the sheet that aren't part of the IEMIS schema (hint, not error). */
  extraColumns: string[]
  /** Absent required columns — if non-empty, the file cannot be imported. */
  missingRequired: IemisColumnName[]
}

/**
 * Unified UI state machine for the multi-phase import flow. Mirrors the
 * pattern already used by `CSVImport.tsx` but with phases specific to the
 * IEMIS flow (mandatory dry-run, richer preview, post-commit results).
 */
export type IemisImportPhase =
  | 'gate' // Checking preconditions (school + emisSchoolCode present)
  | 'chooseFile' // File input + template download
  | 'parsing' // xlsx parsing in-flight
  | 'parseError' // Client-side parse failed (bad file, wrong shape)
  | 'dryRunning' // POST with dryRun=true in-flight
  | 'preview' // Dry-run complete; findings + duplicates shown
  | 'confirming' // User opened the confirm modal; awaiting Yes/No
  | 'committing' // POST with dryRun=false in-flight (server returns 202 quickly)
  | 'progress' // Job accepted; polling GET /jobs/:jobId for terminal state
  | 'results' // Job terminal=succeeded; show final counts
  | 'commitError' // Job terminal=failed OR initial POST failed

/**
 * File size ceiling in bytes. 5MB covers 779-row Saraswati exports with
 * plenty of slack for multi-sheet files. The backend cap of 1000 rows is
 * the real bound; this is just a defense-in-depth.
 */
export const MAX_IEMIS_FILE_SIZE_BYTES = 5 * 1024 * 1024

/** Backend row cap (must stay in sync with `students.service.ts:1186`). */
export const MAX_IEMIS_ROW_COUNT = 1000

/**
 * Flattened row used for error-CSV export. `sourceValue` is pulled from
 * the original `IemisRow` to give operators enough context to debug.
 */
export interface IemisFindingExport {
  row: number
  field: string
  level: IemisFindingLevel
  message: string
  sourceValue: string
}
