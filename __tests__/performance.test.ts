import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  computeUnderlyingPerformance,
  findWorstPerformer,
  worstBelowStrike,
} from "../lib/performance";
import { makeProduct } from "./helpers";

const product = makeProduct({ strikeLevel: 0.8, koLevel: 1.0 });

describe("worst-performing underlying", () => {
  it("picks the lowest price relative to initial, not the lowest price", () => {
    // A 90/100 = 0.90, B 170/200 = 0.85, C 48/50 = 0.96
    const worst = findWorstPerformer(product, { A: 90, B: 170, C: 48 });
    assert.deepEqual(worst, { ticker: "B", ratio: 0.85 });
  });

  it("ignores underlyings without a price", () => {
    const worst = findWorstPerformer(product, { A: 95, C: 49 });
    assert.equal(worst?.ticker, "A");
  });

  it("resolves ties to the first underlying in product order", () => {
    const worst = findWorstPerformer(product, { A: 90, B: 180, C: 45 });
    assert.equal(worst?.ticker, "A");
  });

  it("returns null when there are no prices", () => {
    assert.equal(findWorstPerformer(product, {}), null);
  });
});

describe("strike threshold", () => {
  it("does not flag the worst performer while it is at or above strike", () => {
    assert.equal(worstBelowStrike(product, { A: 80, B: 190, C: 49 }), null); // A exactly 80%
  });

  it("flags the worst performer once it is strictly below strike", () => {
    assert.equal(worstBelowStrike(product, { A: 79.99, B: 190, C: 49 }), "A");
  });

  it("computes per-underlying distances to KO and strike", () => {
    const rows = computeUnderlyingPerformance(product, { A: 104, B: 150, C: 50 });
    const [a, b, c] = rows;
    assert.ok(Math.abs(a.performance - 0.04) < 1e-12);
    assert.ok(Math.abs(a.koDistancePp - 4) < 1e-9);
    assert.equal(a.isBelowStrike, false);
    assert.ok(Math.abs(b.strikeDistancePp - -5) < 1e-9); // 75% vs 80%
    assert.equal(b.isBelowStrike, true);
    assert.equal(b.strikePrice, 160);
    assert.equal(b.koPrice, 200);
    assert.equal(c.ratio, 1);
    assert.equal(c.kiPrice, null); // product has no KI
  });

  it("falls back to the initial price when a close is missing", () => {
    const [a] = computeUnderlyingPerformance(product, {});
    assert.equal(a.currentPrice, 100);
    assert.equal(a.performance, 0);
  });
});
