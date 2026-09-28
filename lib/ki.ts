import type { FCNProduct, PriceSeries } from "./types";

export type KIEvent =
  /** Product has no KI barrier. */
  | { kind: "not-applicable" }
  /** EKI before the final valuation date: nothing to evaluate yet. */
  | { kind: "pending" }
  | { kind: "not-occurred" }
  | { kind: "occurred"; date: string; ticker: string; ratio: number };

/**
 * Detect a knock-in event up to and including `untilDate`.
 *
 * - AKI: the first daily close, from the initial observation date onward, on
 *   which any underlying closes strictly below `kiLevel × initialPrice`.
 * - EKI: evaluated only on the final valuation date (`expiryDate`) — the
 *   worst performer's close strictly below the KI level. Before then the
 *   result is "pending"; dips below KI during the tenor do not count.
 * - NONE: not applicable.
 *
 * Demo convention: KO is inclusive (≥), KI and strike are strict (<). Real
 * term sheets define these boundaries individually.
 */
export function detectKIEvent(
  product: FCNProduct,
  series: PriceSeries,
  untilDate: string,
): KIEvent {
  if (product.kiObservation === "NONE" || product.kiLevel <= 0) {
    return { kind: "not-applicable" };
  }

  if (product.kiObservation === "EKI") {
    if (untilDate < product.expiryDate) return { kind: "pending" };
    const day = series[product.expiryDate];
    if (!day) return { kind: "pending" };
    const worst = worstOnDay(product, day);
    if (worst && worst.ratio < product.kiLevel) {
      return { kind: "occurred", date: product.expiryDate, ...worst };
    }
    return { kind: "not-occurred" };
  }

  // AKI — scan every close in the observation window.
  const dates = Object.keys(series)
    .filter((d) => d >= product.initialObservationDate && d <= untilDate && d <= product.expiryDate)
    .sort();
  for (const date of dates) {
    for (const u of product.underlyings) {
      const close = series[date]?.[u.ticker];
      if (close === undefined) continue;
      const ratio = close / u.initialPrice;
      if (ratio < product.kiLevel) {
        return { kind: "occurred", date, ticker: u.ticker, ratio };
      }
    }
  }
  return { kind: "not-occurred" };
}

function worstOnDay(
  product: FCNProduct,
  day: Record<string, number>,
): { ticker: string; ratio: number } | null {
  let worst: { ticker: string; ratio: number } | null = null;
  for (const u of product.underlyings) {
    const close = day[u.ticker];
    if (close === undefined) continue;
    const ratio = close / u.initialPrice;
    if (!worst || ratio < worst.ratio) worst = { ticker: u.ticker, ratio };
  }
  return worst;
}
