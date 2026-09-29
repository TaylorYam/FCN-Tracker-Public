import { formatDate } from "@/lib/dates";
import { formatLevel, formatPrice } from "@/lib/format";
import type { Locale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import type { ProductState } from "@/lib/state";

const TONE = {
  info: "border-accent-blue/30 bg-accent-blue/10 text-accent-blue",
  success: "border-emerald-300 bg-emerald-50 text-emerald-800",
  warning: "border-amber-300 bg-amber-50 text-amber-900",
} as const;

export function StatusBanner({ state, locale }: { state: ProductState; locale: Locale }) {
  const m = getMessages(locale);
  const b = m.product.banner;
  const { config: p, lifecycle, ko, coupons } = state;
  const reached = Object.values(ko.reachedKO).filter((r) => r.reached).length;
  const total = p.underlyings.length;
  const next = lifecycle.nextKOObservationDate
    ? formatDate(lifecycle.nextKOObservationDate, locale)
    : null;

  let tone: keyof typeof TONE = "info";
  let detail: string;

  switch (lifecycle.status) {
    case "knocked-out": {
      tone = "success";
      const koRow = coupons.rows.find((r) => r.isKOPeriod);
      detail = b.knockedOut(formatDate(ko.trigger.triggerDate!, locale), koRow ? String(koRow.t) : "—");
      break;
    }
    case "matured": {
      const s = lifecycle.settlement;
      if (s?.type === "physical-delivery") {
        tone = "warning";
        detail = b.delivery(
          formatDate(s.date, locale),
          s.worstTicker,
          formatLevel(s.worstRatio),
          formatLevel(p.strikeLevel),
          p.kiObservation !== "NONE",
          formatPrice(s.deliveryPrice),
        );
      } else if (s?.type === "par-redemption") {
        tone = "success";
        detail = b.par(formatDate(s.date, locale), s.worstTicker, formatLevel(s.worstRatio));
      } else {
        detail = b.awaiting;
      }
      break;
    }
    case "non-call":
      detail = b.nonCall(formatDate(p.koStartDate, locale));
      break;
    case "ko-observation":
      detail = p.hasMemoryKO
        ? b.memory(reached, total, next)
        : b.nonMemory(total, m.freq[p.koObservationFreq], next);
      break;
  }

  return (
    <div className={`mb-6 rounded-lg border px-4 py-3 ${TONE[tone]}`} role="status">
      <div className="text-[11px] font-bold uppercase tracking-[0.12em]">{b.current}</div>
      <div className="mt-0.5 text-base font-semibold">{m.status[lifecycle.status]}</div>
      <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">{detail}</p>
    </div>
  );
}
