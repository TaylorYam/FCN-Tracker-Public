import { formatDate } from "@/lib/dates";
import { formatLevel, formatPrice } from "@/lib/format";
import { STATUS_LABEL } from "@/lib/lifecycle";
import type { ProductState } from "@/lib/state";

const TONE = {
  info: "border-accent-blue/30 bg-accent-blue/10 text-accent-blue",
  success: "border-emerald-300 bg-emerald-50 text-emerald-800",
  warning: "border-amber-300 bg-amber-50 text-amber-900",
} as const;

export function StatusBanner({ state }: { state: ProductState }) {
  const { config: p, lifecycle, ko, coupons } = state;
  const reached = Object.values(ko.reachedKO).filter((r) => r.reached).length;
  const total = p.underlyings.length;

  let tone: keyof typeof TONE = "info";
  let detail: React.ReactNode;

  switch (lifecycle.status) {
    case "knocked-out": {
      tone = "success";
      const koRow = coupons.rows.find((r) => r.isKOPeriod);
      detail = (
        <>
          KO condition met on {formatDate(ko.trigger.triggerDate!)}. The note is redeemed early at
          100% of notional plus the coupon for period {koRow?.t ?? "—"}; remaining coupons are
          cancelled.
        </>
      );
      break;
    }
    case "matured": {
      const s = lifecycle.settlement;
      if (s?.type === "physical-delivery") {
        tone = "warning";
        detail = (
          <>
            Final valuation {formatDate(s.date)}: worst performer {s.worstTicker} closed at{" "}
            {formatLevel(s.worstRatio)} of initial, below the {formatLevel(p.strikeLevel)} strike
            {p.kiObservation !== "NONE" && " with the KI barrier breached"}. Settlement by physical
            delivery of {s.worstTicker} at the strike price ({formatPrice(s.deliveryPrice)}).
          </>
        );
      } else if (s?.type === "par-redemption") {
        tone = "success";
        detail = (
          <>
            Final valuation {formatDate(s.date)}: redeemed at 100% par. Worst performer{" "}
            {s.worstTicker} closed at {formatLevel(s.worstRatio)} of initial.
          </>
        );
      } else {
        detail = <>Awaiting final valuation closes.</>;
      }
      break;
    }
    case "non-call":
      detail = <>KO is not observed until {formatDate(p.koStartDate)}.</>;
      break;
    case "ko-observation":
      detail = p.hasMemoryKO ? (
        <>
          {reached} of {total} underlyings have recorded a close at or above KO. The note knocks
          out once all {total} have a record.
          {lifecycle.nextKOObservationDate &&
            ` Next observation: ${formatDate(lifecycle.nextKOObservationDate)}.`}
        </>
      ) : (
        <>
          Not knocked out: on no observation date so far were all {total} underlyings at or above
          KO at the same time.
          {lifecycle.nextKOObservationDate &&
            ` Next ${p.koObservationFreq} observation: ${formatDate(lifecycle.nextKOObservationDate)}.`}
        </>
      );
      break;
  }

  return (
    <div className={`mb-6 rounded-lg border px-4 py-3 ${TONE[tone]}`} role="status">
      <div className="text-[11px] font-bold uppercase tracking-[0.12em]">Current status</div>
      <div className="mt-0.5 text-base font-semibold">{STATUS_LABEL[lifecycle.status]}</div>
      <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">{detail}</p>
    </div>
  );
}
