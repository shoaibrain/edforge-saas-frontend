import { describe, expect, it } from "vitest";
import {
  getLanguageDirection,
  normalizeLocaleCode,
  normalizePlatformLanguage,
  toPlatformLanguage,
} from "./language";

describe("platform language normalization", () => {
  it("normalizes supported language codes", () => {
    expect(toPlatformLanguage("en")).toBe("en");
    expect(toPlatformLanguage("ne")).toBe("ne");
    expect(toPlatformLanguage("hi")).toBe("hi");
    expect(toPlatformLanguage("ar")).toBe("ar");
  });

  it("normalizes regional and underscored locale codes to platform languages", () => {
    expect(toPlatformLanguage("en-US")).toBe("en");
    expect(toPlatformLanguage("en_GB")).toBe("en");
    expect(toPlatformLanguage("ne-NP")).toBe("ne");
    expect(toPlatformLanguage("NE_np")).toBe("ne");
    expect(toPlatformLanguage("hi-IN")).toBe("hi");
    expect(toPlatformLanguage("HI_in")).toBe("hi");
    expect(toPlatformLanguage("ar-AE")).toBe("ar");
    expect(toPlatformLanguage("AR_eg")).toBe("ar");
  });

  it("uses the first supported language candidate from arrays", () => {
    expect(toPlatformLanguage(["fr-FR", "ne-NP", "en-US"])).toBe("ne");
    expect(toPlatformLanguage(["fr-FR", "hi-IN", "en-US"])).toBe("hi");
    expect(toPlatformLanguage(["fr-FR", "ar-AE", "en-US"])).toBe("ar");
    expect(toPlatformLanguage([null, "", "en-US"])).toBe("en");
  });

  it("returns null for unsupported values", () => {
    expect(toPlatformLanguage("fr-FR")).toBeNull();
    expect(toPlatformLanguage("")).toBeNull();
    expect(toPlatformLanguage(null)).toBeNull();
  });

  it("falls back when no platform language can be resolved", () => {
    expect(normalizePlatformLanguage("fr-FR")).toBe("en");
    expect(normalizePlatformLanguage("fr-FR", "ne")).toBe("ne");
  });

  it("returns default regional locale codes for supported platform languages", () => {
    expect(normalizeLocaleCode("en")).toBe("en-US");
    expect(normalizeLocaleCode("en-GB")).toBe("en-US");
    expect(normalizeLocaleCode("ne")).toBe("ne-NP");
    expect(normalizeLocaleCode("ne-NP")).toBe("ne-NP");
    expect(normalizeLocaleCode("hi")).toBe("hi-IN");
    expect(normalizeLocaleCode("hi-IN")).toBe("hi-IN");
    expect(normalizeLocaleCode("ar")).toBe("ar-AE");
    expect(normalizeLocaleCode("ar-EG")).toBe("ar-AE");
  });

  it("resolves layout direction for supported platform languages", () => {
    expect(getLanguageDirection("en")).toBe("ltr");
    expect(getLanguageDirection("ne-NP")).toBe("ltr");
    expect(getLanguageDirection("hi-IN")).toBe("ltr");
    expect(getLanguageDirection("ar-AE")).toBe("rtl");
    expect(getLanguageDirection("fr-FR")).toBe("ltr");
  });
});
