/** Daily series of close prices, keyed by YYYY-MM-DD then ticker. */
export type PriceSeries = {
  [date: string]: { [ticker: string]: number };
};

export type Underlying = {
  ticker: string;
  name: string;
  /** Fixing price on the initial observation date (100% reference level). */
  initialPrice: number;
  color: string;
};

/** One coupon period. All dates are YYYY-MM-DD. */
export type CouponPeriod = {
  t: number;
  observationStart: string;
  observationEnd: string;
  paymentDate: string;
};

/**
 * KO observation frequency.
 * - "daily": every trading day on or after `koStartDate`
 * - "monthly": only on each coupon period's `observationEnd`, excluding
 *   period 1 (the non-call period)
 */
export type KOObservationFreq = "daily" | "monthly";

/**
 * Knock-in observation style.
 * - "EKI": European — evaluated once, on the final valuation date
 * - "AKI": American — evaluated on every daily close during the tenor
 * - "NONE": no knock-in barrier; strike alone decides maturity settlement
 */
export type KIObservation = "EKI" | "AKI" | "NONE";

export type FCNProduct = {
  /** URL slug, e.g. "demo-fcn-001". */
  id: string;
  /** Display identifier, e.g. "DEMO-FCN-001". Synthetic — not a registry code. */
  code: string;
  displayName: string;
  /** One-line description of the lifecycle scenario the demo illustrates. */
  scenario: string;
  underlyingsLabel: string;
  tradeDate: string;
  initialObservationDate: string;
  /** First date on which KO is observed. Before it: non-call period. */
  koStartDate: string;
  /** Final valuation date (last coupon period's observation end). */
  expiryDate: string;
  termMonths: number;
  couponRateAnnual: number;
  couponPeriods: CouponPeriod[];
  /** KO barrier as a fraction of initial price, e.g. 1.0 = 100%. */
  koLevel: number;
  koObservationFreq: KOObservationFreq;
  /** true = memory KO (each underlying remembers having crossed); false = same-day all-above. */
  hasMemoryKO: boolean;
  /** Strike as a fraction of initial price, e.g. 0.8 = 80%. */
  strikeLevel: number;
  /** KI barrier as a fraction of initial price; 0 when `kiObservation` is "NONE". */
  kiLevel: number;
  kiObservation: KIObservation;
  underlyings: Underlying[];
};
