import { describe, expect, it } from "vitest";
import {
  normalizeLocaleCode,
  normalizePlatformLanguage,
  toPlatformLanguage,
} from "./language";

describe("platform language normalization", () => {
  it("normalizes supported language codes", () => {
    expect(toPlatformLanguage("en")).toBe("en");
    expect(toPlatformLanguage("ne")).toBe("ne");
  });

  it("normalizes regional and underscored locale codes to platform languages", () => {
    expect(toPlatformLanguage("en-US")).toBe("en");
    expect(toPlatformLanguage("en_GB")).toBe("en");
    expect(toPlatformLanguage("ne-NP")).toBe("ne");
    expect(toPlatformLanguage("NE_np")).toBe("ne");
  });

  it("uses the first supported language candidate from arrays", () => {
    expect(toPlatformLanguage(["fr-FR", "ne-NP", "en-US"])).toBe("ne");
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
  });
});
