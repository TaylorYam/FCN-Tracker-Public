import { InfoTip } from "@/components/InfoTip";
import { Card, Section } from "@/components/Section";
import { formatDate, formatDateShort } from "@/lib/dates";
import type { Locale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { daysBetween } from "@/lib/schedule";
import type { ProductState } from "@/lib/state";

type Marker = { date: string; label: string; tone: "muted" | "ko" | "ki" | "end" };

/** Horizontal lifecycle timeline: trade → KO start → (events) → final valuation. */
export function Timeline({ state, locale }: { state: ProductState; locale: Locale }) {
  const m = getMessages(locale);
  const t = m.product.timeline;
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
    { date: p.tradeDate, label: t.trade, tone: "muted" },
    { date: p.koStartDate, label: t.koStart, tone: "muted" },
  ];
  if (lifecycle.kiEvent.kind === "occurred" && p.kiObservation === "AKI") {
    markers.push({ date: lifecycle.kiEvent.date, label: t.kiEvent, tone: "ki" });
  }
  if (lifecycle.status === "knocked-out" && ko.trigger.triggerDate) {
    markers.push({ date: ko.trigger.triggerDate, label: t.knockOut, tone: "ko" });
  }
  markers.push({ date: p.expiryDate, label: t.finalValuation, tone: "end" });

  const summary =
    lifecycle.status === "knocked-out" && ko.trigger.triggerDate
      ? t.redeemedEarly(
          formatDate(ko.trigger.triggerDate, locale),
          daysBetween(ko.trigger.triggerDate, p.expiryDate),
        )
      : lifecycle.status === "matured"
        ? t.matured(formatDate(p.expiryDate, locale))
        : t.remaining(daysBetween(asOf, p.expiryDate), formatDate(p.expiryDate, locale));

  return (
    <Section
      title={
        <>
          {t.title}
          <InfoTip ariaLabel={m.aboutTerm(m.terms.maturity)}>{m.glossary.maturity}</InfoTip>
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
          {markers.map((mk, i) => (
            <div
              key={`${mk.tone}-${mk.date}-${i}`}
              className="absolute top-0 -translate-x-1/2 text-center"
              style={{ left: `${pos(mk.date)}%` }}
            >
              <div
                className={`mx-auto mt-[18px] h-4 w-0.5 ${
                  mk.tone === "ko"
                    ? "bg-emerald-700"
                    : mk.tone === "ki"
                      ? "bg-accent-red"
                      : mk.tone === "end"
                        ? "bg-text-primary"
                        : "bg-text-muted"
                }`}
              />
              <div
                className={`mt-1 whitespace-nowrap text-[10px] font-medium ${
                  i % 2 === 1 ? "translate-y-7" : ""
                } ${mk.tone === "ko" ? "text-emerald-800" : mk.tone === "ki" ? "text-accent-red" : "text-text-muted"}`}
              >
                {mk.label}
                <span className="block tabular-nums text-text-muted">{formatDateShort(mk.date, locale)}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-9 text-[12px] leading-relaxed text-text-secondary">{summary}</p>
      </Card>
    </Section>
  );
}
