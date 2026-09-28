import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  computeHasReachedKO,
  computeKOTrigger,
  deriveKOState,
  getObservationDates,
  getScheduledMonthlyObservationDates,
  observationModeLabel,
} from "../lib/fcn";
import type { FCNProduct, PriceSeries, Underlying } from "../lib/types";

const underlyings: Underlying[] = [
  { ticker: "A", name: "A Co", initialPrice: 100, color: "#fff" },
  { ticker: "B", name: "B Co", initialPrice: 200, color: "#fff" },
  { ticker: "C", name: "C Co", initialPrice: 50, color: "#fff" },
];

const koStart = "2026-03-24";

const baseProduct: FCNProduct = {
  id: "test",
  code: "TEST-FCN",
  displayName: "Test",
  scenario: "test",
  underlyingsLabel: "A · B · C",
  tradeDate: "2026-02-24",
  expiryDate: "2026-09-03",
  koStartDate: koStart,
  initialObservationDate: "2026-03-03",
  termMonths: 6,
  couponRateAnnual: 0.16,
  couponPeriods: [
    { t: 1, observationStart: "2026-02-24", observationEnd: "2026-03-24", paymentDate: "2026-03-27" },
    { t: 2, observationStart: "2026-03-24", observationEnd: "2026-04-24", paymentDate: "2026-04-27" },
    { t: 3, observationStart: "2026-04-24", observationEnd: "2026-05-24", paymentDate: "2026-05-27" },
    { t: 4, observationStart: "2026-05-24", observationEnd: "2026-06-24", paymentDate: "2026-06-27" },
  ],
  koLevel: 1.0,
  koObservationFreq: "daily",
  strikeLevel: 0.75,
  kiLevel: 0.65,
  kiObservation: "EKI",
  hasMemoryKO: true,
  underlyings,
};

describe("computeHasReachedKO", () => {
  it("returns reached=false for every ticker when no close reaches KO", () => {
    const series: PriceSeries = {
      "2026-04-01": { A: 95, B: 190, C: 48 },
      "2026-04-02": { A: 99, B: 198, C: 49 },
    };
    const result = computeHasReachedKO(series, koStart, underlyings, 1.0);
    assert.equal(result.A.reached, false);
    assert.equal(result.B.reached, false);
    assert.equal(result.C.reached, false);
    assert.equal(result.A.reachedDate, null);
  });

  it("ignores closes before koStartDate even if they cross KO", () => {
    const series: PriceSeries = {
      "2026-03-10": { A: 110, B: 220, C: 55 },
      "2026-04-01": { A: 95, B: 190, C: 48 },
    };
    const result = computeHasReachedKO(series, koStart, underlyings, 1.0);
    assert.equal(result.A.reached, false, "lockup violation: A");
    assert.equal(result.B.reached, false, "lockup violation: B");
    assert.equal(result.C.reached, false, "lockup violation: C");
  });

  it("records the first qualifying date per ticker", () => {
    const series: PriceSeries = {
      "2026-04-01": { A: 99, B: 195, C: 49 },
      "2026-04-02": { A: 101, B: 195, C: 49 },
      "2026-04-03": { A: 105, B: 199, C: 49 },
      "2026-04-04": { A: 105, B: 210, C: 49 },
    };
    const result = computeHasReachedKO(series, koStart, underlyings, 1.0);
    assert.equal(result.A.reachedDate, "2026-04-02");
    assert.equal(result.B.reachedDate, "2026-04-04");
    assert.equal(result.C.reached, false);
  });

  it("treats reaching exactly KO level as reached (>=)", () => {
    const series: PriceSeries = {
      "2026-04-01": { A: 100, B: 200, C: 50 },
    };
    const result = computeHasReachedKO(series, koStart, underlyings, 1.0);
    assert.equal(result.A.reached, true);
    assert.equal(result.B.reached, true);
    assert.equal(result.C.reached, true);
  });

  it("scales the threshold by koLevel", () => {
    const series: PriceSeries = { "2026-04-01": { A: 102, B: 206, C: 51.4 } };
    const result = computeHasReachedKO(series, koStart, underlyings, 1.03);
    assert.equal(result.A.reached, false); // needs 103
    assert.equal(result.B.reached, true); // needs 206
    assert.equal(result.C.reached, false); // needs 51.5
  });
});

describe("computeKOTrigger", () => {
  it("returns triggered=false when any ticker has not reached KO", () => {
    const reached = {
      A: { reached: true, reachedDate: "2026-04-01" },
      B: { reached: true, reachedDate: "2026-05-01" },
      C: { reached: false, reachedDate: null },
    };
    const trigger = computeKOTrigger(reached);
    assert.equal(trigger.triggered, false);
    assert.equal(trigger.triggerDate, null);
  });

  it("returns triggered=true with the latest reached date when all reach", () => {
    const reached = {
      A: { reached: true, reachedDate: "2026-04-01" },
      B: { reached: true, reachedDate: "2026-05-15" },
      C: { reached: true, reachedDate: "2026-04-22" },
    };
    const trigger = computeKOTrigger(reached);
    assert.equal(trigger.triggered, true);
    assert.equal(trigger.triggerDate, "2026-05-15");
  });

  it("handles empty input as not triggered", () => {
    const trigger = computeKOTrigger({});
    assert.equal(trigger.triggered, false);
  });
});

describe("deriveKOState (memory, daily)", () => {
  it("does not trigger when only some underlyings cross", () => {
    const series: PriceSeries = {
      "2026-04-01": { A: 105, B: 195, C: 55 },
      "2026-04-02": { A: 110, B: 195, C: 55 },
    };
    const { trigger } = deriveKOState(baseProduct, series);
    assert.equal(trigger.triggered, false);
  });

  it("triggers exactly on the date the last laggard crosses", () => {
    const series: PriceSeries = {
      "2026-04-01": { A: 105, B: 200, C: 49 },
      "2026-05-10": { A: 105, B: 200, C: 49 },
      "2026-06-01": { A: 105, B: 200, C: 50 },
    };
    const { trigger, reachedKO } = deriveKOState(baseProduct, series);
    assert.equal(reachedKO.A.reachedDate, "2026-04-01");
    assert.equal(reachedKO.B.reachedDate, "2026-04-01");
    assert.equal(reachedKO.C.reachedDate, "2026-06-01");
    assert.equal(trigger.triggered, true);
    assert.equal(trigger.triggerDate, "2026-06-01");
  });

  it("remembers crossings on different days even after prices fall back", () => {
    const series: PriceSeries = {
      "2026-04-01": { A: 101, B: 190, C: 45 }, // A records
      "2026-04-02": { A: 90, B: 201, C: 45 }, // B records, A back below
      "2026-04-03": { A: 90, B: 190, C: 50.5 }, // C records, A & B below
    };
    const { trigger } = deriveKOState(baseProduct, series);
    assert.equal(trigger.triggered, true);
    assert.equal(trigger.triggerDate, "2026-04-03");
  });

  it("respects lockup: pre-koStartDate crossings do not count", () => {
    const series: PriceSeries = {
      "2026-03-01": { A: 200, B: 400, C: 100 },
      "2026-04-01": { A: 99, B: 199, C: 49 },
    };
    const { trigger, reachedKO } = deriveKOState(baseProduct, series);
    assert.equal(reachedKO.A.reached, false);
    assert.equal(trigger.triggered, false);
  });
});

describe("deriveKOState (non-memory, daily)", () => {
  const product: FCNProduct = { ...baseProduct, hasMemoryKO: false };

  it("does NOT trigger when all stocks crossed but on different days", () => {
    const series: PriceSeries = {
      "2026-04-01": { A: 105, B: 199, C: 55 }, // A up
      "2026-04-02": { A: 99, B: 210, C: 55 }, // B up
      "2026-04-03": { A: 99, B: 199, C: 55 }, // C up
    };
    const { trigger, reachedKO } = deriveKOState(product, series);
    assert.equal(trigger.triggered, false);
    assert.equal(reachedKO.A.reached, false);
    assert.equal(reachedKO.B.reached, false);
    assert.equal(reachedKO.C.reached, false);
  });

  it("triggers on the first date all stocks are simultaneously >= KO", () => {
    const series: PriceSeries = {
      "2026-04-01": { A: 105, B: 199, C: 55 }, // B below
      "2026-04-02": { A: 99, B: 210, C: 55 }, // A below
      "2026-04-03": { A: 99, B: 210, C: 49 }, // A & C below
      "2026-04-04": { A: 105, B: 210, C: 55 }, // all up first time
    };
    const { trigger, reachedKO } = deriveKOState(product, series);
    assert.equal(trigger.triggered, true);
    assert.equal(trigger.triggerDate, "2026-04-04");
    assert.equal(reachedKO.A.reachedDate, "2026-04-04");
  });

  it("respects lockup even for non-memory", () => {
    const series: PriceSeries = {
      "2026-03-01": { A: 200, B: 400, C: 100 }, // pre-lockup, ignored
      "2026-04-01": { A: 99, B: 199, C: 49 },
    };
    const { trigger } = deriveKOState(product, series);
    assert.equal(trigger.triggered, false);
  });
});

describe("deriveKOState (memory, monthly)", () => {
  const product: FCNProduct = { ...baseProduct, koObservationFreq: "monthly" };

  it("ignores intra-month all-up days and triggers only on monthly obs date", () => {
    const series: PriceSeries = {
      "2026-04-01": { A: 105, B: 210, C: 55 }, // all up but not obs date
      "2026-04-15": { A: 99, B: 199, C: 49 },
      "2026-04-24": { A: 99, B: 199, C: 49 }, // monthly obs: not crossed
      "2026-05-24": { A: 105, B: 210, C: 55 }, // monthly obs: all up
    };
    const { trigger, reachedKO } = deriveKOState(product, series);
    assert.equal(reachedKO.A.reachedDate, "2026-05-24");
    assert.equal(reachedKO.B.reachedDate, "2026-05-24");
    assert.equal(reachedKO.C.reachedDate, "2026-05-24");
    assert.equal(trigger.triggered, true);
    assert.equal(trigger.triggerDate, "2026-05-24");
  });

  it("remembers monthly records across observation dates", () => {
    const series: PriceSeries = {
      "2026-04-24": { A: 105, B: 199, C: 49 }, // A records
      "2026-05-24": { A: 95, B: 205, C: 49 }, // B records
      "2026-06-24": { A: 95, B: 190, C: 51 }, // C records → KO
    };
    const { trigger } = deriveKOState(product, series);
    assert.equal(trigger.triggered, true);
    assert.equal(trigger.triggerDate, "2026-06-24");
  });
});

describe("deriveKOState (non-memory, monthly)", () => {
  const product: FCNProduct = {
    ...baseProduct,
    koObservationFreq: "monthly",
    hasMemoryKO: false,
  };

  it("only triggers on a monthly obs date when all stocks simultaneously up", () => {
    const series: PriceSeries = {
      "2026-04-15": { A: 105, B: 210, C: 55 }, // all up but not monthly obs
      "2026-04-24": { A: 99, B: 210, C: 55 }, // monthly obs: A below
      "2026-05-24": { A: 105, B: 210, C: 55 }, // monthly obs: all up
    };
    const { trigger } = deriveKOState(product, series);
    assert.equal(trigger.triggered, true);
    assert.equal(trigger.triggerDate, "2026-05-24");
  });

  it("does not trigger if no monthly obs date has all up simultaneously", () => {
    const series: PriceSeries = {
      "2026-04-24": { A: 105, B: 199, C: 55 },
      "2026-05-24": { A: 99, B: 210, C: 55 },
      "2026-06-24": { A: 105, B: 199, C: 55 },
    };
    const { trigger } = deriveKOState(product, series);
    assert.equal(trigger.triggered, false);
  });
});

describe("observation-period handling", () => {
  const series: PriceSeries = {
    "2026-03-20": { A: 1, B: 1, C: 1 },
    "2026-03-24": { A: 1, B: 1, C: 1 },
    "2026-04-10": { A: 1, B: 1, C: 1 },
    "2026-04-24": { A: 1, B: 1, C: 1 },
    // no snapshot on 2026-05-24
    "2026-06-24": { A: 1, B: 1, C: 1 },
  };

  it("daily: every data date on or after koStartDate, ascending", () => {
    assert.deepEqual(getObservationDates(baseProduct, series), [
      "2026-03-24",
      "2026-04-10",
      "2026-04-24",
      "2026-06-24",
    ]);
  });

  it("monthly: period ends from period 2 onward, only where a close exists", () => {
    const monthly = { ...baseProduct, koObservationFreq: "monthly" as const };
    // period 1 end (2026-03-24) is the non-call period → excluded;
    // 2026-05-24 has no close → skipped.
    assert.deepEqual(getObservationDates(monthly, series), ["2026-04-24", "2026-06-24"]);
  });

  it("scheduled monthly dates ignore data availability", () => {
    assert.deepEqual(getScheduledMonthlyObservationDates(baseProduct), [
      "2026-04-24",
      "2026-05-24",
      "2026-06-24",
    ]);
  });

  it("labels the observation mode", () => {
    assert.equal(observationModeLabel(baseProduct), "Daily · Memory");
    assert.equal(
      observationModeLabel({ koObservationFreq: "monthly", hasMemoryKO: false }),
      "Monthly · Non-memory",
    );
  });
});
