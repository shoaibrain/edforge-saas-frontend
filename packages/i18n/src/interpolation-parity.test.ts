import { describe, expect, it } from "vitest";
import { I18N_RESOURCES, NAMESPACES, type Namespace } from "./config";

type LocaleObject = Record<string, unknown>;

const INTERPOLATION_PATTERN = /{{-?\s*([\w.]+)\s*}}/g;

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
  language: "en" | "ne",
  namespace: Namespace,
): LocaleObject {
  return I18N_RESOURCES[language][namespace] as LocaleObject;
}

describe("translation interpolation parity", () => {
  for (const namespace of NAMESPACES) {
    it(`keeps interpolation variables aligned for ${namespace}`, () => {
      const enResource = resourceFor("en", namespace);
      const neResource = resourceFor("ne", namespace);

      for (const key of getLeafKeys(enResource)) {
        const enVariables = interpolationVariables(valueAt(enResource, key));
        const neVariables = interpolationVariables(valueAt(neResource, key));

        expect(
          neVariables,
          `Interpolation variables differ for ${namespace}.${key}`,
        ).toEqual(enVariables);
      }
    });
  }
});
