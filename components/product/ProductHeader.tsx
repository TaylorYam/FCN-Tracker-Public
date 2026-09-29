import { SyntheticBadge } from "@/components/SyntheticBadge";
import { formatDate } from "@/lib/dates";
import { formatRatePercent } from "@/lib/format";
import type { Locale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import type { ProductState } from "@/lib/state";

export function ProductHeader({ state, locale }: { state: ProductState; locale: Locale }) {
  const m = getMessages(locale);
  const h = m.product.header;
  const p = state.config;
  const facts: [string, string][] = [
    [h.trade, formatDate(p.tradeDate, locale)],
    [h.finalValuation, formatDate(p.expiryDate, locale)],
    [h.koObservation, m.observationMode(p.koObservationFreq, p.hasMemoryKO)],
    [h.coupon, h.couponPa(formatRatePercent(p.couponRateAnnual))],
    [h.asOf, formatDate(state.asOf, locale)],
  ];
  return (
    <header className="mb-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold tracking-[0.12em] text-text-muted">{p.code}</span>
        <SyntheticBadge locale={locale} />
      </div>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-text-primary sm:text-[28px]">
        {p.underlyingsLabel}
      </h1>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-secondary">
        {m.scenarios[p.id] ?? p.scenario}
      </p>
      <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] tabular-nums text-text-muted">
        {facts.map(([label, value]) => (
          <div key={label}>
            <dt className="inline">{label} </dt>
            <dd className="inline text-text-secondary">{value}</dd>
          </div>
        ))}
      </dl>
    </header>
  );
}
