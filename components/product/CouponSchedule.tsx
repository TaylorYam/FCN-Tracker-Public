import { InfoTip } from "@/components/InfoTip";
import { Card, Section } from "@/components/Section";
import { COUPON_STATUS_LABEL, type CouponStatus } from "@/lib/coupons";
import { formatDate, formatDateShort } from "@/lib/dates";
import { GLOSSARY } from "@/lib/glossary";
import type { ProductState } from "@/lib/state";

const STATUS_CLASS: Record<CouponStatus, string> = {
  paid: "text-emerald-700",
  scheduled: "text-text-secondary",
  "paid-with-redemption": "font-semibold text-emerald-700",
  "payable-with-redemption": "font-semibold text-accent-blue",
  cancelled: "text-text-muted line-through decoration-text-muted/50",
};

export function CouponSchedule({ state }: { state: ProductState }) {
  const { coupons, config: p } = state;
  return (
    <Section
      title={
        <>
          Coupon periods
          <InfoTip label="coupon periods">{GLOSSARY.coupon}</InfoTip>
        </>
      }
      aside={
        coupons.nextPayment
          ? `Next payment ${formatDate(coupons.nextPayment.paymentDate)}`
          : "No further payments"
      }
    >
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[440px] text-[12px] tabular-nums">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wide text-text-muted">
              <th className="px-3 py-2 font-medium">#</th>
              <th className="px-3 py-2 font-medium">Observation window</th>
              <th className="px-3 py-2 font-medium">Payment</th>
              <th className="px-3 py-2 text-right font-medium">Coupon</th>
              <th className="px-3 py-2 text-right font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {coupons.rows.map((r) => (
              <tr
                key={r.t}
                className={`border-t border-bg-elevated ${r.isKOPeriod ? "bg-emerald-50/70" : ""}`}
              >
                <td className="px-3 py-1.5 text-text-muted">{r.t}</td>
                <td className="whitespace-nowrap px-3 py-1.5 text-text-secondary">
                  {formatDateShort(r.observationStart)} – {formatDateShort(r.observationEnd)}
                  {r.t === 1 && (
                    <span className="ml-1.5 rounded bg-bg-elevated/60 px-1 py-px text-[9px] font-semibold uppercase text-text-secondary">
                      non-call
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-1.5 text-text-secondary">
                  {formatDate(r.paymentDate)}
                </td>
                <td className="px-3 py-1.5 text-right text-text-primary">
                  {(r.couponPct * 100).toFixed(2)}%
                </td>
                <td className={`px-3 py-1.5 text-right ${STATUS_CLASS[r.status]}`}>
                  {COUPON_STATUS_LABEL[r.status]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <p className="mt-1.5 text-[11px] leading-relaxed text-text-muted">
        Schedule generated from the initial observation date: monthly observation ends rolled to the
        next business day, payment 3 business days later.
        {p.koObservationFreq === "monthly" &&
          " Each observation end from period 2 onward is also a KO observation date."} {coupons.paidCount} of{" "}
        {coupons.rows.length} coupons paid ({(coupons.paidPct * 100).toFixed(2)}% of notional).
      </p>
    </Section>
  );
}
