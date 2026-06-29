export interface AgingBucketLike {
  label: string;
  minDays?: number;
  maxDays?: number | null;
  count: number;
  amount?: number;
}

type Translate = (key: string, options?: Record<string, unknown>) => string;

function bucketKey(bucket: AgingBucketLike): string | null {
  if (bucket.minDays === 0 && bucket.maxDays === 0) return "current";
  if (bucket.minDays === 1 && bucket.maxDays === 30) return "days1To30";
  if (bucket.minDays === 31 && bucket.maxDays === 60) return "days31To60";
  if (bucket.minDays === 61 && bucket.maxDays === 90) return "days61To90";
  if (bucket.minDays === 91 && bucket.maxDays == null) return "days90Plus";

  const normalized = bucket.label.trim().toLowerCase();
  if (normalized === "current") return "current";
  if (normalized === "1-30 days") return "days1To30";
  if (normalized === "31-60 days") return "days31To60";
  if (normalized === "61-90 days") return "days61To90";
  if (normalized === "90+ days") return "days90Plus";

  return null;
}

export function localizeAgingBucketLabel(
  bucket: AgingBucketLike,
  t: Translate,
): string {
  const key = bucketKey(bucket);
  if (!key) return bucket.label;
  return t(`overview.billingHealth.agingBuckets.${key}`);
}

export function getLocalizedAgingInsight(
  buckets: AgingBucketLike[],
  formatAmount: (amount: number) => string,
  t: Translate,
): string | null {
  const activeBuckets = buckets.filter((bucket) => bucket.count > 0);
  if (activeBuckets.length === 0) return null;

  const totalCount = activeBuckets.reduce((sum, bucket) => sum + bucket.count, 0);
  const totalAmount = activeBuckets.reduce(
    (sum, bucket) => sum + (bucket.amount ?? 0),
    0,
  );

  if (activeBuckets.length === 1) {
    const bucket = activeBuckets[0];
    return t("overview.billingHealth.agingInsight.singleBucket", {
      count: bucket.count,
      amount: formatAmount(bucket.amount ?? 0),
      bucket: localizeAgingBucketLabel(bucket, t),
    });
  }

  const worstBucket = activeBuckets[activeBuckets.length - 1];
  return t("overview.billingHealth.agingInsight.multipleBuckets", {
    count: totalCount,
    amount: formatAmount(totalAmount),
    worstCount: worstBucket.count,
    bucket: localizeAgingBucketLabel(worstBucket, t),
  });
}
