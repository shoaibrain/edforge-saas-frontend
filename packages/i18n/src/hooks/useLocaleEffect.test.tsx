import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { i18n, initI18n } from "../config";
import { useLocaleEffect } from "./useLocaleEffect";

const DEVANAGARI_FONT_ID = "edforge-devanagari-font";

describe("useLocaleEffect", () => {
  beforeAll(() => {
    initI18n();
  });

  afterEach(async () => {
    cleanup();
    document.getElementById(DEVANAGARI_FONT_ID)?.remove();
    await i18n.changeLanguage("en");
    document.documentElement.lang = "";
  });

  it("loads the Devanagari font for Hindi", async () => {
    await i18n.changeLanguage("hi");

    renderHook(() => useLocaleEffect());

    await waitFor(() => {
      expect(document.documentElement.lang).toBe("hi");
      expect(document.getElementById(DEVANAGARI_FONT_ID)).toBeTruthy();
    });
  });

  it("loads the Devanagari font for regional Hindi locales", async () => {
    await i18n.changeLanguage("hi-IN");

    renderHook(() => useLocaleEffect());

    await waitFor(() => {
      expect(document.documentElement.lang).toBe("hi");
      expect(document.getElementById(DEVANAGARI_FONT_ID)).toBeTruthy();
    });
  });

  it("removes the Devanagari font for English", async () => {
    document.head.appendChild(
      Object.assign(document.createElement("link"), {
        id: DEVANAGARI_FONT_ID,
        rel: "stylesheet",
      }),
    );
    await i18n.changeLanguage("en");

    renderHook(() => useLocaleEffect());

    await waitFor(() => {
      expect(document.documentElement.lang).toBe("en");
      expect(document.getElementById(DEVANAGARI_FONT_ID)).toBeNull();
    });
  });
});
