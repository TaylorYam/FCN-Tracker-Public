import type { Locale } from "./i18n/config";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * Format YYYY-MM-DD for display, deterministically (no runtime locale data):
 * en → "06 Jan 2025", zh-TW → "2025/01/06".
 */
export function formatDate(iso: string, locale: Locale = "en"): string {
  const [y, m, d] = iso.split("-");
  if (locale === "zh-TW") return `${y}/${m}/${d}`;
  return `${d} ${MONTHS[Number(m) - 1]} ${y}`;
}

/** Compact date for labels: en → "06 Jan", zh-TW → "01/06". */
export function formatDateShort(iso: string, locale: Locale = "en"): string {
  const [, m, d] = iso.split("-");
  if (locale === "zh-TW") return `${m}/${d}`;
  return `${d} ${MONTHS[Number(m) - 1]}`;
}

/** Find the next coupon payment date on or after `today` (YYYY-MM-DD). */
export function findNextCouponDate(
  paymentDates: string[],
  today: string,
): string | null {
  const sorted = [...paymentDates].sort();
  for (const d of sorted) {
    if (d >= today) return d;
  }
  return null;
}
