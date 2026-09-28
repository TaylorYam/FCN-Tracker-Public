import type { FCNProduct, PriceSeries } from "./types";

/** Daily closes for one ticker, keyed by YYYY-MM-DD. */
export type DailyCloses = { [date: string]: number };

/**
 * Minimal market-data boundary. The portfolio edition ships a deterministic
 * synthetic implementation; a production deployment could implement the same
 * interface on top of an external market-data provider plus persistent
 * storage (per-ticker series shared across products). A live source would
 * typically be asynchronous — the engine downstream only needs the
 * assembled `PriceSeries`, so the swap is contained to this boundary.
 */
export interface MarketDataSource {
  getDailyCloses(ticker: string): DailyCloses | null;
}

/**
 * Reconstruct a per-product series `{ date: { ticker: close } }` from
 * per-ticker closes. Dates before the trade date are dropped so the chart
 * and the KO engine never see pre-trade data. Tickers without data simply
 * contribute nothing.
 */
export function assembleProductSeries(
  product: FCNProduct,
  source: MarketDataSource,
): PriceSeries {
  const series: PriceSeries = {};
  for (const u of product.underlyings) {
    const closes = source.getDailyCloses(u.ticker);
    if (!closes) continue;
    for (const [date, close] of Object.entries(closes)) {
      if (date < product.tradeDate) continue;
      if (!series[date]) series[date] = {};
      series[date][u.ticker] = close;
    }
  }
  return series;
}

/** Keep only dates within [from, to] (inclusive). Returns a new object. */
export function clipSeries(series: PriceSeries, from: string, to: string): PriceSeries {
  const out: PriceSeries = {};
  for (const [date, day] of Object.entries(series)) {
    if (date < from || date > to) continue;
    out[date] = { ...day };
  }
  return out;
}
