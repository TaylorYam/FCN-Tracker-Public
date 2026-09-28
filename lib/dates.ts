const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Format YYYY-MM-DD as "06 Jan 2025" (locale-independent, deterministic). */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d} ${MONTHS[Number(m) - 1]} ${y}`;
}

/** Format YYYY-MM-DD as "06 Jan" for compact labels. */
export function formatDateShort(iso: string): string {
  const [, m, d] = iso.split("-");
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
