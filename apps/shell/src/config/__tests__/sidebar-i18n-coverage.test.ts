import { describe, expect, it } from "vitest";
import enNav from "../../../../../packages/i18n/src/locales/en/nav.json";
import neNav from "../../../../../packages/i18n/src/locales/ne/nav.json";
import { SIDEBAR_MODULES } from "../sidebar-modules";

type NavMessages = Record<string, unknown>;

const CRITICAL_BREADCRUMB_SEGMENTS = [
  "finance",
  "invoices",
  "bulk-generate",
  "configuration",
  "fee-structures",
  "accounts",
  "payments",
  "record",
  "receipt",
  "payment-gateways",
  "security-policies",
  "auth-debug",
] as const;

function valueAt(messages: NavMessages, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object" || Array.isArray(current))
      return undefined;
    return (current as NavMessages)[key];
  }, messages);
}

function expectLocalizedString(
  messages: NavMessages,
  path: string,
  locale: "en" | "ne",
) {
  const value = valueAt(messages, path);

  expect(value, `${locale}/nav.json is missing ${path}`).toBeTruthy();
  expect(typeof value, `${locale}/nav.json ${path} must be a string`).toBe(
    "string",
  );
}

describe("sidebar i18n coverage", () => {
  it("has module labels for every configured sidebar module", () => {
    for (const moduleId of Object.keys(SIDEBAR_MODULES)) {
      expectLocalizedString(enNav, `module.${moduleId}`, "en");
      expectLocalizedString(neNav, `module.${moduleId}`, "ne");
    }
  });

  it("has group labels for every configured sidebar group id", () => {
    const groupIds = new Set(
      Object.values(SIDEBAR_MODULES).flatMap((moduleConfig) =>
        moduleConfig.groups.map((group) => group.id),
      ),
    );

    for (const groupId of groupIds) {
      expectLocalizedString(enNav, `group.${groupId}`, "en");
      expectLocalizedString(neNav, `group.${groupId}`, "ne");
    }
  });

  it("has item labels for every configured sidebar item id", () => {
    const itemIds = new Set(
      Object.values(SIDEBAR_MODULES).flatMap((moduleConfig) =>
        moduleConfig.groups.flatMap((group) =>
          group.items.map((item) => item.id),
        ),
      ),
    );

    for (const itemId of itemIds) {
      expectLocalizedString(enNav, `sidebar.${itemId}`, "en");
      expectLocalizedString(neNav, `sidebar.${itemId}`, "ne");
    }
  });
});

describe("breadcrumb i18n coverage", () => {
  it("has explicit keys for critical finance and settings route segments", () => {
    for (const segment of CRITICAL_BREADCRUMB_SEGMENTS) {
      expectLocalizedString(enNav, `breadcrumb.${segment}`, "en");
      expectLocalizedString(neNav, `breadcrumb.${segment}`, "ne");
    }
  });
});
