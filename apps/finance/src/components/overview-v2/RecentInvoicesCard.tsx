/**
 * RecentInvoicesCard — V2
 *
 * Feed list of the most recent 5 invoices with status-coded icons.
 */

import { formatInvoiceStatus, formatRelativeDate } from "@edforge/types";
import { useCurrency } from "@edforge/types/use-currency";
import { useTranslation } from "@edforge/i18n";
import { useFinanceSettings } from "../../layouts/FinanceLayout";

const STATUS_COLORS: Record<string, string> = {
  overdue: "#E24B4A",
  draft: "#888780",
  paid: "#1D9E75",
  partially_paid: "#EF9F27",
  issued: "#378ADD",
  cancelled: "#5F5E5A",
  written_off: "#5F5E5A",
};

interface RecentInvoice {
  id: string;
  invoiceNumber: string;
  studentName: string;
  grandTotal: number;
  amountDue: number;
  status: string;
  issuedDate: string;
  createdAt: string;
}

interface RecentInvoicesCardProps {
  invoices: RecentInvoice[];
  isLoading: boolean;
}

function FeedSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-2 h-7 rounded-sm v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]" />
          <div className="flex-1 space-y-1">
            <div className="h-3 w-28 rounded v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]" />
            <div className="h-2.5 w-20 rounded v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]" />
          </div>
          <div className="h-3 w-16 rounded v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]" />
        </div>
      ))}
    </div>
  );
}

export function RecentInvoicesCard({
  invoices,
  isLoading,
}: RecentInvoicesCardProps) {
  const settings = useFinanceSettings();
  const { t, i18n } = useTranslation("payments");
  const { format } = useCurrency(settings, {
    platformLanguage: i18n.language,
  });
  const top5 = invoices.slice(0, 5);
  const statusLabel = (status: string) =>
    t(`status.${status}`, { defaultValue: formatInvoiceStatus(status) });

  return (
    <div
      // allow-presentation-style: card padding (18px) is off the 4px scale
      className="rounded-xl border flex flex-col bg-[rgb(var(--background-secondary))] border-[rgb(var(--border-primary)/0.35)]"
      style={{ padding: 18 }}
    >
      <h3 className="text-sm font-medium mb-3 text-[rgb(var(--text-secondary))]">
        {t("overview.recent.invoices")}
      </h3>

      {isLoading ? (
        <FeedSkeleton />
      ) : top5.length === 0 ? (
        <p className="text-xs py-4 text-[rgb(var(--text-tertiary))]">
          {t("overview.recent.noInvoices")}
        </p>
      ) : (
        <div className="space-y-1">
          {top5.map((invoice) => {
            const statusColor = STATUS_COLORS[invoice.status] || "#888780";
            return (
              <div
                key={invoice.id}
                className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors"
                style={{ cursor: "default" }}
              >
                {/* Status bar */}
                <div
                  // allow-presentation-style: per-invoice-status color bar
                  className="w-1 h-7 rounded-sm flex-shrink-0"
                  style={{ background: statusColor }}
                />

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium truncate text-[rgb(var(--text-secondary))]">
                      {invoice.invoiceNumber}
                    </span>
                    <span
                      // allow-presentation-style: per-invoice-status chip tint + color
                      className="text-xs font-medium px-1.5 py-0.5 rounded-full flex-shrink-0"
                      style={{
                        background: `${statusColor}18`,
                        color: statusColor,
                      }}
                    >
                      {statusLabel(invoice.status)}
                    </span>
                  </div>
                  <div className="text-xs truncate text-[rgb(var(--text-disabled))]">
                    {invoice.studentName || t("overview.recent.unknown")} ·{" "}
                    {formatRelativeDate(invoice.createdAt, {
                      locale: i18n.language,
                      today: t("overview.recent.today"),
                      yesterday: t("overview.recent.yesterday"),
                      daysAgo: (days) =>
                        t("overview.recent.daysAgo", { count: days }),
                    })}
                  </div>
                </div>

                {/* Amount */}
                <div className="text-right flex-shrink-0">
                  <div className="text-xs font-semibold text-[rgb(var(--text-secondary))]">
                    {format(invoice.grandTotal, { decimals: 0 })}
                  </div>
                  {invoice.amountDue > 0 && invoice.status !== "paid" && (
                    <div className="text-xs text-[rgb(var(--state-danger-fg))]">
                      {format(invoice.amountDue, { decimals: 0 })}{" "}
                      {t("overview.recent.due")}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
