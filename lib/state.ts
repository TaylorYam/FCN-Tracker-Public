import { deriveCouponSchedule, type CouponSchedule } from "./coupons";
import { deriveKOState, type KOState } from "./fcn";
import { deriveLifecycle, latestCompleteDate, type Lifecycle } from "./lifecycle";
import { assembleProductSeries, clipSeries, type MarketDataSource } from "./market-data";
import type { FCNProduct, PriceSeries } from "./types";

export type ProductState = {
  config: FCNProduct;
  /** Fixed valuation cut-off for the demo (no wall-clock dependency). */
  asOf: string;
  /** Closes from trade date to min(asOf, final valuation date). */
  series: PriceSeries;
  /** Latest date on which every underlying has a close. */
  lastTradingDate: string | null;
  /** Closes on the lifecycle valuation date (KO date, final valuation, or latest). */
  prices: Record<string, number>;
  ko: KOState;
  lifecycle: Lifecycle;
  coupons: CouponSchedule;
};

/**
 * Build the full monitoring state for one product from an already-assembled
 * price series. Pure and deterministic: same inputs → same state.
 */
export function buildProductState(
  product: FCNProduct,
  rawSeries: PriceSeries,
  asOf: string,
): ProductState {
  const cutoff = asOf < product.expiryDate ? asOf : product.expiryDate;
  const series = clipSeries(rawSeries, product.tradeDate, cutoff);

  const lastTradingDate = latestCompleteDate(product, series, cutoff);
  const ko = deriveKOState(product, series);
  const lifecycle = deriveLifecycle(product, series, asOf, ko);

  const prices: Record<string, number> = {};
  const day = lifecycle.valuationDate ? series[lifecycle.valuationDate] : undefined;
  if (day) {
    for (const u of product.underlyings) {
      if (day[u.ticker] !== undefined) prices[u.ticker] = day[u.ticker];
    }
  }

  const coupons = deriveCouponSchedule(product, asOf, ko.trigger.triggerDate);

  return { config: product, asOf, series, lastTradingDate, prices, ko, lifecycle, coupons };
}

/** Convenience: assemble the series from a market-data source, then build state. */
export function buildProductStateFromSource(
  product: FCNProduct,
  source: MarketDataSource,
  asOf: string,
): ProductState {
  return buildProductState(product, assembleProductSeries(product, source), asOf);
}
