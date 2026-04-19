/**
 * Analytics API contract — re-exports from @aibrains/shared-types.
 *
 * Single source of truth for `/analytics/*` response shapes shared between:
 *   - The AWS-deployed analytics-api Lambda (server-side producer)
 *   - This Vercel-deployed saas-frontend (consumer)
 *
 * Pattern mirrors `format-currency.ts` — frontend modules import from
 * `@edforge/types/analytics` without needing a direct shared-types
 * dependency.
 *
 * REQUIRES: @aibrains/shared-types >= 0.24.0 (analytics schemas added in v0.24).
 */

// Response types
export type {
  AdoptionMetricEntry,
  AdoptionMetricKey,
  AdoptionReport,
  AdoptionStatus,
  AnalyticsErrorResponse,
  DateSecondary,
  ExportCsvUrlResponse,
  FleetFeatureCount,
  FleetSummary,
  Granularity,
  MetricSeries,
  MetricSeriesPoint,
  SessionEventType,
  SessionHistoryEvent,
  SessionHistoryResponse,
  TenantTimeSeriesResponse,
} from '@aibrains/shared-types/schemas/analytics';

// Zod schemas (for runtime validation in dashboards if needed)
export {
  adoptionMetricEntrySchema,
  adoptionMetricKeySchema,
  adoptionReportSchema,
  adoptionStatusSchema,
  analyticsErrorResponseSchema,
  dateSecondarySchema,
  exportCsvUrlResponseSchema,
  fleetFeatureCountSchema,
  fleetSummarySchema,
  granularitySchema,
  metricSeriesPointSchema,
  metricSeriesSchema,
  sessionEventTypeSchema,
  sessionHistoryEventSchema,
  sessionHistoryResponseSchema,
  tenantTimeSeriesResponseSchema,
} from '@aibrains/shared-types/schemas/analytics';
