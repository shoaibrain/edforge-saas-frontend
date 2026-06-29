/**
 * useCurrency — convenience hook that pre-binds resolved settings to formatCurrency.
 *
 * Reduces boilerplate: `format(150000)` instead of `formatCurrency(150000, "NPR", { ... })`.
 */

import { useMemo } from "react";
import { formatCurrency } from "@aibrains/shared-types/utils/currency";
import type { ResolvedSettings } from "@edforge/config/resolved-settings";

export interface UseCurrencyOptions {
  /**
   * Active platform UI language, not tenant regional defaultLocale.
   * Pass i18n.language from translated UI surfaces that should use Nepali
   * digits/symbols when the operator explicitly selects Nepali.
   */
  platformLanguage?: unknown;
}

export function normalizeCurrencyLocale(
  platformLanguage: unknown,
): "ne" | undefined {
  if (typeof platformLanguage !== "string") return undefined;
  const normalized = platformLanguage.trim().replace("_", "-").toLowerCase();
  return normalized === "ne" || normalized.startsWith("ne-")
    ? "ne"
    : undefined;
}

export function useCurrency(
  settings: ResolvedSettings,
  options: UseCurrencyOptions = {},
) {
  const currencyLocale = normalizeCurrencyLocale(options.platformLanguage);

  return useMemo(
    () => ({
      /** Full format: "NPR 1,50,000.00" or "रू १,५०,०००.००" */
      format: (amount: number, opts?: { decimals?: number }) =>
        formatCurrency(amount, settings.currency, {
          decimals: opts?.decimals ?? 2,
          locale: currencyLocale,
        }),

      /** Compact format: "NPR 4.9L", "$150K", or "रू 4.9L" */
      formatCompact: (amount: number) =>
        formatCurrency(amount, settings.currency, {
          compact: true,
          locale: currencyLocale,
        }),

      /** Short format: "NPR 1.5 lakh", "$150,000", or "रू 1.5 lakh" */
      formatShort: (amount: number) =>
        formatCurrency(amount, settings.currency, {
          short: true,
          locale: currencyLocale,
        }),
    }),
    [currencyLocale, settings.currency],
  );
}
