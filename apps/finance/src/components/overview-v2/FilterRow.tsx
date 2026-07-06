/**
 * FilterRow — V2 Finance Filters & Export
 *
 * Quick-select time pills, date range inputs, academic year dropdown, and CSV export.
 * V2 styled with token-based styling.
 */

import { useMemo } from "react";
import { Loader2, Download, X } from "lucide-react";
import { Select } from "@edforge/ui";
import { useTranslation } from "@edforge/i18n";

interface FilterRowProps {
  fromDate: string;
  toDate: string;
  academicYear: string;
  academicYears: string[];
  hasActiveFilters: boolean;
  isExporting: boolean;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  onAcademicYearChange: (v: string) => void;
  onClear: () => void;
  onExport: () => void;
}

type QuickRange = "today" | "week" | "month" | "year";

function getQuickRange(range: QuickRange): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().slice(0, 10);

  switch (range) {
    case "today":
      return { from: to, to };
    case "week": {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 6);
      return { from: weekAgo.toISOString().slice(0, 10), to };
    }
    case "month": {
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: firstOfMonth.toISOString().slice(0, 10), to };
    }
    case "year": {
      const firstOfYear = new Date(now.getFullYear(), 0, 1);
      return { from: firstOfYear.toISOString().slice(0, 10), to };
    }
  }
}

const QUICK_OPTIONS: { key: QuickRange; labelKey: string }[] = [
  { key: "today", labelKey: "overview.filters.today" },
  { key: "week", labelKey: "overview.filters.week" },
  { key: "month", labelKey: "overview.filters.month" },
  { key: "year", labelKey: "overview.filters.year" },
];

export function FilterRow({
  fromDate,
  toDate,
  academicYear,
  academicYears,
  hasActiveFilters,
  isExporting,
  onFromChange,
  onToChange,
  onAcademicYearChange,
  onClear,
  onExport,
}: FilterRowProps) {
  const { t } = useTranslation("payments");
  const inputStyle = {
    background: "rgb(var(--background-secondary))",
    borderColor: "rgb(var(--border-primary) / 0.35)",
    color: "rgb(var(--text-secondary))",
  };

  // Detect which quick-select pill is active (if any)
  const activeQuick = useMemo<QuickRange | null>(() => {
    if (!fromDate || !toDate) return null;
    for (const opt of QUICK_OPTIONS) {
      const range = getQuickRange(opt.key);
      if (range.from === fromDate && range.to === toDate) return opt.key;
    }
    return null;
  }, [fromDate, toDate]);

  function handleQuickSelect(key: QuickRange) {
    if (activeQuick === key) {
      // Toggle off
      onFromChange("");
      onToChange("");
      return;
    }
    const range = getQuickRange(key);
    onFromChange(range.from);
    onToChange(range.to);
  }

  return (
    <div className="space-y-2">
      {/* Quick-select pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {QUICK_OPTIONS.map((opt) => {
          const isActive = activeQuick === opt.key;
          return (
            <button
              key={opt.key}
              onClick={() => handleQuickSelect(opt.key)}
              className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.30)] ${
                isActive
                  ? "bg-[rgb(var(--action-primary-bg))] border-[rgb(var(--action-primary-bg))] text-[rgb(var(--text-on-accent))]"
                  : "bg-transparent border-[rgb(var(--border-primary)/0.35)] text-[rgb(var(--text-tertiary))]"
              }`}
            >
              {t(opt.labelKey)}
            </button>
          );
        })}

        <span className="text-xs mx-1 text-[rgb(var(--text-disabled))]">
          {t("overview.filters.or")}
        </span>

        {/* Date inputs */}
        <input
          type="date"
          value={fromDate}
          onChange={(e) => onFromChange(e.target.value)}
          aria-label={t("overview.filters.fromDate")}
          className="px-2 py-1 text-xs border rounded-[7px] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.30)]"
          style={inputStyle}
        />
        <span className="text-xs text-[rgb(var(--text-disabled))]">→</span>
        <input
          type="date"
          value={toDate}
          onChange={(e) => onToChange(e.target.value)}
          aria-label={t("overview.filters.toDate")}
          className="px-2 py-1 text-xs border rounded-[7px] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.30)]"
          style={inputStyle}
        />

        {academicYears.length > 0 && (
          <Select
            size="sm"
            className="w-32"
            value={academicYear}
            onChange={(v) => onAcademicYearChange(v ?? "")}
            options={[
              { value: "", label: t("overview.filters.allYears") },
              ...academicYears.map((year) => ({ value: year, label: year })),
            ]}
          />
        )}

        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full transition-colors hover:opacity-80 text-[rgb(var(--accent-enrollment-text))]"
          >
            <X className="w-3 h-3" />
            {t("overview.filters.clear")}
          </button>
        )}

        <div className="ms-auto">
          <button
            onClick={onExport}
            disabled={isExporting}
            aria-label={t("overview.filters.exportCsvAria")}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-[7px] border transition-colors hover:opacity-80 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.30)] bg-[rgb(var(--background-tertiary))] border-[rgb(var(--border-primary)/0.35)] text-[rgb(var(--text-secondary))]"
          >
            {isExporting ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Download className="w-3 h-3" />
            )}
            {t("overview.filters.exportCsv")}
          </button>
        </div>
      </div>
    </div>
  );
}
