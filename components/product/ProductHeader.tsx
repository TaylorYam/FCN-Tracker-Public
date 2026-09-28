import { SyntheticBadge } from "@/components/SyntheticBadge";
import { formatDate } from "@/lib/dates";
import { observationModeLabel } from "@/lib/fcn";
import { formatRatePercent } from "@/lib/format";
import type { ProductState } from "@/lib/state";

export function ProductHeader({ state }: { state: ProductState }) {
  const p = state.config;
  return (
    <header className="mb-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold tracking-[0.12em] text-text-muted">{p.code}</span>
        <SyntheticBadge />
      </div>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-text-primary sm:text-[28px]">
        {p.underlyingsLabel}
      </h1>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-secondary">{p.scenario}</p>
      <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] tabular-nums text-text-muted">
        <div>
          <dt className="inline">Trade </dt>
          <dd className="inline text-text-secondary">{formatDate(p.tradeDate)}</dd>
        </div>
        <div>
          <dt className="inline">Final valuation </dt>
          <dd className="inline text-text-secondary">{formatDate(p.expiryDate)}</dd>
        </div>
        <div>
          <dt className="inline">KO observation </dt>
          <dd className="inline text-text-secondary">{observationModeLabel(p)}</dd>
        </div>
        <div>
          <dt className="inline">Coupon </dt>
          <dd className="inline text-text-secondary">{formatRatePercent(p.couponRateAnnual)} p.a.</dd>
        </div>
        <div>
          <dt className="inline">Demo valuation date </dt>
          <dd className="inline text-text-secondary">{formatDate(state.asOf)}</dd>
        </div>
      </dl>
    </header>
  );
}
