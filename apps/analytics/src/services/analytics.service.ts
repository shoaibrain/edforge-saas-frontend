/**
 * Analytics Service — typed wrappers for /analytics/* endpoints.
 *
 * Backend contract lives in @aibrains/shared-types/schemas/analytics
 * and is re-exported via @edforge/types/analytics.
 *
 * NOTE: the runtime Lambda returns `weekStartsOn` on the adoption report
 * (added in shared-types v0.25). Until that version is published to npm,
 * we extend the v0.24-typed AdoptionReport with the field locally so the
 * dashboard can use it. Once v0.25 ships, drop AdoptionReportV25 and
 * import the canonical type directly.
 */

import type {
  AdoptionReport,
  ExportCsvUrlResponse,
  Granularity,
  TenantTimeSeriesResponse,
} from '@edforge/types/analytics'
import { apiGet } from '../lib/api'

export type AdoptionReportV25 = AdoptionReport & {
  /** Tenant's week-start at report-generation time. v0.25+ Lambda always sets it. */
  weekStartsOn?: 'sunday' | 'monday' | 'saturday'
}

export interface TimeSeriesQuery {
  tenantId: string
  from: string  // ISO date YYYY-MM-DD
  to: string    // ISO date YYYY-MM-DD
  granularity: Granularity
}

export interface AdoptionReportQuery {
  tenantId: string
  /** ISO week key, e.g. "2026-W16". */
  week: string
  /** When the tenant was provisioned (drives grace-period flag). ISO timestamp. */
  provisionedAt: string
  /** Holiday dates in this week (yyyy-mm-dd, comma-separated upstream). Optional. */
  holidays?: string[]
}

export interface ExportCsvQuery {
  tenantId: string
  from: string
  to: string
  granularity: Granularity
}

export const analyticsService = {
  async getTenantTimeSeries(q: TimeSeriesQuery): Promise<TenantTimeSeriesResponse> {
    return apiGet<TenantTimeSeriesResponse>(`/analytics/tenants/${q.tenantId}`, {
      from: q.from,
      to: q.to,
      granularity: q.granularity,
    })
  },

  async getAdoptionReport(q: AdoptionReportQuery): Promise<AdoptionReportV25> {
    const params: Record<string, unknown> = {
      week: q.week,
      provisionedAt: q.provisionedAt,
    }
    if (q.holidays && q.holidays.length > 0) {
      params.holidays = q.holidays.join(',')
    }
    return apiGet<AdoptionReportV25>(
      `/analytics/tenants/${q.tenantId}/adoption-report`,
      params,
    )
  },

  async getExportCsvUrl(q: ExportCsvQuery): Promise<ExportCsvUrlResponse> {
    return apiGet<ExportCsvUrlResponse>(
      `/analytics/tenants/${q.tenantId}/export-csv-url`,
      { from: q.from, to: q.to, granularity: q.granularity },
    )
  },
}
