import type { FCNProduct, PriceSeries, Underlying } from "./types";

export type ReachedKOMap = Record<
  string,
  { reached: boolean; reachedDate: string | null }
>;

export type KOTrigger = {
  triggered: boolean;
  triggerDate: string | null;
};

export type KOState = { reachedKO: ReachedKOMap; trigger: KOTrigger };

/**
 * For each underlying, decide whether its memory-style KO condition has been
 * met: at least one close on or after `koStartDate` reached `koLevel ×
 * initialPrice`.
 *
 * Returns the *first* such date per underlying.
 *
 * Used directly by tests; application code should call `deriveKOState` which
 * also dispatches non-memory products.
 */
export function computeHasReachedKO(
  series: PriceSeries,
  koStartDate: string,
  underlyings: Underlying[],
  koLevel: number,
  observationDates?: string[],
): ReachedKOMap {
  const result: ReachedKOMap = {};
  const dates =
    observationDates ?? Object.keys(series).filter((d) => d >= koStartDate).sort();

  for (const u of underlyings) {
    const koPrice = u.initialPrice * koLevel;
    let reachedDate: string | null = null;
    for (const date of dates) {
      if (date < koStartDate) continue;
      const close = series[date]?.[u.ticker];
      if (close !== undefined && close >= koPrice) {
        reachedDate = date;
        break;
      }
    }
    result[u.ticker] = {
      reached: reachedDate !== null,
      reachedDate,
    };
  }
  return result;
}

/**
 * Memory-mode trigger: product KOs when *every* underlying has individually
 * reached its KO threshold. Trigger date = the latest of the per-stock reach
 * dates.
 */
export function computeKOTrigger(reachedMap: ReachedKOMap): KOTrigger {
  const dates: string[] = [];
  for (const ticker in reachedMap) {
    const entry = reachedMap[ticker];
    if (!entry.reached || entry.reachedDate === null) {
      return { triggered: false, triggerDate: null };
    }
    dates.push(entry.reachedDate);
  }
  if (dates.length === 0) return { triggered: false, triggerDate: null };
  dates.sort();
  return { triggered: true, triggerDate: dates[dates.length - 1] };
}

/**
 * Non-memory trigger: product KOs the first observation date on which *all*
 * underlyings simultaneously close at or above their KO levels. Per-stock
 * `reached` flags only switch to true on/after that trigger date — individual
 * crossings on other dates do not count.
 */
function computeNonMemoryKO(
  product: FCNProduct,
  series: PriceSeries,
  observationDates: string[],
): KOState {
  for (const date of observationDates) {
    if (date < product.koStartDate) continue;
    const allUp = product.underlyings.every((u) => {
      const close = series[date]?.[u.ticker];
      return close !== undefined && close >= u.initialPrice * product.koLevel;
    });
    if (allUp) {
      const reachedKO: ReachedKOMap = {};
      for (const u of product.underlyings) {
        reachedKO[u.ticker] = { reached: true, reachedDate: date };
      }
      return { reachedKO, trigger: { triggered: true, triggerDate: date } };
    }
  }
  // Not triggered: per-stock state stays neutral (non-memory does not record
  // partial individual crossings).
  const reachedKO: ReachedKOMap = {};
  for (const u of product.underlyings) {
    reachedKO[u.ticker] = { reached: false, reachedDate: null };
  }
  return { reachedKO, trigger: { triggered: false, triggerDate: null } };
}

/**
 * Compute the KO observation date list for a product, given its observation
 * frequency. Returns dates in ascending order, all on or after `koStartDate`,
 * and only those for which we have a price snapshot.
 */
export function getObservationDates(
  product: FCNProduct,
  series: PriceSeries,
): string[] {
  const allDates = Object.keys(series)
    .filter((d) => d >= product.koStartDate)
    .sort();
  if (product.koObservationFreq === "daily") {
    return allDates;
  }
  // Monthly: each coupon period's observationEnd, except period 1 (non-call).
  const dataDates = new Set(allDates);
  return product.couponPeriods
    .filter((_, i) => i > 0)
    .map((p) => p.observationEnd)
    .filter((d) => d >= product.koStartDate && dataDates.has(d))
    .sort();
}

/** Scheduled monthly KO observation dates, whether or not data exists yet. */
export function getScheduledMonthlyObservationDates(product: FCNProduct): string[] {
  return product.couponPeriods
    .filter((_, i) => i > 0)
    .map((p) => p.observationEnd)
    .filter((d) => d >= product.koStartDate)
    .sort();
}

/** High-level entry point. Dispatches on memory + observation frequency. */
export function deriveKOState(product: FCNProduct, series: PriceSeries): KOState {
  const observationDates = getObservationDates(product, series);
  if (product.hasMemoryKO) {
    const reachedKO = computeHasReachedKO(
      series,
      product.koStartDate,
      product.underlyings,
      product.koLevel,
      observationDates,
    );
    const trigger = computeKOTrigger(reachedKO);
    return { reachedKO, trigger };
  }
  return computeNonMemoryKO(product, series, observationDates);
}

/** Human-readable label for the observation mode, e.g. "Daily · Memory". */
export function observationModeLabel(
  product: Pick<FCNProduct, "koObservationFreq" | "hasMemoryKO">,
): string {
  const freq = product.koObservationFreq === "daily" ? "Daily" : "Monthly";
  const memory = product.hasMemoryKO ? "Memory" : "Non-memory";
  return `${freq} · ${memory}`;
}
