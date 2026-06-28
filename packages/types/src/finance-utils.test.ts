import { describe, expect, it } from "vitest";
import { formatRelativeDate } from "./finance-utils";

function daysAgoIso(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

describe("formatRelativeDate", () => {
  it("keeps English defaults for existing callers", () => {
    expect(formatRelativeDate(daysAgoIso(0))).toContain("Today");
    expect(formatRelativeDate(daysAgoIso(1))).toContain("Yesterday");
  });

  it("accepts localized relative labels and locale formatting", () => {
    const result = formatRelativeDate(daysAgoIso(2), {
      locale: "ne-NP",
      today: "आज",
      yesterday: "हिजो",
      daysAgo: (days) => `${days} दिनअघि`,
    });

    expect(result).toContain("2 दिनअघि");
  });
});
