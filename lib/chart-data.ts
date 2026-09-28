import type { PriceSeries, Underlying } from "./types";

export type ChartPoint = {
  t: number;
  date: string;
} & {
  [ticker: string]: number | string | undefined;
};

/** Convert a price series into chart points where each ticker is expressed as % of initial. */
export function buildChartData(
  series: PriceSeries,
  underlyings: Underlying[],
): ChartPoint[] {
  const dates = Object.keys(series).sort();
  return dates.map((date) => {
    const point: ChartPoint = {
      t: new Date(date).getTime(),
      date,
    };
    for (const u of underlyings) {
      const close = series[date]?.[u.ticker];
      if (close !== undefined) {
        point[u.ticker] = (close / u.initialPrice) * 100;
      }
    }
    return point;
  });
}
