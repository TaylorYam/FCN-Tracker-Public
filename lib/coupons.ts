import type { CouponPeriod, FCNProduct } from "./types";

/**
 * - "paid": payment date on or before the as-of date
 * - "scheduled": payment date still ahead
 * - "paid-with-redemption" / "payable-with-redemption": the period in which
 *   KO occurred; its coupon is paid together with early redemption at par
 * - "cancelled": periods after the KO period — the note no longer exists
 */
export type CouponStatus =
  | "paid"
  | "scheduled"
  | "paid-with-redemption"
  | "payable-with-redemption"
  | "cancelled";

export type CouponRow = CouponPeriod & {
  /** Coupon for this period as a fraction of notional. */
  couponPct: number;
  status: CouponStatus;
  isKOPeriod: boolean;
};

export type CouponSchedule = {
  rows: CouponRow[];
  perPeriodPct: number;
  /** Months per coupon period (1 = monthly). */
  periodMonths: number;
  paidCount: number;
  /** Sum of coupons already paid, as a fraction of notional. */
  paidPct: number;
  nextPayment: CouponRow | null;
};

/** Coupon per period = annual rate × period length in years. */
export function perPeriodCoupon(product: FCNProduct): number {
  const n = product.couponPeriods.length;
  if (n === 0) return 0;
  const periodMonths = product.termMonths / n;
  return product.couponRateAnnual * (periodMonths / 12);
}

/** Period whose observation window contains `date` (inclusive), else the first period ending on/after it. */
export function findPeriodContaining(
  periods: CouponPeriod[],
  date: string,
): CouponPeriod | null {
  const inside = periods.find((p) => p.observationStart <= date && date <= p.observationEnd);
  if (inside) return inside;
  return periods.find((p) => p.observationEnd >= date) ?? null;
}

/**
 * Coupon schedule with per-period status as of `asOf`.
 *
 * FCN coupons are fixed: they are paid whether or not the underlyings rise
 * or fall. The only thing that stops future coupons is early redemption
 * after a KO. Demo convention: the coupon of the period in which KO occurs
 * is paid on that period's payment date together with 100% of notional.
 */
export function deriveCouponSchedule(
  product: FCNProduct,
  asOf: string,
  koTriggerDate: string | null,
): CouponSchedule {
  const perPeriodPct = perPeriodCoupon(product);
  const periods = [...product.couponPeriods].sort((a, b) => a.t - b.t);
  const koPeriod = koTriggerDate ? findPeriodContaining(periods, koTriggerDate) : null;

  const rows: CouponRow[] = periods.map((p) => {
    const isKOPeriod = koPeriod !== null && p.t === koPeriod.t;
    const paid = p.paymentDate <= asOf;
    let status: CouponStatus;
    if (koPeriod && p.t > koPeriod.t) status = "cancelled";
    else if (isKOPeriod) status = paid ? "paid-with-redemption" : "payable-with-redemption";
    else status = paid ? "paid" : "scheduled";
    return { ...p, couponPct: perPeriodPct, status, isKOPeriod };
  });

  const paidRows = rows.filter((r) => r.status === "paid" || r.status === "paid-with-redemption");
  const nextPayment =
    rows.find((r) => r.status === "scheduled" || r.status === "payable-with-redemption") ?? null;

  return {
    rows,
    perPeriodPct,
    periodMonths: periods.length > 0 ? product.termMonths / periods.length : 1,
    paidCount: paidRows.length,
    paidPct: paidRows.length * perPeriodPct,
    nextPayment,
  };
}
