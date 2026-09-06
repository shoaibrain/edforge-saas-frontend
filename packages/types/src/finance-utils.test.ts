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

/**
 * Issue #349 — a date-only value was rendered a day early with a fabricated
 * clock time for any viewer west of UTC. The zone test matched the date's own
 * "-06", so "2026-09-06" was treated as already zoned, parsed as UTC midnight,
 * then read back through local getters. A payment recorded today displayed as
 * "Yesterday · 7:00 PM" on the finance overview.
 */
describe("formatRelativeDate — date-only values (#349)", () => {
  const opts = { today: "Today", yesterday: "Yesterday" };
  const isoDay = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  it("renders today's date-only value as Today, in any timezone", () => {
    expect(formatRelativeDate(isoDay(new Date()), opts)).toBe("Today");
  });

  it("shows no clock time for a value that has none", () => {
    expect(formatRelativeDate(isoDay(new Date()), opts)).not.toContain("·");
  });

  it("renders yesterday's date-only value as Yesterday", () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    expect(formatRelativeDate(isoDay(d), opts)).toBe("Yesterday");
  });

  it("keeps the time on a real timestamp", () => {
    const now = new Date();
    const out = formatRelativeDate(now.toISOString(), opts);
    expect(out.startsWith("Today ·")).toBe(true);
  });

  it("treats a naive timestamp as UTC, as before", () => {
    const out = formatRelativeDate("2020-01-02T03:04:05", opts);
    expect(out).toContain("·");
  });

  it("does not double-append a zone to an offset timestamp", () => {
    expect(() => formatRelativeDate("2020-01-02T03:04:05+05:45", opts)).not.toThrow();
    expect(formatRelativeDate("2020-01-02T03:04:05+05:45", opts)).toContain("·");
  });
});
