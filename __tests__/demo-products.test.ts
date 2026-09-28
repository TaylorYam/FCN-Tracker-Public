/**
 * Scenario assertions: the generated synthetic paths must keep telling the
 * story each demo product is meant to illustrate. If an anchor or the
 * generator changes, these tests catch a silently broken narrative.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DEMO_AS_OF, DEMO_PRODUCTS, getDemoProductState, syntheticMarketData } from "../lib/demo";
import { SYNTHETIC_PATHS } from "../lib/demo/paths";
import { evaluateKIStyleMatrix, evaluateKORuleMatrix } from "../lib/rules";
import { isBusinessDay, parseYmd } from "../lib/schedule";

const state = (id: string) => {
  const s = getDemoProductState(id);
  assert.ok(s, `missing demo product ${id}`);
  return s;
};

describe("demo product catalogue", () => {
  it("contains exactly three clearly synthetic products", () => {
    assert.deepEqual(
      DEMO_PRODUCTS.map((p) => p.code),
      ["DEMO-FCN-001", "DEMO-FCN-002", "DEMO-FCN-003"],
    );
    for (const p of DEMO_PRODUCTS) {
      assert.match(p.id, /^demo-fcn-\d{3}$/);
      for (const u of p.underlyings) {
        assert.match(u.name, /Synthetic/, `${u.ticker} name should be marked synthetic`);
      }
    }
  });

  it("defines a synthetic path for every underlying, starting at its initial fixing", () => {
    for (const p of DEMO_PRODUCTS) {
      for (const u of p.underlyings) {
        assert.ok(SYNTHETIC_PATHS[u.ticker], `no path for ${u.ticker}`);
        const closes = syntheticMarketData.getDailyCloses(u.ticker)!;
        assert.equal(closes[p.initialObservationDate], u.initialPrice);
        assert.ok(Object.keys(closes).every((d) => isBusinessDay(parseYmd(d)!)));
      }
    }
  });

  it("is reproducible", () => {
    const a = JSON.stringify(state("demo-fcn-002"));
    const b = JSON.stringify(state("demo-fcn-002"));
    assert.equal(a, b);
  });

  it("uses a fixed valuation date", () => {
    assert.equal(DEMO_AS_OF, "2025-06-30");
  });
});

describe("DEMO-FCN-001 — daily memory KO, no KI", () => {
  const s = state("demo-fcn-001");
  const p = s.config;

  it("has the intended terms", () => {
    assert.equal(p.underlyings.length, 3);
    assert.equal(p.termMonths, 6);
    assert.equal(p.koObservationFreq, "daily");
    assert.equal(p.hasMemoryKO, true);
    assert.equal(p.kiObservation, "NONE");
  });

  it("ignores a non-call-period rally above KO", () => {
    const alpha = p.underlyings.find((u) => u.ticker === "ALPHA")!;
    const preKOStart = Object.entries(s.series).filter(([d]) => d < p.koStartDate);
    assert.ok(preKOStart.some(([, day]) => day.ALPHA >= alpha.initialPrice * p.koLevel));
    assert.ok(s.ko.reachedKO.ALPHA.reachedDate! >= p.koStartDate);
  });

  it("knocks out on the date the last laggard crosses", () => {
    assert.equal(s.lifecycle.status, "knocked-out");
    const dates = Object.values(s.ko.reachedKO).map((r) => r.reachedDate!);
    assert.equal(s.ko.trigger.triggerDate, [...dates].sort().at(-1));
    assert.equal(s.ko.reachedKO.GAMMA.reachedDate, s.ko.trigger.triggerDate);
  });

  it("would NOT knock out under non-memory rules (never all above on one day)", () => {
    const nonMemory = evaluateKORuleMatrix(p, s.series).find(
      (m) => m.koObservationFreq === "daily" && !m.hasMemoryKO,
    )!;
    assert.equal(nonMemory.trigger.triggered, false);
  });

  it("pays the KO-period coupon with redemption and cancels the rest", () => {
    const statuses = s.coupons.rows.map((r) => r.status);
    const ko = statuses.findIndex((x) => x === "paid-with-redemption");
    assert.ok(ko > 0);
    assert.ok(statuses.slice(0, ko).every((x) => x === "paid"));
    assert.ok(statuses.slice(ko + 1).every((x) => x === "cancelled"));
  });
});

describe("DEMO-FCN-002 — monthly non-memory KO, EKI", () => {
  const s = state("demo-fcn-002");
  const p = s.config;

  it("has the intended terms", () => {
    assert.equal(p.underlyings.length, 4);
    assert.equal(p.koObservationFreq, "monthly");
    assert.equal(p.hasMemoryKO, false);
    assert.equal(p.kiObservation, "EKI");
  });

  it("is active and not knocked out", () => {
    assert.equal(s.lifecycle.status, "ko-observation");
    assert.equal(s.ko.trigger.triggered, false);
    assert.equal(s.lifecycle.kiEvent.kind, "pending");
    assert.ok(s.lifecycle.nextKOObservationDate! > DEMO_AS_OF);
  });

  it("had all four above KO on a non-observation day — which a daily rule would count", () => {
    const daily = evaluateKORuleMatrix(p, s.series).filter((m) => m.koObservationFreq === "daily");
    assert.ok(daily.every((m) => m.trigger.triggered));
  });

  it("had one laggard below KO on every monthly observation date so far", () => {
    const monthlyMemory = evaluateKORuleMatrix(p, s.series).find(
      (m) => m.koObservationFreq === "monthly" && m.hasMemoryKO,
    )!;
    assert.equal(monthlyMemory.trigger.triggered, false);
    assert.equal(monthlyMemory.reachedCount, 3);
  });

  it("worst performer is below strike but above KI", () => {
    const sigma = s.prices.SIGMA / p.underlyings.find((u) => u.ticker === "SIGMA")!.initialPrice;
    assert.ok(sigma < p.strikeLevel);
    assert.ok(sigma > p.kiLevel);
    for (const u of p.underlyings) {
      assert.ok(s.prices[u.ticker] / u.initialPrice >= sigma);
    }
  });
});

describe("DEMO-FCN-003 — daily memory KO, AKI, matured", () => {
  const s = state("demo-fcn-003");
  const p = s.config;

  it("has matured without a knock-out, two of three recorded", () => {
    assert.equal(s.lifecycle.status, "matured");
    assert.equal(s.ko.trigger.triggered, false);
    assert.equal(Object.values(s.ko.reachedKO).filter((r) => r.reached).length, 2);
    assert.equal(s.ko.reachedKO.THETA.reached, false);
  });

  it("breached the American KI barrier during the tenor", () => {
    const ev = s.lifecycle.kiEvent;
    assert.equal(ev.kind, "occurred");
    if (ev.kind === "occurred") {
      assert.equal(ev.ticker, "THETA");
      assert.ok(ev.date < p.expiryDate);
    }
  });

  it("settles by physical delivery of the worst performer at strike", () => {
    const st = s.lifecycle.settlement;
    assert.equal(st?.type, "physical-delivery");
    if (st?.type === "physical-delivery") {
      assert.equal(st.worstTicker, "THETA");
      assert.ok(st.worstRatio < p.strikeLevel && st.worstRatio > p.kiLevel);
      assert.ok(Math.abs(st.deliveryPrice - 45.6 * 0.85) < 1e-9);
    }
  });

  it("would have redeemed at par under an EKI barrier (final close above KI)", () => {
    const eki = evaluateKIStyleMatrix(p, s.series).find((k) => k.kiObservation === "EKI")!;
    assert.equal(eki.settlement?.type, "par-redemption");
  });

  it("paid every fixed coupon regardless of the settlement", () => {
    assert.ok(s.coupons.rows.every((r) => r.status === "paid"));
    assert.equal(s.coupons.paidCount, p.couponPeriods.length);
  });
});
