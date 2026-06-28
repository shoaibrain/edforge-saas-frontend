import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ResolvedSettings } from "@edforge/config/resolved-settings";
import { normalizeCurrencyLocale, useCurrency } from "./use-currency";

const baseSettings: ResolvedSettings = {
  currency: "NPR",
  timezone: "Asia/Kathmandu",
  dateFormat: "YYYY-MM-DD",
  timeFormat: "12h",
  calendarSystem: "bikram_sambat",
  enableDualDateDisplay: true,
  numberFormat: "south_asian",
  locale: "en-US",
  weekStartsOn: "sunday",
};

describe("normalizeCurrencyLocale", () => {
  it("normalizes Nepali regional locales to the shared formatter locale", () => {
    expect(normalizeCurrencyLocale("ne")).toBe("ne");
    expect(normalizeCurrencyLocale("ne-NP")).toBe("ne");
    expect(normalizeCurrencyLocale("NE_np")).toBe("ne");
  });

  it("does not force non-Nepali locales into the shared formatter", () => {
    expect(normalizeCurrencyLocale("en-US")).toBeUndefined();
    expect(normalizeCurrencyLocale("")).toBeUndefined();
  });
});

describe("useCurrency", () => {
  it("keeps the existing English-style NPR format for English locale settings", () => {
    const { result } = renderHook(() => useCurrency(baseSettings));

    expect(result.current.format(12500)).toBe("NPR 12,500.00");
  });

  it("uses native Nepali symbol and digits for Nepali locale settings", () => {
    const { result } = renderHook(() =>
      useCurrency({
        ...baseSettings,
        locale: "ne-NP",
      }),
    );

    expect(result.current.format(12500)).toBe("रू १२,५००.००");
  });
});
