import { describe, expect, it } from "vitest";
import {
  I18N_RESOURCES,
  NAMESPACES,
  SUPPORTED_LANGUAGES,
  type Namespace,
  type SupportedLanguage,
} from "./config";

type LocaleObject = Record<string, unknown>;

// Captures the variable name, tolerating an optional i18next format suffix such
// as `{{amount, isolate}}` (the RTL bidi-isolation format) so annotated
// placeholders still compare equal across locales.
const INTERPOLATION_PATTERN = /{{-?\s*([\w.]+)(?:\s*,\s*[^}]+)?\s*}}/g;

function getLeafKeys(obj: LocaleObject, prefix = ""): string[] {
  const keys: string[] = [];

  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];

    if (value && typeof value === "object" && !Array.isArray(value)) {
      keys.push(...getLeafKeys(value as LocaleObject, fullKey));
    } else {
      keys.push(fullKey);
    }
  }

  return keys.sort();
}

function valueAt(obj: LocaleObject, path: string): string {
  const value = path.split(".").reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object" || Array.isArray(current))
      return undefined;
    return (current as LocaleObject)[key];
  }, obj);

  return typeof value === "string" ? value : "";
}

function interpolationVariables(value: string): string[] {
  const variables = new Set<string>();

  for (const match of value.matchAll(INTERPOLATION_PATTERN)) {
    variables.add(match[1]);
  }

  return [...variables].sort();
}

function resourceFor(
  language: SupportedLanguage,
  namespace: Namespace,
): LocaleObject {
  return I18N_RESOURCES[language][namespace] as LocaleObject;
}

describe("translation interpolation parity", () => {
  for (const namespace of NAMESPACES) {
    it(`keeps interpolation variables aligned for ${namespace}`, () => {
      const enResource = resourceFor("en", namespace);

      for (const language of SUPPORTED_LANGUAGES.filter(
        (language) => language !== "en",
      )) {
        const localizedResource = resourceFor(language, namespace);

        for (const key of getLeafKeys(enResource)) {
          const enVariables = interpolationVariables(valueAt(enResource, key));
          const localizedVariables = interpolationVariables(
            valueAt(localizedResource, key),
          );

          expect(
            localizedVariables,
            `Interpolation variables differ for ${language}/${namespace}.${key}`,
          ).toEqual(enVariables);
        }
      }
    });
  }
});
