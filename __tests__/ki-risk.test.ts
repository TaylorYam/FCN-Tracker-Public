import assert from "node:assert/strict";
import test from "node:test";
import { getWorstKIRisk } from "../lib/ki-risk";
import { makeProduct } from "./helpers";

const BASE = makeProduct({
  strikeLevel: 0.65,
  kiLevel: 0.55,
  kiObservation: "EKI",
  underlyings: [
    { ticker: "AAA", name: "AAA", initialPrice: 100, color: "#000" },
    { ticker: "BBB", name: "BBB", initialPrice: 200, color: "#111" },
  ],
});

test("does not show KI risk before the worst underlying falls below K", () => {
  assert.equal(getWorstKIRisk(BASE, { AAA: 70, BBB: 140 }), null);
});

test("returns the worst underlying and its distance above KI", () => {
  const risk = getWorstKIRisk(BASE, { AAA: 60, BBB: 130 });
  assert.ok(risk);
  assert.equal(risk.ticker, "AAA");
  assert.equal(risk.currentRatio, 0.6);
  assert.ok(Math.abs(risk.kiPrice - 55) < 1e-9);
  assert.ok(Math.abs(risk.distancePercentagePoints - 5) < 1e-9);
  assert.equal(risk.isBelowKI, false);
});

test("reports a negative distance once the worst underlying is below KI", () => {
  const risk = getWorstKIRisk(BASE, { AAA: 50, BBB: 120 });
  assert.ok(risk);
  assert.ok(Math.abs(risk.distancePercentagePoints + 5) < 1e-9);
  assert.equal(risk.isBelowKI, true);
});

test("does not show KI risk for a product without KI", () => {
  const noKI = { ...BASE, kiObservation: "NONE" as const, kiLevel: 0 };
  assert.equal(getWorstKIRisk(noKI, { AAA: 50, BBB: 120 }), null);
});
