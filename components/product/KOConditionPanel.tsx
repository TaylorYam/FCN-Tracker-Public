import { InfoTip } from "@/components/InfoTip";
import { Card, Section } from "@/components/Section";
import { formatDate, formatDateShort } from "@/lib/dates";
import {
  getObservationDates,
  getScheduledMonthlyObservationDates,
  observationModeLabel,
} from "@/lib/fcn";
import { formatLevel } from "@/lib/format";
import { GLOSSARY } from "@/lib/glossary";
import { evaluateKORuleMatrix } from "@/lib/rules";
import type { ProductState } from "@/lib/state";

export function KOConditionPanel({ state }: { state: ProductState }) {
  const { config: p, series, ko, asOf } = state;
  const evaluated = getObservationDates(p, series).filter(
    (d) => !ko.trigger.triggerDate || d <= ko.trigger.triggerDate,
  );
  const matrix = evaluateKORuleMatrix(p, series);

  return (
    <Section
      title={
        <>
          KO condition
          <InfoTip label="memory KO">{GLOSSARY.memory}</InfoTip>
        </>
      }
      aside={observationModeLabel(p)}
    >
      <Card className="px-4 py-3">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[12px] sm:grid-cols-4">
          <Fact label="KO level" value={`${formatLevel(p.koLevel)} of initial`} />
          <Fact
            label={
              <>
                KO start
                <InfoTip label="non-call period">{GLOSSARY.nonCall}</InfoTip>
              </>
            }
            value={formatDate(p.koStartDate)}
          />
          <Fact
            label={
              <>
                Observation
                <InfoTip label="observation frequency">{GLOSSARY.observation}</InfoTip>
              </>
            }
            value={p.koObservationFreq === "daily" ? "Every close" : "Monthly obs. date"}
          />
          <Fact label="Dates evaluated" value={`${evaluated.length}`} />
        </dl>

        {p.koObservationFreq === "monthly" ? (
          <MonthlyObservationTable state={state} />
        ) : (
          <ul className="mt-3 divide-y divide-bg-elevated border-t border-bg-elevated">
            {p.underlyings.map((u) => {
              const r = ko.reachedKO[u.ticker];
              return (
                <li key={u.ticker} className="flex items-center justify-between py-2 text-[12px]">
                  <span className="flex items-center gap-1.5 font-medium text-text-primary">
                    <span className="h-2 w-2 rounded-full" style={{ background: u.color }} aria-hidden />
                    {u.ticker}
                  </span>
                  <span className={r?.reached ? "font-semibold text-red-700" : "text-text-muted"}>
                    {r?.reached && r.reachedDate
                      ? `${p.hasMemoryKO ? "Recorded" : "Above KO"} ${formatDate(r.reachedDate)}`
                      : p.hasMemoryKO
                        ? "Not yet recorded"
                        : "—"}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        <p className="mt-3 text-[12px] leading-relaxed text-text-secondary">
          {ko.trigger.triggered && ko.trigger.triggerDate
            ? p.hasMemoryKO
              ? `All underlyings recorded — KO triggered on ${formatDate(ko.trigger.triggerDate)}, the date the last laggard crossed.`
              : `All underlyings were at or above KO on ${formatDate(ko.trigger.triggerDate)} — KO triggered.`
            : `No KO as of ${formatDate(asOf < p.expiryDate ? asOf : p.expiryDate)}.`}
        </p>
      </Card>

      <div className="mt-3">
        <div className="mb-1.5 text-[11px] font-medium text-text-muted">
          Rule comparison — the same synthetic path under each KO rule
        </div>
        <Card className="overflow-hidden">
          <table className="w-full text-[12px]">
            <tbody>
              {matrix.map((m) => (
                <tr
                  key={m.label}
                  className={`border-t border-bg-elevated first:border-t-0 ${
                    m.isProductRule ? "bg-accent-blue/10" : ""
                  }`}
                >
                  <td className="px-3 py-2 font-medium text-text-primary">
                    {m.label}
                    {m.isProductRule && (
                      <span className="ml-1.5 rounded bg-accent-blue px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                        This product
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {m.trigger.triggered && m.trigger.triggerDate ? (
                      <span className="font-semibold text-emerald-700">
                        KO {formatDate(m.trigger.triggerDate)}
                      </span>
                    ) : (
                      <span className="text-text-muted">
                        No KO
                        {m.hasMemoryKO && ` · ${m.reachedCount}/${p.underlyings.length} recorded`}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <p className="mt-1.5 text-[11px] leading-relaxed text-text-muted">
          Educational comparison using the engine in <code>lib/fcn.ts</code>. Only the highlighted
          rule is part of this product&apos;s terms.
        </p>
      </div>
    </Section>
  );
}

function Fact({ label, value }: { label: React.ReactNode; value: string }) {
  return (
    <div>
      <dt className="text-[11px] text-text-muted">{label}</dt>
      <dd className="mt-0.5 font-medium tabular-nums text-text-primary">{value}</dd>
    </div>
  );
}

function MonthlyObservationTable({ state }: { state: ProductState }) {
  const { config: p, series, ko } = state;
  const scheduled = getScheduledMonthlyObservationDates(p);
  const lastData = Object.keys(series).sort().at(-1) ?? "";
  const past = scheduled.filter((d) => d <= lastData);
  const upcoming = scheduled.filter((d) => d > lastData);
  const shownUpcoming = ko.trigger.triggered ? [] : upcoming.slice(0, 1);
  const hidden = ko.trigger.triggered ? 0 : upcoming.length - shownUpcoming.length;

  return (
    <div className="mt-3 overflow-x-auto border-t border-bg-elevated">
      <table className="w-full min-w-[420px] text-[12px] tabular-nums">
        <thead>
          <tr className="text-[10px] uppercase tracking-wide text-text-muted">
            <th className="py-2 pr-2 text-left font-medium">Obs. date</th>
            {p.underlyings.map((u) => (
              <th key={u.ticker} className="px-1 py-2 text-right font-medium">
                {u.ticker}
              </th>
            ))}
            <th className="py-2 pl-2 text-right font-medium">All ≥ KO?</th>
          </tr>
        </thead>
        <tbody>
          {past.map((d) => {
            const day = series[d];
            const flags = p.underlyings.map((u) => {
              const close = day?.[u.ticker];
              return close === undefined ? null : close / u.initialPrice;
            });
            const allUp = flags.every((f) => f !== null && f >= p.koLevel);
            return (
              <tr key={d} className="border-t border-bg-elevated">
                <td className="py-1.5 pr-2 text-text-secondary">{formatDateShort(d)}</td>
                {flags.map((f, i) => (
                  <td
                    key={p.underlyings[i].ticker}
                    className={`px-1 py-1.5 text-right ${
                      f !== null && f >= p.koLevel ? "font-semibold text-emerald-700" : "text-text-muted"
                    }`}
                  >
                    {f === null ? "—" : formatLevel(f)}
                  </td>
                ))}
                <td className={`py-1.5 pl-2 text-right font-semibold ${allUp ? "text-emerald-700" : "text-text-muted"}`}>
                  {allUp ? "Yes → KO" : "No"}
                </td>
              </tr>
            );
          })}
          {shownUpcoming.map((d) => (
            <tr key={d} className="border-t border-bg-elevated">
              <td className="py-1.5 pr-2 text-text-secondary">{formatDateShort(d)}</td>
              <td colSpan={p.underlyings.length + 1} className="py-1.5 text-right text-text-muted">
                Next observation{hidden > 0 ? ` · ${hidden} more scheduled` : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
