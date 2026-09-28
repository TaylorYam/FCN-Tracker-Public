/**
 * SYNTHETIC DEMO PRODUCTS.
 *
 * Every identifier, underlying, date, price, level and coupon below is
 * fictional and exists only to exercise the monitoring engine. None of these
 * terms describe a real product, issuer or market instrument.
 */

import { buildMonthlyCouponSchedule } from "../schedule";
import type { FCNProduct } from "../types";

type ProductTerms = Omit<FCNProduct, "couponPeriods" | "koStartDate" | "expiryDate">;

/**
 * Monthly-coupon FCN with a one-month non-call period: KO observation starts
 * with coupon period 2; the final valuation date is the last period's
 * observation end.
 */
function monthlyFCN(terms: ProductTerms): FCNProduct {
  const couponPeriods = buildMonthlyCouponSchedule(terms.initialObservationDate, terms.termMonths);
  return {
    ...terms,
    couponPeriods,
    koStartDate: couponPeriods[1].observationStart,
    expiryDate: couponPeriods[couponPeriods.length - 1].observationEnd,
  };
}

export const DEMO_FCN_001 = monthlyFCN({
  id: "demo-fcn-001",
  code: "DEMO-FCN-001",
  displayName: "DEMO-FCN-001 · ALPHA / BETA / GAMMA",
  scenario:
    "Daily memory KO: each underlying's first close at or above KO is remembered; the note knocks out when the last laggard crosses — even though the three were never above KO on the same day.",
  underlyingsLabel: "ALPHA · BETA · GAMMA",
  tradeDate: "2025-01-06",
  initialObservationDate: "2025-01-06",
  termMonths: 6,
  couponRateAnnual: 0.14,
  koLevel: 1.0,
  koObservationFreq: "daily",
  hasMemoryKO: true,
  strikeLevel: 0.8,
  kiLevel: 0,
  kiObservation: "NONE",
  underlyings: [
    { ticker: "ALPHA", name: "Alpha Synthetic Corp", initialPrice: 142.6, color: "#136b66" },
    { ticker: "BETA", name: "Beta Synthetic Holdings", initialPrice: 88.35, color: "#b14724" },
    { ticker: "GAMMA", name: "Gamma Synthetic Systems", initialPrice: 61.2, color: "#7c3a5d" },
  ],
});

export const DEMO_FCN_002 = monthlyFCN({
  id: "demo-fcn-002",
  code: "DEMO-FCN-002",
  displayName: "DEMO-FCN-002 · DELTA / KAPPA / SIGMA / OMEGA",
  scenario:
    "Monthly non-memory KO with a European knock-in: all four must be at or above KO on the same monthly observation date. The worst performer now trades below strike but above KI.",
  underlyingsLabel: "DELTA · KAPPA · SIGMA · OMEGA",
  tradeDate: "2025-02-03",
  initialObservationDate: "2025-02-03",
  termMonths: 12,
  couponRateAnnual: 0.168,
  koLevel: 1.0,
  koObservationFreq: "monthly",
  hasMemoryKO: false,
  strikeLevel: 0.75,
  kiLevel: 0.6,
  kiObservation: "EKI",
  underlyings: [
    { ticker: "DELTA", name: "Delta Synthetic Energy", initialPrice: 54.8, color: "#5b6b24" },
    { ticker: "KAPPA", name: "Kappa Synthetic Robotics", initialPrice: 212.4, color: "#2f5d8a" },
    { ticker: "SIGMA", name: "Sigma Synthetic Biotech", initialPrice: 37.15, color: "#b14724" },
    { ticker: "OMEGA", name: "Omega Synthetic Networks", initialPrice: 128.9, color: "#7c3a5d" },
  ],
});

export const DEMO_FCN_003 = monthlyFCN({
  id: "demo-fcn-003",
  code: "DEMO-FCN-003",
  displayName: "DEMO-FCN-003 · ZETA / THETA / LAMBDA",
  scenario:
    "Daily memory KO with an American knock-in: two underlyings recorded KO, the laggard breached KI mid-tenor and finished below strike, so the matured note settles by physical delivery.",
  underlyingsLabel: "ZETA · THETA · LAMBDA",
  tradeDate: "2024-11-04",
  initialObservationDate: "2024-11-04",
  termMonths: 6,
  couponRateAnnual: 0.132,
  koLevel: 1.0,
  koObservationFreq: "daily",
  hasMemoryKO: true,
  strikeLevel: 0.85,
  kiLevel: 0.65,
  kiObservation: "AKI",
  underlyings: [
    { ticker: "ZETA", name: "Zeta Synthetic Materials", initialPrice: 73.45, color: "#136b66" },
    { ticker: "THETA", name: "Theta Synthetic Retail", initialPrice: 45.6, color: "#b14724" },
    { ticker: "LAMBDA", name: "Lambda Synthetic Logistics", initialPrice: 196.3, color: "#2f5d8a" },
  ],
});

export const DEMO_PRODUCTS: FCNProduct[] = [DEMO_FCN_001, DEMO_FCN_002, DEMO_FCN_003];
