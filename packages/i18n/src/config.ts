/**
 * i18next Configuration
 *
 * Initializes the i18n instance for the EdForge platform.
 * Supports English (en), Nepali (ne), Hindi (hi), and Arabic (ar) with browser language detection.
 *
 * All micro-frontends share a single i18next instance via Module Federation
 * singleton config, so language changes propagate globally.
 */

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// English translations
import enCommon from "./locales/en/common.json";
import enAuth from "./locales/en/auth.json";
import enNav from "./locales/en/nav.json";
import enSettings from "./locales/en/settings.json";
import enDashboard from "./locales/en/dashboard.json";
import enErrors from "./locales/en/errors.json";
import enAcademics from "./locales/en/academics.json";
import enPeople from "./locales/en/people.json";
import enPayments from "./locales/en/payments.json";
import enPortal from "./locales/en/portal.json";
import enBranding from "./locales/en/branding.json";
import enIdentifiers from "./locales/en/identifiers.json";

// Nepali translations
import neCommon from "./locales/ne/common.json";
import neAuth from "./locales/ne/auth.json";
import neNav from "./locales/ne/nav.json";
import neSettings from "./locales/ne/settings.json";
import neDashboard from "./locales/ne/dashboard.json";
import neErrors from "./locales/ne/errors.json";
import neAcademics from "./locales/ne/academics.json";
import nePeople from "./locales/ne/people.json";
import nePayments from "./locales/ne/payments.json";
import nePortal from "./locales/ne/portal.json";
import neBranding from "./locales/ne/branding.json";
import neIdentifiers from "./locales/ne/identifiers.json";

// Hindi translations
import hiCommon from "./locales/hi/common.json";
import hiAuth from "./locales/hi/auth.json";
import hiNav from "./locales/hi/nav.json";
import hiSettings from "./locales/hi/settings.json";
import hiDashboard from "./locales/hi/dashboard.json";
import hiErrors from "./locales/hi/errors.json";
import hiAcademics from "./locales/hi/academics.json";
import hiPeople from "./locales/hi/people.json";
import hiPayments from "./locales/hi/payments.json";
import hiPortal from "./locales/hi/portal.json";
import hiBranding from "./locales/hi/branding.json";
import hiIdentifiers from "./locales/hi/identifiers.json";

// Arabic translations
import arCommon from "./locales/ar/common.json";
import arAuth from "./locales/ar/auth.json";
import arNav from "./locales/ar/nav.json";
import arSettings from "./locales/ar/settings.json";
import arDashboard from "./locales/ar/dashboard.json";
import arErrors from "./locales/ar/errors.json";
import arAcademics from "./locales/ar/academics.json";
import arPeople from "./locales/ar/people.json";
import arPayments from "./locales/ar/payments.json";
import arPortal from "./locales/ar/portal.json";
import arBranding from "./locales/ar/branding.json";
import arIdentifiers from "./locales/ar/identifiers.json";

export const SUPPORTED_LANGUAGES = ["en", "ne", "hi", "ar"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  en: "English",
  ne: "नेपाली",
  hi: "हिन्दी",
  ar: "العربية",
};

export const NAMESPACES = [
  "common",
  "auth",
  "nav",
  "settings",
  "dashboard",
  "errors",
  "academics",
  "people",
  "payments",
  "portal",
  "branding",
  "identifiers",
] as const;
export type Namespace = (typeof NAMESPACES)[number];

export const I18N_RESOURCES = {
  en: {
    common: enCommon,
    auth: enAuth,
    nav: enNav,
    settings: enSettings,
    dashboard: enDashboard,
    errors: enErrors,
    academics: enAcademics,
    people: enPeople,
    payments: enPayments,
    portal: enPortal,
    branding: enBranding,
    identifiers: enIdentifiers,
  },
  ne: {
    common: neCommon,
    auth: neAuth,
    nav: neNav,
    settings: neSettings,
    dashboard: neDashboard,
    errors: neErrors,
    academics: neAcademics,
    people: nePeople,
    payments: nePayments,
    portal: nePortal,
    branding: neBranding,
    identifiers: neIdentifiers,
  },
  hi: {
    common: hiCommon,
    auth: hiAuth,
    nav: hiNav,
    settings: hiSettings,
    dashboard: hiDashboard,
    errors: hiErrors,
    academics: hiAcademics,
    people: hiPeople,
    payments: hiPayments,
    portal: hiPortal,
    branding: hiBranding,
    identifiers: hiIdentifiers,
  },
  ar: {
    common: arCommon,
    auth: arAuth,
    nav: arNav,
    settings: arSettings,
    dashboard: arDashboard,
    errors: arErrors,
    academics: arAcademics,
    people: arPeople,
    payments: arPayments,
    portal: arPortal,
    branding: arBranding,
    identifiers: arIdentifiers,
  },
} as const;

const resources = I18N_RESOURCES;

/**
 * `isolate` interpolation format — bidi-isolates an interpolated value so LTR
 * "islands" (numbers, codes, dates, currency, ranges) don't reorder inside RTL
 * (Arabic) content. Opt in per placeholder: `"{{amount, isolate}}"`.
 *
 * Wraps the value in Unicode First-Strong-Isolate (U+2068) … Pop-Directional-
 * Isolate (U+2069) for RTL languages only, so it is a no-op for en/ne/hi and
 * always safe to annotate a placeholder with it. RTL is derived from the base
 * language code to keep this file free of a circular import on ./language.
 */
const FIRST_STRONG_ISOLATE = "⁨";
const POP_DIRECTIONAL_ISOLATE = "⁩";
const RTL_LANGUAGE_CODES = new Set(["ar"]);

export function isolateInterpolation(
  value: unknown,
  format?: string,
  lng?: string,
): string {
  const text = value == null ? "" : String(value);
  if (format !== "isolate") return text;
  const baseLanguage = (lng ?? "").split("-")[0];
  if (!RTL_LANGUAGE_CODES.has(baseLanguage)) return text;
  return `${FIRST_STRONG_ISOLATE}${text}${POP_DIRECTIONAL_ISOLATE}`;
}

/**
 * Initialize the i18next instance.
 * Safe to call multiple times — subsequent calls are no-ops if already initialized.
 */
export function initI18n() {
  if (i18n.isInitialized) return i18n;

  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: "en",
      supportedLngs: SUPPORTED_LANGUAGES as unknown as string[],
      defaultNS: "common",
      ns: NAMESPACES as unknown as string[],
      interpolation: {
        escapeValue: false, // React already handles XSS
        format: isolateInterpolation,
      },
      detection: {
        order: ["localStorage", "navigator"],
        lookupLocalStorage: "edforge-language",
        caches: ["localStorage"],
      },
      react: {
        useSuspense: false, // We handle loading states manually
      },
    });

  return i18n;
}

export { i18n };
