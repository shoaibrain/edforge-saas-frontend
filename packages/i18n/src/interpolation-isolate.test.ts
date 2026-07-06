import { describe, expect, it } from "vitest";
import { isolateInterpolation } from "./config";

const FSI = "⁨";
const PDI = "⁩";

describe("isolateInterpolation", () => {
  it("wraps values in bidi isolates for RTL (Arabic) only", () => {
    expect(isolateInterpolation("NPR 1,50,000", "isolate", "ar")).toBe(
      `${FSI}NPR 1,50,000${PDI}`,
    );
    expect(isolateInterpolation("2081/01/01", "isolate", "ar-AE")).toBe(
      `${FSI}2081/01/01${PDI}`,
    );
  });

  it("is a no-op for LTR languages", () => {
    for (const lng of ["en", "en-US", "ne", "hi"]) {
      expect(isolateInterpolation("NPR 1,50,000", "isolate", lng)).toBe(
        "NPR 1,50,000",
      );
    }
  });

  it("only wraps when the `isolate` format is requested", () => {
    expect(isolateInterpolation("NPR 1,50,000", undefined, "ar")).toBe(
      "NPR 1,50,000",
    );
    expect(isolateInterpolation("NPR 1,50,000", "uppercase", "ar")).toBe(
      "NPR 1,50,000",
    );
  });

  it("coerces non-string values and handles null/undefined", () => {
    expect(isolateInterpolation(42, "isolate", "ar")).toBe(`${FSI}42${PDI}`);
    expect(isolateInterpolation(null, "isolate", "ar")).toBe(`${FSI}${PDI}`);
    expect(isolateInterpolation(undefined, undefined, "ar")).toBe("");
  });
});
