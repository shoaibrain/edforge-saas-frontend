/**
 * BillingHealthCard — V2
 *
 * Unified billing health view merging invoice status (donut),
 * aging spectrum (heatbar), and payment methods into one card.
 * Replaces the separate InvoiceStatusCard + AgingReportCard.
 */

import { useMemo } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { CheckCircle2 } from "lucide-react";
import { AnimatedProgressBar } from "@edforge/ui";
import { formatInvoiceStatus, formatGatewayLabel } from "@edforge/types";
import { useCurrency } from "@edforge/types/use-currency";
import { useTranslation } from "@edforge/i18n";
import { useFinanceSettings } from "../../layouts/FinanceLayout";
import {
  getLocalizedAgingInsight,
  localizeAgingBucketLabel,
} from "./aging-i18n";

// ─── Colors ──────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  overdue: "#E24B4A",
  draft: "#888780",
  paid: "#1D9E75",
  partially_paid: "#EF9F27",
  issued: "#378ADD",
  cancelled: "#5F5E5A",
  written_off: "#5F5E5A",
};

const GATEWAY_COLORS: Record<string, string> = {
  cash: "#1D9E75",
  cheque: "#7F77DD",
  bank_transfer: "#378ADD",
  esewa: "#60C06E",
  khalti: "#5C2D91",
  fonepay: "#2196F3",
  connectips: "#00BCD4",
  stripe: "#6772E5",
};

// Aging heat spectrum — color intensity increases with age
const AGING_COLORS = [
  "#1D9E75", // Current — healthy green
  "#EF9F27", // 1-30 days — amber
  "#E8762B", // 31-60 days — orange
  "#E24B4A", // 61-90 days — red
  "#9B2C2C", // 90+ days — dark red
];

// ─── Types ───────────────────────────────────────────────────────────────────

interface AgingBucket {
  label: string;
  minDays: number;
  maxDays: number | null;
  count: number;
  amount: number;
}

interface BillingHealthCardProps {
  invoicesByStatus: Record<string, number>;
  totalInvoiceCount: number;
  paymentsByGateway: Record<string, number>;
  totalPaymentCount: number;
  agingReport: AgingBucket[];
  isLoading: boolean;
  /** Render only the donut + aging + gateways (no card chrome / title) for WidgetCard framing. */
  bare?: boolean;
}

// ─── Skeletons ───────────────────────────────────────────────────────────────

function GatewayRowsSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-1">
          <div className="flex justify-between">
            <div className="h-3 w-16 rounded v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]" />
            <div className="h-3 w-10 rounded v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]" />
          </div>
          <div className="h-1 rounded-sm v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]" />
        </div>
      ))}
    </div>
  );
}

/**
 * Mirrors the loaded card's full height envelope (donut + legend, aging
 * spectrum, payment methods) so the card reserves its populated size during
 * load instead of growing from a short stub — the source of the dashboard's
 * layout shift.
 */
function BillingHealthSkeleton() {
  return (
    <>
      <div className="flex items-start gap-4">
        <div
          className="flex-shrink-0 rounded-full v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]"
          style={{ width: 110, height: 110 }}
        />
        <div className="flex-1 space-y-2 pt-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <div className="h-3 w-24 rounded v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]" />
              <div className="h-3 w-8 rounded v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]" />
            </div>
          ))}
        </div>
      </div>

      <div className="my-4 h-px bg-[rgb(var(--border-primary)/0.35)]" />

      <div className="mb-4">
        <div className="h-3 w-24 mb-2 rounded v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]" />
        <SpectrumSkeleton />
      </div>

      <div className="mb-4 h-px bg-[rgb(var(--border-primary)/0.35)]" />

      <div>
        <div className="h-3 w-28 mb-2.5 rounded v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]" />
        <GatewayRowsSkeleton />
      </div>
    </>
  );
}

function SpectrumSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-6 rounded-lg v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]" />
      <div className="flex gap-4 justify-between">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-3 w-12 rounded v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]"
          />
        ))}
      </div>
    </div>
  );
}

// ─── Tooltips ────────────────────────────────────────────────────────────────

function DonutTooltip({ active, payload }: any) {
  const { t } = useTranslation("payments");
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="rounded-lg border px-3 py-2 text-xs shadow-lg bg-[rgb(var(--background-secondary))] border-[rgb(var(--border-primary)/0.35)] text-[rgb(var(--text-secondary))]">
      <div className="font-semibold">{d.name}</div>
      <div className="text-[rgb(var(--text-disabled))]">
        {t(
          d.value === 1
            ? "overview.billingHealth.invoiceCount"
            : "overview.billingHealth.invoiceCount_plural",
          { count: d.value },
        )}{" "}
        · {d.payload.pct}%
      </div>
    </div>
  );
}

// ─── Default Buckets ─────────────────────────────────────────────────────────

const DEFAULT_BUCKETS: AgingBucket[] = [
  { label: "Current", minDays: 0, maxDays: 0, count: 0, amount: 0 },
  { label: "1-30 days", minDays: 1, maxDays: 30, count: 0, amount: 0 },
  { label: "31-60 days", minDays: 31, maxDays: 60, count: 0, amount: 0 },
  { label: "61-90 days", minDays: 61, maxDays: 90, count: 0, amount: 0 },
  { label: "90+ days", minDays: 91, maxDays: null, count: 0, amount: 0 },
];

// ─── Component ───────────────────────────────────────────────────────────────

export function BillingHealthCard({
  invoicesByStatus,
  totalInvoiceCount,
  paymentsByGateway,
  totalPaymentCount,
  agingReport,
  isLoading,
  bare,
}: BillingHealthCardProps) {
  const settings = useFinanceSettings();
  const { t, i18n } = useTranslation("payments");
  const { formatShort } = useCurrency(settings, {
    platformLanguage: i18n.language,
  });

  const statusLabel = (status: string) =>
    t(`status.${status}`, { defaultValue: formatInvoiceStatus(status) });
  const gatewayLabel = (gateway: string) => {
    const key =
      gateway === "bank_transfer" ? "bankTransfer" : gateway.toLowerCase();
    return t(`gateway.${key}`, { defaultValue: formatGatewayLabel(gateway) });
  };

  const sortedStatuses = useMemo(
    () =>
      Object.entries(invoicesByStatus)
        .filter(([, count]) => count > 0)
        .sort(([, a], [, b]) => b - a),
    [invoicesByStatus],
  );

  const donutData = useMemo(
    () =>
      sortedStatuses.map(([status, count]) => ({
        name: statusLabel(status),
        value: count,
        color: STATUS_COLORS[status] || "#888780",
        pct:
          totalInvoiceCount > 0
            ? Math.round((count / totalInvoiceCount) * 100)
            : 0,
      })),
    [sortedStatuses, statusLabel, totalInvoiceCount],
  );

  const sortedGateways = useMemo(
    () =>
      Object.entries(paymentsByGateway)
        .filter(([, count]) => count > 0)
        .sort(([, a], [, b]) => b - a),
    [paymentsByGateway],
  );

  const buckets = agingReport.length > 0 ? agingReport : DEFAULT_BUCKETS;
  const hasAnyOverdue = buckets.some((b) => b.count > 0);
  const agingInsight = useMemo(
    () => getLocalizedAgingInsight(buckets, formatShort, t),
    [buckets, formatShort, t],
  );

  // Spectrum bar segment widths — proportional to count, minimum 6% for visibility
  const totalCount = buckets.reduce((s, b) => s + b.count, 0);

  const content = isLoading ? (
    <BillingHealthSkeleton />
  ) : totalInvoiceCount === 0 ? (
        <div className="flex flex-col items-center py-6">
          <CheckCircle2 className="w-8 h-8 mb-2 opacity-40 text-[rgb(var(--text-tertiary))]" />
          <p className="text-xs font-medium text-[rgb(var(--text-tertiary))]">
            {t("overview.billingHealth.noInvoicesTitle")}
          </p>
          <p className="text-xs mt-0.5 text-[rgb(var(--text-disabled))]">
            {t("overview.billingHealth.noInvoicesDescription")}
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-start gap-4">
            {/* Donut */}
            <div
              className="flex-shrink-0 relative"
              style={{ width: 110, height: 110 }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={33}
                    outerRadius={50}
                    paddingAngle={2}
                    dataKey="value"
                    animationDuration={700}
                    animationEasing="ease-out"
                    stroke="none"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<DonutTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-sm font-semibold leading-none text-[rgb(var(--text-primary))]">
                  {totalInvoiceCount}
                </span>
                <span className="text-xs mt-0.5 text-[rgb(var(--text-disabled))]">
                  {t("overview.billingHealth.invoices")}
                </span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex-1 space-y-1.5 pt-1">
              {donutData.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-1.5">
                    <div
                      // allow-presentation-style: per-status legend dot color
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: item.color }}
                    />
                    <span className="text-xs text-[rgb(var(--text-secondary))]">
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs tabular-nums text-[rgb(var(--text-disabled))]">
                      {item.pct}%
                    </span>
                    <span className="text-xs font-medium tabular-nums text-[rgb(var(--text-secondary))]">
                      {item.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Divider ── */}
          <div className="my-4 h-px bg-[rgb(var(--border-primary)/0.35)]" />

          {/* ── Aging Spectrum ── */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[rgb(var(--text-secondary))]">
                {t("overview.billingHealth.agingOverview")}
              </span>
              {hasAnyOverdue && (
                <span className="text-xs tabular-nums text-[rgb(var(--text-disabled))]">
                  {t("overview.billingHealth.overdueCount", {
                    count: totalCount,
                  })}
                </span>
              )}
            </div>

            {/* Insight text */}
            {agingInsight && (
              <p className="text-xs mb-3 leading-relaxed text-[rgb(var(--text-tertiary))]">
                {agingInsight}
              </p>
            )}

            {isLoading ? (
              <SpectrumSkeleton />
            ) : !hasAnyOverdue ? (
              <div className="rounded-lg px-4 py-3 flex items-center gap-2 bg-[rgb(var(--state-success-bg))] border border-[rgb(var(--state-success-border))]">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-[rgb(var(--accent-enrollment-text))]" />
                <span className="text-xs text-[rgb(var(--accent-enrollment-text))]">
                  {t("overview.billingHealth.noOverdue")}
                </span>
              </div>
            ) : (
              <>
                {/* Spectrum heatbar */}
                <div
                  className="flex rounded-lg overflow-hidden"
                  style={{ height: 24 }}
                >
                  {buckets.map((bucket, idx) => {
                    // Width proportional to count; minimum 6% for empty segments, proportional for active
                    const isActive = bucket.count > 0;
                    const minWidth = 6;
                    const proportionalWidth =
                      totalCount > 0 ? (bucket.count / totalCount) * 100 : 0;
                    const width = isActive
                      ? Math.max(proportionalWidth, 12)
                      : minWidth;
                    const color =
                      AGING_COLORS[idx] ||
                      AGING_COLORS[AGING_COLORS.length - 1];

                    return (
                      <div
                        key={bucket.label}
                        // allow-presentation-style: per-bucket aging heat segment (width/color/opacity from data)
                        className="relative flex items-center justify-center transition-all duration-500"
                        style={{
                          width: `${width}%`,
                          background: isActive
                            ? color
                            : "rgb(var(--background-tertiary))",
                          opacity: isActive ? 1 : 0.4,
                          borderRight:
                            idx < buckets.length - 1
                              ? "1px solid rgb(var(--background-primary))"
                              : undefined,
                        }}
                        title={t("overview.billingHealth.agingBucketTitle", {
                          bucket: localizeAgingBucketLabel(bucket, t),
                          count: bucket.count,
                          amount: formatShort(bucket.amount),
                        })}
                      >
                        {isActive && bucket.count > 0 && (
                          <span className="text-xs font-bold text-[rgb(var(--action-primary-fg))] drop-shadow-sm">
                            {bucket.count}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Bucket labels */}
                <div className="flex mt-1.5 gap-0.5">
                  {buckets.map((bucket, idx) => {
                    const isActive = bucket.count > 0;
                    const minWidth = 6;
                    const proportionalWidth =
                      totalCount > 0 ? (bucket.count / totalCount) * 100 : 0;
                    const width = isActive
                      ? Math.max(proportionalWidth, 12)
                      : minWidth;
                    const color =
                      AGING_COLORS[idx] ||
                      AGING_COLORS[AGING_COLORS.length - 1];

                    return (
                      <div
                        key={bucket.label}
                        className="text-center"
                        style={{ width: `${width}%` }}
                      >
                        <div
                          // allow-presentation-style: active bucket label uses its heat color
                          className="text-xs font-medium truncate"
                          style={{
                            color: isActive
                              ? color
                              : "rgb(var(--text-disabled))",
                          }}
                        >
                          {localizeAgingBucketLabel(bucket, t)}
                        </div>
                        {isActive && (
                          <div className="text-xs tabular-nums text-[rgb(var(--text-tertiary))]">
                            {formatShort(bucket.amount)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* ── Divider ── */}
          <div className="mb-4 h-px bg-[rgb(var(--border-primary)/0.35)]" />

          {/* ── Payment Methods ── */}
          <div>
            <span className="text-xs font-medium text-[rgb(var(--text-secondary))]">
              {t("overview.billingHealth.paymentMethods")}
            </span>

            {totalPaymentCount === 0 ? (
              <p className="text-xs py-3 text-[rgb(var(--text-tertiary))]">
                {t("overview.billingHealth.noPaymentsRecorded")}
              </p>
            ) : (
              <div className="space-y-2 mt-2.5">
                {sortedGateways.map(([gateway, count]) => {
                  const pct =
                    totalPaymentCount > 0
                      ? (count / totalPaymentCount) * 100
                      : 0;
                  const color = GATEWAY_COLORS[gateway] || "#888780";
                  return (
                    <div key={gateway} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div
                            // allow-presentation-style: per-gateway legend dot color
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ background: color }}
                          />
                          <span className="text-xs text-[rgb(var(--text-secondary))]">
                            {gatewayLabel(gateway)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs tabular-nums text-[rgb(var(--text-disabled))]">
                            {pct.toFixed(0)}%
                          </span>
                          <span className="text-xs font-medium tabular-nums text-[rgb(var(--text-secondary))]">
                            {count}
                          </span>
                        </div>
                      </div>
                      <AnimatedProgressBar
                        percentage={pct}
                        color={color}
                        label={`${gatewayLabel(gateway)}: ${count} (${pct.toFixed(0)}%)`}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
  );

  if (bare) return content;

  return (
    <div
      // allow-presentation-style: card padding (18px) is off the 4px scale
      className="rounded-xl border flex flex-col bg-[rgb(var(--background-secondary))] border-[rgb(var(--border-primary)/0.35)]"
      style={{ padding: 18 }}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-[rgb(var(--text-secondary))]">
          {t("overview.billingHealth.title")}
        </h3>
        {!isLoading && !hasAnyOverdue && totalInvoiceCount > 0 && (
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-[rgb(var(--state-success-bg))] text-[rgb(var(--accent-enrollment-text))]">
            <CheckCircle2 className="w-3 h-3" />
            {t("overview.billingHealth.allAccountsCurrent")}
          </span>
        )}
      </div>
      {content}
    </div>
  );
}
