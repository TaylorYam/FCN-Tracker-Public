"use client";

import {
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipContentProps } from "recharts";
import { buildChartData } from "@/lib/chart-data";
import type { FCNProduct, PriceSeries } from "@/lib/types";

/** Pre-translated, serializable chart text (built on the server). */
export type ChartLabels = {
  title: string;
  synthetic: string;
  ko: string;
  strike: string;
  ki: string;
  nonCall: string;
  kiEvent: string;
  legendNonCall: string;
  legendMonthly: string;
  legendGrey: string;
  aria: string;
};

type Props = {
  product: FCNProduct;
  series: PriceSeries;
  /** Fixed demo valuation date (replaces the wall-clock "today"). */
  asOf: string;
  reachedKO: Record<string, boolean>;
  /** Per-ticker first KO date (YYYY-MM-DD). null if not yet reached. */
  koDates: Record<string, string | null>;
  triggerDate: string | null;
  /** AKI knock-in event date, if one occurred. */
  kiEventDate: string | null;
  /** Monthly KO observation dates to mark (empty for daily products). */
  observationDates: string[];
  labels: ChartLabels;
};

const DAY = 86_400_000;

export function PriceChart({
  product,
  series,
  asOf,
  reachedKO,
  koDates,
  triggerDate,
  kiEventDate,
  observationDates,
  labels,
}: Props) {
  const allData = buildChartData(series, product.underlyings);
  const tradeT = new Date(product.tradeDate).getTime();
  const expiryT = new Date(product.expiryDate).getTime();
  const asOfT = new Date(asOf).getTime();

  // When KO has triggered, freeze the X axis at the trigger date and clip
  // the data to that point.
  const triggered = triggerDate !== null;
  const triggerT = triggered ? new Date(triggerDate).getTime() : null;
  const baseData = triggered ? allData.filter((p) => p.t <= (triggerT as number)) : allData;

  // Early in a product's life the future runway is mostly empty. Zoom the
  // right edge to ~as-of (plus a small buffer); near or after maturity this
  // naturally falls back to the full term. KO'd products clamp to the
  // trigger date.
  const buffer = Math.min(14 * DAY, Math.max(3 * DAY, (asOfT - tradeT) * 0.06));
  const koStartT = new Date(product.koStartDate).getTime();
  const xMax = triggered
    ? (triggerT as number)
    : Math.min(expiryT, Math.max(asOfT, koStartT) + buffer);
  const hasKI = product.kiObservation !== "NONE";

  // For each ticker, split values into a "pre-KO" coloured segment and a
  // "post-KO" grey segment. The two share the KO-day point so the line
  // transitions without a gap.
  const koTimes: Record<string, number | null> = {};
  for (const u of product.underlyings) {
    const d = koDates[u.ticker];
    koTimes[u.ticker] = d ? new Date(d).getTime() : null;
  }
  const data = baseData.map((row) => {
    const out: Record<string, number | string | undefined | null> = { ...row };
    for (const u of product.underlyings) {
      const v = row[u.ticker];
      const koT = koTimes[u.ticker];
      const numV = typeof v === "number" ? v : null;
      if (koT === null || row.t < koT) {
        out[`${u.ticker}_pre`] = numV;
        out[`${u.ticker}_post`] = null;
      } else if (row.t > koT) {
        out[`${u.ticker}_pre`] = null;
        out[`${u.ticker}_post`] = numV;
      } else {
        out[`${u.ticker}_pre`] = numV;
        out[`${u.ticker}_post`] = numV;
      }
    }
    return out;
  });

  // Label only the lone laggard when exactly one underlying has not reached KO.
  const unreached = product.underlyings.filter((u) => reachedKO[u.ticker] !== true);
  const labelTicker = unreached.length === 1 ? unreached[0].ticker : null;
  const lastIdx = data.length - 1;

  // If the worst performer is below strike at the latest point, draw it bold
  // — at maturity the worst-of drives settlement. A KO'd line that is now
  // below strike reverts to its colour instead of grey.
  const koPct = product.koLevel * 100;
  const strikePct = product.strikeLevel * 100;
  const kiPct = product.kiLevel * 100;
  const lastRow = data[lastIdx];
  const belowKByTicker: Record<string, boolean> = {};
  let worstTicker: string | null = null;
  let anyBelowK = false;
  let worst = Infinity;
  for (const u of product.underlyings) {
    const v = lastRow?.[u.ticker];
    const below = typeof v === "number" && v < strikePct;
    belowKByTicker[u.ticker] = below;
    if (below) anyBelowK = true;
    if (typeof v === "number" && v < worst) {
      worst = v;
      worstTicker = u.ticker;
    }
  }
  if (!anyBelowK) worstTicker = null;

  // Y domain adapts to the path while always showing every barrier.
  let minV = Infinity;
  let maxV = -Infinity;
  for (const row of baseData) {
    for (const u of product.underlyings) {
      const v = row[u.ticker];
      if (typeof v === "number") {
        minV = Math.min(minV, v);
        maxV = Math.max(maxV, v);
      }
    }
  }
  const floorRef = hasKI ? kiPct : strikePct;
  const yMin = Math.floor((Math.min(minV, floorRef) - 5) / 5) * 5;
  const yMax = Math.ceil((Math.max(maxV, koPct) + 5) / 5) * 5;
  const ticks = Array.from(
    new Set(
      [hasKI ? Math.round(kiPct) : null, Math.round(strikePct), 100, Math.round(koPct), yMax].filter(
        (v): v is number => v !== null,
      ),
    ),
  ).sort((a, b) => a - b);

  const ariaLabel = labels.aria;

  return (
    <section className="mb-6">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold text-text-secondary">{labels.title}</h2>
        <span className="text-[11px] text-text-muted">{labels.synthetic}</span>
      </div>
      <div className="rounded-lg bg-bg-surface px-1 pb-1 pt-3">
        <div className="h-[360px] w-full" role="img" aria-label={ariaLabel}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 8, right: labelTicker ? 44 : 12, bottom: 4, left: 0 }}
            >
              <CartesianGrid stroke="#ddd0b3" strokeDasharray="2 2" vertical={false} />
              <XAxis
                dataKey="t"
                type="number"
                domain={[tradeT, xMax]}
                scale="time"
                tickFormatter={formatTickDate}
                tick={{ fontSize: 10, fill: "#6f6450" }}
                stroke="#c4b48f"
                minTickGap={30}
              />
              <YAxis
                domain={[yMin, yMax]}
                ticks={ticks}
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 10, fill: "#6f6450" }}
                stroke="#c4b48f"
                width={46}
              />

              {/* Non-call period: trade date → KO start. KO is not observed here. */}
              <ReferenceArea x1={tradeT} x2={koStartT} fill="#d3bf99" fillOpacity={0.3} stroke="none" />

              <ReferenceLine
                y={koPct}
                stroke="#136b66"
                strokeDasharray="4 4"
                strokeWidth={1}
                label={{ value: labels.ko, position: "insideTopRight", fill: "#136b66", fontSize: 9 }}
              />
              <ReferenceLine
                y={strikePct}
                stroke="#8a5e0a"
                strokeDasharray="4 4"
                strokeWidth={1}
                label={{ value: labels.strike, position: "insideTopRight", fill: "#8a5e0a", fontSize: 9 }}
              />
              {hasKI && (
                <ReferenceLine
                  y={kiPct}
                  stroke="#b14724"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                  label={{
                    value: labels.ki,
                    position: "insideBottomRight",
                    fill: "#b14724",
                    fontSize: 9,
                  }}
                />
              )}

              <ReferenceLine
                x={koStartT}
                stroke="#6f6450"
                strokeDasharray="3 3"
                strokeWidth={1}
                label={{
                  value: labels.nonCall,
                  position: "insideTopLeft",
                  fill: "#6f6450",
                  fontSize: 9,
                  offset: 6,
                }}
              />

              {observationDates.map((d) => {
                const t = new Date(d).getTime();
                if (t > xMax) return null;
                return (
                  <ReferenceLine key={d} x={t} stroke="#136b66" strokeOpacity={0.25} strokeWidth={1} />
                );
              })}

              {kiEventDate && (
                <ReferenceLine
                  x={new Date(kiEventDate).getTime()}
                  stroke="#b14724"
                  strokeDasharray="2 3"
                  strokeWidth={1}
                  label={{ value: labels.kiEvent, position: "insideBottomLeft", fill: "#b14724", fontSize: 9 }}
                />
              )}

              {product.underlyings.flatMap((u) => {
                const koT = koTimes[u.ticker];
                const showLabel = u.ticker === labelTicker;
                const sw = u.ticker === worstTicker ? 2.5 : 1.5;
                const lines = [
                  <Line
                    key={`${u.ticker}_pre`}
                    type="monotone"
                    dataKey={`${u.ticker}_pre`}
                    stroke={u.color}
                    strokeWidth={sw}
                    dot={false}
                    activeDot={{ r: 3 }}
                    isAnimationActive={false}
                    connectNulls={false}
                  >
                    {showLabel && (
                      <LabelList
                        dataKey={`${u.ticker}_pre`}
                        content={(p) => {
                          const props = p as { x?: number; y?: number; index?: number; value?: unknown };
                          if (props.index !== lastIdx) return null;
                          if (props.value == null) return null;
                          const x = typeof props.x === "number" ? props.x : 0;
                          const y = typeof props.y === "number" ? props.y : 0;
                          return (
                            <text
                              x={x + 5}
                              y={y}
                              fill={u.color}
                              fontSize={10}
                              fontWeight={600}
                              dominantBaseline="middle"
                            >
                              {u.ticker}
                            </text>
                          );
                        }}
                      />
                    )}
                  </Line>,
                ];
                if (koT !== null) {
                  lines.push(
                    <Line
                      key={`${u.ticker}_post`}
                      type="monotone"
                      dataKey={`${u.ticker}_post`}
                      stroke={belowKByTicker[u.ticker] ? u.color : "#c4b48f"}
                      strokeWidth={sw}
                      dot={false}
                      activeDot={{ r: 3 }}
                      isAnimationActive={false}
                      connectNulls={false}
                    />,
                  );
                }
                return lines;
              })}

              <Tooltip
                content={(props) => <ChartTooltip product={product} {...props} />}
                cursor={{ stroke: "#c4b48f", strokeDasharray: "2 2" }}
                position={{ x: 0, y: 0 }}
                wrapperStyle={{
                  position: "absolute",
                  top: 6,
                  right: 6,
                  bottom: "auto",
                  left: "auto",
                  transform: "none",
                  pointerEvents: "none",
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <Legend product={product} reachedKO={reachedKO} monthly={observationDates.length > 0} labels={labels} />
    </section>
  );
}

function Legend({
  product,
  reachedKO,
  monthly,
  labels,
}: {
  product: FCNProduct;
  reachedKO: Record<string, boolean>;
  monthly: boolean;
  labels: ChartLabels;
}) {
  const anyKO = product.underlyings.some((u) => reachedKO[u.ticker] === true);
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-[11px]">
      {product.underlyings.map((u) => (
        <span key={u.ticker} className="flex items-center gap-1 tabular-nums text-text-secondary">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: u.color }} />
          <span>{u.ticker}</span>
        </span>
      ))}
      <span className="ml-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-text-muted">
        <span>{labels.legendNonCall}</span>
        {monthly && <span>{labels.legendMonthly}</span>}
        {anyKO && (
          <span className="flex items-center gap-1 text-text-primary">
            <span className="inline-block h-2 w-2 rounded-full bg-[#c4b48f]" />
            {labels.legendGrey}
          </span>
        )}
      </span>
    </div>
  );
}

function ChartTooltip({
  product,
  active,
  payload,
  label,
}: TooltipContentProps & { product: FCNProduct }) {
  if (!active || !payload || payload.length === 0) return null;
  const date =
    typeof label === "number" ? new Date(label).toISOString().slice(0, 10) : String(label ?? "");
  const fullRow = payload[0]?.payload as Record<string, number | string | undefined | null> | undefined;
  return (
    <div className="rounded border border-bg-elevated bg-bg-base/95 px-2 py-1.5 text-[11px] shadow-lg backdrop-blur">
      <div className="mb-1 font-medium tabular-nums text-text-primary">{date}</div>
      {product.underlyings.map((u) => {
        const raw = fullRow?.[u.ticker];
        const v = typeof raw === "number" ? raw : undefined;
        return (
          <div key={u.ticker} className="flex items-center gap-1.5 tabular-nums">
            <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: u.color }} />
            <span className="w-14 text-text-secondary">{u.ticker}</span>
            <span className="w-14 text-right text-text-primary">
              {v !== undefined ? `${v.toFixed(2)}%` : "—"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function formatTickDate(t: number): string {
  const d = new Date(t);
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${m}/${day}`;
}
