import { InfoTip } from "@/components/InfoTip";
import { Card, Section } from "@/components/Section";
import { formatDate, formatDateShort } from "@/lib/dates";
import { GLOSSARY } from "@/lib/glossary";
import { daysBetween } from "@/lib/schedule";
import type { ProductState } from "@/lib/state";

type Marker = { date: string; label: string; tone: "muted" | "ko" | "ki" | "end" };

/** Horizontal lifecycle timeline: trade → KO start → (events) → final valuation. */
export function Timeline({ state }: { state: ProductState }) {
  const { config: p, lifecycle, ko, asOf } = state;
  const total = daysBetween(p.tradeDate, p.expiryDate);
  const pos = (d: string) => Math.min(100, Math.max(0, (daysBetween(p.tradeDate, d) / total) * 100));

  const endOfLife =
    lifecycle.status === "knocked-out" && ko.trigger.triggerDate
      ? ko.trigger.triggerDate
      : asOf < p.expiryDate
        ? asOf
        : p.expiryDate;

  const markers: Marker[] = [
    { date: p.tradeDate, label: "Trade", tone: "muted" },
    { date: p.koStartDate, label: "KO start", tone: "muted" },
  ];
  if (lifecycle.kiEvent.kind === "occurred" && p.kiObservation === "AKI") {
    markers.push({ date: lifecycle.kiEvent.date, label: "KI event", tone: "ki" });
  }
  if (lifecycle.status === "knocked-out" && ko.trigger.triggerDate) {
    markers.push({ date: ko.trigger.triggerDate, label: "Knock-out", tone: "ko" });
  }
  markers.push({ date: p.expiryDate, label: "Final valuation", tone: "end" });

  const daysLeft = daysBetween(asOf, p.expiryDate);

  return (
    <Section
      title={
        <>
          Maturity timeline
          <InfoTip label="maturity">{GLOSSARY.maturity}</InfoTip>
        </>
      }
    >
      <Card className="px-4 pb-4 pt-5">
        <div className="relative mx-2 h-20">
          <div className="absolute left-0 right-0 top-6 h-1.5 rounded-full bg-bg-elevated/70" />
          <div
            className={`absolute left-0 top-6 h-1.5 rounded-full ${
              lifecycle.status === "knocked-out" ? "bg-emerald-600" : "bg-accent-blue"
            }`}
            style={{ width: `${pos(endOfLife)}%` }}
          />
          {/* non-call shading */}
          <div
            className="absolute top-5 h-3.5 rounded-sm bg-bg-elevated/40"
            style={{ left: 0, width: `${pos(p.koStartDate)}%` }}
            aria-hidden
          />
          {markers.map((m, i) => (
            <div
              key={`${m.label}-${i}`}
              className="absolute top-0 -translate-x-1/2 text-center"
              style={{ left: `${pos(m.date)}%` }}
            >
              <div
                className={`mx-auto mt-[18px] h-4 w-0.5 ${
                  m.tone === "ko"
                    ? "bg-emerald-700"
                    : m.tone === "ki"
                      ? "bg-accent-red"
                      : m.tone === "end"
                        ? "bg-text-primary"
                        : "bg-text-muted"
                }`}
              />
              <div
                className={`mt-1 whitespace-nowrap text-[10px] font-medium ${
                  i % 2 === 1 ? "translate-y-7" : ""
                } ${m.tone === "ko" ? "text-emerald-800" : m.tone === "ki" ? "text-accent-red" : "text-text-muted"}`}
              >
                {m.label}
                <span className="block tabular-nums text-text-muted">{formatDateShort(m.date)}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-9 text-[12px] leading-relaxed text-text-secondary">
          {lifecycle.status === "knocked-out" && ko.trigger.triggerDate
            ? `Redeemed early on ${formatDate(ko.trigger.triggerDate)}, ${daysBetween(
                ko.trigger.triggerDate,
                p.expiryDate,
              )} days before the scheduled final valuation.`
            : lifecycle.status === "matured"
              ? `Reached final valuation on ${formatDate(p.expiryDate)} without a knock-out.`
              : `${daysLeft} days to final valuation (${formatDate(p.expiryDate)}). Shaded segment = non-call period.`}
        </p>
      </Card>
    </Section>
  );
}
