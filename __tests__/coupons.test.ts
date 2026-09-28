import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { deriveCouponSchedule, findPeriodContaining, perPeriodCoupon } from "../lib/coupons";
import { makeProduct } from "./helpers";

const product = makeProduct({ couponRateAnnual: 0.12, termMonths: 4 });

describe("coupon schedule", () => {
  it("per-period coupon = annual rate × period length", () => {
    assert.ok(Math.abs(perPeriodCoupon(product) - 0.01) < 1e-12); // 12% p.a. monthly
    const quarterly = makeProduct({ termMonths: 12, couponRateAnnual: 0.12 });
    // 4 periods over 12 months → 3-month periods → 3%
    assert.ok(Math.abs(perPeriodCoupon(quarterly) - 0.03) < 1e-12);
  });

  it("marks coupons paid once their payment date has passed", () => {
    const s = deriveCouponSchedule(product, "2026-04-29", null);
    assert.deepEqual(
      s.rows.map((r) => r.status),
      ["paid", "paid", "scheduled", "scheduled"],
    );
    assert.equal(s.paidCount, 2);
    assert.ok(Math.abs(s.paidPct - 0.02) < 1e-12);
    assert.equal(s.nextPayment?.t, 3);
  });

  it("after KO: KO-period coupon paid with redemption, later coupons cancelled", () => {
    const s = deriveCouponSchedule(product, "2026-06-30", "2026-04-10"); // KO inside period 2
    assert.deepEqual(
      s.rows.map((r) => r.status),
      ["paid", "paid-with-redemption", "cancelled", "cancelled"],
    );
    assert.equal(s.paidCount, 2);
    assert.equal(s.nextPayment, null);
    assert.ok(s.rows[1].isKOPeriod);
  });

  it("KO period coupon is payable until its payment date", () => {
    const s = deriveCouponSchedule(product, "2026-04-15", "2026-04-10");
    assert.equal(s.rows[1].status, "payable-with-redemption");
    assert.equal(s.nextPayment?.t, 2);
  });

  it("finds the observation period containing a date (inclusive bounds)", () => {
    const periods = product.couponPeriods;
    assert.equal(findPeriodContaining(periods, "2026-03-24")?.t, 1);
    assert.equal(findPeriodContaining(periods, "2026-03-25")?.t, 2);
    assert.equal(findPeriodContaining(periods, "2026-06-24")?.t, 4);
    assert.equal(findPeriodContaining(periods, "2026-07-01"), null);
  });
});
