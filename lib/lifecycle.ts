import type { KOState } from "./fcn";
import { getScheduledMonthlyObservationDates } from "./fcn";
import { detectKIEvent, type KIEvent } from "./ki";
import { findWorstPerformer } from "./performance";
import { addDays, isoToDate, rollForwardToBusinessDay, toIsoDate } from "./schedule";
import type { FCNProduct, PriceSeries } from "./types";

/**
 * Where the product is in its life:
 * - "non-call": before the KO start date — KO is not observed yet
 * - "ko-observation": live, KO condition monitored on each observation date
 * - "knocked-out": KO condition met; note redeemed early at par
 * - "matured": reached the final valuation date without KO
 */
export type LifecycleStatus = "non-call" | "ko-observation" | "knocked-out" | "matured";

export type Settlement =
  | { type: "early-redemption"; date: string; redemptionPct: number }
  | {
      type: "par-redemption";
      date: string;
      worstTicker: string;
      worstRatio: number;
      redemptionPct: number;
    }
  | {
      type: "physical-delivery";
      date: string;
      worstTicker: string;
      worstRatio: number;
      /** Worst performer's initial price × strike level. */
      deliveryPrice: number;
      /** Market value of delivered shares per unit notional: worstRatio / strikeLevel. */
      indicativeValuePct: number;
    };

export type Lifecycle = {
  status: LifecycleStatus;
  /** Date whose closes describe the product: KO date, final valuation date, or latest close. */
  valuationDate: string | null;
  nextKOObservationDate: string | null;
  kiEvent: KIEvent;
  settlement: Settlement | null;
};

/** Latest date ≤ `untilDate` on which every underlying has a close. */
export function latestCompleteDate(
  product: FCNProduct,
  series: PriceSeries,
  untilDate: string,
): string | null {
  const dates = Object.keys(series)
    .filter((d) => d <= untilDate)
    .sort()
    .reverse();
  return (
    dates.find((d) => product.underlyings.every((u) => series[d]?.[u.ticker] !== undefined)) ??
    null
  );
}

/**
 * Maturity settlement for a product that reached its final valuation date
 * without knocking out. Worst-of logic on the final closes:
 *
 * - no KI:  worst final < strike            → physical delivery at strike
 * - EKI/AKI: KI event AND worst final < strike → physical delivery at strike
 * - otherwise                                  → redemption at 100% par
 *
 * Coupons are fixed and paid regardless of the settlement type.
 * Returns null if the final valuation closes are not available.
 */
export function deriveMaturitySettlement(
  product: FCNProduct,
  series: PriceSeries,
): Settlement | null {
  const finalDay = series[product.expiryDate];
  if (!finalDay) return null;
  if (!product.underlyings.every((u) => finalDay[u.ticker] !== undefined)) return null;

  const worst = findWorstPerformer(product, finalDay);
  if (!worst) return null;

  const kiEvent = detectKIEvent(product, series, product.expiryDate);
  const downsideActive =
    product.kiObservation === "NONE" ? true : kiEvent.kind === "occurred";

  if (downsideActive && worst.ratio < product.strikeLevel) {
    const u = product.underlyings.find((x) => x.ticker === worst.ticker)!;
    return {
      type: "physical-delivery",
      date: product.expiryDate,
      worstTicker: worst.ticker,
      worstRatio: worst.ratio,
      deliveryPrice: u.initialPrice * product.strikeLevel,
      indicativeValuePct: worst.ratio / product.strikeLevel,
    };
  }
  return {
    type: "par-redemption",
    date: product.expiryDate,
    worstTicker: worst.ticker,
    worstRatio: worst.ratio,
    redemptionPct: 1,
  };
}

/** Next KO observation date strictly after `asOf`, or null if none remain. */
export function nextKOObservationDate(product: FCNProduct, asOf: string): string | null {
  if (product.koObservationFreq === "monthly") {
    return getScheduledMonthlyObservationDates(product).find((d) => d > asOf) ?? null;
  }
  const nextDay = toIsoDate(rollForwardToBusinessDay(addDays(isoToDate(asOf), 1)));
  const koStart = toIsoDate(rollForwardToBusinessDay(isoToDate(product.koStartDate)));
  const candidate = nextDay > koStart ? nextDay : koStart;
  return candidate <= product.expiryDate ? candidate : null;
}

/**
 * Derive the lifecycle status as of `asOf`. `series` must already be limited
 * to closes on or before `asOf`; `ko` is the KO state computed on that series.
 */
export function deriveLifecycle(
  product: FCNProduct,
  series: PriceSeries,
  asOf: string,
  ko: KOState,
): Lifecycle {
  const { trigger } = ko;

  if (trigger.triggered && trigger.triggerDate && trigger.triggerDate <= asOf) {
    return {
      status: "knocked-out",
      valuationDate: trigger.triggerDate,
      nextKOObservationDate: null,
      kiEvent: detectKIEvent(product, series, trigger.triggerDate),
      settlement: { type: "early-redemption", date: trigger.triggerDate, redemptionPct: 1 },
    };
  }

  if (asOf >= product.expiryDate) {
    return {
      status: "matured",
      valuationDate: series[product.expiryDate]
        ? product.expiryDate
        : latestCompleteDate(product, series, product.expiryDate),
      nextKOObservationDate: null,
      kiEvent: detectKIEvent(product, series, product.expiryDate),
      settlement: deriveMaturitySettlement(product, series),
    };
  }

  return {
    status: asOf < product.koStartDate ? "non-call" : "ko-observation",
    valuationDate: latestCompleteDate(product, series, asOf),
    nextKOObservationDate: nextKOObservationDate(product, asOf),
    kiEvent: detectKIEvent(product, series, asOf),
    settlement: null,
  };
}
