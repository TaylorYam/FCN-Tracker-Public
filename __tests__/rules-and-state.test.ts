import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assembleProductSeries, type DailyCloses, type MarketDataSource } from "../lib/market-data";
import { evaluateKIStyleMatrix, evaluateKORuleMatrix } from "../lib/rules";
import { buildProductState } from "../lib/state";
import type { PriceSeries } from "../lib/types";
import { makeProduct } from "./helpers";

describe("KO rule matrix", () => {
  // KO start 2026-03-24; monthly obs dates 04-24, 05-25, 06-24.
  const series: PriceSeries = {
    "2026-04-01": { A: 101, B: 190, C: 45 }, // A up
    "2026-04-02": { A: 90, B: 205, C: 45 }, // B up
    "2026-04-06": { A: 90, B: 190, C: 51 }, // C up → daily memory KO
    "2026-04-24": { A: 90, B: 190, C: 45 }, // monthly obs: none up
  };
  const product = makeProduct();
  const matrix = evaluateKORuleMatrix(product, series);
  const by = (label: string) => matrix.find((m) => m.label === label)!;

  it("evaluates all four rule combinations and flags the product's own", () => {
    assert.equal(matrix.length, 4);
    assert.equal(matrix.filter((m) => m.isProductRule).length, 1);
    assert.equal(by("Daily · Memory").isProductRule, true);
  });

  it("memory vs non-memory diverge on the same path", () => {
    assert.equal(by("Daily · Memory").trigger.triggerDate, "2026-04-06");
    assert.equal(by("Daily · Non-memory").trigger.triggered, false);
    assert.equal(by("Monthly · Memory").trigger.triggered, false);
    assert.equal(by("Monthly · Memory").reachedCount, 0);
  });

  it("KI-style matrix changes only the KI rule", () => {
    const p = makeProduct({ strikeLevel: 0.75, kiLevel: 0.6, kiObservation: "AKI" });
    const s: PriceSeries = {
      "2026-04-10": { A: 58, B: 190, C: 48 }, // AKI breach
      "2026-06-24": { A: 70, B: 190, C: 48 }, // final 70% — below strike, above KI
    };
    const out = Object.fromEntries(evaluateKIStyleMatrix(p, s).map((k) => [k.kiObservation, k.settlement?.type]));
    assert.deepEqual(out, { NONE: "physical-delivery", EKI: "par-redemption", AKI: "physical-delivery" });
  });
});

describe("product state assembly", () => {
  const product = makeProduct();
  const closes: Record<string, DailyCloses> = {
    A: { "2026-02-20": 99, "2026-02-24": 100, "2026-04-01": 96, "2026-07-01": 90 },
    B: { "2026-02-24": 200, "2026-04-01": 194, "2026-07-01": 180 },
    C: { "2026-02-24": 50, "2026-04-01": 49 },
  };
  const source: MarketDataSource = { getDailyCloses: (ticker) => closes[ticker] ?? null };

  it("drops pre-trade-date closes when assembling the per-product series", () => {
    const series = assembleProductSeries(product, source);
    assert.equal(series["2026-02-20"], undefined);
    assert.deepEqual(series["2026-04-01"], { A: 96, B: 194, C: 49 });
  });

  it("clips to the as-of date and uses the latest complete date", () => {
    const state = buildProductState(product, assembleProductSeries(product, source), "2026-05-01");
    assert.equal(state.lastTradingDate, "2026-04-01");
    assert.deepEqual(state.prices, { A: 96, B: 194, C: 49 });
    assert.equal(state.lifecycle.status, "ko-observation");
  });

  it("never evaluates closes after the final valuation date", () => {
    const state = buildProductState(product, assembleProductSeries(product, source), "2026-12-31");
    assert.equal(Object.keys(state.series).some((d) => d > product.expiryDate), false);
  });
});
