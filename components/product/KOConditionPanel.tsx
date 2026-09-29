import { InfoTip } from "@/components/InfoTip";
import { Card, Section } from "@/components/Section";
import { formatDate, formatDateShort } from "@/lib/dates";
import { getObservationDates, getScheduledMonthlyObservationDates } from "@/lib/fcn";
import { formatLevel } from "@/lib/format";
import type { Locale } from "@/lib/i18n/config";
import { getMessages, type Messages } from "@/lib/i18n/messages";
import { evaluateKORuleMatrix } from "@/lib/rules";
import type { ProductState } from "@/lib/state";

export function KOConditionPanel({ state, locale }: { state: ProductState; locale: Locale }) {
  const m = getMessages(locale);
  const t = m.product.ko;
  const { config: p, series, ko, asOf } = state;
  const evaluated = getObservationDates(p, series).filter(
    (d) => !ko.trigger.triggerDate || d <= ko.trigger.triggerDate,
  );
  const matrix = evaluateKORuleMatrix(p, series);

  return (
    <Section
      title={
        <>
          {t.title}
          <InfoTip ariaLabel={m.aboutTerm(m.terms.memory)}>{m.glossary.memory}</InfoTip>
        </>
      }
      aside={m.observationMode(p.koObservationFreq, p.hasMemoryKO)}
    >
      <Card className="px-4 py-3">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[12px] sm:grid-cols-4">
          <Fact label={t.level} value={t.levelValue(formatLevel(p.koLevel))} />
          <Fact
            label={
              <>
                {t.start}
                <InfoTip ariaLabel={m.aboutTerm(m.terms.nonCall)}>{m.glossary.nonCall}</InfoTip>
              </>
            }
            value={formatDate(p.koStartDate, locale)}
          />
          <Fact
            label={
              <>
                {t.observation}
                <InfoTip ariaLabel={m.aboutTerm(m.terms.observation)}>{m.glossary.observation}</InfoTip>
              </>
            }
            value={p.koObservationFreq === "daily" ? t.everyClose : t.monthlyDate}
          />
          <Fact label={t.evaluated} value={`${evaluated.length}`} />
        </dl>

        {p.koObservationFreq === "monthly" ? (
          <MonthlyObservationTable state={state} locale={locale} m={m} />
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
                      ? p.hasMemoryKO
                        ? t.recorded(formatDate(r.reachedDate, locale))
                        : t.aboveKO(formatDate(r.reachedDate, locale))
                      : p.hasMemoryKO
                        ? t.notRecorded
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
              ? t.triggeredMemory(formatDate(ko.trigger.triggerDate, locale))
              : t.triggeredNonMemory(formatDate(ko.trigger.triggerDate, locale))
            : t.noKO(formatDate(asOf < p.expiryDate ? asOf : p.expiryDate, locale))}
        </p>
      </Card>

      <div className="mt-3">
        <div className="mb-1.5 text-[11px] font-medium text-text-muted">{t.matrixTitle}</div>
        <Card className="overflow-hidden">
          <table className="w-full text-[12px]">
            <tbody>
              {matrix.map((row) => (
                <tr
                  key={row.label}
                  className={`border-t border-bg-elevated first:border-t-0 ${
                    row.isProductRule ? "bg-accent-blue/10" : ""
                  }`}
                >
                  <td className="px-3 py-2 font-medium text-text-primary">
                    {m.observationMode(row.koObservationFreq, row.hasMemoryKO)}
                    {row.isProductRule && (
                      <span className="ml-1.5 rounded bg-accent-blue px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                        {m.common.thisProduct}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {row.trigger.triggered && row.trigger.triggerDate ? (
                      <span className="font-semibold text-emerald-700">
                        {t.matrixKO(formatDate(row.trigger.triggerDate, locale))}
                      </span>
                    ) : (
                      <span className="text-text-muted">
                        {t.matrixNoKO}
                        {row.hasMemoryKO && t.matrixRecorded(row.reachedCount, p.underlyings.length)}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <p className="mt-1.5 text-[11px] leading-relaxed text-text-muted">{t.matrixNote}</p>
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

function MonthlyObservationTable({
  state,
  locale,
  m,
}: {
  state: ProductState;
  locale: Locale;
  m: Messages;
}) {
  const t = m.product.ko;
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
            <th className="py-2 pr-2 text-left font-medium">{t.obsDate}</th>
            {p.underlyings.map((u) => (
              <th key={u.ticker} className="px-1 py-2 text-right font-medium">
                {u.ticker}
              </th>
            ))}
            <th className="py-2 pl-2 text-right font-medium">{t.allAbove}</th>
          </tr>
        </thead>
        <tbody>
          {past.map((d) => {
            const day = series[d];
            const levels = p.underlyings.map((u) => {
              const close = day?.[u.ticker];
              return close === undefined ? null : close / u.initialPrice;
            });
            const allUp = levels.every((f) => f !== null && f >= p.koLevel);
            return (
              <tr key={d} className="border-t border-bg-elevated">
                <td className="py-1.5 pr-2 text-text-secondary">{formatDateShort(d, locale)}</td>
                {levels.map((f, i) => (
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
                  {allUp ? t.yesKO : t.no}
                </td>
              </tr>
            );
          })}
          {shownUpcoming.map((d) => (
            <tr key={d} className="border-t border-bg-elevated">
              <td className="py-1.5 pr-2 text-text-secondary">{formatDateShort(d, locale)}</td>
              <td colSpan={p.underlyings.length + 1} className="py-1.5 text-right text-text-muted">
                {t.nextObservation}
                {hidden > 0 ? t.moreScheduled(hidden) : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
