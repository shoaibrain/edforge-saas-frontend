/**
 * Fee Structures Configuration Page
 *
 * Admin page for configuring fee types and amounts.
 * Route: /finance/configuration/fee-structures
 *
 * Production fixes:
 *  - Fetches academic years from identity service for academicYearId
 *  - Fetches school gradeRange for dynamic grade level chips
 *  - Improved error handling with specific error messages in toasts
 */

import { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import type { FeeStructure } from "@edforge/types";
import { useCurrency } from "@edforge/types/use-currency";
import { useTranslation } from "@edforge/i18n";
import { useFinanceSettings } from "../../layouts/FinanceLayout";
import { apiGet } from "@edforge/api-client";
import type { AxiosError } from "@edforge/api-client";
import {
  GRADE_LEVEL_OPTIONS,
  getGradeLevelsInRange,
  type GradeLevel,
} from "@aibrains/shared-types";
import { Button, PageHeader, StatBand, type StatMetric } from "@edforge/ui";
import { Plus, AlertTriangle } from "lucide-react";
import { useAppStore } from "../../stores/app.store";
import {
  useFeeStructures,
  useCreateFeeStructure,
  useUpdateFeeStructure,
  useDeleteFeeStructure,
} from "@edforge/finance-services";
import { FeeStructureList } from "../../components/configuration/FeeStructureList";
import { FeeStructureForm } from "../../components/configuration/FeeStructureForm";
import type {
  FeeStructureFormData,
  AcademicYearOption,
} from "../../components/configuration/FeeStructureForm";
import {
  FinanceInfoBanner,
  FinanceFilterChips,
} from "../../components/shared";

/* ------------------------------------------------------------------ */
/*  API response types                                                 */
/* ------------------------------------------------------------------ */

interface AcademicYearApiItem {
  yearId?: string;
  academicYearId?: string;
  id?: string;
  name: string;
  status: string;
  isCurrent?: boolean;
}

interface SchoolApiResponse {
  gradeRange?: { start: string; end: string };
  /**
   * P1: school's chosen subset of the global grade-level catalog. Preferred
   * over `gradeRange` for picking which grade codes a fee structure can be
   * assigned to. Falls back to `gradeRange`-derived options for legacy rows.
   */
  enabledGradeLevels?: string[];
  [key: string]: unknown;
}

/* ------------------------------------------------------------------ */
/*  Constants & Helpers                                                */
/* ------------------------------------------------------------------ */

function extractApiErrorMessage(error: unknown): string | null {
  const axiosErr = error as AxiosError<{
    message?: string;
    errors?: Array<{ message?: string }>;
  }>;
  const data = axiosErr?.response?.data;
  if (!data) return null;
  if (data.message) return data.message;
  if (data.errors?.length) {
    return data.errors
      .map((e) => e.message)
      .filter(Boolean)
      .join("; ");
  }
  return null;
}

/**
 * Derive the array of grade codes a fee structure can be assigned to for
 * this school. Mirrors the academics-app `useSchoolEnabledGradeOptions`
 * resolution order:
 *   1. Non-empty `enabledGradeLevels` → use it (filtered to known catalog
 *      codes, in canonical order)
 *   2. Else `gradeRange` → derive via shared-types' `getGradeLevelsInRange`
 *   3. Else → full 20-code catalog
 */
function deriveSchoolGradeCodes(
  school: SchoolApiResponse | undefined,
): string[] {
  const enabled = school?.enabledGradeLevels;
  if (Array.isArray(enabled) && enabled.length > 0) {
    const enabledSet = new Set<string>(enabled.map(String));
    const filtered = GRADE_LEVEL_OPTIONS.map((o) => o.value).filter((v) =>
      enabledSet.has(v),
    );
    if (filtered.length > 0) return filtered;
  }
  const range = school?.gradeRange;
  if (range) {
    try {
      const codes = getGradeLevelsInRange(
        range.start as GradeLevel,
        range.end as GradeLevel,
      );
      if (codes.length > 0) return [...codes];
    } catch {
      // fall through
    }
  }
  return GRADE_LEVEL_OPTIONS.map((o) => o.value);
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function FeeStructuresPage() {
  const schoolId = useAppStore((s) => s.activeSchoolId);
  const settings = useFinanceSettings();
  const { t, i18n } = useTranslation("payments");
  const { formatCompact } = useCurrency(settings, {
    platformLanguage: i18n.language,
  });

  const [showForm, setShowForm] = useState(false);
  const [editingFee, setEditingFee] = useState<FeeStructure | null>(null);
  const [deletingFee, setDeletingFee] = useState<FeeStructure | null>(null);
  const [activeFilter, setActiveFilter] = useState<"" | "active" | "inactive">(
    "",
  );

  const {
    data: feeStructures,
    isLoading,
    isError,
  } = useFeeStructures(schoolId ?? "");
  const createMutation = useCreateFeeStructure(schoolId ?? "");
  const updateMutation = useUpdateFeeStructure(schoolId ?? "");
  const deleteMutation = useDeleteFeeStructure(schoolId ?? "");

  const filteredFeeStructures = useMemo(() => {
    const list = feeStructures ?? [];
    if (activeFilter === "active")
      return list.filter((f) => f.isActive !== false);
    if (activeFilter === "inactive")
      return list.filter((f) => f.isActive === false);
    return list;
  }, [feeStructures, activeFilter]);

  const kpi = useMemo(() => {
    const list = feeStructures ?? [];
    const totalStructures = list.length;
    const autoApplyCount = list.filter((f) => f.autoApplyOnEnrollment).length;
    const feeTypes = new Set(list.map((f) => f.feeType)).size;
    const maxFee = list.reduce((max, f) => Math.max(max, f.amount || 0), 0);
    return { totalStructures, autoApplyCount, feeTypes, maxFee };
  }, [feeStructures]);

  // Fetch academic years for the school
  const { data: academicYearsRaw } = useQuery({
    queryKey: ["academicYears", schoolId],
    queryFn: () =>
      apiGet<{ items: AcademicYearApiItem[] } | AcademicYearApiItem[]>(
        `/schools/${schoolId}/academic-years`,
      ),
    enabled: !!schoolId,
    staleTime: 10 * 60 * 1000,
  });

  const academicYears: AcademicYearOption[] = useMemo(() => {
    const items = Array.isArray(academicYearsRaw)
      ? academicYearsRaw
      : (academicYearsRaw?.items ?? []);
    return items.map((ay) => ({
      id: ay.yearId || ay.academicYearId || ay.id || "",
      name: ay.name,
      status: ay.status,
      isCurrent: ay.isCurrent,
    }));
  }, [academicYearsRaw]);

  // Fetch school details for grade range
  const { data: schoolData } = useQuery({
    queryKey: ["school", schoolId],
    queryFn: () => apiGet<SchoolApiResponse>(`/schools/${schoolId}`),
    enabled: !!schoolId,
    staleTime: 10 * 60 * 1000,
  });

  const gradeOptions = useMemo(
    () => deriveSchoolGradeCodes(schoolData),
    [schoolData],
  );

  /**
   * When editing, surface any codes the saved fee structure references that
   * aren't in the school's current `enabledGradeLevels` / `gradeRange` so the
   * operator can SEE them in the picker (and choose to drop them) rather
   * than have them silently disappear from the UI and get clobbered by the
   * "All Grades" toggle. Matches the academics `extraOpt` pattern in
   * EditStudentModal — see CLAUDE.md P3 architectural decision #2
   * ("permissive on out-of-range data").
   */
  const editGradeOptions = useMemo(() => {
    if (!editingFee?.gradeLevels?.length) return gradeOptions;
    const inDerived = new Set(gradeOptions);
    const extras = editingFee.gradeLevels.filter((g) => !inDerived.has(g));
    return extras.length > 0 ? [...gradeOptions, ...extras] : gradeOptions;
  }, [gradeOptions, editingFee]);

  // Resolve academic year name from ID
  const getAcademicYearName = (yearId: string): string => {
    const year = academicYears.find((y) => y.id === yearId);
    return year?.name ?? "";
  };

  const handleCreate = async (data: FeeStructureFormData) => {
    try {
      await createMutation.mutateAsync({
        name: data.name,
        description: data.description,
        feeType: data.feeType,
        amount: data.amount,
        currency: settings.currency,
        taxRate: data.taxRate || 0,
        taxType: data.taxType || "none",
        frequency: data.frequency,
        gradeLevels: data.gradeLevels ?? [],
        autoApplyOnEnrollment: data.autoApplyOnEnrollment,
        proRateOnMidTermEntry: data.proRateOnMidTermEntry,
        effectiveFrom: data.effectiveFrom,
        effectiveTo: data.effectiveTo || undefined,
        academicYear: getAcademicYearName(data.academicYearId),
        academicYearId: data.academicYearId,
      });
      toast.success(t("feeStructure.created"));
      setShowForm(false);
    } catch (error) {
      const msg = extractApiErrorMessage(error);
      toast.error(msg || t("feeStructure.createFailed"));
    }
  };

  const handleUpdate = async (data: FeeStructureFormData) => {
    if (!editingFee) return;
    try {
      await updateMutation.mutateAsync({
        id: editingFee.id,
        data: {
          name: data.name,
          description: data.description,
          amount: data.amount,
          taxRate: data.taxRate || 0,
          taxType: data.taxType || "none",
          frequency: data.frequency,
          gradeLevels: data.gradeLevels ?? [],
          effectiveFrom: data.effectiveFrom,
          effectiveTo: data.effectiveTo || undefined,
        },
      });
      toast.success(t("feeStructure.updated"));
      setEditingFee(null);
    } catch (error) {
      const msg = extractApiErrorMessage(error);
      toast.error(msg || t("feeStructure.updateFailed"));
    }
  };

  const handleDelete = async () => {
    if (!deletingFee) return;
    try {
      await deleteMutation.mutateAsync(deletingFee.id);
      toast.success(t("feeStructure.deleted"));
      setDeletingFee(null);
    } catch (error) {
      const msg = extractApiErrorMessage(error);
      toast.error(msg || t("feeStructure.deleteFailed"));
    }
  };

  if (!schoolId) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8 text-center text-[rgb(var(--text-tertiary))]">
        {t("feeStructure.selectSchool")}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-16">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-[rgb(var(--state-danger-fg))] opacity-60" />
          <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
            {t("feeStructure.loadFailed")}
          </p>
          <p className="text-xs text-[rgb(var(--text-tertiary))] mt-1">
            {t("feeStructure.connectionRetry")}
          </p>
        </div>
      </div>
    );
  }


  // ── StatBand metrics (calm) ──────────────────────────────────────────────
  const metrics: StatMetric[] = [
    {
      label: t("feeStructure.stats.totalStructures"),
      value: String(kpi.totalStructures),
      iconSignature: "finance",
      state: "normal",
      primary: true,
    },
    {
      label: t("feeStructure.stats.autoApply"),
      value: String(kpi.autoApplyCount),
      iconSignature: "overview",
      state: "normal",
    },
    {
      label: t("feeStructure.stats.feeTypes"),
      value: String(kpi.feeTypes),
      iconSignature: "finance_receipt",
      state: "normal",
    },
    {
      label: t("feeStructure.stats.maxFee"),
      value: formatCompact(kpi.maxFee),
      iconSignature: "fees",
      state: "normal",
    },
  ];

  return (
    <div className="p-6 space-y-5">
      {/* Screen-reader page heading (breadcrumb names the page visually) */}
      <h1 className="sr-only">{t("feeStructure.title")}</h1>

      {/* ---- Page header (pagebar) ---- */}
      <PageHeader
        mode="pagebar"
        actions={[
          {
            label: t("feeStructure.addFee"),
            icon: <Plus className="h-3.5 w-3.5" />,
            primary: true,
            onClick: () => setShowForm(true),
          },
        ]}
      />

      {/* Info Banner */}
      <FinanceInfoBanner
        variant="info"
        message={t("feeStructure.autoApplyBanner")}
      />

      {/* ---- StatBand — KPI summary ---- */}
      <StatBand metrics={metrics} ariaLabel={t("feeStructure.kpi.region")} />

      {/* Filter Chips */}
      <FinanceFilterChips
        options={[
          { label: t("feeStructure.filters.all"), value: "" },
          { label: t("feeStructure.filters.active"), value: "active" },
          { label: t("feeStructure.filters.inactive"), value: "inactive" },
        ]}
        value={activeFilter}
        onChange={(v) => setActiveFilter(v as "" | "active" | "inactive")}
        accentColor="#7F77DD"
      />

      {/* List */}
      <FeeStructureList
        feeStructures={filteredFeeStructures}
        isLoading={isLoading}
        onEdit={(fee) => setEditingFee(fee)}
        onDelete={(fee) => setDeletingFee(fee)}
      />

      {/* Create form modal */}
      {showForm && (
        <FeeStructureForm
          academicYears={academicYears}
          gradeOptions={gradeOptions}
          onSubmit={handleCreate}
          onClose={() => setShowForm(false)}
          isSubmitting={createMutation.isPending}
          currency={settings.currency}
          calendarSystem={settings.calendarSystem}
          enableDualDateDisplay={settings.enableDualDateDisplay}
        />
      )}

      {/* Edit form modal */}
      {editingFee && (
        <FeeStructureForm
          feeStructure={editingFee}
          academicYears={academicYears}
          gradeOptions={editGradeOptions}
          onSubmit={handleUpdate}
          onClose={() => setEditingFee(null)}
          isSubmitting={updateMutation.isPending}
          currency={settings.currency}
          calendarSystem={settings.calendarSystem}
          enableDualDateDisplay={settings.enableDualDateDisplay}
        />
      )}

      {/* Styled delete confirmation dialog */}
      {deletingFee && (
        <DeleteConfirmDialog
          feeName={deletingFee.name}
          isPending={deleteMutation.isPending}
          onConfirm={handleDelete}
          onCancel={() => setDeletingFee(null)}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Delete Confirm Dialog                                              */
/* ------------------------------------------------------------------ */

function DeleteConfirmDialog({
  feeName,
  isPending,
  onConfirm,
  onCancel,
}: {
  feeName: string;
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation("payments");

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPending) onCancel();
    },
    [onCancel, isPending],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isPending) onCancel();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgb(var(--background-overlay)/0.50)]"
      onClick={handleBackdropClick}
    >
      <div
        className="w-full max-w-sm mx-4 p-6 bg-[rgb(var(--background-primary))] rounded-2xl shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-fee-title"
      >
        {/* Warning icon */}
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-[rgb(var(--state-danger-bg)/0.18)]">
          <AlertTriangle className="w-6 h-6 text-[rgb(var(--state-danger-fg))] dark:text-[rgb(var(--state-danger-fg))]" />
        </div>

        <h3
          id="delete-fee-title"
          className="text-lg font-semibold text-[rgb(var(--text-primary))] text-center"
        >
          {t("feeStructure.deleteTitle")}
        </h3>

        <p className="text-sm text-[rgb(var(--text-tertiary))] mt-2 text-center">
          {t("feeStructure.deleteMessage", { feeName })}
        </p>

        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
            className="flex-1"
          >
            {t("actions.cancel")}
          </Button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 py-2 rounded-xl bg-[rgb(var(--action-danger-bg))] text-[rgb(var(--action-primary-fg))] text-sm font-semibold hover:brightness-95 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending
              ? t("feeStructure.deleting")
              : t("feeStructure.confirmDelete")}
          </button>
        </div>
      </div>
    </div>
  );
}
