import type { FCNProduct, Underlying } from "../lib/types";

/** Three fictional underlyings with round initial prices. */
export const U3: Underlying[] = [
  { ticker: "A", name: "A Co", initialPrice: 100, color: "#000" },
  { ticker: "B", name: "B Co", initialPrice: 200, color: "#111" },
  { ticker: "C", name: "C Co", initialPrice: 50, color: "#222" },
];

/**
 * A synthetic 4-period monthly FCN. Period 1 (non-call) ends 2026-03-24;
 * KO observation starts the same day, matching the retained engine tests.
 */
export function makeProduct(overrides: Partial<FCNProduct> = {}): FCNProduct {
  return {
    id: "test",
    code: "TEST-FCN",
    displayName: "Test",
    scenario: "test",
    underlyingsLabel: "A · B · C",
    tradeDate: "2026-02-24",
    initialObservationDate: "2026-02-24",
    koStartDate: "2026-03-24",
    expiryDate: "2026-06-24",
    termMonths: 4,
    couponRateAnnual: 0.12,
    couponPeriods: [
      { t: 1, observationStart: "2026-02-24", observationEnd: "2026-03-24", paymentDate: "2026-03-27" },
      { t: 2, observationStart: "2026-03-25", observationEnd: "2026-04-24", paymentDate: "2026-04-29" },
      { t: 3, observationStart: "2026-04-25", observationEnd: "2026-05-25", paymentDate: "2026-05-28" },
      { t: 4, observationStart: "2026-05-26", observationEnd: "2026-06-24", paymentDate: "2026-06-29" },
    ],
    koLevel: 1.0,
    koObservationFreq: "daily",
    hasMemoryKO: true,
    strikeLevel: 0.75,
    kiLevel: 0,
    kiObservation: "NONE",
    underlyings: U3,
    ...overrides,
  };
}
