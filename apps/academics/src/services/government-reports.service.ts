/**
 * Government Reports (CEHRD IEMIS Flash I/II) API client.
 *
 * These endpoints live on the IDENTITY service (`/reporting/...`), not
 * academics — the reverse proxy routes the `^/reporting` prefix to identity —
 * so the paths here are bare (no `/academics` prefix), matching school.service.
 */

import { apiGet, apiPatch, apiPost } from '../lib/api'
import type {
  CreateReportingSnapshotRequest,
  ListReportingSnapshotsQuery,
  ListReportingSnapshotsResponse,
  PreflightReportingSnapshotRequest,
  PreflightReportingSnapshotResponse,
  ReportingSnapshot,
  ReportingSnapshotDownload,
  ReportingSnapshotStatus,
} from '../components/reports/government-reports.types'

export async function listReportingSnapshots(
  query: ListReportingSnapshotsQuery,
): Promise<ListReportingSnapshotsResponse> {
  return apiGet<ListReportingSnapshotsResponse>('/reporting/snapshots', {
    schoolId: query.schoolId,
    templateId: query.templateId,
    academicYearBs: query.academicYearBs,
    status: query.status,
  })
}

export async function createReportingSnapshot(
  body: CreateReportingSnapshotRequest,
): Promise<ReportingSnapshot> {
  return apiPost<ReportingSnapshot, CreateReportingSnapshotRequest>(
    '/reporting/snapshots',
    body,
  )
}

export async function preflightReportingSnapshot(
  body: PreflightReportingSnapshotRequest,
): Promise<PreflightReportingSnapshotResponse> {
  return apiPost<PreflightReportingSnapshotResponse, PreflightReportingSnapshotRequest>(
    '/reporting/snapshots/preflight',
    body,
  )
}

export async function getReportingSnapshot(
  snapshotId: string,
  schoolId: string,
): Promise<ReportingSnapshot> {
  return apiGet<ReportingSnapshot>(`/reporting/snapshots/${snapshotId}`, { schoolId })
}

export async function getReportingSnapshotDownload(
  snapshotId: string,
  schoolId: string,
): Promise<ReportingSnapshotDownload> {
  return apiGet<ReportingSnapshotDownload>(
    `/reporting/snapshots/${snapshotId}/download`,
    { schoolId },
  )
}

export async function transitionReportingSnapshot(
  snapshotId: string,
  schoolId: string,
  nextStatus: ReportingSnapshotStatus,
): Promise<ReportingSnapshot> {
  return apiPatch<ReportingSnapshot, { nextStatus: ReportingSnapshotStatus }>(
    `/reporting/snapshots/${snapshotId}/transition?schoolId=${encodeURIComponent(schoolId)}`,
    { nextStatus },
  )
}
