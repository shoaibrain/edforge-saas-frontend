/**
 * OverdueAlertBanner — V2
 *
 * Critical alert banner shown when overdue invoices exist.
 */

import { useNavigate } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { V2AlertItem } from "@edforge/ui";
import { useCurrency } from "@edforge/types/use-currency";
import { useTranslation } from "@edforge/i18n";
import { useFinanceSettings } from "../../layouts/FinanceLayout";
import { localizeAgingBucketLabel } from "./aging-i18n";

interface OverdueAlertBannerProps {
  overdue: number;
  overdueCount: number;
  collectionRate: number;
  draftCount: number;
  agingReport: Array<{ label: string; count: number }>;
}

export function OverdueAlertBanner({
  overdue,
  overdueCount,
  collectionRate,
  draftCount,
  agingReport,
}: OverdueAlertBannerProps) {
  const settings = useFinanceSettings();
  const { t, i18n } = useTranslation("payments");
  const { formatShort } = useCurrency(settings, {
    platformLanguage: i18n.language,
  });
  const navigate = useNavigate();

  if (overdue <= 0) return null;

  // Dynamic aging label from the largest non-zero bucket
  const largestBucket = agingReport
    .filter((b) => b.count > 0)
    .sort((a, b) => b.count - a.count)[0];
  const agingLabel = largestBucket
    ? t("overview.alert.agingBucket", {
        count: largestBucket.count,
        bucket: localizeAgingBucketLabel(largestBucket, t),
      })
    : "";

  const subtitle =
    [
      t("overview.alert.collectionRate", { rate: collectionRate.toFixed(1) }),
      agingLabel,
      draftCount > 0 ? t("overview.alert.drafts", { count: draftCount }) : "",
    ]
      .filter(Boolean)
      .join(". ") + ".";

  return (
    <V2AlertItem
      severity="critical"
      title={t("overview.alert.title", {
        count: overdueCount,
        amount: formatShort(overdue),
      })}
      subtitle={subtitle}
      icon={<AlertTriangle className="w-3.5 h-3.5" />}
      cta={{
        label: t("overview.alert.reviewBilling"),
        onClick: () =>
          navigate({ to: "/invoices", search: { status: "overdue" } as any }),
      }}
    />
  );
}
