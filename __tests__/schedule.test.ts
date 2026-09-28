import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  addBusinessDays,
  addMonths,
  businessDaysBetween,
  buildMonthlyCouponSchedule,
  daysBetween,
  parseYmd,
  rollForwardToBusinessDay,
  toIsoDate,
} from "../lib/schedule";

describe("date helpers", () => {
  it("parseYmd accepts YYYYMMDD and YYYY-MM-DD", () => {
    assert.equal(toIsoDate(parseYmd("20260508")!), "2026-05-08");
    assert.equal(toIsoDate(parseYmd("2026-05-08")!), "2026-05-08");
  });

  it("parseYmd rejects bad input", () => {
    assert.equal(parseYmd("2026-05"), null);
    assert.equal(parseYmd("May 8"), null);
    assert.equal(parseYmd("20260230"), null); // Feb 30 invalid
  });

  it("addMonths clamps to end of month", () => {
    const jan31 = parseYmd("20260131")!;
    assert.equal(toIsoDate(addMonths(jan31, 1)), "2026-02-28");
  });

  it("addBusinessDays skips weekends", () => {
    const fri = parseYmd("20260515")!; // Friday
    assert.equal(toIsoDate(addBusinessDays(fri, 1)), "2026-05-18"); // Mon
    assert.equal(toIsoDate(addBusinessDays(fri, 3)), "2026-05-20"); // Wed
  });

  it("rolls weekend dates forward to Monday", () => {
    assert.equal(toIsoDate(rollForwardToBusinessDay(parseYmd("2025-05-03")!)), "2025-05-05"); // Sat
    assert.equal(toIsoDate(rollForwardToBusinessDay(parseYmd("2025-05-04")!)), "2025-05-05"); // Sun
    assert.equal(toIsoDate(rollForwardToBusinessDay(parseYmd("2025-05-06")!)), "2025-05-06"); // Tue
  });

  it("lists business days inclusively", () => {
    assert.deepEqual(businessDaysBetween("2025-01-03", "2025-01-07"), [
      "2025-01-03",
      "2025-01-06",
      "2025-01-07",
    ]);
  });

  it("counts calendar days", () => {
    assert.equal(daysBetween("2025-01-01", "2025-03-01"), 59);
    assert.equal(daysBetween("2025-03-01", "2025-01-01"), -59);
  });
});

describe("buildMonthlyCouponSchedule", () => {
  const periods = buildMonthlyCouponSchedule("2025-02-03", 12);

  it("creates one period per month with sequential numbering", () => {
    assert.equal(periods.length, 12);
    assert.deepEqual(
      periods.map((p) => p.t),
      Array.from({ length: 12 }, (_, i) => i + 1),
    );
  });

  it("starts period 1 on the initial observation date", () => {
    assert.equal(periods[0].observationStart, "2025-02-03");
    assert.equal(periods[0].observationEnd, "2025-03-03");
  });

  it("rolls weekend observation ends to the next business day", () => {
    // 2025-05-03 is a Saturday → 2025-05-05 (Mon)
    assert.equal(periods[2].observationEnd, "2025-05-05");
    for (const p of periods) {
      const dow = parseYmd(p.observationEnd)!.getUTCDay();
      assert.ok(dow !== 0 && dow !== 6, `${p.observationEnd} falls on a weekend`);
    }
  });

  it("makes observation windows contiguous", () => {
    for (let i = 1; i < periods.length; i++) {
      assert.equal(daysBetween(periods[i - 1].observationEnd, periods[i].observationStart), 1);
    }
  });

  it("pays 3 business days after each observation end", () => {
    for (const p of periods) {
      assert.equal(p.paymentDate, toIsoDate(addBusinessDays(parseYmd(p.observationEnd)!, 3)));
    }
  });

  it("ends the final period one tenor after the initial observation date", () => {
    assert.equal(periods[11].observationEnd, "2026-02-03");
  });
});
