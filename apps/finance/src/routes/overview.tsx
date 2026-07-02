/**
 * Finance Overview Page — dashboard recipe
 *
 * PageHeader (pagebar, ⑧ AttentionCorner pill in the attention slot) → StatBand
 * → WidgetCard grid (⑤), the same canonical structure as Home + Academics
 * Overview. Reuses `useFinanceOverviewV2` and the existing overview-v2 cards in
 * `bare` mode; preserves the filters/export row, no-school guard, per-widget
 * error boundaries, and reduced-motion stagger.
 */

import { useNavigate } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { Wallet, FileStack, CreditCard } from "lucide-react";
import {
  PageHeader,
  StatBand,
  type StatMetric,
  AttentionCorner,
  AttentionCornerPill,
  AttentionCornerShade,
  useSignalAcks,
  type Signal,
  WidgetGrid,
  WidgetCard,
  WidgetErrorBoundaryV2,
} from "@edforge/ui";
import { useCurrency } from "@edforge/types/use-currency";
import { useTranslation } from "@edforge/i18n";
import { useFinanceSettings } from "../layouts/FinanceLayout";
import { useAppStore } from "../stores/app.store";
import { useFinanceOverviewV2 } from "../hooks/useFinanceOverviewV2";
import { FilterRow } from "../components/overview-v2/FilterRow";
import { CollectionPerformanceCard } from "../components/overview-v2/CollectionPerformanceCard";
import { BillingHealthCard } from "../components/overview-v2/BillingHealthCard";
import { RecentPaymentsCard } from "../components/overview-v2/RecentPaymentsCard";
import { RecentInvoicesCard } from "../components/overview-v2/RecentInvoicesCard";
import { localizeAgingBucketLabel } from "../components/overview-v2/aging-i18n";

// ============================================================================
// ANIMATION
// ============================================================================

function useMotionVariants() {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) {
    return {
      stagger: { hidden: {}, visible: {} },
      fadeInUp: { hidden: {}, visible: {} },
    };
  }
  return {
    stagger: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: { staggerChildren: 0.06, delayChildren: 0.05 },
      },
    },
    fadeInUp: {
      hidden: { opacity: 0, y: 14 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.35, ease: "easeOut" },
      },
    },
  };
}

// ============================================================================
// PAGE
// ============================================================================

export function Overview() {
  const schoolId = useAppStore((s) => s.activeSchoolId);
  const { t } = useTranslation("payments");

  // No-school guard
  if (!schoolId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Wallet className="w-12 h-12 mx-auto mb-4 opacity-30 text-[rgb(var(--text-tertiary))]" />
          <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
            {t("overview.selectSchoolTitle")}
          </h2>
          <p className="text-sm mt-1 text-[rgb(var(--text-tertiary))]">
            {t("overview.selectSchoolDescription")}
          </p>
        </div>
      </div>
    );
  }

  return <FinanceOverviewContent schoolId={schoolId} />;
}

function FinanceOverviewContent({ schoolId }: { schoolId: string }) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("payments");
  const data = useFinanceOverviewV2(schoolId);
  const { stagger, fadeInUp } = useMotionVariants();
  const settings = useFinanceSettings();
  const { formatCompact, formatShort } = useCurrency(settings, {
    platformLanguage: i18n.language,
  });

  const {
    kpi,
    isLoading,
    invoicesByStatus,
    totalInvoiceCount,
    paymentsByGateway,
    totalPaymentCount,
    byFeeType,
    agingReport,
    recentPayments,
    recentInvoices,
    filters,
    setFromDate,
    setToDate,
    setAcademicYear,
    clearFilters,
    hasActiveFilters,
    academicYears,
    handleExportCSV,
    isExporting,
  } = data;

  const overdueCount = invoicesByStatus["overdue"] ?? 0;
  const draftCount = invoicesByStatus["draft"] ?? 0;


  // ── StatBand metrics (calm; attention only via state) ────────────────────
  const metrics: StatMetric[] = [
    {
      label: t("overview.kpi.totalInvoiced"),
      value: formatCompact(kpi.totalInvoiced),
      iconSignature: "finance",
      state: "normal",
      primary: true,
      sub: t("overview.kpi.invoiceCount", { count: kpi.totalInvoiceCount }),
    },
    {
      label: t("overview.kpi.collected"),
      value: formatCompact(kpi.totalCollected),
      iconSignature: "finance",
      state: "normal",
      sub: t("overview.kpi.paymentCount", { count: kpi.currentMonthPaymentCount }),
    },
    {
      label: t("overview.kpi.outstanding"),
      value: formatCompact(kpi.outstanding),
      iconSignature: "finance_receipt",
      state: "normal",
      sub: t("overview.kpi.awaiting", { count: kpi.outstandingInvoiceCount }),
    },
    kpi.overdue > 0
      ? {
          label: t("overview.kpi.overdue"),
          value: formatCompact(kpi.overdue),
          iconSignature: "atrisk",
          state: "critical",
          pill: { tone: "critical", text: t("overview.kpi.invoiceCount", { count: overdueCount }) },
        }
      : {
          label: t("overview.kpi.overdue"),
          value: formatCompact(kpi.overdue),
          iconSignature: "atrisk",
          state: "normal",
        },
  ];

  // ── ⑧ Attention Corner signals (replaces the AlertLane stack) ────────────
  // Derived from the same overview-v2 query on every render, so collecting the
  // overdue amount auto-resolves the signal. `[]` while the query loads.
  const { acked, ack, unack } = useSignalAcks();
  const signals: Signal[] = [];
  if (!isLoading && kpi.overdue > 0) {
    const largestBucket = agingReport
      .filter((b) => b.count > 0)
      .sort((a, b) => b.count - a.count)[0];
    const agingLabel = largestBucket
      ? t("overview.alert.agingBucket", {
          count: largestBucket.count,
          bucket: localizeAgingBucketLabel(largestBucket, t),
        })
      : "";
    const description =
      [
        t("overview.alert.collectionRate", { rate: kpi.collectionRate.toFixed(1) }),
        agingLabel,
        draftCount > 0 ? t("overview.alert.drafts", { count: draftCount }) : "",
      ]
        .filter(Boolean)
        .join(". ") + ".";
    signals.push({
      id: "finance.overdue",
      severity: "critical",
      domain: t("headerZone.domains.finance"),
      title: t("overview.alert.title", {
        count: overdueCount,
        amount: formatShort(kpi.overdue),
      }),
      description,
      fix: {
        label: t("overview.alert.reviewBilling"),
        onAction: () =>
          navigate({ to: "/invoices", search: { status: "overdue" } as never }),
      },
    });
  }

  return (
    <div className="p-6 space-y-5" style={{ minHeight: "100vh" }}>
      {/* Screen-reader page heading (breadcrumb names the page visually) */}
      <h1 className="sr-only">{t("overview.finance")}</h1>

      {/* ---- ⑧ Header zone — attention pill left, actions right ---- */}
      <motion.div variants={fadeInUp} initial="hidden" animate="visible">
        <AttentionCorner
          signals={signals}
          acked={acked}
          onAck={ack}
          onUnack={unack}
          labels={{
            needAttention: t("headerZone.needAttention"),
            allClear: t("headerZone.allClear"),
            region: t("headerZone.region"),
            minimize: t("headerZone.minimize"),
            acknowledge: t("headerZone.acknowledge"),
            acknowledged: t("headerZone.acknowledged"),
            acknowledgedHint: t("headerZone.acknowledgedHint"),
            dismiss: t("headerZone.dismiss"),
            emptyTitle: t("headerZone.emptyTitle"),
          }}
        >
          <PageHeader
            mode="pagebar"
            attention={<AttentionCornerPill />}
            actions={[
              {
                label: t("overview.actions.bulkInvoice"),
                icon: <FileStack className="h-3.5 w-3.5" />,
                ariaLabel: t("overview.actions.bulkInvoiceAria"),
                onClick: () => navigate({ to: "/invoices/bulk-generate" }),
              },
              {
                label: t("overview.actions.recordPayment"),
                icon: <CreditCard className="h-3.5 w-3.5" />,
                primary: true,
                ariaLabel: t("overview.actions.recordPaymentAria"),
                onClick: () => navigate({ to: "/payments/record" }),
              },
            ]}
          />
          <AttentionCornerShade />
        </AttentionCorner>
      </motion.div>

      {/* ---- Filters & Export ---- */}
      <FilterRow
        fromDate={filters.from || ""}
        toDate={filters.to || ""}
        academicYear={filters.academicYear || ""}
        academicYears={academicYears}
        hasActiveFilters={hasActiveFilters}
        isExporting={isExporting}
        onFromChange={setFromDate}
        onToChange={setToDate}
        onAcademicYearChange={setAcademicYear}
        onClear={clearFilters}
        onExport={handleExportCSV}
      />

      {/* ---- StatBand — KPI summary ---- */}
      <motion.div variants={fadeInUp} initial="hidden" animate="visible">
        <StatBand metrics={metrics} ariaLabel={t("overview.kpi.region")} />
      </motion.div>

      {/* ---- ⑤ WidgetCard grid ---- */}
      <motion.div variants={stagger} initial="hidden" animate="visible">
        <WidgetGrid>
          <WidgetCard title={t("overview.billingHealth.title")} iconSignature="finance" span={5}>
            <WidgetErrorBoundaryV2>
              <BillingHealthCard
                invoicesByStatus={invoicesByStatus}
                totalInvoiceCount={totalInvoiceCount}
                paymentsByGateway={paymentsByGateway}
                totalPaymentCount={totalPaymentCount}
                agingReport={agingReport}
                isLoading={isLoading}
                bare
              />
            </WidgetErrorBoundaryV2>
          </WidgetCard>

          <WidgetCard
            title={t("overview.collection.title")}
            iconSignature="finance"
            span={7}
            metric={t("overview.collection.percentCollected", { rate: kpi.collectionRate.toFixed(1) })}
          >
            <WidgetErrorBoundaryV2>
              <CollectionPerformanceCard
                totalInvoiced={kpi.totalInvoiced}
                totalCollected={kpi.totalCollected}
                outstanding={kpi.outstanding}
                overdue={kpi.overdue}
                collectionRate={kpi.collectionRate}
                byFeeType={byFeeType}
                isLoading={isLoading}
                bare
              />
            </WidgetErrorBoundaryV2>
          </WidgetCard>

          <WidgetCard title={t("overview.recent.payments")} iconSignature="finance_note" span={6}>
            <WidgetErrorBoundaryV2>
              <RecentPaymentsCard payments={recentPayments} isLoading={isLoading} bare />
            </WidgetErrorBoundaryV2>
          </WidgetCard>

          <WidgetCard title={t("overview.recent.invoices")} iconSignature="finance_receipt" span={6}>
            <WidgetErrorBoundaryV2>
              <RecentInvoicesCard invoices={recentInvoices} isLoading={isLoading} bare />
            </WidgetErrorBoundaryV2>
          </WidgetCard>
        </WidgetGrid>
      </motion.div>
    </div>
  );
}
