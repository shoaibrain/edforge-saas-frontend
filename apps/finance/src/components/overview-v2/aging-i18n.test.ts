import { describe, expect, it } from "vitest";
import {
  getLocalizedAgingInsight,
  localizeAgingBucketLabel,
  type AgingBucketLike,
} from "./aging-i18n";

const messages: Record<string, string> = {
  "overview.billingHealth.agingBuckets.current": "हालको",
  "overview.billingHealth.agingBuckets.days1To30": "१-३० दिन",
  "overview.billingHealth.agingBuckets.days31To60": "३१-६० दिन",
  "overview.billingHealth.agingBuckets.days61To90": "६१-९० दिन",
  "overview.billingHealth.agingBuckets.days90Plus": "९०+ दिन",
  "overview.billingHealth.agingInsight.singleBucket":
    "{{count}} बाँकी · {{amount}}, सबै {{bucket}} अवधिभित्र।",
  "overview.billingHealth.agingInsight.multipleBuckets":
    "{{count}} बाँकी जम्मा {{amount}}। {{bucket}} मा {{worstCount}} लाई तुरुन्त ध्यान चाहिन्छ।",
};

function t(key: string, options: Record<string, unknown> = {}) {
  return Object.entries(options).reduce(
    (text, [name, value]) => text.replace(`{{${name}}}`, String(value)),
    messages[key] ?? key,
  );
}

describe("aging i18n helpers", () => {
  it("localizes known server bucket labels", () => {
    expect(localizeAgingBucketLabel({ label: "Current", count: 0 }, t)).toBe(
      "हालको",
    );
    expect(localizeAgingBucketLabel({ label: "1-30 days", count: 0 }, t)).toBe(
      "१-३० दिन",
    );
    expect(localizeAgingBucketLabel({ label: "90+ days", count: 0 }, t)).toBe(
      "९०+ दिन",
    );
  });

  it("builds localized single-bucket insight text", () => {
    const buckets: AgingBucketLike[] = [
      { label: "1-30 days", count: 3, amount: 11397 },
    ];

    expect(getLocalizedAgingInsight(buckets, (amount) => `NPR ${amount}`, t)).toBe(
      "3 बाँकी · NPR 11397, सबै १-३० दिन अवधिभित्र।",
    );
  });

  it("builds localized multiple-bucket insight text", () => {
    const buckets: AgingBucketLike[] = [
      { label: "1-30 days", count: 3, amount: 11397 },
      { label: "61-90 days", count: 2, amount: 5000 },
    ];

    expect(getLocalizedAgingInsight(buckets, (amount) => `NPR ${amount}`, t)).toBe(
      "5 बाँकी जम्मा NPR 16397। ६१-९० दिन मा 2 लाई तुरुन्त ध्यान चाहिन्छ।",
    );
  });
});
