/**
 * Date arithmetic and coupon-schedule helpers.
 *
 * Kept dependency-free and UTC-based so the same code runs identically in
 * the browser, on the server and in tests. Business-day logic is naive
 * (weekends only, no holiday calendar) — sufficient for synthetic demo data.
 */

import type { CouponPeriod } from "./types";

/** Parse "YYYYMMDD" or "YYYY-MM-DD" to a UTC Date. Returns null on bad input. */
export function parseYmd(s: string): Date | null {
  const trimmed = s.trim();
  let y: number, m: number, d: number;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    y = Number(trimmed.slice(0, 4));
    m = Number(trimmed.slice(5, 7));
    d = Number(trimmed.slice(8, 10));
  } else if (/^\d{8}$/.test(trimmed)) {
    y = Number(trimmed.slice(0, 4));
    m = Number(trimmed.slice(4, 6));
    d = Number(trimmed.slice(6, 8));
  } else {
    return null;
  }
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) {
    return null; // invalid (e.g. Feb 30)
  }
  return dt;
}

/** Parse an ISO date that is known to be valid (throws otherwise). */
export function isoToDate(iso: string): Date {
  const dt = parseYmd(iso);
  if (!dt) throw new Error(`Invalid date: ${iso}`);
  return dt;
}

export function toIsoDate(dt: Date): string {
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dt.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Add N calendar months, clamping to end-of-month when the target month has
 * fewer days (e.g. Jan 31 + 1M → Feb 28).
 */
export function addMonths(dt: Date, n: number): Date {
  const y = dt.getUTCFullYear();
  const m = dt.getUTCMonth();
  const d = dt.getUTCDate();
  const target = new Date(Date.UTC(y, m + n + 1, 0)); // last day of target month
  const clampedDay = Math.min(d, target.getUTCDate());
  return new Date(Date.UTC(y, m + n, clampedDay));
}

export function addDays(dt: Date, n: number): Date {
  return new Date(dt.getTime() + n * 86_400_000);
}

export function isBusinessDay(dt: Date): boolean {
  const dow = dt.getUTCDay();
  return dow !== 0 && dow !== 6;
}

/** Add N business days (skipping Sat/Sun). */
export function addBusinessDays(dt: Date, n: number): Date {
  let cur = dt;
  let left = n;
  while (left > 0) {
    cur = addDays(cur, 1);
    if (isBusinessDay(cur)) left--;
  }
  return cur;
}

/** "Following" business-day convention: roll a weekend date forward to Monday. */
export function rollForwardToBusinessDay(dt: Date): Date {
  let cur = dt;
  while (!isBusinessDay(cur)) cur = addDays(cur, 1);
  return cur;
}

/** Every business day (Mon–Fri) from `startIso` to `endIso`, inclusive. */
export function businessDaysBetween(startIso: string, endIso: string): string[] {
  const out: string[] = [];
  let cur = isoToDate(startIso);
  const end = isoToDate(endIso);
  while (cur.getTime() <= end.getTime()) {
    if (isBusinessDay(cur)) out.push(toIsoDate(cur));
    cur = addDays(cur, 1);
  }
  return out;
}

/** Whole calendar days from `fromIso` to `toIso` (negative if `toIso` is earlier). */
export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((isoToDate(toIso).getTime() - isoToDate(fromIso).getTime()) / 86_400_000);
}

/**
 * Build a monthly coupon schedule from the initial observation date.
 *
 * Period 1 observationStart = initial observation date; observationEnd =
 * initial + 1M. Period t (t ≥ 2) observationStart = previous observationEnd
 * + 1 day; observationEnd = initial + t M. Observation ends are rolled
 * forward to the next business day so that monthly KO observation dates
 * always coincide with a trading close. Payment date = observationEnd + N
 * business days (default 3).
 */
export function buildMonthlyCouponSchedule(
  initialObservationIso: string,
  termMonths: number,
  paymentLagBusinessDays = 3,
): CouponPeriod[] {
  const initial = isoToDate(initialObservationIso);
  const out: CouponPeriod[] = [];
  let prevEnd: Date | null = null;
  for (let t = 1; t <= termMonths; t++) {
    const start = t === 1 ? initial : addDays(prevEnd!, 1);
    const end = rollForwardToBusinessDay(addMonths(initial, t));
    const pay = addBusinessDays(end, paymentLagBusinessDays);
    out.push({
      t,
      observationStart: toIsoDate(start),
      observationEnd: toIsoDate(end),
      paymentDate: toIsoDate(pay),
    });
    prevEnd = end;
  }
  return out;
}
