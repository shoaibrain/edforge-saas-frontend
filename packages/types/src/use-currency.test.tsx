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
  it("normalizes active Nepali platform language to the shared formatter locale", () => {
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
  it("keeps the existing English-style NPR format by default", () => {
    const { result } = renderHook(() => useCurrency(baseSettings));

    expect(result.current.format(12500)).toBe("NPR 12,500.00");
  });

  it("does not infer platform language from tenant regional locale", () => {
    const { result } = renderHook(() =>
      useCurrency({
        ...baseSettings,
        locale: "ne-NP",
      }),
    );

    expect(result.current.format(12500)).toBe("NPR 12,500.00");
  });

  it("uses native Nepali symbol and digits when active platform language is Nepali", () => {
    const { result } = renderHook(() =>
      useCurrency(baseSettings, { platformLanguage: "ne" }),
    );

    expect(result.current.format(12500)).toBe("रू १२,५००.००");
  });

  it("keeps English-style formatting when active platform language is English", () => {
    const { result } = renderHook(() =>
      useCurrency(
        {
          ...baseSettings,
          locale: "ne-NP",
        },
        { platformLanguage: "en" },
      ),
    );

    expect(result.current.format(12500)).toBe("NPR 12,500.00");
  });
});
