import Link from "next/link";
import { getScheduledMonthlyObservationDates } from "@/lib/fcn";
import { formatLevel } from "@/lib/format";
import { localePath, type Locale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import type { ProductState } from "@/lib/state";
import { CouponSchedule } from "./CouponSchedule";
import { KOConditionPanel } from "./KOConditionPanel";
import { PriceChart, type ChartLabels } from "./PriceChart";
import { ProductHeader } from "./ProductHeader";
import { SettlementPanel } from "./SettlementPanel";
import { StatusBanner } from "./StatusBanner";
import { Summary } from "./Summary";
import { Timeline } from "./Timeline";
import { UnderlyingTable } from "./UnderlyingTable";

/** Pure render of a product's monitoring state. */
export function ProductView({ state, locale }: { state: ProductState; locale: Locale }) {
  const m = getMessages(locale);
  const { config: product, series, ko, lifecycle, asOf } = state;

  const reachedFlags = Object.fromEntries(
    Object.entries(ko.reachedKO).map(([ticker, v]) => [ticker, v.reached]),
  );
  const koDates = Object.fromEntries(
    Object.entries(ko.reachedKO).map(([ticker, v]) => [ticker, v.reachedDate]),
  );
  const kiEventDate =
    product.kiObservation === "AKI" && lifecycle.kiEvent.kind === "occurred"
      ? lifecycle.kiEvent.date
      : null;

  const hasKI = product.kiObservation !== "NONE";
  const chartLabels: ChartLabels = {
    title: m.product.chart.title,
    synthetic: m.product.chart.synthetic,
    ko: m.product.chart.ko,
    strike: m.product.chart.strike,
    ki: m.product.chart.ki(product.kiObservation),
    nonCall: m.product.chart.nonCall,
    kiEvent: m.product.chart.kiEvent,
    legendNonCall: m.product.chart.legendNonCall,
    legendMonthly: m.product.chart.legendMonthly,
    legendGrey: m.product.chart.legendGrey,
    aria: m.product.chart.aria(
      product.underlyings.map((u) => u.ticker).join(", "),
      formatLevel(product.koLevel),
      formatLevel(product.strikeLevel),
      hasKI ? formatLevel(product.kiLevel) : null,
    ),
  };

  return (
    <>
      <Link
        href={localePath(locale, "/#demo-products")}
        className="mb-4 inline-flex items-center gap-1 text-[12px] text-text-secondary transition-colors hover:text-text-primary"
      >
        <span aria-hidden>←</span>
        <span>{m.product.back}</span>
      </Link>

      <ProductHeader state={state} locale={locale} />
      <StatusBanner state={state} locale={locale} />

      <div className="grid grid-cols-1 gap-x-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <Summary state={state} locale={locale} />
        <Timeline state={state} locale={locale} />
      </div>

      <PriceChart
        product={product}
        series={series}
        asOf={asOf}
        reachedKO={reachedFlags}
        koDates={koDates}
        triggerDate={ko.trigger.triggerDate}
        kiEventDate={kiEventDate}
        observationDates={
          product.koObservationFreq === "monthly" ? getScheduledMonthlyObservationDates(product) : []
        }
        labels={chartLabels}
      />

      <UnderlyingTable state={state} locale={locale} />

      <div className="grid grid-cols-1 gap-x-6 lg:grid-cols-2">
        <KOConditionPanel state={state} locale={locale} />
        <div className="min-w-0">
          <SettlementPanel state={state} locale={locale} />
          <CouponSchedule state={state} locale={locale} />
        </div>
      </div>
    </>
  );
}
