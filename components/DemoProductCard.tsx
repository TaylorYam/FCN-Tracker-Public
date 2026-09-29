import Link from "next/link";
import { SyntheticBadge } from "@/components/SyntheticBadge";
import { formatRatePercent } from "@/lib/format";
import { STATUS_LABEL } from "@/lib/lifecycle";
import type { ProductState } from "@/lib/state";

export function DemoProductCard({ state }: { state: ProductState }) {
  const p = state.config;
  const facts: [string, string][] = [
    ["Underlyings", `${p.underlyings.length} · worst-of`],
    ["Tenor", `${p.termMonths} months`],
    ["Annualized coupon", formatRatePercent(p.couponRateAnnual)],
    ["KO observation", p.koObservationFreq === "daily" ? "Daily" : "Monthly"],
    ["Memory KO", p.hasMemoryKO ? "Yes" : "No"],
    ["Knock-in", p.kiObservation === "NONE" ? "None" : p.kiObservation],
  ];
  const tone =
    state.lifecycle.status === "knocked-out"
      ? "bg-emerald-100 text-emerald-800"
      : state.lifecycle.status === "matured"
        ? "bg-amber-100 text-amber-900"
        : "bg-accent-blue/10 text-accent-blue";

  return (
    <article className="flex flex-col rounded-xl border border-bg-elevated/70 bg-bg-surface p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="whitespace-nowrap text-[12px] font-bold tracking-[0.1em] text-text-primary">
          {p.code}
        </span>
        <SyntheticBadge />
      </div>
      <h3 className="mt-2 text-[15px] font-semibold text-text-primary">{p.underlyingsLabel}</h3>
      <span className={`mt-2 self-start rounded px-1.5 py-0.5 text-[10px] font-bold ${tone}`}>
        {STATUS_LABEL[state.lifecycle.status]}
      </span>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]">
        {facts.map(([k, v]) => (
          <div key={k}>
            <dt className="text-[10px] uppercase tracking-wide text-text-muted">{k}</dt>
            <dd className="font-medium tabular-nums text-text-primary">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 flex-1 text-[12px] leading-relaxed text-text-secondary">{p.scenario}</p>
      <Link
        href={`/products/${p.id}`}
        className="mt-4 inline-flex items-center justify-center rounded-lg bg-text-primary px-4 py-2.5 text-sm font-medium text-bg-surface transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2 focus-visible:ring-offset-bg-surface"
        aria-label={`View product ${p.code}`}
      >
        View Product
      </Link>
    </article>
  );
}
