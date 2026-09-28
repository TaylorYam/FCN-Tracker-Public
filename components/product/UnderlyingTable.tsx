import { InfoTip } from "@/components/InfoTip";
import { Card, Section } from "@/components/Section";
import { formatDate, formatDateShort } from "@/lib/dates";
import { formatLevel, formatPrice, formatSignedPct } from "@/lib/format";
import { GLOSSARY } from "@/lib/glossary";
import { getWorstKIRisk } from "@/lib/ki-risk";
import { computeUnderlyingPerformance, findWorstPerformer, worstBelowStrike } from "@/lib/performance";
import type { ProductState } from "@/lib/state";

export function UnderlyingTable({ state }: { state: ProductState }) {
  const { config: p, prices, ko, lifecycle } = state;
  const rows = computeUnderlyingPerformance(p, prices);
  const worst = findWorstPerformer(p, prices);
  const belowStrikeWorst = worstBelowStrike(p, prices);
  const hasKI = p.kiObservation !== "NONE";
  const isLive = lifecycle.status === "ko-observation" || lifecycle.status === "non-call";
  const kiRisk = isLive ? getWorstKIRisk(p, prices) : null;

  const valuationLabel =
    lifecycle.status === "knocked-out"
      ? "At KO date"
      : lifecycle.status === "matured"
        ? "Final"
        : "Latest";

  return (
    <Section
      title={
        <>
          Underlyings
          <InfoTip label="performance">{GLOSSARY.performance}</InfoTip>
        </>
      }
      aside={
        lifecycle.valuationDate
          ? `${valuationLabel} closes: ${formatDate(lifecycle.valuationDate)}`
          : undefined
      }
    >
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wide text-text-muted">
              <th className="px-3 py-2 font-medium">Underlying</th>
              <th className="px-3 py-2 text-right font-medium">Initial</th>
              <th className="px-3 py-2 text-right font-medium">{valuationLabel}</th>
              <th className="px-3 py-2 text-right font-medium">Performance</th>
              <th className="px-3 py-2 text-right font-medium">KO {formatLevel(p.koLevel)}</th>
              <th className="px-3 py-2 text-right font-medium">Strike {formatLevel(p.strikeLevel)}</th>
              {hasKI && (
                <th className="px-3 py-2 text-right font-medium">KI {formatLevel(p.kiLevel)}</th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const reached = ko.reachedKO[r.ticker];
              const isWorst = worst?.ticker === r.ticker;
              const isWorstBelowK = belowStrikeWorst === r.ticker;
              const color = p.underlyings.find((u) => u.ticker === r.ticker)!.color;
              return (
                <tr key={r.ticker} className="border-t border-bg-elevated align-top">
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="inline-block h-2 w-2 shrink-0 rounded-full"
                        style={{ background: color }}
                        aria-hidden
                      />
                      <span className="font-semibold text-text-primary">{r.ticker}</span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-text-muted">{r.name}</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {reached?.reached && (
                        <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-red-700">
                          KO{p.hasMemoryKO && reached.reachedDate ? ` · ${formatDateShort(reached.reachedDate)}` : ""}
                        </span>
                      )}
                      {isWorst && (
                        <span
                          className={`whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-bold ${
                            isWorstBelowK
                              ? "bg-amber-100 text-amber-800"
                              : "bg-bg-elevated/60 text-text-secondary"
                          }`}
                        >
                          {isWorstBelowK ? "Worst · below strike" : "Worst performer"}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-text-secondary">
                    {formatPrice(r.initialPrice)}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-text-primary">
                    {formatPrice(r.currentPrice)}
                    <div className="text-[11px] text-text-muted">{formatLevel(r.ratio)}</div>
                  </td>
                  <td
                    className={`px-3 py-3 text-right font-medium tabular-nums ${
                      r.performance < 0 ? "text-accent-red" : "text-emerald-700"
                    }`}
                  >
                    {formatSignedPct(r.performance)}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-text-secondary">
                    {formatPrice(r.koPrice)}
                    <div className={`text-[11px] ${r.koDistancePp >= 0 ? "text-emerald-700" : "text-text-muted"}`}>
                      {r.koDistancePp >= 0 ? "at/above" : `${Math.abs(r.koDistancePp).toFixed(1)} pp below`}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-text-secondary">
                    {formatPrice(r.strikePrice)}
                    <div className={`text-[11px] ${r.isBelowStrike ? "text-amber-800" : "text-text-muted"}`}>
                      {r.isBelowStrike
                        ? `${Math.abs(r.strikeDistancePp).toFixed(1)} pp below`
                        : `${r.strikeDistancePp.toFixed(1)} pp above`}
                    </div>
                  </td>
                  {hasKI && (
                    <td className="px-3 py-3 text-right tabular-nums text-text-secondary">
                      {r.kiPrice !== null ? formatPrice(r.kiPrice) : "—"}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {kiRisk && (
        <div
          className={`mt-2 rounded-md px-3 py-2.5 ${kiRisk.isBelowKI ? "bg-red-100/80" : "bg-amber-100/80"}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div
                className={`text-[12px] font-bold ${kiRisk.isBelowKI ? "text-red-700" : "text-amber-900"}`}
              >
                {kiRisk.ticker} is below strike ·{" "}
                {kiRisk.isBelowKI
                  ? `${Math.abs(kiRisk.distancePercentagePoints).toFixed(1)} pp below KI`
                  : `${kiRisk.distancePercentagePoints.toFixed(1)} pp above KI`}
              </div>
              <div className="mt-1 text-[11px] text-text-secondary">
                {p.kiObservation === "EKI"
                  ? "EKI: the barrier is evaluated on the final valuation date only; closes below KI before then do not count."
                  : lifecycle.kiEvent.kind === "occurred"
                    ? `AKI: barrier already breached on ${formatDate(lifecycle.kiEvent.date)}.`
                    : "AKI: any daily close below KI during the tenor would activate the downside."}
              </div>
            </div>
            <div className="shrink-0 text-right tabular-nums">
              <div className="text-[12px] font-semibold text-text-primary">
                {formatLevel(kiRisk.currentRatio)}
              </div>
              <div className="mt-1 text-[10px] text-text-muted">
                KI {formatLevel(p.kiLevel)} · {formatPrice(kiRisk.kiPrice)}
              </div>
            </div>
          </div>
        </div>
      )}
    </Section>
  );
}
