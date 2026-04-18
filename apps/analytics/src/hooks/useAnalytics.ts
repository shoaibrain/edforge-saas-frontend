/**
 * React Query hooks for the analytics dashboard.
 *
 * All hooks key on tenantId so multi-tenant cache isolation is automatic.
 * Stale time: 60s for time-series (data changes via aggregator on minute
 * cadence), 5min for adoption reports (week-grain), 0 for export URL
 * (presigned, single-use).
 */

import { useMutation, useQuery, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query'
import type {
  ExportCsvUrlResponse,
  TenantTimeSeriesResponse,
} from '@edforge/types/analytics'
import {
  analyticsService,
  type AdoptionReportQuery,
  type AdoptionReportV25,
  type ExportCsvQuery,
  type TimeSeriesQuery,
} from '../services/analytics.service'

export const analyticsKeys = {
  all: ['analytics'] as const,
  timeSeries: (q: TimeSeriesQuery) =>
    [...analyticsKeys.all, 'timeSeries', q.tenantId, q.from, q.to, q.granularity] as const,
  adoptionReport: (q: AdoptionReportQuery) =>
    [...analyticsKeys.all, 'adoptionReport', q.tenantId, q.week, q.holidays?.join(',') ?? ''] as const,
}

export function useTenantTimeSeries(
  q: TimeSeriesQuery,
  options?: { enabled?: boolean },
): UseQueryResult<TenantTimeSeriesResponse> {
  return useQuery({
    queryKey: analyticsKeys.timeSeries(q),
    queryFn: () => analyticsService.getTenantTimeSeries(q),
    staleTime: 60_000,
    enabled: options?.enabled ?? Boolean(q.tenantId && q.from && q.to),
  })
}

export function useAdoptionReport(
  q: AdoptionReportQuery,
  options?: { enabled?: boolean },
): UseQueryResult<AdoptionReportV25> {
  return useQuery({
    queryKey: analyticsKeys.adoptionReport(q),
    queryFn: () => analyticsService.getAdoptionReport(q),
    staleTime: 5 * 60_000,
    enabled: options?.enabled ?? Boolean(q.tenantId && q.week && q.provisionedAt),
  })
}

/**
 * Export is a mutation, not a query — every click should re-issue the
 * presigned URL (they expire). Caller drives invocation via mutate().
 */
export function useExportCsvUrl(): UseMutationResult<ExportCsvUrlResponse, Error, ExportCsvQuery> {
  return useMutation({
    mutationFn: (q: ExportCsvQuery) => analyticsService.getExportCsvUrl(q),
  })
}
