import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateSyntheticCloses, hashSeed, mulberry32 } from "../lib/demo/synthetic";
import { isBusinessDay, parseYmd } from "../lib/schedule";

const spec = {
  ticker: "TEST",
  initialPrice: 50,
  dailyVol: 0.012,
  anchors: [
    ["2025-01-06", 1.0],
    ["2025-02-03", 1.1],
    ["2025-03-03", 0.8],
  ] as const,
};

describe("synthetic price generator", () => {
  it("is deterministic for the same spec", () => {
    assert.deepEqual(generateSyntheticCloses(spec), generateSyntheticCloses(spec));
  });

  it("changes with the seed", () => {
    const a = generateSyntheticCloses(spec);
    const b = generateSyntheticCloses({ ...spec, seed: 42 });
    assert.notDeepEqual(a, b);
  });

  it("passes exactly through every anchor (to the cent)", () => {
    const closes = generateSyntheticCloses(spec);
    for (const [date, level] of spec.anchors) {
      assert.equal(closes[date], Math.round(spec.initialPrice * level * 100) / 100);
    }
  });

  it("produces business days only, from first to last anchor", () => {
    const dates = Object.keys(generateSyntheticCloses(spec)).sort();
    assert.equal(dates[0], "2025-01-06");
    assert.equal(dates.at(-1), "2025-03-03");
    assert.ok(dates.every((d) => isBusinessDay(parseYmd(d)!)));
  });

  it("rejects anchors that are not business days or not level 1.0 at start", () => {
    assert.throws(() =>
      generateSyntheticCloses({ ...spec, anchors: [["2025-01-06", 1], ["2025-01-11", 1.1]] }),
    );
    assert.throws(() =>
      generateSyntheticCloses({ ...spec, anchors: [["2025-01-06", 0.9], ["2025-01-10", 1.1]] }),
    );
  });

  it("PRNG and seed hash are stable", () => {
    assert.equal(hashSeed("ALPHA"), hashSeed("ALPHA"));
    assert.notEqual(hashSeed("ALPHA"), hashSeed("BETA"));
    const r = mulberry32(1);
    const x = r();
    assert.ok(x >= 0 && x < 1);
    assert.equal(mulberry32(1)(), x);
  });
});
