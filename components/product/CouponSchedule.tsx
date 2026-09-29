import { InfoTip } from "@/components/InfoTip";
import { Card, Section } from "@/components/Section";
import type { CouponStatus } from "@/lib/coupons";
import { formatDate, formatDateShort } from "@/lib/dates";
import type { Locale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import type { ProductState } from "@/lib/state";

const STATUS_CLASS: Record<CouponStatus, string> = {
  paid: "text-emerald-700",
  scheduled: "text-text-secondary",
  "paid-with-redemption": "font-semibold text-emerald-700",
  "payable-with-redemption": "font-semibold text-accent-blue",
  cancelled: "text-text-muted line-through decoration-text-muted/50",
};

export function CouponSchedule({ state, locale }: { state: ProductState; locale: Locale }) {
  const m = getMessages(locale);
  const t = m.product.coupons;
  const { coupons, config: p } = state;
  return (
    <Section
      title={
        <>
          {t.title}
          <InfoTip ariaLabel={m.aboutTerm(m.terms.coupon)}>{m.glossary.coupon}</InfoTip>
        </>
      }
      aside={
        coupons.nextPayment ? t.next(formatDate(coupons.nextPayment.paymentDate, locale)) : t.noMore
      }
    >
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[440px] text-[12px] tabular-nums">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wide text-text-muted">
              <th className="px-3 py-2 font-medium">{t.period}</th>
              <th className="px-3 py-2 font-medium">{t.window}</th>
              <th className="px-3 py-2 font-medium">{t.payment}</th>
              <th className="px-3 py-2 text-right font-medium">{t.coupon}</th>
              <th className="px-3 py-2 text-right font-medium">{t.status}</th>
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
                  {formatDateShort(r.observationStart, locale)} – {formatDateShort(r.observationEnd, locale)}
                  {r.t === 1 && (
                    <span className="ml-1.5 rounded bg-bg-elevated/60 px-1 py-px text-[9px] font-semibold uppercase text-text-secondary">
                      {t.nonCall}
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-1.5 text-text-secondary">
                  {formatDate(r.paymentDate, locale)}
                </td>
                <td className="px-3 py-1.5 text-right text-text-primary">
                  {(r.couponPct * 100).toFixed(2)}%
                </td>
                <td className={`px-3 py-1.5 text-right ${STATUS_CLASS[r.status]}`}>
                  {m.couponStatus[r.status]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <p className="mt-1.5 text-[11px] leading-relaxed text-text-muted">
        {t.note(
          p.koObservationFreq === "monthly",
          coupons.paidCount,
          coupons.rows.length,
          (coupons.paidPct * 100).toFixed(2),
        )}
      </p>
    </Section>
  );
}
