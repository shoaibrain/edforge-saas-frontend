/**
 * Locale parity tests.
 *
 * These derive from the same namespace registry used by runtime i18n config so
 * adding a namespace without localized coverage fails immediately.
 */

import { describe, expect, it } from "vitest";
import {
  I18N_RESOURCES,
  NAMESPACES,
  SUPPORTED_LANGUAGES,
  type Namespace,
  type SupportedLanguage,
} from "./config";

type LocaleObject = Record<string, unknown>;

function getKeys(obj: LocaleObject, prefix = ""): string[] {
  const keys: string[] = [];

  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];

    if (value && typeof value === "object" && !Array.isArray(value)) {
      keys.push(...getKeys(value as LocaleObject, fullKey));
    } else {
      keys.push(fullKey);
    }
  }

  return keys.sort();
}

function valueAt(obj: LocaleObject, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object" || Array.isArray(current))
      return undefined;
    return (current as LocaleObject)[key];
  }, obj);
}

function resourceFor(
  language: SupportedLanguage,
  namespace: Namespace,
): LocaleObject {
  return I18N_RESOURCES[language][namespace] as LocaleObject;
}

describe("locale registry", () => {
  it("has resources for every configured language and namespace", () => {
    for (const language of SUPPORTED_LANGUAGES) {
      for (const namespace of NAMESPACES) {
        expect(
          I18N_RESOURCES[language][namespace],
          `Missing ${language}/${namespace}.json resource`,
        ).toBeTruthy();
      }
    }
  });
});

describe("locale parity", () => {
  for (const namespace of NAMESPACES) {
    describe(`namespace: ${namespace}`, () => {
      it("English keys have corresponding localized keys", () => {
        const enKeys = getKeys(resourceFor("en", namespace));

        for (const language of SUPPORTED_LANGUAGES.filter(
          (language) => language !== "en",
        )) {
          const localizedKeys = new Set(getKeys(resourceFor(language, namespace)));
          const missing = enKeys.filter((key) => !localizedKeys.has(key));

          expect(
            missing,
            `Missing in ${language}/${namespace}.json: ${missing.join(", ")}`,
          ).toEqual([]);
        }
      });

      it("localized keys have corresponding English keys", () => {
        const enKeys = new Set(getKeys(resourceFor("en", namespace)));

        for (const language of SUPPORTED_LANGUAGES.filter(
          (language) => language !== "en",
        )) {
          const localizedKeys = getKeys(resourceFor(language, namespace));
          const extra = localizedKeys.filter((key) => !enKeys.has(key));

          expect(
            extra,
            `Extra in ${language}/${namespace}.json: ${extra.join(", ")}`,
          ).toEqual([]);
        }
      });

      it("localized leaves are non-empty strings", () => {
        for (const language of SUPPORTED_LANGUAGES.filter(
          (language) => language !== "en",
        )) {
          const resource = resourceFor(language, namespace);

          for (const key of getKeys(resource)) {
            const value = valueAt(resource, key);

            expect(
              value,
              `${language}/${namespace}.json "${key}" should be a non-empty string`,
            ).toBeTruthy();
            expect(
              typeof value,
              `${language}/${namespace}.json "${key}" should be string, got ${typeof value}`,
            ).toBe("string");
          }
        }
      });
    });
  }
});
