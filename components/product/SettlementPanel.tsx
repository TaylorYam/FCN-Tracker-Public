import { InfoTip } from "@/components/InfoTip";
import { Card, Section } from "@/components/Section";
import { formatDate } from "@/lib/dates";
import { formatLevel, formatPrice } from "@/lib/format";
import { GLOSSARY } from "@/lib/glossary";
import type { Settlement } from "@/lib/lifecycle";
import { evaluateKIStyleMatrix } from "@/lib/rules";
import type { ProductState } from "@/lib/state";

/** Shown once the product has terminated (knock-out or maturity). */
export function SettlementPanel({ state }: { state: ProductState }) {
  const { config: p, lifecycle, coupons, series } = state;
  const s = lifecycle.settlement;
  if (!s) return null;

  const koRow = coupons.rows.find((r) => r.isKOPeriod);
  const totalCoupons = coupons.rows.filter(
    (r) => r.status !== "cancelled",
  ).length;

  return (
    <Section
      title={
        <>
          Settlement
          <InfoTip label="strike">{GLOSSARY.strike}</InfoTip>
        </>
      }
    >
      <Card className="px-4 py-3">
        <SettlementText settlement={s} strikeLevel={p.strikeLevel} />
        <p className="mt-2 text-[12px] text-text-secondary">
          Coupons: {totalCoupons} × {(coupons.perPeriodPct * 100).toFixed(2)}% ={" "}
          {(totalCoupons * coupons.perPeriodPct * 100).toFixed(2)}% of notional
          {s.type === "early-redemption" && koRow
            ? `, the last paid with redemption on ${formatDate(koRow.paymentDate)}.`
            : ", paid regardless of the settlement type."}
        </p>
      </Card>

      {lifecycle.status === "matured" && (
        <div className="mt-3">
          <div className="mb-1.5 text-[11px] font-medium text-text-muted">
            What the knock-in style changes — same final closes, KI level {formatLevel(p.kiLevel || p.strikeLevel)}
          </div>
          <Card className="overflow-hidden">
            <table className="w-full text-[12px]">
              <tbody>
                {evaluateKIStyleMatrix(p, series).map((k) => (
                  <tr
                    key={k.kiObservation}
                    className={`border-t border-bg-elevated first:border-t-0 ${
                      k.isProductRule ? "bg-accent-blue/10" : ""
                    }`}
                  >
                    <td className="px-3 py-2 font-medium text-text-primary">
                      {k.kiObservation === "NONE" ? "No KI" : k.kiObservation}
                      {k.isProductRule && (
                        <span className="ml-1.5 rounded bg-accent-blue px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                          This product
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {k.settlement?.type === "physical-delivery"
                        ? "Physical delivery at strike"
                        : k.settlement?.type === "par-redemption"
                          ? "100% par redemption"
                          : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <p className="mt-1.5 text-[11px] leading-relaxed text-text-muted">
            Educational comparison. With EKI only the final close is tested against KI; with AKI any
            daily close during the tenor counts; with no KI the strike alone decides.
          </p>
        </div>
      )}
    </Section>
  );
}

function SettlementText({ settlement: s, strikeLevel }: { settlement: Settlement; strikeLevel: number }) {
  if (s.type === "early-redemption") {
    return (
      <p className="text-[13px] leading-relaxed text-text-primary">
        <span className="font-semibold">Early redemption at 100% of notional</span> following the
        knock-out on {formatDate(s.date)}.
      </p>
    );
  }
  if (s.type === "par-redemption") {
    return (
      <p className="text-[13px] leading-relaxed text-text-primary">
        <span className="font-semibold">Redeemed at 100% par</span> on the final valuation date.
        Worst performer {s.worstTicker} finished at {formatLevel(s.worstRatio)} of initial.
      </p>
    );
  }
  return (
    <div className="text-[13px] leading-relaxed text-text-primary">
      <p>
        <span className="font-semibold">Physical delivery of {s.worstTicker}</span> at the strike
        price of {formatPrice(s.deliveryPrice)} ({formatLevel(strikeLevel)} of initial): the notional
        converts into notional ÷ {formatPrice(s.deliveryPrice)} shares.
      </p>
      <p className="mt-1 text-[12px] text-text-secondary">
        {s.worstTicker} finished at {formatLevel(s.worstRatio)} of initial, so the delivered shares
        are worth about {(s.indicativeValuePct * 100).toFixed(1)}% of notional at the final close
        ({formatLevel(s.worstRatio)} ÷ {formatLevel(strikeLevel)}), before coupons.
      </p>
    </div>
  );
}
