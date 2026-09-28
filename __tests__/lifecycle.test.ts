import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { deriveKOState } from "../lib/fcn";
import {
  deriveLifecycle,
  deriveMaturitySettlement,
  latestCompleteDate,
  nextKOObservationDate,
} from "../lib/lifecycle";
import type { FCNProduct, PriceSeries } from "../lib/types";
import { makeProduct } from "./helpers";

function lifecycleAt(product: FCNProduct, series: PriceSeries, asOf: string) {
  const clipped = Object.fromEntries(Object.entries(series).filter(([d]) => d <= asOf));
  return deriveLifecycle(product, clipped, asOf, deriveKOState(product, clipped));
}

/** Final closes on the expiry date (2026-06-24) with worst performer A. */
function finalSeries(aFinal: number, extra: PriceSeries = {}): PriceSeries {
  return {
    "2026-03-02": { A: 95, B: 190, C: 48 },
    ...extra,
    "2026-06-24": { A: aFinal, B: 190, C: 48 },
  };
}

describe("maturity state — settlement", () => {
  it("no KI: redeems at par when the worst performer finishes at strike", () => {
    const p = makeProduct({ strikeLevel: 0.75 });
    const s = deriveMaturitySettlement(p, finalSeries(75));
    assert.equal(s?.type, "par-redemption");
  });

  it("no KI: physical delivery when the worst performer finishes below strike", () => {
    const p = makeProduct({ strikeLevel: 0.75 });
    const s = deriveMaturitySettlement(p, finalSeries(60));
    assert.equal(s?.type, "physical-delivery");
    if (s?.type === "physical-delivery") {
      assert.equal(s.worstTicker, "A");
      assert.equal(s.deliveryPrice, 75); // initial 100 × 75%
      assert.ok(Math.abs(s.indicativeValuePct - 0.8) < 1e-12); // 60% ÷ 75%
    }
  });

  it("EKI: below strike but above KI at maturity → par", () => {
    const p = makeProduct({ strikeLevel: 0.75, kiLevel: 0.6, kiObservation: "EKI" });
    assert.equal(deriveMaturitySettlement(p, finalSeries(65))?.type, "par-redemption");
  });

  it("EKI: below KI at maturity → physical delivery", () => {
    const p = makeProduct({ strikeLevel: 0.75, kiLevel: 0.6, kiObservation: "EKI" });
    assert.equal(deriveMaturitySettlement(p, finalSeries(55))?.type, "physical-delivery");
  });

  it("AKI: an earlier breach plus a sub-strike finish → physical delivery", () => {
    const p = makeProduct({ strikeLevel: 0.75, kiLevel: 0.6, kiObservation: "AKI" });
    const s = deriveMaturitySettlement(p, finalSeries(70, { "2026-04-10": { A: 58, B: 190, C: 48 } }));
    assert.equal(s?.type, "physical-delivery");
  });

  it("AKI: an earlier breach but a finish at/above strike → par", () => {
    const p = makeProduct({ strikeLevel: 0.75, kiLevel: 0.6, kiObservation: "AKI" });
    const s = deriveMaturitySettlement(p, finalSeries(80, { "2026-04-10": { A: 58, B: 190, C: 48 } }));
    assert.equal(s?.type, "par-redemption");
  });

  it("AKI: no breach during the tenor → par even below strike", () => {
    const p = makeProduct({ strikeLevel: 0.75, kiLevel: 0.6, kiObservation: "AKI" });
    assert.equal(deriveMaturitySettlement(p, finalSeries(70))?.type, "par-redemption");
  });

  it("returns null when final closes are missing", () => {
    assert.equal(deriveMaturitySettlement(makeProduct(), { "2026-03-02": { A: 1, B: 1, C: 1 } }), null);
  });
});

describe("lifecycle status", () => {
  const product = makeProduct(); // KO start 2026-03-24, expiry 2026-06-24
  const quiet: PriceSeries = {
    "2026-03-02": { A: 95, B: 190, C: 48 },
    "2026-04-01": { A: 96, B: 191, C: 48 },
    "2026-06-24": { A: 97, B: 192, C: 49 },
  };

  it("non-call before the KO start date", () => {
    const lc = lifecycleAt(product, quiet, "2026-03-10");
    assert.equal(lc.status, "non-call");
    assert.equal(lc.valuationDate, "2026-03-02");
    assert.equal(lc.nextKOObservationDate, "2026-03-24");
  });

  it("ko-observation between KO start and expiry", () => {
    const lc = lifecycleAt(product, quiet, "2026-04-01");
    assert.equal(lc.status, "ko-observation");
    assert.equal(lc.settlement, null);
    assert.equal(lc.nextKOObservationDate, "2026-04-02");
  });

  it("knocked-out once the KO condition is met, valued at the trigger date", () => {
    const series: PriceSeries = { ...quiet, "2026-04-15": { A: 101, B: 201, C: 51 } };
    const lc = lifecycleAt(product, series, "2026-06-30");
    assert.equal(lc.status, "knocked-out");
    assert.equal(lc.valuationDate, "2026-04-15");
    assert.equal(lc.nextKOObservationDate, null);
    assert.deepEqual(lc.settlement, { type: "early-redemption", date: "2026-04-15", redemptionPct: 1 });
  });

  it("matured on or after the final valuation date without KO", () => {
    const lc = lifecycleAt(product, quiet, "2026-06-24");
    assert.equal(lc.status, "matured");
    assert.equal(lc.valuationDate, "2026-06-24");
    assert.equal(lc.settlement?.type, "par-redemption");
  });

  it("latestCompleteDate requires a close for every underlying", () => {
    const partial: PriceSeries = { ...quiet, "2026-05-01": { A: 1, B: 1 } };
    assert.equal(latestCompleteDate(product, partial, "2026-05-10"), "2026-04-01");
  });
});

describe("next KO observation date", () => {
  it("daily: next business day after as-of", () => {
    const p = makeProduct();
    assert.equal(nextKOObservationDate(p, "2026-04-03"), "2026-04-06"); // Fri → Mon
  });

  it("daily: never before the KO start date", () => {
    assert.equal(nextKOObservationDate(makeProduct(), "2026-03-01"), "2026-03-24");
  });

  it("daily: none after the final valuation date", () => {
    assert.equal(nextKOObservationDate(makeProduct(), "2026-06-24"), null);
  });

  it("monthly: next scheduled period end after as-of", () => {
    const p = makeProduct({ koObservationFreq: "monthly" });
    assert.equal(nextKOObservationDate(p, "2026-04-24"), "2026-05-25");
    assert.equal(nextKOObservationDate(p, "2026-06-24"), null);
  });
});
