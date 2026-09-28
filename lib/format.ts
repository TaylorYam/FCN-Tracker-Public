/** Format an annual rate stored as a decimal (0.1932 → "19.32"). */
export function formatRateValue(rate: number): string {
  return (rate * 100).toFixed(2);
}

/** Format an annual rate stored as a decimal (0.12 → "12.00%"). */
export function formatRatePercent(rate: number): string {
  return `${formatRateValue(rate)}%`;
}

/** Format a barrier level stored as a decimal (0.8 → "80%", 1.025 → "102.5%"). */
export function formatLevel(level: number): string {
  const pct = Math.round(level * 1000) / 10;
  return `${Number.isInteger(pct) ? pct.toFixed(0) : pct.toFixed(1)}%`;
}

/** Format a price with 2–4 decimals. */
export function formatPrice(n: number): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

/** Format a signed performance fraction (−0.123 → "−12.3%"). */
export function formatSignedPct(fraction: number, digits = 1): string {
  const pct = fraction * 100;
  const abs = Math.abs(pct).toFixed(digits);
  if (Number(abs) === 0) return `${(0).toFixed(digits)}%`;
  return `${pct < 0 ? "−" : "+"}${abs}%`;
}
