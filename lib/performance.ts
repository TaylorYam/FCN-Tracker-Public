import type { FCNProduct } from "./types";

export type UnderlyingPerformance = {
  ticker: string;
  name: string;
  initialPrice: number;
  currentPrice: number;
  /** currentPrice / initialPrice (1.0 = 100%). */
  ratio: number;
  /** ratio − 1, e.g. −0.12 = down 12% since the initial observation. */
  performance: number;
  koPrice: number;
  strikePrice: number;
  /** null when the product has no KI barrier. */
  kiPrice: number | null;
  /** (ratio − koLevel) in percentage points; ≥ 0 means at or above KO. */
  koDistancePp: number;
  /** (ratio − strikeLevel) in percentage points; < 0 means below strike. */
  strikeDistancePp: number;
  isBelowStrike: boolean;
};

/**
 * Per-underlying performance versus the product's barriers. Missing prices
 * fall back to the initial price (i.e. 100%), mirroring how the monitoring
 * view renders an underlying before its first close is available.
 */
export function computeUnderlyingPerformance(
  product: FCNProduct,
  prices: Record<string, number>,
): UnderlyingPerformance[] {
  return product.underlyings.map((u) => {
    const currentPrice = prices[u.ticker] ?? u.initialPrice;
    const ratio = currentPrice / u.initialPrice;
    return {
      ticker: u.ticker,
      name: u.name,
      initialPrice: u.initialPrice,
      currentPrice,
      ratio,
      performance: ratio - 1,
      koPrice: u.initialPrice * product.koLevel,
      strikePrice: u.initialPrice * product.strikeLevel,
      kiPrice: product.kiObservation === "NONE" ? null : u.initialPrice * product.kiLevel,
      koDistancePp: (ratio - product.koLevel) * 100,
      strikeDistancePp: (ratio - product.strikeLevel) * 100,
      isBelowStrike: ratio < product.strikeLevel,
    };
  });
}

/**
 * The worst-performing underlying (lowest price / initial). Only underlyings
 * with a price are considered. Ties resolve to the first in product order.
 * Returns null when no underlying has a price.
 */
export function findWorstPerformer(
  product: FCNProduct,
  prices: Record<string, number>,
): { ticker: string; ratio: number } | null {
  let worst: { ticker: string; ratio: number } | null = null;
  for (const u of product.underlyings) {
    const price = prices[u.ticker];
    if (price === undefined || u.initialPrice <= 0) continue;
    const ratio = price / u.initialPrice;
    if (!worst || ratio < worst.ratio) worst = { ticker: u.ticker, ratio };
  }
  return worst;
}

/**
 * The worst performer is only highlighted once it trades below strike —
 * above strike, the worst-of does not change the maturity outcome, so the
 * monitoring view stays neutral.
 */
export function worstBelowStrike(
  product: FCNProduct,
  prices: Record<string, number>,
): string | null {
  const worst = findWorstPerformer(product, prices);
  if (!worst || worst.ratio >= product.strikeLevel) return null;
  return worst.ticker;
}
