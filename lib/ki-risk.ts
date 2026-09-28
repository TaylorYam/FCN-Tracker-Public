import type { FCNProduct } from "./types";

export type WorstKIRisk = {
  ticker: string;
  currentPrice: number;
  currentRatio: number;
  kiPrice: number;
  /** Current ratio minus KI ratio, expressed in percentage points. */
  distancePercentagePoints: number;
  isBelowKI: boolean;
};

/**
 * Returns the worst underlying only when:
 *   1. the product has KI, and
 *   2. that underlying is currently below K.
 *
 * Keeping this threshold logic outside the component makes the monitoring
 * warning deterministic and testable.
 */
export function getWorstKIRisk(
  product: FCNProduct,
  currentPrices: Record<string, number>,
): WorstKIRisk | null {
  if (product.kiObservation === "NONE" || product.kiLevel <= 0) return null;

  let worst:
    | {
        ticker: string;
        currentPrice: number;
        currentRatio: number;
        initialPrice: number;
      }
    | undefined;

  for (const underlying of product.underlyings) {
    const currentPrice = currentPrices[underlying.ticker];
    if (currentPrice === undefined || underlying.initialPrice <= 0) continue;

    const currentRatio = currentPrice / underlying.initialPrice;
    if (!worst || currentRatio < worst.currentRatio) {
      worst = {
        ticker: underlying.ticker,
        currentPrice,
        currentRatio,
        initialPrice: underlying.initialPrice,
      };
    }
  }

  if (!worst || worst.currentRatio >= product.strikeLevel) return null;

  const distancePercentagePoints =
    (worst.currentRatio - product.kiLevel) * 100;

  return {
    ticker: worst.ticker,
    currentPrice: worst.currentPrice,
    currentRatio: worst.currentRatio,
    kiPrice: worst.initialPrice * product.kiLevel,
    distancePercentagePoints,
    isBelowKI: distancePercentagePoints < 0,
  };
}
