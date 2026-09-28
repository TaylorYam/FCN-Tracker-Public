/**
 * Deterministic synthetic price paths.
 *
 * Each path is defined by a handful of anchor points (date, level relative
 * to the initial price). Between anchors the log-price follows a seeded
 * Brownian bridge: random daily noise that is pinned to pass exactly through
 * both anchors. This gives realistic-looking, fully reproducible paths whose
 * scenario (which barrier is crossed, and roughly when) is chosen by design.
 *
 * Nothing here is market data. The same spec always yields the same closes.
 */

import { businessDaysBetween } from "../schedule";
import type { DailyCloses } from "../market-data";

/** [YYYY-MM-DD business day, level as a fraction of the initial price]. */
export type Anchor = readonly [date: string, level: number];

export type SyntheticPathSpec = {
  ticker: string;
  initialPrice: number;
  /** Standard deviation of the daily log-return noise, e.g. 0.01 = 1%. */
  dailyVol: number;
  /** Anchors in ascending date order. First anchor = path start at level 1.0. */
  anchors: readonly Anchor[];
  /** Optional explicit seed; defaults to a hash of the ticker. */
  seed?: number;
};

/** 32-bit FNV-1a hash — stable seed derived from a string. */
export function hashSeed(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Mulberry32 PRNG — small, fast, deterministic; returns floats in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 2 ** 32;
  };
}

/** Standard normal draws via Box–Muller. */
function normalGenerator(rand: () => number): () => number {
  let spare: number | null = null;
  return () => {
    if (spare !== null) {
      const v = spare;
      spare = null;
      return v;
    }
    let u = 0;
    while (u === 0) u = rand();
    const v = rand();
    const r = Math.sqrt(-2 * Math.log(u));
    spare = r * Math.sin(2 * Math.PI * v);
    return r * Math.cos(2 * Math.PI * v);
  };
}

/** Generate business-day closes (rounded to cents) for one synthetic path. */
export function generateSyntheticCloses(spec: SyntheticPathSpec): DailyCloses {
  const { anchors } = spec;
  if (anchors.length < 2) throw new Error(`${spec.ticker}: need at least two anchors`);
  if (anchors[0][1] !== 1) throw new Error(`${spec.ticker}: first anchor must be level 1.0`);

  const days = businessDaysBetween(anchors[0][0], anchors[anchors.length - 1][0]);
  const index = new Map(days.map((d, i) => [d, i]));
  const anchorIdx = anchors.map(([d]) => {
    const i = index.get(d);
    if (i === undefined) throw new Error(`${spec.ticker}: anchor ${d} is not a business day in range`);
    return i;
  });
  for (let k = 1; k < anchorIdx.length; k++) {
    if (anchorIdx[k] <= anchorIdx[k - 1]) {
      throw new Error(`${spec.ticker}: anchors must be strictly increasing`);
    }
  }

  const normal = normalGenerator(mulberry32(spec.seed ?? hashSeed(spec.ticker)));
  const logLevel = new Array<number>(days.length);

  for (let k = 0; k < anchors.length - 1; k++) {
    const i0 = anchorIdx[k];
    const i1 = anchorIdx[k + 1];
    const m = i1 - i0;
    const l0 = Math.log(anchors[k][1]);
    const l1 = Math.log(anchors[k + 1][1]);

    // Random walk W_0..W_m, then pin both ends: B_j = W_j − (j/m)·W_m.
    const walk = [0];
    for (let j = 1; j <= m; j++) walk.push(walk[j - 1] + spec.dailyVol * normal());
    for (let j = 0; j <= m; j++) {
      const bridge = walk[j] - (j / m) * walk[m];
      logLevel[i0 + j] = l0 + (j / m) * (l1 - l0) + bridge;
    }
  }

  const closes: DailyCloses = {};
  days.forEach((d, i) => {
    closes[d] = Math.round(spec.initialPrice * Math.exp(logLevel[i]) * 100) / 100;
  });
  return closes;
}
