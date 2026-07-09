/**
 * AgreementCoverageCard — V2 (FB-5.5)
 *
 * Family-billing agreement-coverage tile for the Finance Overview dashboard.
 * Three stats: students covered, active agreements, and invoiced-via-agreement
 * (count + amount). Peer of BillingHealthCard / CollectionPerformanceCard —
 * same `bare` framing for WidgetCard, same skeleton idiom.
 */

import { Handshake, Users, FileText } from "lucide-react";
import { useCurrency } from "@edforge/types/use-currency";
import { useTranslation } from "@edforge/i18n";
import type { DashboardSummary } from "@edforge/types";
import { useFinanceSettings } from "../../layouts/FinanceLayout";

interface AgreementCoverageCardProps {
  coverage: DashboardSummary["agreementCoverage"] | null;
  isLoading: boolean;
  /** Render only the stats (no card chrome / title) for WidgetCard framing. */
  bare?: boolean;
}

function CardSkeleton() {
  return (
    <div className="space-y-3 py-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-24 rounded v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]" />
            <div className="h-3 w-16 rounded v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function StatRow({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-[rgb(var(--background-tertiary))] text-[rgb(var(--text-tertiary))]">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-xs text-[rgb(var(--text-tertiary))]">{label}</div>
        {sub && (
          <div className="text-xs text-[rgb(var(--text-disabled))]">{sub}</div>
        )}
      </div>
      <span className="text-sm font-semibold tabular-nums text-[rgb(var(--text-primary))]">
        {value}
      </span>
    </div>
  );
}

export function AgreementCoverageCard({
  coverage,
  isLoading,
  bare,
}: AgreementCoverageCardProps) {
  const settings = useFinanceSettings();
  const { t, i18n } = useTranslation("payments");
  const { formatShort } = useCurrency(settings, {
    platformLanguage: i18n.language,
  });

  const content = isLoading ? (
    <CardSkeleton />
  ) : !coverage || coverage.activeAgreements === 0 ? (
    <div className="flex flex-col items-center py-6">
      <Handshake className="mb-2 h-8 w-8 opacity-40 text-[rgb(var(--text-tertiary))]" />
      <p className="text-xs font-medium text-[rgb(var(--text-tertiary))]">
        {t("overview.agreementCoverage.none")}
      </p>
    </div>
  ) : (
    <div className="flex flex-col gap-3">
      <StatRow
        icon={Users}
        label={t("overview.agreementCoverage.studentsCoveredLabel")}
        value={String(coverage.studentsCovered)}
      />
      <StatRow
        icon={Handshake}
        label={t("overview.agreementCoverage.activeAgreementsLabel")}
        value={String(coverage.activeAgreements)}
      />
      <StatRow
        icon={FileText}
        label={t("overview.agreementCoverage.invoicedViaAgreementLabel")}
        sub={t(
          coverage.invoicedViaAgreement.count === 1
            ? "overview.agreementCoverage.invoicedCount"
            : "overview.agreementCoverage.invoicedCount_plural",
          { count: coverage.invoicedViaAgreement.count },
        )}
        value={formatShort(coverage.invoicedViaAgreement.amount)}
      />
    </div>
  );

  if (bare) return content;

  return (
    <div
      // allow-presentation-style: card padding (18px) is off the 4px scale — matches sibling cards
      className="flex flex-col rounded-xl border bg-[rgb(var(--background-secondary))] border-[rgb(var(--border-primary)/0.35)]"
      style={{ padding: 18 }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-[rgb(var(--text-secondary))]">
          {t("overview.agreementCoverage.title")}
        </h3>
      </div>
      {content}
    </div>
  );
}
