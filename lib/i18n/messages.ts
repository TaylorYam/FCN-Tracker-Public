/**
 * UI dictionary. `en` defines the shape; every other locale is typed as
 * `Messages`, so a missing or extra key fails the type check.
 *
 * Functions take values that the caller has already formatted (dates,
 * levels, prices) so that formatting stays in one place per locale.
 */

import type { CouponStatus } from "../coupons";
import type { LifecycleStatus } from "../lifecycle";
import type { KOObservationFreq } from "../types";
import type { Locale } from "./config";

const en = {
  meta: {
    title: "FCN Tracker — Structured Product Monitoring Platform",
    description:
      "Portfolio demonstration: Fixed Coupon Note terms and multi-underlying price paths translated into structured-product monitoring logic. All data is synthetic.",
    productTitle: (code: string) => `${code} (synthetic demo)`,
    notFound: "Page not found",
  },
  header: {
    tagline: "Structured Product Monitoring Platform",
    navProducts: "Demo products",
    navHow: "How it works",
    language: "Language",
  },
  footer: {
    disclaimer:
      "This repository is a personal research and engineering project for informational and educational purposes only. The products, prices, terms and scenarios shown in the public demonstration are synthetic. It is not investment advice and is not affiliated with, sponsored by, or endorsed by my employer.",
    note:
      "All underlyings (ALPHA, BETA, GAMMA …) are fictional. Price paths are generated deterministically from authored scenario anchors; no market data is fetched.",
  },
  badge: {
    text: "Synthetic demo",
    title: "All product terms, dates and prices on this page are synthetic.",
  },
  aboutTerm: (term: string) => `About ${term}`,
  glossary: {
    coupon:
      "A fixed rate agreed at issue and paid every period (monthly in these demos) regardless of how the underlyings perform. Coupons stop only if the note is redeemed early after a knock-out.",
    observation:
      "Each coupon period has an observation window. Daily-KO products check every close from the KO start date; monthly-KO products check only each period's observation end date.",
    nonCall:
      "Before the KO start date the knock-out condition is not observed, so the note cannot be redeemed early. Closes above the KO level during this period do not count.",
    ko: "Knock-out barrier as a % of each underlying's initial price. Once the KO condition is met on an observation date, the note is redeemed early at 100% of notional plus that period's coupon.",
    strike:
      "At maturity, if the worst performer closes below strike (and, for products with a KI, a knock-in has occurred), the investor receives shares of that underlying at the strike price instead of 100% cash.",
    ki: "Knock-in barrier. With a KI, finishing below strike leads to share delivery only if the KI barrier was breached — checked at maturity only (EKI) or on every daily close (AKI).",
    memory:
      "Memory KO records each underlying's first close at or above KO; the note knocks out once every underlying has a record, even on different days. Non-memory requires all underlyings at or above KO on the same observation date.",
    worst:
      "FCNs are typically worst-of: the maturity outcome is driven by the underlying with the lowest price relative to its initial fixing.",
    performance: "Latest close ÷ initial fixing − 1, measured from the initial observation date.",
    maturity:
      "The final valuation date. Without a knock-out, the note settles either at 100% par or by physical delivery of the worst performer, depending on its final level, the strike and any KI.",
  },
  terms: {
    coupon: "coupon",
    observation: "observation frequency",
    nonCall: "non-call period",
    ko: "knock-out",
    strike: "strike",
    ki: "knock-in",
    memory: "memory KO",
    worst: "worst-of",
    performance: "performance",
    maturity: "maturity",
  },
  freq: { daily: "Daily", monthly: "Monthly" } as Record<KOObservationFreq, string>,
  observationMode: (freq: KOObservationFreq, memory: boolean) =>
    `${freq === "daily" ? "Daily" : "Monthly"} · ${memory ? "Memory" : "Non-memory"}`,
  status: {
    "non-call": "Non-call period",
    "ko-observation": "Active · KO observation",
    "knocked-out": "Knocked out · early redemption",
    matured: "Matured",
  } as Record<LifecycleStatus, string>,
  couponStatus: {
    paid: "Paid",
    scheduled: "Scheduled",
    "paid-with-redemption": "Paid with early redemption",
    "payable-with-redemption": "Payable with early redemption",
    cancelled: "Cancelled — redeemed early",
  } as Record<CouponStatus, string>,
  common: {
    none: "None",
    yes: "Yes",
    no: "No",
    months: (n: number) => `${n} months`,
    underlyingsWorstOf: (n: number) => `${n} · worst-of`,
    thisProduct: "This product",
    ofNotional: (pct: string) => `${pct}% of notional`,
  },
  landing: {
    eyebrow: "Portfolio demonstration · synthetic data",
    subtitle: "Structured Product Monitoring Platform",
    intro:
      "An interactive portfolio demonstration showing how Fixed Coupon Note terms and multi-underlying price paths can be translated into structured product monitoring logic.",
    ctaExplore: "Explore Demo Products",
    ctaHow: "How the demo works",
    productsHeading: "Explore Demo Products",
    valuationNote: (date: string) => `Demo valuation date ${date} · all terms and prices synthetic`,
    logicTitle: "1. Product Logic",
    workflowTitle: "2. Monitoring Workflow",
    architectureTitle: "3. Engineering Architecture",
    concepts: [
      { term: "Coupon schedule", key: "coupon" },
      { term: "Observation periods", key: "observation" },
      { term: "Knock-out level", key: "ko" },
      { term: "Strike level", key: "strike" },
      { term: "Memory KO", key: "memory" },
      { term: "Underlying performance", key: "performance" },
      { term: "Maturity state", key: "maturity" },
    ] as { term: string; key: "coupon" | "observation" | "ko" | "strike" | "memory" | "performance" | "maturity" }[],
    workflow: [
      {
        step: "Define terms",
        text: "Coupon rate, tenor, KO / strike / KI levels, observation rule and underlyings are captured as a typed product definition; the coupon schedule is generated from the initial observation date.",
      },
      {
        step: "Assemble price paths",
        text: "Per-ticker daily closes are combined into one per-product series from the trade date, then limited to the valuation date.",
      },
      {
        step: "Evaluate observations",
        text: "The engine selects the observation dates (every close, or monthly dates only), applies the non-call period, and evaluates memory or same-day KO.",
      },
      {
        step: "Derive product state",
        text: "Status (non-call, active, knocked out, matured), coupon status, worst performer, distance to barriers, KI events and maturity settlement.",
      },
      {
        step: "Present",
        text: "Pre-rendered pages show the summary, timeline, underlying table, KO condition, coupon periods and an interactive price-path chart.",
      },
    ],
    architectureBoxes: [
      "Synthetic product definition",
      "Synthetic price series",
      "FCN state engine",
      "KO / strike / coupon evaluation",
      "Product state",
      "Next.js UI + charts",
    ],
    architectureNotes: [
      "Next.js App Router, React and TypeScript; every page statically generated, in English and Traditional Chinese.",
      "Pure, framework-free engine in lib/ — deterministic and unit-tested.",
      "Recharts for the price-path chart; Tailwind CSS for styling.",
      "CI runs a public-content scanner, node:test suites and a production build.",
      "No credentials, databases or network calls are needed to run the demo.",
    ],
    howTitle: "How the Demo Works",
    how: [
      {
        lead: "Multiple underlyings.",
        text: "Each FCN references a basket of three or four fictional stocks. Every price is expressed relative to that stock's initial fixing, and the product is worst-of: the weakest underlying drives the maturity outcome.",
      },
      {
        lead: "Predefined coupons.",
        text: "The annualized coupon and the monthly schedule are fixed at issue. Coupons are paid whatever the underlyings do; they stop only when the note is redeemed early after a knock-out.",
      },
      {
        lead: "KO on observation dates.",
        text: "The knock-out condition is not checked during the first (non-call) period. After that it is checked on every close (daily) or only on each period's observation end date (monthly). When it is met, the note redeems at 100% of notional plus that period's coupon.",
      },
      {
        lead: "Memory KO.",
        text: "With memory, each underlying that closes at or above KO on an observation date is recorded, and the note knocks out once every underlying has a record — even on different days. Without memory, all underlyings must be at or above KO on the same observation date.",
      },
      {
        lead: "Strike and maturity.",
        text: "If no KO occurs, the worst performer's final level is compared with the strike. At or above strike the note repays 100% in cash; below strike the investor receives that underlying's shares at the strike price — unless a knock-in barrier applies and was not breached.",
      },
      {
        lead: "Knock-in styles.",
        text: "An EKI barrier is tested only on the final valuation date; an AKI barrier on every daily close during the tenor. The demo uses inclusive KO (≥) and strict strike / KI (<) boundaries; real term sheets define these individually.",
      },
    ],
    howNote:
      "Each product page also re-runs the same synthetic path under the alternative KO rules (and, for the matured example, the alternative KI styles) so the effect of each rule is visible. Those comparisons are educational only.",
  },
  card: {
    underlyings: "Underlyings",
    tenor: "Tenor",
    coupon: "Annualized coupon",
    koObservation: "KO observation",
    memory: "Memory KO",
    knockIn: "Knock-in",
    view: "View Product",
    viewAria: (code: string) => `View product ${code}`,
  },
  scenarios: {
    "demo-fcn-001":
      "Daily memory KO: each underlying's first close at or above KO is remembered; the note knocks out when the last laggard crosses — even though the three were never above KO on the same day.",
    "demo-fcn-002":
      "Monthly non-memory KO with a European knock-in: all four must be at or above KO on the same monthly observation date. The worst performer now trades below strike but above KI.",
    "demo-fcn-003":
      "Daily memory KO with an American knock-in: two underlyings recorded KO, the laggard breached KI mid-tenor and finished below strike, so the matured note settles by physical delivery.",
  } as Record<string, string>,
  product: {
    back: "All demo products",
    header: {
      trade: "Trade",
      finalValuation: "Final valuation",
      koObservation: "KO observation",
      coupon: "Coupon",
      couponPa: (rate: string) => `${rate} p.a.`,
      asOf: "Demo valuation date",
    },
    banner: {
      current: "Current status",
      knockedOut: (date: string, period: string) =>
        `KO condition met on ${date}. The note is redeemed early at 100% of notional plus the coupon for period ${period}; remaining coupons are cancelled.`,
      delivery: (date: string, ticker: string, level: string, strike: string, kiBreached: boolean, price: string) =>
        `Final valuation ${date}: worst performer ${ticker} closed at ${level} of initial, below the ${strike} strike${kiBreached ? " with the KI barrier breached" : ""}. Settlement by physical delivery of ${ticker} at the strike price (${price}).`,
      par: (date: string, ticker: string, level: string) =>
        `Final valuation ${date}: redeemed at 100% par. Worst performer ${ticker} closed at ${level} of initial.`,
      awaiting: "Awaiting final valuation closes.",
      nonCall: (date: string) => `KO is not observed until ${date}.`,
      memory: (reached: number, total: number, next: string | null) =>
        `${reached} of ${total} underlyings have recorded a close at or above KO. The note knocks out once all ${total} have a record.${next ? ` Next observation: ${next}.` : ""}`,
      nonMemory: (total: number, freq: string, next: string | null) =>
        `Not knocked out: on no observation date so far were all ${total} underlyings at or above KO at the same time.${next ? ` Next ${freq.toLowerCase()} observation: ${next}.` : ""}`,
    },
    summary: {
      title: "Product summary",
      coupon: "Annualized coupon",
      perPeriod: (pct: string, periodMonths: number) =>
        `≈ ${pct}% paid ${periodMonths === 1 ? "monthly" : periodMonths === 3 ? "quarterly" : `every ${periodMonths} months`}`,
      ko: "Knock-out",
      strike: "Strike",
      ki: "Knock-in",
      ekiDetail: "EKI · at maturity",
      akiDetail: "AKI · daily",
      tenor: "Tenor",
      underlyings: "Underlyings",
      couponsPaid: "Coupons paid",
    },
    timeline: {
      title: "Maturity timeline",
      trade: "Trade",
      koStart: "KO start",
      kiEvent: "KI event",
      knockOut: "Knock-out",
      finalValuation: "Final valuation",
      redeemedEarly: (date: string, days: number) =>
        `Redeemed early on ${date}, ${days} days before the scheduled final valuation.`,
      matured: (date: string) => `Reached final valuation on ${date} without a knock-out.`,
      remaining: (days: number, date: string) =>
        `${days} days to final valuation (${date}). Shaded segment = non-call period.`,
    },
    chart: {
      title: "Price path · % of initial",
      synthetic: "Synthetic closes",
      ko: "KO",
      strike: "Strike",
      ki: (style: string) => `KI (${style})`,
      nonCall: "Non-call",
      kiEvent: "KI event",
      legendNonCall: "Shaded = non-call period",
      legendMonthly: "Faint verticals = monthly KO observation dates",
      legendGrey: "Grey = underlying has recorded KO",
      aria: (tickers: string, ko: string, strike: string, ki: string | null) =>
        `Synthetic price paths of ${tickers} as a percentage of initial price, with KO at ${ko}, strike at ${strike}${ki ? ` and KI at ${ki}` : ""}.`,
    },
    underlyings: {
      title: "Underlyings",
      closesOn: (label: string, date: string) => `${label} closes: ${date}`,
      atKO: "At KO date",
      final: "Final",
      latest: "Latest",
      underlying: "Underlying",
      initial: "Initial",
      performance: "Performance",
      koCol: (level: string) => `KO ${level}`,
      strikeCol: (level: string) => `Strike ${level}`,
      kiCol: (level: string) => `KI ${level}`,
      worstBelowStrike: "Worst · below strike",
      worst: "Worst performer",
      atOrAbove: "at/above",
      ppBelow: (pp: string) => `${pp} pp below`,
      ppAbove: (pp: string) => `${pp} pp above`,
      kiRiskHead: (ticker: string, pp: string, below: boolean) =>
        `${ticker} is below strike · ${pp} pp ${below ? "below" : "above"} KI`,
      kiRiskEki: "EKI: the barrier is evaluated on the final valuation date only; closes below KI before then do not count.",
      kiRiskAkiHit: (date: string) => `AKI: barrier already breached on ${date}.`,
      kiRiskAki: "AKI: any daily close below KI during the tenor would activate the downside.",
    },
    ko: {
      title: "KO condition",
      level: "KO level",
      levelValue: (level: string) => `${level} of initial`,
      start: "KO start",
      observation: "Observation",
      everyClose: "Every close",
      monthlyDate: "Monthly obs. date",
      evaluated: "Dates evaluated",
      recorded: (date: string) => `Recorded ${date}`,
      aboveKO: (date: string) => `Above KO ${date}`,
      notRecorded: "Not yet recorded",
      triggeredMemory: (date: string) =>
        `All underlyings recorded — KO triggered on ${date}, the date the last laggard crossed.`,
      triggeredNonMemory: (date: string) =>
        `All underlyings were at or above KO on ${date} — KO triggered.`,
      noKO: (date: string) => `No KO as of ${date}.`,
      matrixTitle: "Rule comparison — the same synthetic path under each KO rule",
      matrixKO: (date: string) => `KO ${date}`,
      matrixNoKO: "No KO",
      matrixRecorded: (a: number, b: number) => ` · ${a}/${b} recorded`,
      matrixNote: "Educational comparison using the engine in lib/fcn.ts. Only the highlighted rule is part of this product's terms.",
      obsDate: "Obs. date",
      allAbove: "All ≥ KO?",
      yesKO: "Yes → KO",
      no: "No",
      nextObservation: "Next observation",
      moreScheduled: (n: number) => ` · ${n} more scheduled`,
    },
    coupons: {
      title: "Coupon periods",
      next: (date: string) => `Next payment ${date}`,
      noMore: "No further payments",
      period: "#",
      window: "Observation window",
      payment: "Payment",
      coupon: "Coupon",
      status: "Status",
      nonCall: "non-call",
      note: (monthly: boolean, paid: number, total: number, pct: string) =>
        `Schedule generated from the initial observation date: monthly observation ends rolled to the next business day, payment 3 business days later.${monthly ? " Each observation end from period 2 onward is also a KO observation date." : ""} ${paid} of ${total} coupons paid (${pct}% of notional).`,
    },
    settlement: {
      title: "Settlement",
      coupons: (n: number, per: string, total: string, earlyDate: string | null) =>
        `Coupons: ${n} × ${per}% = ${total}% of notional${earlyDate ? `, the last paid with redemption on ${earlyDate}.` : ", paid regardless of the settlement type."}`,
      kiMatrixTitle: (level: string) => `What the knock-in style changes — same final closes, KI level ${level}`,
      noKI: "No KI",
      delivery: "Physical delivery at strike",
      par: "100% par redemption",
      kiMatrixNote:
        "Educational comparison. With EKI only the final close is tested against KI; with AKI any daily close during the tenor counts; with no KI the strike alone decides.",
      earlyLead: "Early redemption at 100% of notional",
      earlyText: (date: string) => ` following the knock-out on ${date}.`,
      parLead: "Redeemed at 100% par",
      parText: (ticker: string, level: string) =>
        ` on the final valuation date. Worst performer ${ticker} finished at ${level} of initial.`,
      deliveryLead: (ticker: string) => `Physical delivery of ${ticker}`,
      deliveryText: (price: string, strike: string) =>
        ` at the strike price of ${price} (${strike} of initial): the notional converts into notional ÷ ${price} shares.`,
      deliveryValue: (ticker: string, level: string, value: string, strike: string) =>
        `${ticker} finished at ${level} of initial, so the delivered shares are worth about ${value}% of notional at the final close (${level} ÷ ${strike}), before coupons.`,
    },
  },
  notFound: {
    title: "Page not found",
    text: "This portfolio edition contains three synthetic demo products only.",
    link: "← Explore demo products",
  },
};

export type Messages = typeof en;

const zhTW: Messages = {
  meta: {
    title: "FCN Tracker — 結構型商品監控平台",
    description:
      "作品集示範：將固定配息票券（FCN）的條款與多檔標的價格路徑，轉換為結構型商品的監控邏輯。所有資料皆為模擬。",
    productTitle: (code: string) => `${code}（模擬示範）`,
    notFound: "找不到頁面",
  },
  header: {
    tagline: "結構型商品監控平台",
    navProducts: "示範商品",
    navHow: "運作方式",
    language: "語言",
  },
  footer: {
    disclaimer:
      "本專案為個人研究與工程作品，僅供資訊與教育用途。公開示範中的商品、價格、條款與情境皆為模擬資料，不構成投資建議，亦與本人雇主無關，未獲其贊助或背書。",
    note:
      "所有連結標的（ALPHA、BETA、GAMMA……）皆為虛構。價格路徑依預先設定的情境錨點以固定演算法產生，不抓取任何市場資料。",
  },
  badge: {
    text: "Synthetic demo · 模擬示範",
    title: "本頁所有商品條款、日期與價格皆為模擬資料。",
  },
  aboutTerm: (term: string) => `關於「${term}」`,
  glossary: {
    coupon:
      "發行時約定的固定利率，每期（本示範為每月）支付，與連結標的表現無關。只有在敲出提前出場後，後續票息才會停止。",
    observation:
      "每個配息期都有對應的觀察區間。每日 KO 商品自 KO 起始日起觀察每個收盤價；每月 KO 商品只在各期的觀察結束日觀察。",
    nonCall:
      "KO 起始日之前不觀察敲出條件，商品不會提前出場；這段期間的收盤價即使高於 KO 水準也不列入計算。",
    ko: "敲出（KO）門檻，以各連結標的期初價的百分比表示。當某個觀察日滿足 KO 條件，商品即以 100% 本金加上該期票息提前出場。",
    strike:
      "到期時，若表現最差標的的收盤價低於執行價（設有 KI 的商品須已發生敲入），投資人將以執行價承接該標的股票，而不是取回 100% 現金。",
    ki: "敲入（KI）門檻。設有 KI 時，到期低於執行價只有在 KI 曾被觸及時才會轉換為股票——EKI 只在到期日觀察，AKI 則觀察存續期間每個交易日的收盤價。",
    memory:
      "記憶式 KO 會記錄每檔標的第一次收盤達到或高於 KO 的日期；所有標的都有紀錄後即觸發敲出，即使發生在不同日子。非記憶式則要求所有標的在同一個觀察日同時達到或高於 KO。",
    worst:
      "FCN 通常採「最差表現」（worst-of）機制：到期結果由相對期初價表現最差的標的決定。",
    performance: "最新收盤價 ÷ 期初價 − 1，自期初觀察日起算。",
    maturity:
      "最終評價日。若未敲出，商品依表現最差標的的最終水準、執行價與 KI 條件，以 100% 本金贖回或以實物交割結算。",
  },
  terms: {
    coupon: "票息",
    observation: "觀察頻率",
    nonCall: "保障期",
    ko: "敲出",
    strike: "執行價",
    ki: "敲入",
    memory: "記憶式 KO",
    worst: "最差表現",
    performance: "表現",
    maturity: "到期",
  },
  freq: { daily: "每日", monthly: "每月" },
  observationMode: (freq: KOObservationFreq, memory: boolean) =>
    `${freq === "daily" ? "每日" : "每月"} · ${memory ? "記憶式" : "非記憶式"}`,
  status: {
    "non-call": "保障期",
    "ko-observation": "存續中 · KO 觀察",
    "knocked-out": "已敲出 · 提前出場",
    matured: "已到期",
  },
  couponStatus: {
    paid: "已配息",
    scheduled: "待配息",
    "paid-with-redemption": "已隨提前出場配息",
    "payable-with-redemption": "將隨提前出場配息",
    cancelled: "已取消（提前出場）",
  },
  common: {
    none: "無",
    yes: "是",
    no: "否",
    months: (n: number) => `${n} 個月`,
    underlyingsWorstOf: (n: number) => `${n} 檔 · 最差表現`,
    thisProduct: "本商品",
    ofNotional: (pct: string) => `本金的 ${pct}%`,
  },
  landing: {
    eyebrow: "作品集示範 · 模擬資料",
    subtitle: "結構型商品監控平台",
    intro:
      "互動式作品集示範：展示如何將固定配息票券（FCN）的條款與多檔標的價格路徑，轉換為結構型商品的監控邏輯。",
    ctaExplore: "瀏覽示範商品",
    ctaHow: "示範運作方式",
    productsHeading: "瀏覽示範商品",
    valuationNote: (date: string) => `示範評價日 ${date} · 所有條款與價格皆為模擬`,
    logicTitle: "1. 商品邏輯",
    workflowTitle: "2. 監控流程",
    architectureTitle: "3. 工程架構",
    concepts: [
      { term: "配息時程", key: "coupon" },
      { term: "觀察期間", key: "observation" },
      { term: "敲出水準（KO）", key: "ko" },
      { term: "執行價（K）", key: "strike" },
      { term: "記憶式 KO", key: "memory" },
      { term: "標的表現", key: "performance" },
      { term: "到期狀態", key: "maturity" },
    ],
    workflow: [
      {
        step: "定義條款",
        text: "票息、天期、KO／執行價／KI 水準、觀察規則與連結標的，皆以具型別的商品定義描述；配息時程由期初觀察日自動產生。",
      },
      {
        step: "組合價格路徑",
        text: "將各標的的每日收盤價組合成每檔商品的價格序列（自交易日起），並截至評價日為止。",
      },
      {
        step: "評估觀察日",
        text: "引擎依規則選出觀察日（每個收盤價，或僅每月觀察日），套用保障期，並計算記憶式或同日 KO。",
      },
      {
        step: "推導商品狀態",
        text: "狀態（保障期、存續中、已敲出、已到期）、配息狀態、表現最差標的、與各門檻的距離、KI 事件及到期結算。",
      },
      {
        step: "呈現",
        text: "預先產生的頁面呈現商品概要、時間軸、標的表、KO 條件、配息期與互動式價格走勢圖。",
      },
    ],
    architectureBoxes: [
      "模擬商品定義",
      "模擬價格序列",
      "FCN 狀態引擎",
      "KO／執行價／票息判斷",
      "商品狀態",
      "Next.js 介面＋圖表",
    ],
    architectureNotes: [
      "Next.js App Router、React 與 TypeScript；所有頁面皆以英文與繁體中文靜態產生。",
      "lib/ 內為純函式、不依賴框架的引擎——結果可重現，並有單元測試。",
      "價格走勢圖使用 Recharts；樣式使用 Tailwind CSS。",
      "CI 執行公開內容掃描、node:test 測試與正式建置。",
      "執行示範不需要任何憑證、資料庫或網路請求。",
    ],
    howTitle: "示範運作方式",
    how: [
      {
        lead: "多檔連結標的。",
        text: "每檔 FCN 連結三到四檔虛構股票，所有價格皆以各標的期初價為基準表示；商品採最差表現機制，由表現最弱的標的決定到期結果。",
      },
      {
        lead: "預先約定的票息。",
        text: "年化票息與每月配息時程在發行時即已固定。不論標的漲跌都會配息，只有在敲出提前出場後才會停止。",
      },
      {
        lead: "在觀察日判斷 KO。",
        text: "第一期（保障期）不觀察敲出條件；之後依每日（每個收盤價）或每月（各期觀察結束日）判斷。一旦滿足條件，商品以 100% 本金加上當期票息提前出場。",
      },
      {
        lead: "記憶式 KO。",
        text: "記憶式下，任一標的在觀察日收盤達到或高於 KO 即被記錄；所有標的都有紀錄後即觸發敲出——即使發生在不同日子。非記憶式則要求所有標的在同一個觀察日同時達到或高於 KO。",
      },
      {
        lead: "執行價與到期。",
        text: "若未敲出，則比較表現最差標的的最終水準與執行價：達到或高於執行價，以 100% 現金返還；低於執行價，投資人以執行價承接該標的股票——除非商品設有 KI 且未被觸及。",
      },
      {
        lead: "敲入類型。",
        text: "EKI 只在最終評價日觀察；AKI 觀察存續期間每個交易日的收盤價。本示範採 KO 含等於（≥）、執行價與 KI 不含等於（<）的邊界慣例；實際條件以各商品條款為準。",
      },
    ],
    howNote:
      "每個商品頁也會用其他 KO 規則（到期商品另含其他 KI 類型）重新計算同一條模擬路徑，讓各規則的影響一目了然。這些比較僅供教學參考。",
  },
  card: {
    underlyings: "連結標的",
    tenor: "天期",
    coupon: "年化票息",
    koObservation: "KO 觀察",
    memory: "記憶式 KO",
    knockIn: "敲入",
    view: "查看商品",
    viewAria: (code: string) => `查看商品 ${code}`,
  },
  scenarios: {
    "demo-fcn-001":
      "每日記憶式 KO：每檔標的第一次收盤達到或高於 KO 的日期會被記住；最後一檔落後標的突破時即觸發敲出——即使三檔從未在同一天同時高於 KO。",
    "demo-fcn-002":
      "每月非記憶式 KO，搭配歐式敲入（EKI）：四檔必須在同一個每月觀察日同時達到或高於 KO。目前表現最差的標的已低於執行價，但仍高於 KI。",
    "demo-fcn-003":
      "每日記憶式 KO，搭配美式敲入（AKI）：兩檔標的已記錄 KO，落後標的在存續期間跌破 KI、到期時仍低於執行價，因此到期以實物交割結算。",
  },
  product: {
    back: "所有示範商品",
    header: {
      trade: "交易日",
      finalValuation: "最終評價日",
      koObservation: "KO 觀察",
      coupon: "票息",
      couponPa: (rate: string) => `年化 ${rate}`,
      asOf: "示範評價日",
    },
    banner: {
      current: "目前狀態",
      knockedOut: (date: string, period: string) =>
        `${date} 滿足 KO 條件。商品以 100% 本金加上第 ${period} 期票息提前出場，其餘票息取消。`,
      delivery: (date: string, ticker: string, level: string, strike: string, kiBreached: boolean, price: string) =>
        `最終評價日 ${date}：表現最差標的 ${ticker} 收在期初價的 ${level}，低於 ${strike} 執行價${kiBreached ? "，且已發生敲入" : ""}。以執行價（${price}）實物交割 ${ticker}。`,
      par: (date: string, ticker: string, level: string) =>
        `最終評價日 ${date}：以 100% 本金贖回。表現最差標的 ${ticker} 收在期初價的 ${level}。`,
      awaiting: "等待最終評價日收盤價。",
      nonCall: (date: string) => `${date} 之前不觀察 KO。`,
      memory: (reached: number, total: number, next: string | null) =>
        `${total} 檔標的中已有 ${reached} 檔記錄收盤達到或高於 KO；${total} 檔都有紀錄後即觸發敲出。${next ? `下次觀察日：${next}。` : ""}`,
      nonMemory: (total: number, freq: string, next: string | null) =>
        `尚未敲出：至今沒有任何觀察日是 ${total} 檔標的同時達到或高於 KO。${next ? `下次${freq}觀察日：${next}。` : ""}`,
    },
    summary: {
      title: "商品概要",
      coupon: "年化票息",
      perPeriod: (pct: string, periodMonths: number) =>
        `約${periodMonths === 1 ? "每月" : periodMonths === 3 ? "每季" : `每 ${periodMonths} 個月`}配息 ${pct}%`,
      ko: "敲出",
      strike: "執行價",
      ki: "敲入",
      ekiDetail: "EKI · 到期觀察",
      akiDetail: "AKI · 每日觀察",
      tenor: "天期",
      underlyings: "連結標的",
      couponsPaid: "已配息期數",
    },
    timeline: {
      title: "到期時間軸",
      trade: "交易日",
      koStart: "KO 起始",
      kiEvent: "敲入事件",
      knockOut: "敲出",
      finalValuation: "最終評價",
      redeemedEarly: (date: string, days: number) =>
        `${date} 提前出場，比預定的最終評價日早 ${days} 天。`,
      matured: (date: string) => `${date} 到達最終評價日，期間未曾敲出。`,
      remaining: (days: number, date: string) =>
        `距最終評價日（${date}）還有 ${days} 天。陰影區段為保障期。`,
    },
    chart: {
      title: "價格走勢 · 期初價百分比",
      synthetic: "模擬收盤價",
      ko: "KO",
      strike: "執行價",
      ki: (style: string) => `KI（${style}）`,
      nonCall: "保障期",
      kiEvent: "敲入事件",
      legendNonCall: "陰影 = 保障期",
      legendMonthly: "淡色直線 = 每月 KO 觀察日",
      legendGrey: "灰色 = 該標的已記錄 KO",
      aria: (tickers: string, ko: string, strike: string, ki: string | null) =>
        `${tickers} 的模擬價格走勢（期初價百分比），KO 為 ${ko}、執行價為 ${strike}${ki ? `、KI 為 ${ki}` : ""}。`,
    },
    underlyings: {
      title: "連結標的",
      closesOn: (label: string, date: string) => `${label}收盤：${date}`,
      atKO: "KO 當日",
      final: "最終",
      latest: "最新",
      underlying: "標的",
      initial: "期初價",
      performance: "表現",
      koCol: (level: string) => `KO ${level}`,
      strikeCol: (level: string) => `執行價 ${level}`,
      kiCol: (level: string) => `KI ${level}`,
      worstBelowStrike: "最差 · 低於執行價",
      worst: "表現最差",
      atOrAbove: "已達／高於",
      ppBelow: (pp: string) => `低於 ${pp} 個百分點`,
      ppAbove: (pp: string) => `高於 ${pp} 個百分點`,
      kiRiskHead: (ticker: string, pp: string, below: boolean) =>
        `${ticker} 已低於執行價 · ${below ? `低於 KI ${pp} 個百分點` : `距 KI 尚有 ${pp} 個百分點`}`,
      kiRiskEki: "EKI：只在最終評價日判斷；在此之前跌破 KI 不列入計算。",
      kiRiskAkiHit: (date: string) => `AKI：已於 ${date} 觸及 KI。`,
      kiRiskAki: "AKI：存續期間任一交易日收盤低於 KI，下檔風險即啟動。",
    },
    ko: {
      title: "KO 條件",
      level: "KO 水準",
      levelValue: (level: string) => `期初價的 ${level}`,
      start: "KO 起始日",
      observation: "觀察方式",
      everyClose: "每個收盤價",
      monthlyDate: "每月觀察日",
      evaluated: "已評估日數",
      recorded: (date: string) => `已記錄 ${date}`,
      aboveKO: (date: string) => `${date} 高於 KO`,
      notRecorded: "尚未記錄",
      triggeredMemory: (date: string) =>
        `所有標的皆已記錄——${date} 最後一檔落後標的突破時觸發 KO。`,
      triggeredNonMemory: (date: string) => `${date} 所有標的同時達到或高於 KO——觸發 KO。`,
      noKO: (date: string) => `截至 ${date} 尚未敲出。`,
      matrixTitle: "規則比較——以各種 KO 規則計算同一條模擬路徑",
      matrixKO: (date: string) => `${date} KO`,
      matrixNoKO: "未敲出",
      matrixRecorded: (a: number, b: number) => ` · 已記錄 ${a}/${b}`,
      matrixNote: "使用 lib/fcn.ts 引擎的教學比較；只有標示的規則屬於本商品條款。",
      obsDate: "觀察日",
      allAbove: "全部 ≥ KO？",
      yesKO: "是 → KO",
      no: "否",
      nextObservation: "下次觀察",
      moreScheduled: (n: number) => ` · 另有 ${n} 次`,
    },
    coupons: {
      title: "配息期",
      next: (date: string) => `下次配息 ${date}`,
      noMore: "已無後續配息",
      period: "期",
      window: "觀察區間",
      payment: "配息日",
      coupon: "票息",
      status: "狀態",
      nonCall: "保障期",
      note: (monthly: boolean, paid: number, total: number, pct: string) =>
        `配息時程由期初觀察日產生：每月觀察結束日遇週末順延至下一個營業日，配息日為其後 3 個營業日。${monthly ? "第 2 期起，每期的觀察結束日同時也是 KO 觀察日。" : ""}已配息 ${paid} / ${total} 期（本金的 ${pct}%）。`,
    },
    settlement: {
      title: "結算",
      coupons: (n: number, per: string, total: string, earlyDate: string | null) =>
        `票息：${n} × ${per}% = 本金的 ${total}%${earlyDate ? `，最後一期於 ${earlyDate} 隨提前出場一併支付。` : "，不論結算方式皆照付。"}`,
      kiMatrixTitle: (level: string) => `敲入類型的影響——相同最終收盤價，KI 水準 ${level}`,
      noKI: "無 KI",
      delivery: "以執行價實物交割",
      par: "100% 本金贖回",
      kiMatrixNote:
        "教學比較。EKI 只以最終收盤價判斷 KI；AKI 觀察存續期間每個交易日的收盤價；無 KI 則僅由執行價決定。",
      earlyLead: "以 100% 本金提前出場",
      earlyText: (date: string) => `（${date} 觸發 KO）。`,
      parLead: "以 100% 本金贖回",
      parText: (ticker: string, level: string) =>
        `（最終評價日）。表現最差標的 ${ticker} 收在期初價的 ${level}。`,
      deliveryLead: (ticker: string) => `實物交割 ${ticker}`,
      deliveryText: (price: string, strike: string) =>
        `，以執行價 ${price}（期初價的 ${strike}）計算：本金將轉換為「本金 ÷ ${price}」股。`,
      deliveryValue: (ticker: string, level: string, value: string, strike: string) =>
        `${ticker} 收在期初價的 ${level}，以最終收盤價計算，交付股票約值本金的 ${value}%（${level} ÷ ${strike}），未含票息。`,
    },
  },
  notFound: {
    title: "找不到頁面",
    text: "此作品集版本只包含三檔模擬示範商品。",
    link: "← 瀏覽示範商品",
  },
};

const MESSAGES: Record<Locale, Messages> = { en, "zh-TW": zhTW };

export function getMessages(locale: Locale): Messages {
  return MESSAGES[locale];
}
