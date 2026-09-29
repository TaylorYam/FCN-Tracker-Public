import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatDate, formatDateShort } from "../lib/dates";
import { DEMO_PRODUCTS } from "../lib/demo";
import { LOCALES, htmlLang, isLocale, localePath, switchLocalePath } from "../lib/i18n/config";
import { getMessages } from "../lib/i18n/messages";

const en = getMessages("en");
const zh = getMessages("zh-TW");
const CJK = /[一-鿿]/;

/** Flatten a dictionary into { "a.b.c": leaf } (functions and arrays included). */
function leaves(obj: unknown, prefix = ""): Record<string, unknown> {
  if (typeof obj !== "object" || obj === null) return { [prefix]: obj };
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    Object.assign(out, leaves(v, prefix ? `${prefix}.${k}` : k));
  }
  return out;
}

describe("locale config", () => {
  it("supports English and Traditional Chinese", () => {
    assert.deepEqual([...LOCALES], ["en", "zh-TW"]);
    assert.equal(isLocale("zh-TW"), true);
    assert.equal(isLocale("fr"), false);
    assert.equal(htmlLang("zh-TW"), "zh-Hant-TW");
  });

  it("builds locale-prefixed paths", () => {
    assert.equal(localePath("en"), "/en");
    assert.equal(localePath("zh-TW", "/products/demo-fcn-001"), "/zh-TW/products/demo-fcn-001");
    assert.equal(localePath("zh-TW", "/#demo-products"), "/zh-TW#demo-products");
  });

  it("switches the same page to the other locale", () => {
    assert.equal(switchLocalePath("/en/products/demo-fcn-002", "zh-TW"), "/zh-TW/products/demo-fcn-002");
    assert.equal(switchLocalePath("/zh-TW", "en"), "/en");
    assert.equal(switchLocalePath("/products/demo-fcn-003", "zh-TW"), "/zh-TW/products/demo-fcn-003");
  });
});

describe("dictionary", () => {
  it("has exactly the same keys in every locale", () => {
    const enKeys = Object.keys(leaves(en)).sort();
    for (const locale of LOCALES) {
      assert.deepEqual(Object.keys(leaves(getMessages(locale))).sort(), enKeys, locale);
    }
  });

  it("translates every plain string into Chinese (except shared symbols)", () => {
    const SHARED = new Set(["product.chart.ko", "product.coupons.period"]);
    const enLeaves = leaves(en);
    for (const [key, value] of Object.entries(leaves(zh))) {
      if (typeof value !== "string" || SHARED.has(key) || key.endsWith(".key")) continue;
      assert.match(value, CJK, `zh-TW "${key}" is not translated`);
      assert.notEqual(value, enLeaves[key], `zh-TW "${key}" equals English`);
    }
  });

  it("formats interpolated messages per locale", () => {
    assert.equal(en.common.months(6), "6 months");
    assert.equal(zh.common.months(6), "6 個月");
    assert.equal(en.observationMode("monthly", false), "Monthly · Non-memory");
    assert.equal(zh.observationMode("daily", true), "每日 · 記憶式");
    assert.match(zh.product.banner.memory(2, 3, "2025/07/01"), /3 檔標的中已有 2 檔/);
    assert.match(zh.product.banner.knockedOut("2025/04/08", "4"), /第 4 期/);
  });

  it("translates every lifecycle and coupon status", () => {
    for (const s of ["non-call", "ko-observation", "knocked-out", "matured"] as const) {
      assert.match(zh.status[s], CJK);
    }
    for (const s of ["paid", "scheduled", "paid-with-redemption", "payable-with-redemption", "cancelled"] as const) {
      assert.match(zh.couponStatus[s], CJK);
    }
  });

  it("has a scenario description for every demo product in every locale", () => {
    for (const p of DEMO_PRODUCTS) {
      assert.ok(en.scenarios[p.id], `en scenario for ${p.id}`);
      assert.match(zh.scenarios[p.id] ?? "", CJK, `zh-TW scenario for ${p.id}`);
    }
  });

  it("describes physical settlement as 承接股票 in Chinese", () => {
    assert.match(zh.product.settlement.delivery, /承接股票/);
    assert.match(zh.product.settlement.deliveryLead("THETA"), /承接 THETA 股票/);
    const texts = Object.values(leaves(zh)).map((v) =>
      typeof v === "function" ? String((v as (...a: unknown[]) => unknown)("X", "X", "X", "X", true, "X")) : String(v),
    );
    for (const t of texts) assert.doesNotMatch(t, /實物交割/);
  });

  it("calls the non-call period 配息保證期 in Chinese", () => {
    assert.equal(zh.status["non-call"], "配息保證期");
    assert.equal(zh.product.chart.nonCall, "配息保證期");
    for (const v of Object.values(leaves(zh))) {
      if (typeof v === "string") assert.doesNotMatch(v, /保障期/);
    }
  });

  it("keeps the synthetic-demo label visible in both languages", () => {
    assert.match(en.badge.text, /synthetic demo/i);
    assert.match(zh.badge.text, /synthetic demo/i);
    assert.match(zh.badge.text, /模擬/);
  });
});

describe("localized dates", () => {
  it("formats deterministically per locale", () => {
    assert.equal(formatDate("2025-01-06", "en"), "06 Jan 2025");
    assert.equal(formatDate("2025-01-06", "zh-TW"), "2025/01/06");
    assert.equal(formatDateShort("2025-04-08", "en"), "08 Apr");
    assert.equal(formatDateShort("2025-04-08", "zh-TW"), "04/08");
  });
});
