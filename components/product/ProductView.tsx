import Link from "next/link";
import { getScheduledMonthlyObservationDates } from "@/lib/fcn";
import type { ProductState } from "@/lib/state";
import { CouponSchedule } from "./CouponSchedule";
import { KOConditionPanel } from "./KOConditionPanel";
import { PriceChart } from "./PriceChart";
import { ProductHeader } from "./ProductHeader";
import { SettlementPanel } from "./SettlementPanel";
import { StatusBanner } from "./StatusBanner";
import { Summary } from "./Summary";
import { Timeline } from "./Timeline";
import { UnderlyingTable } from "./UnderlyingTable";

/** Pure render of a product's monitoring state. */
export function ProductView({ state }: { state: ProductState }) {
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

  return (
    <>
      <Link
        href="/#demo-products"
        className="mb-4 inline-flex items-center gap-1 text-[12px] text-text-secondary transition-colors hover:text-text-primary"
      >
        <span aria-hidden>←</span>
        <span>All demo products</span>
      </Link>

      <ProductHeader state={state} />
      <StatusBanner state={state} />

      <div className="grid grid-cols-1 gap-x-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <Summary state={state} />
        <Timeline state={state} />
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
      />

      <UnderlyingTable state={state} />

      <div className="grid grid-cols-1 gap-x-6 lg:grid-cols-2">
        <KOConditionPanel state={state} />
        <div className="min-w-0">
          <SettlementPanel state={state} />
          <CouponSchedule state={state} />
        </div>
      </div>
    </>
  );
}
