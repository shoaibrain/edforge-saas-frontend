import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "./config";

export type LocaleCode = SupportedLanguage | `${SupportedLanguage}-${string}`;

export const DEFAULT_LANGUAGE_LOCALES: Record<SupportedLanguage, LocaleCode> = {
  en: "en-US",
  ne: "ne-NP",
  hi: "hi-IN",
};

const SUPPORTED_LANGUAGE_SET = new Set<string>(SUPPORTED_LANGUAGES);

function firstLanguageCandidate(value: unknown): string | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const candidate = firstLanguageCandidate(item);
      if (candidate) return candidate;
    }
    return null;
  }

  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function toPlatformLanguage(value: unknown): SupportedLanguage | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const language = toPlatformLanguage(item);
      if (language) return language;
    }
    return null;
  }

  const candidate = firstLanguageCandidate(value);
  if (!candidate) return null;

  const normalized = candidate.replace("_", "-").toLowerCase();
  const baseLanguage = normalized.split("-")[0];

  if (SUPPORTED_LANGUAGE_SET.has(normalized)) {
    return normalized as SupportedLanguage;
  }

  if (SUPPORTED_LANGUAGE_SET.has(baseLanguage)) {
    return baseLanguage as SupportedLanguage;
  }

  return null;
}

export function normalizePlatformLanguage(
  value: unknown,
  fallback: SupportedLanguage = "en",
): SupportedLanguage {
  return toPlatformLanguage(value) ?? fallback;
}

export function normalizeLocaleCode(
  value: unknown,
  fallback: LocaleCode = "en-US",
): LocaleCode {
  const platformLanguage = toPlatformLanguage(value);
  if (platformLanguage) return DEFAULT_LANGUAGE_LOCALES[platformLanguage];

  const candidate = firstLanguageCandidate(value);
  if (!candidate) return fallback;

  const [language, region] = candidate.replace("_", "-").split("-");
  const normalizedLanguage = language?.toLowerCase();
  if (!normalizedLanguage || !SUPPORTED_LANGUAGE_SET.has(normalizedLanguage))
    return fallback;

  return region
    ? (`${normalizedLanguage}-${region.toUpperCase()}` as LocaleCode)
    : DEFAULT_LANGUAGE_LOCALES[normalizedLanguage as SupportedLanguage];
}
