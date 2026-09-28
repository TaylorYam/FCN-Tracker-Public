import { deriveKOState, observationModeLabel, type KOTrigger } from "./fcn";
import type { FCNProduct, KIObservation, KOObservationFreq, PriceSeries } from "./types";
import { deriveMaturitySettlement, type Settlement } from "./lifecycle";

export type KORuleOutcome = {
  koObservationFreq: KOObservationFreq;
  hasMemoryKO: boolean;
  label: string;
  isProductRule: boolean;
  trigger: KOTrigger;
  /** Underlyings with a recorded KO under this rule (non-memory: all or none). */
  reachedCount: number;
};

/**
 * Evaluate the same price path under all four KO rule combinations
 * (daily/monthly × memory/non-memory). Educational: shows why the
 * observation rule matters. Only the product's own rule is contractual.
 */
export function evaluateKORuleMatrix(
  product: FCNProduct,
  series: PriceSeries,
): KORuleOutcome[] {
  const combos: { koObservationFreq: KOObservationFreq; hasMemoryKO: boolean }[] = [
    { koObservationFreq: "daily", hasMemoryKO: true },
    { koObservationFreq: "daily", hasMemoryKO: false },
    { koObservationFreq: "monthly", hasMemoryKO: true },
    { koObservationFreq: "monthly", hasMemoryKO: false },
  ];
  return combos.map((c) => {
    const variant: FCNProduct = { ...product, ...c };
    const { reachedKO, trigger } = deriveKOState(variant, series);
    return {
      ...c,
      label: observationModeLabel(c),
      isProductRule:
        c.koObservationFreq === product.koObservationFreq &&
        c.hasMemoryKO === product.hasMemoryKO,
      trigger,
      reachedCount: Object.values(reachedKO).filter((r) => r.reached).length,
    };
  });
}

export type KIStyleOutcome = {
  kiObservation: KIObservation;
  isProductRule: boolean;
  settlement: Settlement | null;
};

/**
 * For a matured product: the maturity settlement the same final closes would
 * produce under each KI style, holding every other term fixed. For "NONE"
 * the KI level is ignored; for EKI/AKI the product's KI level is used.
 */
export function evaluateKIStyleMatrix(
  product: FCNProduct,
  series: PriceSeries,
): KIStyleOutcome[] {
  const kiLevel = product.kiLevel > 0 ? product.kiLevel : product.strikeLevel;
  const styles: KIObservation[] = ["NONE", "EKI", "AKI"];
  return styles.map((kiObservation) => {
    const variant: FCNProduct = {
      ...product,
      kiObservation,
      kiLevel: kiObservation === "NONE" ? 0 : kiLevel,
    };
    return {
      kiObservation,
      isProductRule: kiObservation === product.kiObservation,
      settlement: deriveMaturitySettlement(variant, series),
    };
  });
}
