import { InfoTip } from "@/components/InfoTip";
import { Card, Section } from "@/components/Section";
import { formatLevel, formatRateValue } from "@/lib/format";
import type { Locale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import type { ProductState } from "@/lib/state";

export function Summary({ state, locale }: { state: ProductState; locale: Locale }) {
  const m = getMessages(locale);
  const t = m.product.summary;
  const { config: p, coupons } = state;
  const noKi = p.kiObservation === "NONE";
  const kiDetail =
    p.kiObservation === "EKI" ? t.ekiDetail : p.kiObservation === "AKI" ? t.akiDetail : undefined;

  return (
    <Section title={t.title}>
      <Card className="overflow-hidden">
        <div className="px-4 pb-4 pt-5 text-center">
          <div className="text-[11px] uppercase tracking-[0.18em] text-text-muted">
            {t.coupon}
            <InfoTip ariaLabel={m.aboutTerm(m.terms.coupon)}>{m.glossary.coupon}</InfoTip>
          </div>
          <div className="mt-1.5 text-[36px] font-semibold leading-none tabular-nums text-emerald-700">
            {formatRateValue(p.couponRateAnnual)}
            <span className="ml-0.5 text-2xl">%</span>
          </div>
          <div className="mt-2 text-[12px] tabular-nums text-text-secondary">
            {t.perPeriod((coupons.perPeriodPct * 100).toFixed(2), coupons.periodMonths)}
          </div>
        </div>

        <div className="grid grid-cols-3 divide-x divide-bg-elevated border-t border-bg-elevated">
          <Stat label={t.ko} tip={m.glossary.ko} tipLabel={m.aboutTerm(m.terms.ko)} value={formatLevel(p.koLevel)} />
          <Stat
            label={t.strike}
            tip={m.glossary.strike}
            tipLabel={m.aboutTerm(m.terms.strike)}
            value={formatLevel(p.strikeLevel)}
          />
          <Stat
            label={t.ki}
            tip={m.glossary.ki}
            tipLabel={m.aboutTerm(m.terms.ki)}
            value={noKi ? m.common.none : formatLevel(p.kiLevel)}
            detail={kiDetail}
            dim={noKi}
          />
        </div>
        <div className="grid grid-cols-3 divide-x divide-bg-elevated border-t border-bg-elevated">
          <Stat label={t.tenor} value={m.common.months(p.termMonths)} />
          <Stat
            label={t.underlyings}
            tip={m.glossary.worst}
            tipLabel={m.aboutTerm(m.terms.worst)}
            value={m.common.underlyingsWorstOf(p.underlyings.length)}
          />
          <Stat
            label={t.couponsPaid}
            value={`${coupons.paidCount} / ${coupons.rows.length}`}
            detail={m.common.ofNotional((coupons.paidPct * 100).toFixed(2))}
          />
        </div>
      </Card>
    </Section>
  );
}

function Stat({
  label,
  value,
  tip,
  tipLabel,
  detail,
  dim = false,
}: {
  label: string;
  value: string;
  tip?: string;
  tipLabel?: string;
  detail?: string;
  dim?: boolean;
}) {
  return (
    <div className="px-2 py-3 text-center">
      <div className="text-[11px] text-text-muted">
        {label}
        {tip && <InfoTip ariaLabel={tipLabel ?? label}>{tip}</InfoTip>}
      </div>
      <div
        className={`mt-1 text-[15px] font-medium tabular-nums ${dim ? "text-text-muted" : "text-text-primary"}`}
      >
        {value}
      </div>
      {detail && <div className="mt-1 text-[10px] font-medium text-amber-800">{detail}</div>}
    </div>
  );
}
