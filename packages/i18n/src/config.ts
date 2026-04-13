/**
 * i18next Configuration
 *
 * Initializes the i18n instance for the EdForge platform.
 * Supports English (en) and Nepali (ne) with browser language detection.
 *
 * All micro-frontends share a single i18next instance via Module Federation
 * singleton config, so language changes propagate globally.
 */

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// English translations
import enCommon from './locales/en/common.json'
import enAuth from './locales/en/auth.json'
import enNav from './locales/en/nav.json'
import enSettings from './locales/en/settings.json'
import enDashboard from './locales/en/dashboard.json'
import enErrors from './locales/en/errors.json'
import enAcademics from './locales/en/academics.json'
import enPeople from './locales/en/people.json'
import enPayments from './locales/en/payments.json'
import enPortal from './locales/en/portal.json'

// Nepali translations
import neCommon from './locales/ne/common.json'
import neAuth from './locales/ne/auth.json'
import neNav from './locales/ne/nav.json'
import neSettings from './locales/ne/settings.json'
import neDashboard from './locales/ne/dashboard.json'
import neErrors from './locales/ne/errors.json'
import neAcademics from './locales/ne/academics.json'
import nePeople from './locales/ne/people.json'
import nePayments from './locales/ne/payments.json'
import nePortal from './locales/ne/portal.json'

export const SUPPORTED_LANGUAGES = ['en', 'ne'] as const
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  en: 'English',
  ne: 'नेपाली',
}

export const NAMESPACES = [
  'common',
  'auth',
  'nav',
  'settings',
  'dashboard',
  'errors',
  'academics',
  'people',
  'payments',
  'portal',
] as const
export type Namespace = (typeof NAMESPACES)[number]

const resources = {
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
  },
} as const

/**
 * Initialize the i18next instance.
 * Safe to call multiple times — subsequent calls are no-ops if already initialized.
 */
export function initI18n() {
  if (i18n.isInitialized) return i18n

  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: 'en',
      supportedLngs: SUPPORTED_LANGUAGES as unknown as string[],
      defaultNS: 'common',
      ns: NAMESPACES as unknown as string[],
      interpolation: {
        escapeValue: false, // React already handles XSS
      },
      detection: {
        order: ['localStorage', 'navigator'],
        lookupLocalStorage: 'edforge-language',
        caches: ['localStorage'],
      },
      react: {
        useSuspense: false, // We handle loading states manually
      },
    })

  return i18n
}

export { i18n }
