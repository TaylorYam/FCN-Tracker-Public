import { InfoTip } from "@/components/InfoTip";
import { Card, Section } from "@/components/Section";
import { GLOSSARY } from "@/lib/glossary";
import { formatLevel, formatRateValue } from "@/lib/format";
import type { ProductState } from "@/lib/state";

export function Summary({ state }: { state: ProductState }) {
  const { config: p, coupons } = state;
  const periodLabel =
    coupons.periodMonths === 1
      ? "monthly"
      : coupons.periodMonths === 3
        ? "quarterly"
        : `every ${coupons.periodMonths} months`;
  const noKi = p.kiObservation === "NONE";
  const kiDetail =
    p.kiObservation === "EKI" ? "EKI · at maturity" : p.kiObservation === "AKI" ? "AKI · daily" : undefined;

  return (
    <Section title="Product summary">
      <Card className="overflow-hidden">
        <div className="px-4 pb-4 pt-5 text-center">
          <div className="text-[11px] uppercase tracking-[0.18em] text-text-muted">
            Annualized coupon
            <InfoTip label="coupon">{GLOSSARY.coupon}</InfoTip>
          </div>
          <div className="mt-1.5 text-[36px] font-semibold leading-none tabular-nums text-emerald-700">
            {formatRateValue(p.couponRateAnnual)}
            <span className="ml-0.5 text-2xl">%</span>
          </div>
          <div className="mt-2 text-[12px] tabular-nums text-text-secondary">
            ≈ {(coupons.perPeriodPct * 100).toFixed(2)}% paid {periodLabel}
          </div>
        </div>

        <div className="grid grid-cols-3 divide-x divide-bg-elevated border-t border-bg-elevated">
          <Stat label="Knock-out" tip={GLOSSARY.ko} value={formatLevel(p.koLevel)} />
          <Stat label="Strike" tip={GLOSSARY.strike} value={formatLevel(p.strikeLevel)} />
          <Stat
            label="Knock-in"
            tip={GLOSSARY.ki}
            value={noKi ? "None" : formatLevel(p.kiLevel)}
            detail={kiDetail}
            dim={noKi}
          />
        </div>
        <div className="grid grid-cols-3 divide-x divide-bg-elevated border-t border-bg-elevated">
          <Stat label="Tenor" value={`${p.termMonths} months`} />
          <Stat label="Underlyings" tip={GLOSSARY.worst} value={`${p.underlyings.length} · worst-of`} />
          <Stat
            label="Coupons paid"
            value={`${coupons.paidCount} / ${coupons.rows.length}`}
            detail={`${(coupons.paidPct * 100).toFixed(2)}% of notional`}
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
  detail,
  dim = false,
}: {
  label: string;
  value: string;
  tip?: string;
  detail?: string;
  dim?: boolean;
}) {
  return (
    <div className="px-2 py-3 text-center">
      <div className="text-[11px] text-text-muted">
        {label}
        {tip && <InfoTip label={label}>{tip}</InfoTip>}
      </div>
      <div
        className={`mt-1 text-[15px] font-medium tabular-nums ${dim ? "text-text-muted" : "text-text-primary"}`}
      >
        {value}
      </div>
      {detail && (
        <div className="mt-1 text-[10px] font-medium text-amber-800">{detail}</div>
      )}
    </div>
  );
}
