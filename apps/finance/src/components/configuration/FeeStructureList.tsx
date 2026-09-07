/**
 * FeeStructureList
 *
 * Admin table of configured fee structures with edit/delete actions.
 * Uses TanstackDataTable from @edforge/ui for pagination and sorting.
 */

import type { FeeStructure } from "@edforge/types";
import { formatGradeLabel, gradeSort } from "@edforge/types";
import { useCurrency } from "@edforge/types/use-currency";
import { useTranslation } from "@edforge/i18n";
import { useFinanceSettings } from "../../layouts/FinanceLayout";
import {
  TanstackDataTable,
  createActionsColumn,
  type ColumnDef,
} from "@edforge/ui";
import { Pencil, Trash2, Layers } from "lucide-react";
import { AnimatedIcon } from "@edforge/ui/motion";
import { useMemo, type ComponentProps } from "react";
import { FeeTypeChip } from "../shared";

interface FeeStructureListProps {
  feeStructures: FeeStructure[];
  isLoading?: boolean;
  onEdit: (fee: FeeStructure) => void;
  onDelete: (fee: FeeStructure) => void;
  /**
   * Issue #357 — supplied by the page from the cursor hook. Optional so the
   * component still renders standalone in tests and stories.
   */
  serverPagination?: ComponentProps<typeof TanstackDataTable>["serverPagination"];
  isFetching?: boolean;
}

export function FeeStructureList({
  feeStructures,
  isLoading,
  onEdit,
  onDelete,
  serverPagination,
  isFetching,
}: FeeStructureListProps) {
  const settings = useFinanceSettings();
  const { t, i18n } = useTranslation("payments");
  const { formatCompact } = useCurrency(settings, {
    platformLanguage: i18n.language,
  });
  const safeList = Array.isArray(feeStructures) ? feeStructures : [];
  const frequencyLabel = (frequency: string) =>
    t(`feeStructure.frequencies.${frequency}`, { defaultValue: frequency });

  const columns = useMemo<ColumnDef<FeeStructure, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: t("feeStructure.name"),
        cell: ({ row }) => {
          const fee = row.original;
          return (
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 inline-block ${fee.isActive !== false ? "bg-[rgb(var(--accent-enrollment))]" : "bg-[rgb(var(--text-disabled))]"}`}
                />
                <span className="text-xs font-medium text-[rgb(var(--text-primary))]">
                  {fee.name}
                </span>
              </div>
              <span className="text-3xs text-[rgb(var(--text-tertiary))]">
                {fee.description}
                {fee.autoApplyOnEnrollment && (
                  <>
                    {" "}
                    ·{" "}
                    <span className="text-[rgb(var(--accent-enrollment-text))]">
                      {t("feeStructure.autoApplyOnEnrollment")}
                    </span>
                  </>
                )}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "feeType",
        header: t("feeStructure.type"),
        cell: ({ row }) => <FeeTypeChip type={row.original.feeType} />,
      },
      {
        accessorKey: "amount",
        header: t("feeStructure.amount"),
        meta: { align: "right" as const },
        cell: ({ row }) => {
          const fee = row.original;
          return (
            <div className="text-right flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-[rgb(var(--text-primary))] tabular-nums">
                {formatCompact(fee.amount)}
              </span>
              <span className="text-4xs text-[rgb(var(--text-disabled))]">
                {settings.currency} ·{" "}
                {fee.frequency
                  ? frequencyLabel(fee.frequency).toLowerCase()
                  : ""}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "frequency",
        header: t("feeStructure.frequency"),
        cell: ({ row }) => (
          <span className="text-[rgb(var(--text-secondary))]">
            {frequencyLabel(row.original.frequency)}
          </span>
        ),
      },
      {
        accessorKey: "gradeLevels",
        header: t("feeStructure.gradeLevels"),
        enableSorting: false,
        cell: ({ row }) => {
          const gradeLevels = row.original.gradeLevels ?? [];
          if (gradeLevels.length === 0) {
            return (
              <div className="flex flex-wrap gap-1">
                <span className="text-3xs font-medium py-px px-1.5 rounded-[5px] border bg-[rgb(var(--accent-enrollment)/0.08)] text-[rgb(var(--accent-enrollment-text))] border-[rgb(var(--accent-enrollment)/0.15)]">
                  {t("feeStructure.allGrades")}
                </span>
              </div>
            );
          }
          return (
            <div className="flex flex-wrap gap-1">
              {[...gradeLevels].sort(gradeSort).map((g) => (
                <span
                  key={g}
                  className="text-3xs font-medium py-px px-1.5 rounded-[5px] border bg-[rgb(var(--accent-academics)/0.08)] text-[rgb(var(--accent-academics-text))] border-[rgb(var(--accent-academics)/0.15)]"
                >
                  {formatGradeLabel(g)}
                </span>
              ))}
            </div>
          );
        },
      },
      createActionsColumn<FeeStructure>({
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onEdit(row.original)}
              className="ef-motion p-1.5 rounded-lg hover:bg-[rgb(var(--background-tertiary))] transition-colors"
              aria-label={t("feeStructure.editAria")}
            >
              <AnimatedIcon name="edit" icon={Pencil} size={14} applyAccent={false} className="text-[rgb(var(--text-tertiary))]" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(row.original)}
              className="ef-motion p-1.5 rounded-lg hover:bg-[rgb(var(--state-danger-bg)/0.18)] transition-colors"
              aria-label={t("feeStructure.deleteAria")}
            >
              <AnimatedIcon name="remove" icon={Trash2} size={14} applyAccent={false} className="text-[rgb(var(--state-danger-fg))]" />
            </button>
          </div>
        ),
      }),
    ],
    [formatCompact, frequencyLabel, onDelete, onEdit, settings.currency, t],
  );

  return (
    <TanstackDataTable<FeeStructure>
      columns={columns}
      data={safeList}
      isLoading={isLoading}
      isFetching={isFetching}
      serverPagination={serverPagination}
      tableId="finance.fee-structures"
      enableSorting={true}
      pagination={{ pageSize: 10 }}
      maxHeight="calc(100vh - 24rem)"
      emptyState={{
        icon: <Layers className="w-10 h-10" />,
        title: t("feeStructure.noFeeStructures"),
        description: t("feeStructure.noFeeStructuresDescription"),
      }}
      className="min-h-96"
    />
  );
}
