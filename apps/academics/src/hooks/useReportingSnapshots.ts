/**
 * React Query hooks for the Government Reports (CEHRD IEMIS Flash I/II) export
 * surface. Mirrors the data-access conventions used by useStudents/useSchool:
 * service functions in services/, query keys namespaced, toast on mutation
 * error via parseApiError.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { parseApiError } from '../services/academics.service'
import {
  createReportingSnapshot,
  getReportingSnapshot,
  getReportingSnapshotDownload,
  listReportingSnapshots,
  preflightReportingSnapshot,
  transitionReportingSnapshot,
} from '../services/government-reports.service'
import type {
  CreateReportingSnapshotRequest,
  ListReportingSnapshotsQuery,
  PreflightReportingSnapshotRequest,
  ReportingSnapshotStatus,
} from '../components/reports/government-reports.types'
import { isInProgress } from '../components/reports/government-reports.helpers'

export const reportingKeys = {
  all: ['reporting-snapshots'] as const,
  list: (query: ListReportingSnapshotsQuery) =>
    [...reportingKeys.all, 'list', query] as const,
  detail: (schoolId: string, snapshotId: string) =>
    [...reportingKeys.all, 'detail', schoolId, snapshotId] as const,
}

/** List a school's snapshots (with optional filters). Disabled until schoolId is set. */
export function useReportingSnapshots(
  query: Omit<ListReportingSnapshotsQuery, 'schoolId'> & { schoolId: string | null },
  enabled = true,
) {
  return useQuery({
    queryKey: reportingKeys.list(query as ListReportingSnapshotsQuery),
    queryFn: () => listReportingSnapshots(query as ListReportingSnapshotsQuery),
    enabled: enabled && !!query.schoolId,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })
}

/**
 * Poll a single snapshot while it is still generating, so the UI flips to
 * "Ready" (or "Failed") without a manual refresh. Pass `null` to disable.
 */
export function useReportingSnapshotPoll(
  schoolId: string | null,
  snapshotId: string | null,
) {
  const queryClient = useQueryClient()
  return useQuery({
    queryKey:
      schoolId && snapshotId
        ? reportingKeys.detail(schoolId, snapshotId)
        : [...reportingKeys.all, 'detail', 'disabled'],
    queryFn: () => getReportingSnapshot(snapshotId as string, schoolId as string),
    enabled: !!schoolId && !!snapshotId,
    refetchInterval: (query) => (isInProgress(query.state.data?.status as ReportingSnapshotStatus) ? 5000 : false),
    refetchIntervalInBackground: false,
    staleTime: 0,
    select: (data) => {
      // Once generation terminates, refresh the history list so the row updates.
      if (!isInProgress(data.status)) {
        queryClient.invalidateQueries({ queryKey: reportingKeys.all })
      }
      return data
    },
  })
}

export function usePreflightReportingSnapshot() {
  return useMutation({
    mutationFn: (body: PreflightReportingSnapshotRequest) =>
      preflightReportingSnapshot(body),
    onError: (error) => toast.error(parseApiError(error).message),
  })
}

export function useCreateReportingSnapshot() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateReportingSnapshotRequest) => createReportingSnapshot(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportingKeys.all })
      toast.success('Report generation started')
    },
    onError: (error) => toast.error(parseApiError(error).message),
  })
}

/** Lazily mint a presigned download URL on click. */
export function useReportingSnapshotDownload() {
  return useMutation({
    mutationFn: ({ snapshotId, schoolId }: { snapshotId: string; schoolId: string }) =>
      getReportingSnapshotDownload(snapshotId, schoolId),
    onError: (error) => toast.error(parseApiError(error).message),
  })
}

export function useTransitionReportingSnapshot() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      snapshotId,
      schoolId,
      nextStatus,
    }: {
      snapshotId: string
      schoolId: string
      nextStatus: ReportingSnapshotStatus
    }) => transitionReportingSnapshot(snapshotId, schoolId, nextStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportingKeys.all })
      toast.success('Report status updated')
    },
    onError: (error) => toast.error(parseApiError(error).message),
  })
}
