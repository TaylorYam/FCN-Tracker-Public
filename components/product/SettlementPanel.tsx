import { InfoTip } from "@/components/InfoTip";
import { Card, Section } from "@/components/Section";
import { formatDate } from "@/lib/dates";
import { formatLevel, formatPrice } from "@/lib/format";
import type { Locale } from "@/lib/i18n/config";
import { getMessages, type Messages } from "@/lib/i18n/messages";
import type { Settlement } from "@/lib/lifecycle";
import { evaluateKIStyleMatrix } from "@/lib/rules";
import type { ProductState } from "@/lib/state";

/** Shown once the product has terminated (knock-out or maturity). */
export function SettlementPanel({ state, locale }: { state: ProductState; locale: Locale }) {
  const m = getMessages(locale);
  const t = m.product.settlement;
  const { config: p, lifecycle, coupons, series } = state;
  const s = lifecycle.settlement;
  if (!s) return null;

  const koRow = coupons.rows.find((r) => r.isKOPeriod);
  const totalCoupons = coupons.rows.filter((r) => r.status !== "cancelled").length;

  return (
    <Section
      title={
        <>
          {t.title}
          <InfoTip ariaLabel={m.aboutTerm(m.terms.strike)}>{m.glossary.strike}</InfoTip>
        </>
      }
    >
      <Card className="px-4 py-3">
        <SettlementText settlement={s} strikeLevel={p.strikeLevel} locale={locale} m={m} />
        <p className="mt-2 text-[12px] text-text-secondary">
          {t.coupons(
            totalCoupons,
            (coupons.perPeriodPct * 100).toFixed(2),
            (totalCoupons * coupons.perPeriodPct * 100).toFixed(2),
            s.type === "early-redemption" && koRow ? formatDate(koRow.paymentDate, locale) : null,
          )}
        </p>
      </Card>

      {lifecycle.status === "matured" && (
        <div className="mt-3">
          <div className="mb-1.5 text-[11px] font-medium text-text-muted">
            {t.kiMatrixTitle(formatLevel(p.kiLevel || p.strikeLevel))}
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
                      {k.kiObservation === "NONE" ? t.noKI : k.kiObservation}
                      {k.isProductRule && (
                        <span className="ml-1.5 rounded bg-accent-blue px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                          {m.common.thisProduct}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {k.settlement?.type === "physical-delivery"
                        ? t.delivery
                        : k.settlement?.type === "par-redemption"
                          ? t.par
                          : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <p className="mt-1.5 text-[11px] leading-relaxed text-text-muted">{t.kiMatrixNote}</p>
        </div>
      )}
    </Section>
  );
}

function SettlementText({
  settlement: s,
  strikeLevel,
  locale,
  m,
}: {
  settlement: Settlement;
  strikeLevel: number;
  locale: Locale;
  m: Messages;
}) {
  const t = m.product.settlement;
  if (s.type === "early-redemption") {
    return (
      <p className="text-[13px] leading-relaxed text-text-primary">
        <span className="font-semibold">{t.earlyLead}</span>
        {t.earlyText(formatDate(s.date, locale))}
      </p>
    );
  }
  if (s.type === "par-redemption") {
    return (
      <p className="text-[13px] leading-relaxed text-text-primary">
        <span className="font-semibold">{t.parLead}</span>
        {t.parText(s.worstTicker, formatLevel(s.worstRatio))}
      </p>
    );
  }
  return (
    <div className="text-[13px] leading-relaxed text-text-primary">
      <p>
        <span className="font-semibold">{t.deliveryLead(s.worstTicker)}</span>
        {t.deliveryText(formatPrice(s.deliveryPrice), formatLevel(strikeLevel))}
      </p>
      <p className="mt-1 text-[12px] text-text-secondary">
        {t.deliveryValue(
          s.worstTicker,
          formatLevel(s.worstRatio),
          (s.indicativeValuePct * 100).toFixed(1),
          formatLevel(strikeLevel),
        )}
      </p>
    </div>
  );
}
