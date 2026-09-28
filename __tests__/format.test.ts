import assert from "node:assert/strict";
import test from "node:test";
import { formatDate, findNextCouponDate } from "../lib/dates";
import { formatLevel, formatRatePercent, formatRateValue, formatSignedPct } from "../lib/format";

test("formats whole-number rates with two decimal places", () => {
  assert.equal(formatRateValue(0.12), "12.00");
  assert.equal(formatRatePercent(0.12), "12.00%");
});

test("preserves two-decimal coupon rates", () => {
  assert.equal(formatRatePercent(0.1932), "19.32%");
});

test("avoids floating-point noise in stored rates", () => {
  assert.equal(formatRatePercent(0.10339999999999999), "10.34%");
});

test("formats barrier levels", () => {
  assert.equal(formatLevel(1), "100%");
  assert.equal(formatLevel(0.8), "80%");
  assert.equal(formatLevel(1.025), "102.5%");
  assert.equal(formatLevel(0.78004), "78%");
});

test("formats signed performance", () => {
  assert.equal(formatSignedPct(0.035), "+3.5%");
  assert.equal(formatSignedPct(-0.22), "−22.0%");
  assert.equal(formatSignedPct(-0.00001), "0.0%");
});

test("formats dates deterministically", () => {
  assert.equal(formatDate("2025-01-06"), "06 Jan 2025");
});

test("finds the next coupon date on or after today", () => {
  const dates = ["2025-03-11", "2025-02-11", "2025-04-10"];
  assert.equal(findNextCouponDate(dates, "2025-02-12"), "2025-03-11");
  assert.equal(findNextCouponDate(dates, "2025-03-11"), "2025-03-11");
  assert.equal(findNextCouponDate(dates, "2025-05-01"), null);
});
