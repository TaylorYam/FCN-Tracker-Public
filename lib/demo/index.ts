import type { DailyCloses, MarketDataSource } from "../market-data";
import { buildProductStateFromSource, type ProductState } from "../state";
import type { FCNProduct } from "../types";
import { SYNTHETIC_PATHS } from "./paths";
import { DEMO_PRODUCTS } from "./products";
import { generateSyntheticCloses } from "./synthetic";

/**
 * Fixed valuation date for the whole demo. Using a constant instead of the
 * wall clock keeps every page, chart and test reproducible.
 */
export const DEMO_AS_OF = "2025-06-30";

const productById: Record<string, FCNProduct> = Object.fromEntries(
  DEMO_PRODUCTS.map((p) => [p.id, p]),
);

/** Initial fixing per ticker, taken from the (synthetic) product terms. */
const initialPriceByTicker: Record<string, number> = Object.fromEntries(
  DEMO_PRODUCTS.flatMap((p) => p.underlyings.map((u) => [u.ticker, u.initialPrice])),
);

const closesCache = new Map<string, DailyCloses>();

/** Deterministic, in-memory, credential-free market-data source. */
export const syntheticMarketData: MarketDataSource = {
  getDailyCloses(ticker) {
    const cached = closesCache.get(ticker);
    if (cached) return cached;
    const path = SYNTHETIC_PATHS[ticker];
    const initialPrice = initialPriceByTicker[ticker];
    if (!path || initialPrice === undefined) return null;
    const closes = generateSyntheticCloses({ ticker, initialPrice, ...path });
    closesCache.set(ticker, closes);
    return closes;
  },
};

export function listDemoProducts(): FCNProduct[] {
  return DEMO_PRODUCTS;
}

export function getDemoProduct(id: string): FCNProduct | undefined {
  return productById[id];
}

export function getDemoProductState(id: string): ProductState | null {
  const product = productById[id];
  if (!product) return null;
  return buildProductStateFromSource(product, syntheticMarketData, DEMO_AS_OF);
}

export { DEMO_PRODUCTS };
