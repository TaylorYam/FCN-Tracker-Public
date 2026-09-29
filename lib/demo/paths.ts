/**
 * Authored scenario anchors for the synthetic underlyings.
 *
 * Levels are fractions of each underlying's initial fixing (1.0 = 100%).
 * Between anchors a seeded Brownian bridge fills in daily noise (see
 * `synthetic.ts`). Anchors pin the moments that define each scenario; the
 * scenario assertions in `__tests__/demo-products.test.ts` verify that the
 * generated paths still tell the intended story.
 */

import type { Anchor } from "./synthetic";

export type PathDefinition = { dailyVol: number; anchors: readonly Anchor[] };

export const SYNTHETIC_PATHS: Record<string, PathDefinition> = {
  // ── DEMO-FCN-001 — daily memory KO, no KI ────────────────────────────
  // ALPHA rallies inside the non-call period (ignored); ALPHA and BETA then
  // record KO in February; GAMMA, the laggard, only crosses in April — by
  // which time the other two are back below KO, so the three are never
  // above KO on the same day.
  ALPHA: {
    dailyVol: 0.01,
    anchors: [
      ["2025-01-06", 1.0],
      ["2025-01-23", 1.035],
      ["2025-02-04", 0.975],
      ["2025-02-18", 1.025],
      ["2025-03-04", 0.975],
      ["2025-03-21", 0.93],
      ["2025-04-09", 0.95],
      ["2025-05-07", 0.985],
      ["2025-06-30", 1.01],
    ],
  },
  BETA: {
    dailyVol: 0.009,
    anchors: [
      ["2025-01-06", 1.0],
      ["2025-02-07", 0.955],
      ["2025-03-07", 1.0],
      ["2025-03-13", 1.03],
      ["2025-03-26", 0.985],
      ["2025-04-09", 0.965],
      ["2025-05-14", 0.935],
      ["2025-06-30", 0.955],
    ],
  },
  GAMMA: {
    dailyVol: 0.011,
    anchors: [
      ["2025-01-06", 1.0],
      ["2025-02-06", 0.935],
      ["2025-03-10", 0.9],
      ["2025-03-31", 0.955],
      ["2025-04-10", 1.025],
      ["2025-04-22", 0.985],
      ["2025-05-20", 1.035],
      ["2025-06-30", 1.05],
    ],
  },

  // ── DEMO-FCN-002 — monthly non-memory KO, EKI ────────────────────────
  // All four close above KO on 22 Apr, which is not a monthly observation
  // date. On each monthly observation date at least one is below KO. SIGMA
  // then sells off to below strike, still above the KI barrier.
  DELTA: {
    dailyVol: 0.011,
    anchors: [
      ["2025-02-03", 1.0],
      ["2025-02-24", 0.97],
      ["2025-03-17", 1.0],
      ["2025-04-03", 1.02],
      ["2025-04-22", 1.05],
      ["2025-05-05", 1.04],
      ["2025-06-03", 0.995],
      ["2025-06-30", 1.035],
    ],
  },
  KAPPA: {
    dailyVol: 0.013,
    anchors: [
      ["2025-02-03", 1.0],
      ["2025-02-26", 1.03],
      ["2025-03-20", 0.95],
      ["2025-04-03", 0.97],
      ["2025-04-22", 1.03],
      ["2025-05-05", 1.02],
      ["2025-06-03", 0.96],
      ["2025-06-30", 0.965],
    ],
  },
  SIGMA: {
    dailyVol: 0.016,
    anchors: [
      ["2025-02-03", 1.0],
      ["2025-02-21", 1.04],
      ["2025-03-14", 0.97],
      ["2025-04-03", 0.99],
      ["2025-04-22", 1.035],
      ["2025-04-28", 0.93],
      ["2025-05-05", 0.9],
      ["2025-06-03", 0.79],
      ["2025-06-30", 0.69],
    ],
  },
  OMEGA: {
    dailyVol: 0.01,
    anchors: [
      ["2025-02-03", 1.0],
      ["2025-03-05", 0.96],
      ["2025-04-03", 1.01],
      ["2025-04-22", 1.04],
      ["2025-05-05", 1.03],
      ["2025-06-03", 1.0],
      ["2025-06-30", 1.01],
    ],
  },

  // ── DEMO-FCN-003 — daily memory KO, AKI, matured ─────────────────────
  // ZETA and LAMBDA record KO; THETA never does, breaches the 65% American
  // KI barrier in late February / March, and finishes below the 85% strike.
  ZETA: {
    dailyVol: 0.01,
    anchors: [
      ["2024-11-04", 1.0],
      ["2024-11-22", 1.02],
      ["2024-12-05", 0.99],
      ["2024-12-16", 1.03],
      ["2025-01-15", 0.99],
      ["2025-02-14", 0.95],
      ["2025-03-14", 0.93],
      ["2025-04-15", 0.97],
      ["2025-05-05", 0.99],
    ],
  },
  THETA: {
    dailyVol: 0.014,
    anchors: [
      ["2024-11-04", 1.0],
      ["2024-12-06", 0.92],
      ["2025-01-08", 0.84],
      ["2025-02-12", 0.74],
      ["2025-03-11", 0.625],
      ["2025-03-25", 0.69],
      ["2025-04-15", 0.74],
      ["2025-05-05", 0.78],
    ],
  },
  LAMBDA: {
    dailyVol: 0.009,
    anchors: [
      ["2024-11-04", 1.0],
      ["2024-12-10", 0.94],
      ["2025-01-10", 0.965],
      ["2025-01-29", 1.025],
      ["2025-02-20", 0.98],
      ["2025-03-20", 0.95],
      ["2025-04-17", 0.96],
      ["2025-05-05", 0.975],
    ],
  },
};
