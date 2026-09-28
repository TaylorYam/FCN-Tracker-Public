import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { detectKIEvent } from "../lib/ki";
import type { PriceSeries } from "../lib/types";
import { makeProduct } from "./helpers";

const series: PriceSeries = {
  "2026-03-02": { A: 90, B: 190, C: 45 },
  "2026-04-01": { A: 64, B: 190, C: 45 }, // A at 64% — below a 65% KI
  "2026-05-01": { A: 80, B: 190, C: 45 },
  "2026-06-24": { A: 70, B: 150, C: 45 }, // final: worst A 70%
};

describe("detectKIEvent", () => {
  it("is not applicable without a KI barrier", () => {
    const p = makeProduct({ kiObservation: "NONE", kiLevel: 0 });
    assert.deepEqual(detectKIEvent(p, series, "2026-06-24"), { kind: "not-applicable" });
  });

  it("AKI: reports the first daily close below the barrier", () => {
    const p = makeProduct({ kiObservation: "AKI", kiLevel: 0.65 });
    const ev = detectKIEvent(p, series, "2026-06-24");
    assert.equal(ev.kind, "occurred");
    if (ev.kind === "occurred") {
      assert.equal(ev.date, "2026-04-01");
      assert.equal(ev.ticker, "A");
      assert.equal(ev.ratio, 0.64);
    }
  });

  it("AKI: only considers closes up to the requested date", () => {
    const p = makeProduct({ kiObservation: "AKI", kiLevel: 0.65 });
    assert.equal(detectKIEvent(p, series, "2026-03-31").kind, "not-occurred");
  });

  it("AKI: a close exactly at the barrier is not a breach (strict <)", () => {
    const p = makeProduct({ kiObservation: "AKI", kiLevel: 0.64 });
    assert.equal(detectKIEvent(p, series, "2026-06-24").kind, "not-occurred");
  });

  it("EKI: pending before the final valuation date", () => {
    const p = makeProduct({ kiObservation: "EKI", kiLevel: 0.65 });
    assert.equal(detectKIEvent(p, series, "2026-05-01").kind, "pending");
  });

  it("EKI: mid-tenor dips below KI do not count; only the final close does", () => {
    const p = makeProduct({ kiObservation: "EKI", kiLevel: 0.65 });
    // A dipped to 64% in April but finished at 70% ≥ 65%
    assert.equal(detectKIEvent(p, series, "2026-06-24").kind, "not-occurred");
  });

  it("EKI: occurs when the worst final close is below KI", () => {
    const p = makeProduct({ kiObservation: "EKI", kiLevel: 0.75 });
    const ev = detectKIEvent(p, series, "2026-06-24");
    assert.equal(ev.kind, "occurred");
    if (ev.kind === "occurred") assert.equal(ev.ticker, "A");
  });
});
