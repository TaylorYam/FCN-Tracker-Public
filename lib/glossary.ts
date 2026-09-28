/**
 * Plain-English definitions shared by tooltips and the landing page. Each
 * entry describes only behaviour the engine in `lib/` actually implements.
 */
export const GLOSSARY = {
  coupon:
    "A fixed rate agreed at issue and paid every period (monthly in these demos) regardless of how the underlyings perform. Coupons stop only if the note is redeemed early after a knock-out.",
  observation:
    "Each coupon period has an observation window. Daily-KO products check every close from the KO start date; monthly-KO products check only each period's observation end date.",
  nonCall:
    "Before the KO start date the knock-out condition is not observed, so the note cannot be redeemed early. Closes above the KO level during this period do not count.",
  ko:
    "Knock-out barrier as a % of each underlying's initial price. Once the KO condition is met on an observation date, the note is redeemed early at 100% of notional plus that period's coupon.",
  strike:
    "At maturity, if the downside is active and the worst performer closes below strike, the investor receives shares of that underlying at the strike price instead of 100% cash.",
  ki:
    "Knock-in barrier. With a KI, finishing below strike leads to share delivery only if the KI barrier was breached — checked at maturity only (EKI) or on every daily close (AKI).",
  memory:
    "Memory KO records each underlying's first close at or above KO; the note knocks out once every underlying has a record, even on different days. Non-memory requires all underlyings at or above KO on the same observation date.",
  worst:
    "FCNs are typically worst-of: the maturity outcome is driven by the underlying with the lowest price relative to its initial fixing.",
  performance: "Latest close ÷ initial fixing − 1, measured from the initial observation date.",
  maturity:
    "The final valuation date. Without a knock-out, the note settles either at 100% par or by physical delivery of the worst performer, depending on its final level, the strike and any KI.",
} as const;
